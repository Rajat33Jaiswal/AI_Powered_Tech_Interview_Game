import jwt from 'jsonwebtoken';
import { User, Room, Match, Question, Answer, MatchParticipant } from '../db/models/index.js';
import { generateQuestions, evaluateAnswer, generateMatchReport } from '../ai/aiService.js';
import config from '../config.js';

const JWT_SECRET = config.jwtSecret;
const activeRooms = {}; // key: roomCode, value: game state
const aiRateLimits = {}; // key: userId, value: lastRequestTime
const RATE_LIMIT_COOLDOWN = 30000;

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function initGameSocket(io) {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // CREATE ROOM
    socket.on('room:create', async ({ token, topic, difficulty, rounds, mode }) => {
      const decoded = verifyToken(token);
      if (!decoded) {
        return socket.emit('error', { message: 'Unauthorized. Invalid token.' });
      }

      try {
        const user = await User.findByPk(decoded.id);
        if (!user) {
          return socket.emit('error', { message: 'User not found.' });
        }

        const roomCode = generateRoomCode();
        
        // Create DB entities
        const room = await Room.create({
          roomCode,
          hostId: user.id,
          status: 'lobby',
          topic,
          difficulty,
          roundCount: parseInt(rounds) || 10
        });

        const match = await Match.create({
          roomId: room.id,
          mode: mode || 'multiplayer',
          topic,
          difficulty,
          status: 'active'
        });

        // Initialize state in activeRooms
        activeRooms[roomCode] = {
          roomId: room.id,
          matchId: match.id,
          roomCode,
          hostId: user.id,
          mode: mode || 'multiplayer',
          topic,
          difficulty,
          rounds: parseInt(rounds) || 10,
          status: 'lobby',
          players: [{
            userId: user.id,
            username: user.username,
            socketId: socket.id,
            score: 0,
            answers: [], // store individual answers for leaderboard and reports
            ready: true // Host is always ready
          }],
          questions: [],
          currentQuestionIndex: -1,
          timer: null,
          timeLeft: 30,
          answersSubmitted: {}, // key: userId, value: answerDetails
          isGrading: false
        };

        socket.join(roomCode);
        socket.emit('room:created', {
          roomCode,
          topic,
          difficulty,
          rounds,
          mode: mode || 'multiplayer',
          players: activeRooms[roomCode].players
        });
        
        console.log(`Room created: ${roomCode} by User: ${user.username}`);
      } catch (err) {
        console.error('Error creating room:', err);
        socket.emit('error', { message: 'Failed to create room.' });
      }
    });

    // JOIN ROOM
    socket.on('room:join', async ({ token, roomCode }) => {
      const decoded = verifyToken(token);
      if (!decoded) {
        return socket.emit('error', { message: 'Unauthorized. Invalid token.' });
      }

      const cleanCode = roomCode.trim().toUpperCase();
      let state = activeRooms[cleanCode];

      try {
        const user = await User.findByPk(decoded.id);
        if (!user) {
          return socket.emit('error', { message: 'User not found.' });
        }

        // If the state is not in memory (e.g. server restarted) but exists in database, let's deny or rebuild.
        // For MVP, if it is not in memory, we assume the room doesn't exist or is expired.
        if (!state) {
          return socket.emit('error', { message: 'Room not found or game has already finished.' });
        }

        if (state.status !== 'lobby') {
          return socket.emit('error', { message: 'Game has already started in this room.' });
        }

        // Check if player is already in room
        const isAlreadyIn = state.players.some(p => p.userId === user.id);
        if (!isAlreadyIn) {
          state.players.push({
            userId: user.id,
            username: user.username,
            socketId: socket.id,
            score: 0,
            answers: [],
            ready: false // Normal players start as not ready
          });
        } else {
          // Update socket ID if reconnecting to the lobby
          const playerIdx = state.players.findIndex(p => p.userId === user.id);
          state.players[playerIdx].socketId = socket.id;
        }

        socket.join(cleanCode);
        
        // Notify the player
        socket.emit('room:joined', {
          roomCode: cleanCode,
          topic: state.topic,
          difficulty: state.difficulty,
          rounds: state.rounds,
          mode: state.mode,
          players: state.players
        });

        // Broadcast updated list to the entire room
        io.to(cleanCode).emit('room:players_update', { players: state.players });
        console.log(`User ${user.username} joined room ${cleanCode}`);
      } catch (err) {
        console.error('Error joining room:', err);
        socket.emit('error', { message: 'Failed to join room.' });
      }
    });

    // QUICK JOIN SEARCH (Find random active lobby)
    socket.on('room:quick_join_search', () => {
      const availableRooms = Object.values(activeRooms).filter(
        r => r.status === 'lobby' && r.mode === 'multiplayer' && r.players.length < 8
      );

      if (availableRooms.length > 0) {
        const randomRoom = availableRooms[Math.floor(Math.random() * availableRooms.length)];
        socket.emit('room:quick_join_found', { roomCode: randomRoom.roomCode });
      } else {
        socket.emit('room:quick_join_not_found', { 
          message: 'No active multiplayer lobbies found. Try creating one!' 
        });
      }
    });

    // TOGGLE READY STATUS
    socket.on('lobby:ready_toggle', ({ roomCode, token }) => {
      const state = activeRooms[roomCode];
      if (!state || state.status !== 'lobby') return;

      let player;
      if (token) {
        const decoded = verifyToken(token);
        if (decoded) {
          player = state.players.find(p => p.userId === decoded.id);
        }
      }

      // Fallback to socket.id search if token verification failed/was not provided
      if (!player) {
        player = state.players.find(p => p.socketId === socket.id);
      }

      if (!player) return;

      // Host is always ready
      if (player.userId !== state.hostId) {
        player.ready = !player.ready;
      }
      
      io.to(roomCode).emit('room:players_update', { players: state.players });
    });

    // CHAT MESSAGE IN LOBBY
    socket.on('lobby:chat_send', ({ roomCode, message }) => {
      const state = activeRooms[roomCode];
      if (!state || state.status !== 'lobby') return;

      const player = state.players.find(p => p.socketId === socket.id);
      if (!player) return;

      if (!message || !message.trim()) return;

      const chatMsg = {
        userId: player.userId,
        username: player.username,
        message: message.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      io.to(roomCode).emit('lobby:chat_receive', chatMsg);
    });

    // START GAME
    socket.on('game:start', async ({ roomCode }) => {
      const state = activeRooms[roomCode];
      if (!state) return;

      if (state.status !== 'lobby') return;

      // Check if all players (except host) are ready
      const unreadyPlayers = state.players.filter(p => p.userId !== state.hostId && !p.ready);
      if (unreadyPlayers.length > 0) {
        return socket.emit('error', { 
          message: 'Cannot start match. All players must mark themselves as ready!' 
        });
      }

      // Rate Limiting Check for AI generation
      const now = Date.now();
      const lastRequest = aiRateLimits[state.hostId] || 0;
      if (now - lastRequest < RATE_LIMIT_COOLDOWN) {
        const secondsLeft = Math.ceil((RATE_LIMIT_COOLDOWN - (now - lastRequest)) / 1000);
        return socket.emit('error', { 
          message: `Please wait ${secondsLeft} seconds before generating questions again.` 
        });
      }
      aiRateLimits[state.hostId] = now;

      try {
        state.status = 'playing';
        
        // Update room status in DB
        await Room.update({ status: 'playing' }, { where: { id: state.roomId } });

        // Notify client loading state
        io.to(roomCode).emit('game:loading', { message: 'Generating AI Interview Questions...' });

        // Fetch players' previous questions to exclude
        const userIds = state.players.map(p => p.userId);
        const previousAnswers = await Answer.findAll({
          where: { userId: userIds },
          include: [
            {
              model: Question,
              required: true
            },
            {
              model: Match,
              where: { topic: state.topic },
              required: true
            }
          ]
        });
        const excludeQuestionTexts = previousAnswers.map(ans => ans.Question.questionText);

        // Generate questions
        const questionsList = await generateQuestions(state.topic, state.difficulty, state.rounds, excludeQuestionTexts);
        
        // Persist questions in database
        const dbQuestions = await Promise.all(
          questionsList.map((q) => 
            Question.create({
              matchId: state.matchId,
              questionText: q.questionText,
              questionType: q.questionType,
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
              orderIndex: q.orderIndex
            })
          )
        );

        state.questions = dbQuestions.map(dbQ => dbQ.toJSON());

        // Create MatchParticipant records for all players
        await Promise.all(
          state.players.map(p =>
            MatchParticipant.create({
              matchId: state.matchId,
              userId: p.userId,
              score: 0,
              aiReportCard: null
            })
          )
        );

        io.to(roomCode).emit('game:started');
        console.log(`Game started in room ${roomCode}. Questions loaded: ${state.questions.length}`);

        // Start first question after 2 seconds delay
        setTimeout(() => {
          runQuestionLoop(io, roomCode, 0);
        }, 2000);

      } catch (err) {
        console.error('Error starting game:', err);
        io.to(roomCode).emit('error', { message: 'Error generating questions. Please try again.' });
      }
    });

    // SUBMIT ANSWER
    socket.on('answer:submit', async ({ roomCode, questionId, userAnswer, responseTimeSeconds }) => {
      const state = activeRooms[roomCode];
      if (!state) return;

      const player = state.players.find(p => p.socketId === socket.id);
      if (!player) return;

      // Avoid double submissions for same question
      if (state.answersSubmitted[player.userId]) return;

      const currentQuestion = state.questions[state.currentQuestionIndex];
      if (!currentQuestion || currentQuestion.id !== questionId) return;

      // Mark as submitted
      state.answersSubmitted[player.userId] = {
        userAnswer,
        responseTimeSeconds
      };

      // Notify room that this player has submitted (for visual indicators)
      io.to(roomCode).emit('answer:submitted_update', { userId: player.userId });

      // If all players have submitted, force the timer to fire immediately
      const activeSubmitCount = Object.keys(state.answersSubmitted).length;
      if (activeSubmitCount === state.players.length) {
        if (state.timer) {
          clearInterval(state.timer);
          state.timer = null;
        }
        processRoundGrading(io, roomCode);
      }
    });

    // DISCONNECT
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      
      // Find which room this socket belonged to
      for (const roomCode in activeRooms) {
        const state = activeRooms[roomCode];
        const playerIdx = state.players.findIndex(p => p.socketId === socket.id);
        
        if (playerIdx !== -1) {
          const leavingPlayer = state.players[playerIdx];
          
          if (state.status === 'lobby') {
            // In lobby, just remove them
            state.players.splice(playerIdx, 1);
            io.to(roomCode).emit('room:players_update', { players: state.players });
            
            // If lobby is empty, delete room state
            if (state.players.length === 0) {
              delete activeRooms[roomCode];
              console.log(`Empty room ${roomCode} cleaned up.`);
            } else if (state.hostId === leavingPlayer.userId) {
              // Reassign host if host left
              state.hostId = state.players[0].userId;
              // Update room in DB
              Room.update({ hostId: state.hostId }, { where: { id: state.roomId } }).catch(console.error);
              console.log(`Room host reassigned in room ${roomCode}`);
            }
          } else if (state.status === 'playing') {
            // During gameplay, do not remove player record to avoid breaking scores, 
            // but mark socket as null or inactive.
            console.log(`Player ${leavingPlayer.username} disconnected from active room ${roomCode}`);
            
            // Check if all remaining players are finished
            const activeSubmits = Object.keys(state.answersSubmitted).length;
            // Count players who still have valid sockets
            const activeSocketPlayers = state.players.filter(p => p.socketId !== null);
            
            if (activeSubmits === activeSocketPlayers.length) {
              // Force resolve if all active players are done
              if (state.timer) {
                clearInterval(state.timer);
                state.timer = null;
              }
              processRoundGrading(io, roomCode);
            }
          }
          break;
        }
      }
    });
  });
}

