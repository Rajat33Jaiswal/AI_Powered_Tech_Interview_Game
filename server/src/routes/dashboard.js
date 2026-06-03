import express from 'express';
import { User, Match, Question, Answer, MatchParticipant } from '../db/models/index.js';
import authMiddleware from './authMiddleware.js';

const router = express.Router();

// GET USER DASHBOARD STATS
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['gamesPlayed', 'avgScore', 'maxScore']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Fetch all user participations to calculate topic averages, streaks, and trend
    const allParticipations = await MatchParticipant.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Match,
          include: [{ model: Question, attributes: ['id'] }]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 100
    });

    // 1. Topic Averages
    const topics = ['DSA', 'OS', 'DBMS', 'Java', 'WebDev', 'OOP', 'SystemDesign'];
    const topicTotals = { 
      DSA: { score: 0, max: 0 }, 
      OS: { score: 0, max: 0 }, 
      DBMS: { score: 0, max: 0 }, 
      Java: { score: 0, max: 0 }, 
      WebDev: { score: 0, max: 0 },
      OOP: { score: 0, max: 0 },
      SystemDesign: { score: 0, max: 0 }
    };

    allParticipations.forEach(p => {
      if (p.Match) {
        const topic = p.Match.topic;
        const questionCount = p.Match.Questions.length;
        if (topicTotals[topic]) {
          topicTotals[topic].score += p.score;
          topicTotals[topic].max += questionCount * 10;
        }
      }
    });

    const topicAverages = {};
    topics.forEach(topic => {
      const data = topicTotals[topic];
      topicAverages[topic] = data.max > 0 ? Math.round((data.score / data.max) * 100) : 0;
    });

    // 2. Performance Trend (Last 10 matches percentage scores, oldest to newest)
    const trendMatches = allParticipations.slice(0, 10).reverse();
    const performanceTrend = trendMatches.map(p => {
      const questionCount = p.Match ? p.Match.Questions.length : 0;
      const maxPossibleScore = questionCount * 10;
      return maxPossibleScore > 0 ? Math.round((p.score / maxPossibleScore) * 100) : 0;
    });

    // 3. Practice Streak
    const dates = allParticipations.map(p => new Date(p.createdAt).toISOString().split('T')[0]);
    const uniqueDates = [...new Set(dates)].sort((a, b) => b.localeCompare(a));
    
    let streak = 0;
    if (uniqueDates.length > 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
        streak = 1;
        let prevDateStr = uniqueDates[0];
        for (let i = 1; i < uniqueDates.length; i++) {
          const currentDate = new Date(prevDateStr);
          currentDate.setDate(currentDate.getDate() - 1);
          const expectedDateStr = currentDate.toISOString().split('T')[0];
          if (uniqueDates[i] === expectedDateStr) {
            streak++;
            prevDateStr = expectedDateStr;
          } else {
            break;
          }
        }
      }
    }

    return res.json({
      stats: {
        gamesPlayed: user.gamesPlayed,
        avgScore: parseFloat(user.avgScore.toFixed(1)),
        maxScore: parseFloat(user.maxScore.toFixed(1)),
        topicAverages,
        performanceTrend,
        streak
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return res.status(500).json({ error: 'Internal server error fetching stats.' });
  }
});

