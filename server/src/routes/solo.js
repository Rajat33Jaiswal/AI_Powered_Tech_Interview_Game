import express from 'express';
import { User, Match, Question, Answer, MatchParticipant } from '../db/models/index.js';
import { generateQuestions, evaluateAnswer, generateMatchReport } from '../ai/aiService.js';
import authMiddleware from './authMiddleware.js';

const router = express.Router();

// In-memory rate limits (30-second cooldown per user for question generation)
const aiRateLimits = {};
const RATE_LIMIT_COOLDOWN = 30000;

// 1. START SOLO MATCH
router.post('/start', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const now = Date.now();
  const lastRequest = aiRateLimits[userId] || 0;

  // Rate Limiting Check
  if (now - lastRequest < RATE_LIMIT_COOLDOWN) {
    const secondsLeft = Math.ceil((RATE_LIMIT_COOLDOWN - (now - lastRequest)) / 1000);
    return res.status(429).json({ 
      error: `Please wait ${secondsLeft} seconds before starting another session.` 
    });
  }
  
  aiRateLimits[userId] = now;

  try {
    const { topic, difficulty, rounds } = req.body;
    const roundCount = parseInt(rounds) || 10;

    if (!topic || !difficulty) {
      return res.status(400).json({ error: 'Topic and difficulty are required.' });
    }

    // Create Match in DB
    const match = await Match.create({
      roomId: null, // Solo mode has no room
      mode: 'solo',
      topic,
      difficulty,
      status: 'active'
    });

    // Fetch user's previous questions to exclude
    const previousAnswers = await Answer.findAll({
      where: { userId },
      include: [
        {
          model: Question,
          required: true
        },
        {
          model: Match,
          where: { topic },
          required: true
        }
      ]
    });
    const excludeQuestionTexts = previousAnswers.map(ans => ans.Question.questionText);

    // Generate questions
    const questionsList = await generateQuestions(topic, difficulty, roundCount, excludeQuestionTexts);

    // Save questions to DB
    const dbQuestions = await Promise.all(
      questionsList.map((q) => 
        Question.create({
          matchId: match.id,
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          orderIndex: q.orderIndex
        })
      )
    );

    // Create MatchParticipant record
    await MatchParticipant.create({
      matchId: match.id,
      userId: userId,
      score: 0,
      aiReportCard: null
    });

    // Strip answers from questions response for security
    const clientQuestions = dbQuestions.map(q => ({
      id: q.id,
      questionText: q.questionText,
      questionType: q.questionType,
      options: q.options,
      orderIndex: q.orderIndex
    }));

    return res.status(201).json({
      matchId: match.id,
      topic,
      difficulty,
      questions: clientQuestions
    });

  } catch (error) {
    console.error('Error starting solo game:', error);
    return res.status(500).json({ error: 'Internal server error starting solo session.' });
  }
});

// 2. SUBMIT SOLO ANSWER
router.post('/answer', authMiddleware, async (req, res) => {
  try {
    const { matchId, questionId, userAnswer, responseTimeSeconds } = req.body;
    const userId = req.user.id;

    if (!matchId || !questionId) {
      return res.status(400).json({ error: 'MatchId and questionId are required.' });
    }

    // Verify MatchParticipant exists
    const participant = await MatchParticipant.findOne({
      where: { matchId, userId }
    });

    if (!participant) {
      return res.status(403).json({ error: 'You are not a participant in this match.' });
    }

    // Fetch Question to get correct answers
    const question = await Question.findByPk(questionId);
    if (!question || question.matchId !== parseInt(matchId)) {
      return res.status(404).json({ error: 'Question not found for this match.' });
    }

    // Check if user already submitted an answer to this question
    const existingAnswer = await Answer.findOne({
      where: { matchId, questionId, userId }
    });

    if (existingAnswer) {
      return res.status(400).json({ error: 'You have already answered this question.' });
    }

    // Grade answer
    const isMCQ = question.questionType === 'MCQ';
    const gradeResult = await evaluateAnswer(
      question.questionText,
      question.correctAnswer,
      userAnswer || '',
      isMCQ
    );

    // Save Answer
    await Answer.create({
      matchId: parseInt(matchId),
      userId,
      questionId: parseInt(questionId),
      userAnswer: userAnswer || '',
      isCorrect: gradeResult.isCorrect,
      score: gradeResult.score,
      feedbackText: gradeResult.feedbackText,
      responseTimeSeconds: parseInt(responseTimeSeconds) || 30
    });

    // Update participant cumulative score
    await participant.update({
      score: participant.score + gradeResult.score
    });

    return res.json({
      score: gradeResult.score,
      isCorrect: gradeResult.isCorrect,
      feedbackText: gradeResult.feedbackText,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation
    });

  } catch (error) {
    console.error('Error submitting solo answer:', error);
    return res.status(500).json({ error: 'Internal server error grading answer.' });
  }
});

// 3. FINISH SOLO MATCH & GENERATE REPORT
router.post('/finish', authMiddleware, async (req, res) => {
  try {
    const { matchId } = req.body;
    const userId = req.user.id;

    if (!matchId) {
      return res.status(400).json({ error: 'MatchId is required.' });
    }

    const participant = await MatchParticipant.findOne({
      where: { matchId, userId }
    });

    if (!participant) {
      return res.status(403).json({ error: 'You are not a participant in this match.' });
    }

    const match = await Match.findByPk(matchId);
    if (!match || match.status === 'completed') {
      return res.status(400).json({ error: 'Match not found or already finalized.' });
    }

    // Fetch all answers user submitted for this match
    const answers = await Answer.findAll({
      where: { matchId, userId },
      include: [Question]
    });

    // Construct format for AI report card
    const qaLogs = answers.map(ans => ({
      questionText: ans.Question.questionText,
      questionType: ans.Question.questionType,
      userAnswer: ans.userAnswer,
      score: ans.score,
      feedbackText: ans.feedbackText
    }));

    // Generate AI match report card
    const reportCard = await generateMatchReport(match.topic, match.difficulty, qaLogs);

    // Update participant details
    await participant.update({
      aiReportCard: reportCard
    });

    // Update Match record to complete
    await match.update({
      status: 'completed',
      aiFeedbackSummary: reportCard
    });

    // Update User Profile stats
    const user = await User.findByPk(userId);
    if (user) {
      const totalMatches = user.gamesPlayed + 1;
      const matchScore = participant.score;
      const newAvg = ((user.avgScore * user.gamesPlayed) + matchScore) / totalMatches;
      const newMax = Math.max(user.maxScore, matchScore);

      await user.update({
        gamesPlayed: totalMatches,
        avgScore: newAvg,
        maxScore: newMax
      });
    }

    return res.json({
      matchId,
      totalScore: participant.score,
      reportCard
    });

  } catch (error) {
    console.error('Error finishing solo match:', error);
    return res.status(500).json({ error: 'Internal server error finalizing match.' });
  }
});

export default router;