// RUNS THE QUESTION LOOP (Handles counts, next question scheduling)
async function runQuestionLoop(io, roomCode, questionIndex) {
  const state = activeRooms[roomCode];
  if (!state || state.status !== 'playing') return;

  state.currentQuestionIndex = questionIndex;
  state.answersSubmitted = {};
  state.timeLeft = 30;
  state.isGrading = false; // Reset grading lock

  const currentQuestion = state.questions[questionIndex];
  
  // Send question details to client (strip correctAnswer for cheating prevention)
  const clientQuestion = {
    id: currentQuestion.id,
    questionText: currentQuestion.questionText,
    questionType: currentQuestion.questionType,
    options: currentQuestion.options,
    orderIndex: currentQuestion.orderIndex,
    totalQuestions: state.questions.length
  };

  io.to(roomCode).emit('question:next', {
    question: clientQuestion,
    questionIndex,
    totalQuestions: state.questions.length
  });

  console.log(`Broadcasting question ${questionIndex + 1} to room ${roomCode}`);

  // Broadcast ticks
  io.to(roomCode).emit('timer:tick', { timeLeft: state.timeLeft });

  state.timer = setInterval(() => {
    state.timeLeft--;
    io.to(roomCode).emit('timer:tick', { timeLeft: state.timeLeft });

    if (state.timeLeft <= 0) {
      clearInterval(state.timer);
      state.timer = null;
      processRoundGrading(io, roomCode);
    }
  }, 1000);
}

