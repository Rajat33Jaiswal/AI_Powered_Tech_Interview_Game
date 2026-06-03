import Anthropic from '@anthropic-ai/sdk';
import { mockQuestions } from './mockQuestions.js';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.CLAUDE_API_KEY;
let anthropicClient = null;

if (apiKey) {
  console.log('Anthropic Claude API client initialized.');
  anthropicClient = new Anthropic({ apiKey });
} else {
  console.log('Claude API key missing. Operating in OFFLINE MOCK MODE.');
}

const isMockMode = () => {
  return !anthropicClient || process.env.USE_MOCK_AI === 'true';
};

/**
 * Shuffles an array helper
 */
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generates technical questions for a topic and difficulty
 */
export async function generateQuestions(topic, difficulty, count = 10, excludeQuestions = []) {
  if (isMockMode()) {
    console.log(`[AI Mock] Generating ${count} questions for Topic: ${topic}, Difficulty: ${difficulty}`);
    const questionsForTopic = mockQuestions[topic] || mockQuestions['WebDev'];
    
    // Filter out previously answered questions
    const filtered = questionsForTopic.filter(q => {
      const isExcluded = excludeQuestions.some(eq => eq.trim().toLowerCase() === q.questionText.trim().toLowerCase());
      return !isExcluded;
    });

    const questionsToShuffle = filtered.length >= count ? filtered : questionsForTopic;
    const shuffled = shuffleArray(questionsToShuffle);
    
    // Return sliced questions with an orderIndex added
    return shuffled.slice(0, count).map((q, index) => ({
      ...q,
      orderIndex: index + 1
    }));
  }

  try {
    let prompt = `You are a technical interviewer. Generate exactly ${count} questions about the topic "${topic}" at a "${difficulty}" level.
    The list must contain a mix of 5 Multiple Choice Questions (MCQ) and 5 open-ended short-answer/coding conceptual questions.`;

    if (excludeQuestions && excludeQuestions.length > 0) {
      // Send the most recent 40 excluded questions to prevent duplication while keeping prompt size small
      const recentExclusions = excludeQuestions.slice(-40);
      prompt += `\n\nCRITICAL REQUIREMENT: Do NOT generate any of the following questions, as the user has already answered them recently:
      ${JSON.stringify(recentExclusions)}
      
      Make sure to generate entirely new, distinct questions about ${topic}.`;
    }

    prompt += `\n\nReturn the response as a valid JSON array of objects. Do NOT wrap the JSON in markdown code blocks like \`\`\`json. Respond with raw JSON only.
    
    Each object in the JSON array must follow this structure:
    {
      "questionText": "The actual question prompt string",
      "questionType": "MCQ" or "short",
      "options": ["Option A", "Option B", "Option C", "Option D"] (or null if questionType is "short"),
      "correctAnswer": "For MCQ, must exactly match one of the elements in the options array. For short, provide a concise guide detailing the critical keywords and concepts that make an answer correct.",
      "explanation": "A brief explanation of the correct answer or concept"
    }`;

    const response = await anthropicClient.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      temperature: 0.7,
      system: "You are a helpful assistant that generates technical interview questions and returns responses ONLY in raw JSON arrays.",
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = response.content[0].text.trim();
    const parsed = JSON.parse(responseText);

    return parsed.map((q, index) => ({
      ...q,
      orderIndex: index + 1
    }));
  } catch (error) {
    console.error('Error generating questions from Claude API:', error);
    console.log('Falling back to mock questions...');
    const questionsForTopic = mockQuestions[topic] || mockQuestions['WebDev'];
    const filtered = questionsForTopic.filter(q => {
      const isExcluded = excludeQuestions.some(eq => eq.trim().toLowerCase() === q.questionText.trim().toLowerCase());
      return !isExcluded;
    });
    const questionsToShuffle = filtered.length >= count ? filtered : questionsForTopic;
    return shuffleArray(questionsToShuffle).slice(0, count).map((q, index) => ({
      ...q,
      orderIndex: index + 1
    }));
  }
}

/**
 * Evaluates a candidate's answer to a short answer question
 */