// GET USER PUBLIC PROFILE BY USERNAME
router.get('/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({
      where: { username },
      attributes: ['id', 'username', 'gamesPlayed', 'avgScore', 'maxScore', 'createdAt']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Get rank of this user based on maxScore
    const allUsers = await User.findAll({
      attributes: ['id', 'username', 'maxScore', 'avgScore'],
      order: [
        ['maxScore', 'DESC'],
        ['avgScore', 'DESC']
      ]
    });
    const rank = allUsers.findIndex(u => u.id === user.id) + 1;

    // Get user's match history details (last 10 matches)
    const participations = await MatchParticipant.findAll({
      where: { userId: user.id },
      include: [
        {
          model: Match,
          include: [{ model: Question, attributes: ['id'] }]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    const formattedHistory = participations.map(p => {
      const match = p.Match;
      const questionCount = match ? match.Questions.length : 0;
      return {
        id: p.matchId,
        mode: match ? match.mode : 'solo',
        topic: match ? match.topic : 'DSA',
        difficulty: match ? match.difficulty : 'Medium',
        createdAt: p.createdAt,
        totalScore: p.score,
        maxPossibleScore: questionCount * 10
      };
    });

    // Calculate topics and streak for profile
    const allParticipations = await MatchParticipant.findAll({
      where: { userId: user.id },
      include: [
        {
          model: Match,
          include: [{ model: Question, attributes: ['id'] }]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 100
    });

    const topics = ['DSA', 'OS', 'DBMS', 'Java', 'WebDev', 'OOP', 'SystemDesign'];
    const topicTotals = { 
      DSA: { score: 0, max: 0 }, 
      OS: { score: 0, max: 0 }, 
      DBMS: { score: 0, max: 0 }, 
      Java: { score: 0, max: 0 }, 
      WebDev: { score: 0, max: 0 },
      OOP: { score: 0, max: 0 },
      SystemDesign: { score: 0, max: 0 }
    };

    allParticipations.forEach(p => {
      if (p.Match) {
        const topic = p.Match.topic;
        const questionCount = p.Match.Questions.length;
        if (topicTotals[topic]) {
          topicTotals[topic].score += p.score;
          topicTotals[topic].max += questionCount * 10;
        }
      }
    });

    const topicAverages = {};
    topics.forEach(topic => {
      const data = topicTotals[topic];
      topicAverages[topic] = data.max > 0 ? Math.round((data.score / data.max) * 100) : 0;
    });

    const dates = allParticipations.map(p => new Date(p.createdAt).toISOString().split('T')[0]);
    const uniqueDates = [...new Set(dates)].sort((a, b) => b.localeCompare(a));
    
    let streak = 0;
    if (uniqueDates.length > 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
        streak = 1;
        let prevDateStr = uniqueDates[0];
        for (let i = 1; i < uniqueDates.length; i++) {
          const currentDate = new Date(prevDateStr);
          currentDate.setDate(currentDate.getDate() - 1);
          const expectedDateStr = currentDate.toISOString().split('T')[0];
          if (uniqueDates[i] === expectedDateStr) {
            streak++;
            prevDateStr = expectedDateStr;
          } else {
            break;
          }
        }
      }
    }

    return res.json({
      user: {
        id: user.id,
        username: user.username,
        gamesPlayed: user.gamesPlayed,
        avgScore: parseFloat(user.avgScore.toFixed(1)),
        maxScore: parseFloat(user.maxScore.toFixed(1)),
        createdAt: user.createdAt,
        rank,
        streak,
        topicAverages,
        history: formattedHistory
      }
    });
  } catch (error) {
    console.error('Error fetching public profile:', error);
    return res.status(500).json({ error: 'Internal server error fetching profile.' });
  }
});

// GET USER MATCH HISTORY
router.get('/history', authMiddleware, async (req, res) => {
  try {
    // Find all participations for the user
    const participations = await MatchParticipant.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Match,
          include: [{ model: Question, attributes: ['id'] }]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    const formattedHistory = participations.map(p => {
      const match = p.Match;
      const questionCount = match ? match.Questions.length : 0;

      return {
        id: p.matchId,
        mode: match ? match.mode : 'solo',
        topic: match ? match.topic : 'DSA',
        difficulty: match ? match.difficulty : 'Medium',
        status: match ? match.status : 'completed',
        createdAt: p.createdAt,
        totalScore: p.score,
        questionCount,
        maxPossibleScore: questionCount * 10
      };
    });

    return res.json({ history: formattedHistory });
  } catch (error) {
    console.error('Error fetching history:', error);
    return res.status(500).json({ error: 'Internal server error fetching history.' });
  }
});

// GET DETAILED MATCH REPORT
router.get('/match/:id', authMiddleware, async (req, res) => {
  try {
    const matchId = req.params.id;

    const match = await Match.findByPk(matchId, {
      include: [
        {
          model: Question,
          order: [['orderIndex', 'ASC']]
        }
      ]
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found.' });
    }

    // Retrieve participants for this match
    const participations = await MatchParticipant.findAll({
      where: { matchId },
      include: [
        {
          model: User,
          attributes: ['id', 'username']
        }
      ]
    });

    // Retrieve answers for this match with associated questions to get questionText
    const answers = await Answer.findAll({
      where: { matchId },
      include: [Question]
    });

    // Group details by participant
    const participantsMap = {};
    participations.forEach(p => {
      participantsMap[p.userId] = {
        userId: p.userId,
        username: p.User.username,
        totalScore: p.score,
        aiReportCard: p.aiReportCard,
        correctCount: 0,
        answers: []
      };
    });

    answers.forEach(ans => {
      const p = participantsMap[ans.userId];
      if (p) {
        p.answers.push({
          questionId: ans.questionId,
          questionText: ans.Question?.questionText || '',
          userAnswer: ans.userAnswer,
          isCorrect: ans.isCorrect,
          score: ans.score,
          feedbackText: ans.feedbackText,
          responseTimeSeconds: ans.responseTimeSeconds
        });
        if (ans.isCorrect) {
          p.correctCount++;
        }
      }
    });

    return res.json({
      match: {
        id: match.id,
        mode: match.mode,
        topic: match.topic,
        difficulty: match.difficulty,
        status: match.status,
        aiFeedbackSummary: match.aiFeedbackSummary,
        createdAt: match.createdAt,
        questions: match.Questions
      },
      participants: Object.values(participantsMap)
    });
  } catch (error) {
    console.error('Error fetching match details:', error);
    return res.status(500).json({ error: 'Internal server error fetching match details.' });
  }
});

// GET GLOBAL LEADERBOARD
router.get('/leaderboard', async (req, res) => {
  try {
    const topUsers = await User.findAll({
      attributes: ['id', 'username', 'gamesPlayed', 'avgScore', 'maxScore'],
      where: {
        gamesPlayed: {
          [User.sequelize.Sequelize.Op.gt]: 0
        }
      },
      order: [
        ['maxScore', 'DESC'],
        ['avgScore', 'DESC']
      ],
      limit: 10
    });

    return res.json({ leaderboard: topUsers });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return res.status(500).json({ error: 'Internal server error fetching leaderboard.' });
  }
});

export default router;