// GRADES ANSWERS AND BROADCASTS ROUND RESULTS
async function processRoundGrading(io, roomCode) {
  const state = activeRooms[roomCode];
  if (!state || state.isGrading) return;
  state.isGrading = true;

  try {
    const currentQuestion = state.questions[state.currentQuestionIndex];
    const submissions = state.answersSubmitted;
    
    io.to(roomCode).emit('round:grading', { message: 'AI is evaluating answers...' });

    const gradingPromises = state.players.map(async (player) => {
      const submission = submissions[player.userId];
      const userAnswerText = submission ? submission.userAnswer : '';
      const responseTime = submission ? submission.responseTimeSeconds : 30;

      // Evaluate
      const isMCQ = currentQuestion.questionType === 'MCQ';
      const gradeResult = await evaluateAnswer(
        currentQuestion.questionText,
        currentQuestion.correctAnswer,
        userAnswerText,
        isMCQ
      );

      // Save answer record to DB
      const dbAnswer = await Answer.create({
        matchId: state.matchId,
        userId: player.userId,
        questionId: currentQuestion.id,
        userAnswer: userAnswerText,
        isCorrect: gradeResult.isCorrect,
        score: gradeResult.score,
        feedbackText: gradeResult.feedbackText,
        responseTimeSeconds: responseTime
      });

      // Update player score in-memory
      player.score += gradeResult.score;
      player.answers.push({
        questionText: currentQuestion.questionText,
        questionType: currentQuestion.questionType,
        userAnswer: userAnswerText,
        isCorrect: gradeResult.isCorrect,
        score: gradeResult.score,
        feedbackText: gradeResult.feedbackText
      });

      // Send individual feedback to this player
      if (player.socketId) {
        io.to(player.socketId).emit('round:result_personal', {
          userAnswer: userAnswerText,
          isCorrect: gradeResult.isCorrect,
          score: gradeResult.score,
          feedbackText: gradeResult.feedbackText,
          correctAnswer: currentQuestion.correctAnswer,
          explanation: currentQuestion.explanation
        });
      }

      return {
        userId: player.userId,
        username: player.username,
        score: player.score
      };
    });

    const updatedLeaderboard = await Promise.all(gradingPromises);

    // Send update scoreboard to all players in the room
    io.to(roomCode).emit('leaderboard:update', { leaderboard: updatedLeaderboard });

    // Transition delay
    setTimeout(async () => {
      const nextIndex = state.currentQuestionIndex + 1;
      if (nextIndex < state.questions.length) {
        runQuestionLoop(io, roomCode, nextIndex);
      } else {
        await finishGame(io, roomCode);
      }
    }, 7000); // give users 7 seconds to read the feedback
  } catch (err) {
    console.error('Error in processRoundGrading:', err);
    state.isGrading = false;
    io.to(roomCode).emit('error', { message: 'Failed to process round grading. Transitioning to next question...' });
    
    setTimeout(() => {
      const nextIndex = state.currentQuestionIndex + 1;
      if (nextIndex < state.questions.length) {
        runQuestionLoop(io, roomCode, nextIndex);
      } else {
        finishGame(io, roomCode).catch(console.error);
      }
    }, 3000);
  }
}