export async function evaluateAnswer(questionText, correctAnswerGuide, userAnswer, isMCQ = false) {
  if (isMCQ) {
    // Basic MCQ check (case insensitive trim comparison)
    const normalizedUser = userAnswer.trim().toLowerCase();
    const normalizedCorrect = correctAnswerGuide.trim().toLowerCase();
    const isCorrect = normalizedUser === normalizedCorrect;
    return {
      score: isCorrect ? 10 : 0,
      isCorrect,
      feedbackText: isCorrect 
        ? "Correct! You successfully identified the right option." 
        : `Incorrect. The correct answer was: "${correctAnswerGuide}".`
    };
  }

  if (isMockMode()) {
    console.log(`[AI Mock] Grading short answer: "${userAnswer}"`);
    // Basic heuristics for mock grading
    const wordCount = userAnswer.trim().split(/\s+/).length;
    const correctKeywords = correctAnswerGuide.toLowerCase().split(/[^a-zA-Z]+/);
    const userLower = userAnswer.toLowerCase();
    
    let matchedKeywords = 0;
    const keywordsToSearch = correctKeywords.filter(w => w.length > 4); // search longer words
    
    if (keywordsToSearch.length > 0) {
      keywordsToSearch.forEach(keyword => {
        if (userLower.includes(keyword)) matchedKeywords++;
      });
    }

    let score = 0;
    if (wordCount < 3) {
      score = 1;
    } else if (wordCount < 10) {
      score = Math.min(5, 2 + matchedKeywords);
    } else {
      score = Math.min(10, 4 + matchedKeywords * 2 + Math.floor(wordCount / 10));
    }
    
    // clamp score
    score = Math.max(0, Math.min(10, score));
    const isCorrect = score >= 7;
    
    return {
      score,
      isCorrect,
      feedbackText: `[Mock AI Evaluation] Your answer has ${wordCount} words. It covers some relevant points. Key criteria match score: ${score}/10. Keep practice to details.`
    };
  }

  try {
    const prompt = `You are a technical interviewer grading a candidate's short answer.
    
    Question: ${questionText}
    Correct Answer Guideline/Key Points: ${correctAnswerGuide}
    Candidate's Answer: ${userAnswer}
    
    Grade this answer strictly but constructively out of 10 points. If the answer is blank or nonsense, give a score of 0.
    
    Return the response as a valid JSON object. Do NOT wrap the JSON in markdown code blocks. Respond with raw JSON only.
    
    The JSON object must follow this structure:
    {
      "score": <number between 0 and 10>,
      "isCorrect": <boolean, true if score is 7 or higher, false otherwise>,
      "feedbackText": "Provide 1-2 sentences of professional feedback, explaining what they got right, what was missing, and how to improve."
    }`;

    const response = await anthropicClient.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 800,
      temperature: 0.3,
      system: "You are a precise technical grader who outputs response details ONLY as a raw JSON object.",
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = response.content[0].text.trim();
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Error evaluating answer with Claude:', error);
    return {
      score: userAnswer.length > 10 ? 7 : 4,
      isCorrect: userAnswer.length > 10,
      feedbackText: "An error occurred with the AI grading service, so a default score was computed based on answer length."
    };
  }
}

/**
 * Generates a comprehensive summary report card at the end of the match
 */
export async function generateMatchReport(topic, difficulty, qas) {
  if (isMockMode()) {
    console.log('[AI Mock] Generating match feedback report...');
    const totalScore = qas.reduce((sum, qa) => sum + (qa.score || 0), 0);
    const maxPossibleScore = qas.length * 10;
    const percentage = ((totalScore / maxPossibleScore) * 100).toFixed(0);

    return `### 📊 AI Performance Evaluation Report

**Topic**: ${topic} | **Difficulty**: ${difficulty}
**Overall Score**: ${totalScore} / ${maxPossibleScore} (${percentage}%)

#### 🎯 Performance Summary
You demonstrated a **${percentage >= 70 ? 'Strong' : 'Developing'}** understanding of ${topic} concepts during this match. You performed well on the conceptual topics but have room for growth in implementation details.

#### 💡 Strengths & Weaknesses
- **Key Strength**: Good response time and general familiarity with fundamental terminology.
- **Area for Improvement**: Ensure you mention precise definitions and edge cases (e.g., resource cleanup, memory space complexities) when answering technical questions.

#### 🚀 Next Steps
1. Practice explaining core architectures (like the event loop or database transactions) aloud in under 30 seconds.
2. Review the specific questions you got incorrect and implement small code examples to reinforce those concepts.
`;
  }

  try {
    const prompt = `You are an AI Tech Interview Coach. Give a comprehensive, professional, and encouraging performance report card summary for a candidate who completed a technical interview round.
    
    Topic: ${topic}
    Difficulty: ${difficulty}
    Questions and Candidate Responses Details:
    ${JSON.stringify(qas.map(item => ({
      question: item.questionText,
      type: item.questionType,
      userAnswer: item.userAnswer,
      score: item.score,
      feedback: item.feedbackText
    })), null, 2)}
    
    Write a personalized feedback report in GitHub Markdown format. It should contain:
    1. A "Performance Summary" analyzing their score and accuracy trend.
    2. A "Strengths & Weaknesses" analysis based on their answers.
    3. "Recommended Actionable Next Steps" for their career prep.
    
    Keep the tone professional, direct, and constructive. Max length 300 words.`;

    const response = await anthropicClient.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }]
    });

    return response.content[0].text.trim();
  } catch (error) {
    console.error('Error generating report from Claude:', error);
    return `### AI Feedback Report (Fallback)
    We encountered an issue connecting to the AI feedback engine. However, based on your final answers, you completed ${qas.length} questions on ${topic} (${difficulty}). Please review each question's individual feedback in your match history!`;
  }
}