// COMPLETES GAME, UPDATES STATS, AND WRITES AI SUMMARY
async function finishGame(io, roomCode) {
  const state = activeRooms[roomCode];
  if (!state) return;

  state.status = 'finished';
  console.log(`Match finished for room ${roomCode}`);

  io.to(roomCode).emit('game:generating_report', { message: 'Generating overall match evaluation report...' });

  try {
    // Update match status in DB
    await Match.update({ status: 'completed' }, { where: { id: state.matchId } });
    await Room.update({ status: 'finished' }, { where: { id: state.roomId } });

    // Generate and save AI reports for players
    // For multiplayer, we generate a report for the match and save it.
    // For solo, we generate it for the player.
    // In both cases, we evaluate their response logs.
    const updateStatsPromises = state.players.map(async (player) => {
      // 1. Generate customized match report for this user
      const userReport = await generateMatchReport(state.topic, state.difficulty, player.answers);
      
      // 2. Save user score and personalized report card in MatchParticipant model
      await MatchParticipant.update(
        { score: player.score, aiReportCard: userReport },
        { where: { matchId: state.matchId, userId: player.userId } }
      );

      // 3. Fetch User DB record to update profile stats
      const user = await User.findByPk(player.userId);
      if (user) {
        const totalMatches = user.gamesPlayed + 1;
        
        // Calculate new average score
        const currentMatchScore = player.score;
        const newAvg = ((user.avgScore * user.gamesPlayed) + currentMatchScore) / totalMatches;
        const newMax = Math.max(user.maxScore, currentMatchScore);

        await user.update({
          gamesPlayed: totalMatches,
          avgScore: newAvg,
          maxScore: newMax
        });
      }

      return {
        userId: player.userId,
        username: player.username,
        score: player.score,
        reportCard: userReport
      };
    });

    const playerReportDetails = await Promise.all(updateStatsPromises);

    // Save the host or first player's report to the Match table as the default feedback summary
    const defaultFeedback = playerReportDetails[0]?.reportCard || 'Game completed successfully!';
    await Match.update({ aiFeedbackSummary: defaultFeedback }, { where: { id: state.matchId } });

    // Broadcast completion to all players
    io.to(roomCode).emit('game:ended', {
      matchId: state.matchId,
      finalScores: playerReportDetails.map(p => ({ username: p.username, score: p.score })),
      reports: playerReportDetails // Sends back user-specific reports
    });

    // Cleanup room state from memory after 1 minute to allow users to navigate away
    setTimeout(() => {
      delete activeRooms[roomCode];
      console.log(`Room state ${roomCode} removed from memory.`);
    }, 60000);

  } catch (err) {
    console.error('Error completing game:', err);
    io.to(roomCode).emit('error', { message: 'Failed to complete game reports correctly.' });
  }
}
