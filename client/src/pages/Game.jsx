import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socket from '../socket.js';
import { getToken, getUser } from '../utils/api.js';
import { Loader, Send, CheckCircle2, XCircle, Award, Hourglass, Mic, MicOff, CheckCircle } from 'lucide-react';

export default function Game() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const currentUser = getUser();

  const [question, setQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(10);
  
  const [timeLeft, setTimeLeft] = useState(30);
  const [leaderboard, setLeaderboard] = useState([]);
  
  // Game states
  const [userAnswer, setUserAnswer] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [grading, setGrading] = useState(false);
  const [personalResult, setPersonalResult] = useState(null);
  const [submittingUserIds, setSubmittingUserIds] = useState(new Set());
  
  // Auto-save draft status
  const [draftSaved, setDraftSaved] = useState(false);
  
  // Voice listening status
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const shouldListenRef = useRef(false);
  const [speechError, setSpeechError] = useState('');

  // Report generation state
  const [generatingReport, setGeneratingReport] = useState(false);

  // Countdown overlay state
  const [countdown, setCountdown] = useState(3);
  const [showCountdownOverlay, setShowCountdownOverlay] = useState(true);

  // Time tracker
  const questionStartTime = useRef(Date.now());

  // Recover room settings from sessionStorage or defaults
  const topic = sessionStorage.getItem(`room_topic_${roomCode}`) || 'DSA';
  const difficulty = sessionStorage.getItem(`room_diff_${roomCode}`) || 'Medium';

  useEffect(() => {
    const token = getToken();
    if (!token) return navigate('/login');

    // Register socket listeners
    socket.on('question:next', (data) => {
      setQuestion(data.question);
      setQuestionIndex(data.questionIndex);
      setTotalQuestions(data.totalQuestions);
      
      // Reset input states
      setUserAnswer('');
      setHasSubmitted(false);
      setGrading(false);
      setPersonalResult(null);
      setSubmittingUserIds(new Set());
      
      questionStartTime.current = Date.now();
    });

    socket.on('timer:tick', (data) => {
      setTimeLeft(data.timeLeft);
    });

    socket.on('answer:submitted_update', (data) => {
      setSubmittingUserIds((prev) => {
        const next = new Set(prev);
        next.add(data.userId);
        return next;
      });
    });

    socket.on('round:grading', () => {
      setGrading(true);
      shouldListenRef.current = false;
      recognitionRef.current?.stop();
      setIsListening(false);
    });

    socket.on('round:result_personal', (data) => {
      setGrading(false);
      setPersonalResult(data);
    });

    socket.on('leaderboard:update', (data) => {
      setLeaderboard(data.leaderboard || []);
    });

    socket.on('game:generating_report', () => {
      setGeneratingReport(true);
    });

    socket.on('game:ended', (data) => {
      sessionStorage.setItem(`match_report_${data.matchId}`, JSON.stringify(data));
      navigate(`/results/${data.matchId}`);
    });

    return () => {
      socket.off('question:next');
      socket.off('timer:tick');
      socket.off('answer:submitted_update');
      socket.off('round:grading');
      socket.off('round:result_personal');
      socket.off('leaderboard:update');
      socket.off('game:generating_report');
      socket.off('game:ended');
    };
  }, [roomCode, navigate]);

  // Countdown useEffect
  useEffect(() => {
    if (!question || questionIndex !== 0) {
      setShowCountdownOverlay(false);
      return;
    }

    if (!showCountdownOverlay) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimeout(() => {
            setShowCountdownOverlay(false);
          }, 800);
          return 0; // 0 will represent "GO!"
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [question, questionIndex, showCountdownOverlay]);

  // Auto-save drafts to localStorage
  useEffect(() => {
    if (!question || hasSubmitted || !userAnswer || userAnswer.trim() === '') return;

    const saveTimeout = setTimeout(() => {
      localStorage.setItem(`draft_room_${roomCode}_q_${question.id}`, userAnswer);
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 1500);
    }, 2000);

    return () => clearTimeout(saveTimeout);
  }, [userAnswer, roomCode, question?.id, question, hasSubmitted]);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      recognitionRef.current?.stop();
    };
  }, []);

  // Recover drafts when index shifts
  useEffect(() => {
    if (question?.id) {
      const savedDraft = localStorage.getItem(`draft_room_${roomCode}_q_${question.id}`);
      if (savedDraft) {
        setUserAnswer(savedDraft);
      } else {
        setUserAnswer('');
      }
      setDraftSaved(false);
      setSpeechError(''); // Clear speech error on question shift

      // Stop speech recognition when moving to the next question
      shouldListenRef.current = false;
      recognitionRef.current?.stop();
      setIsListening(false);
    }
  }, [questionIndex, question?.id, roomCode]);

  // Unsaved warning
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (userAnswer && userAnswer.trim() !== '' && !hasSubmitted) {
        e.preventDefault();
        e.returnValue = 'You have an unsaved answer. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [userAnswer, hasSubmitted]);

  // Keyboard shortcuts (Ctrl+Enter to submit, 1-4 for MCQ selection, Enter to submit MCQ)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 1-4 keys for MCQ selection
      if (!hasSubmitted && question && question.questionType === 'MCQ' && !grading && !personalResult) {
        if (e.key >= '1' && e.key <= '4') {
          const optIndex = parseInt(e.key) - 1;
          if (question.options && question.options[optIndex]) {
            e.preventDefault();
            setUserAnswer(question.options[optIndex]);
          }
        }
      }

      // Enter key for MCQ submission (directly, no Ctrl required)
      if (e.key === 'Enter' && !e.ctrlKey) {
        if (question && question.questionType === 'MCQ') {
          if (!hasSubmitted && userAnswer.trim() !== '' && !grading && !personalResult) {
            e.preventDefault();
            handleAnswerSubmit();
          }
        }
      }

      if (e.ctrlKey && e.key === 'Enter') {
        if (!hasSubmitted && userAnswer.trim() !== '' && !grading && !personalResult) {
          e.preventDefault();
          handleAnswerSubmit();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [userAnswer, hasSubmitted, grading, personalResult, question]);

  // Speech-to-Text Voice Mode
  const toggleVoiceMode = () => {
    if (isListening) {
      console.log('Stopping speech recognition manually');
      shouldListenRef.current = false;
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setSpeechError(''); // Clear any previous error on retry
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSpeechError("Web Speech recognition is not supported in this browser. Try Chrome, Edge, or Safari!");
        return;
      }
      
      console.log('Initializing Web Speech API instance');
      shouldListenRef.current = true;
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        console.log('Speech recognition started listening');
        setIsListening(true);
      };
      
      rec.onend = () => {
        console.log('Speech recognition ended');
        if (shouldListenRef.current) {
          console.log('Auto-restarting speech recognition...');
          try {
            rec.start();
          } catch (err) {
            console.error('Error auto-restarting SpeechRecognition:', err);
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      };
      
      rec.onerror = (e) => {
        console.error('Speech recognition error occurred:', e.error);
        if (e.error === 'not-allowed') {
          setSpeechError("Microphone access is blocked. Please enable microphone permissions in your browser address bar.");
          shouldListenRef.current = false;
          setIsListening(false);
        } else if (e.error === 'network') {
          setSpeechError("Speech network error (Google Speech cloud servers unreachable). Please type your answer instead.");
          shouldListenRef.current = false;
          setIsListening(false);
        } else if (e.error === 'no-speech') {
          console.warn('Speech recognition: No speech detected.');
        } else if (e.error === 'aborted') {
          console.warn('Speech recognition: Aborted.');
        } else {
          setSpeechError(`Voice input error: ${e.error}. Please check your mic connection or type your answer.`);
          shouldListenRef.current = false;
          setIsListening(false);
        }
      };

      rec.onresult = (event) => {
        console.log('Speech recognition result received');
        let newTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i] && event.results[i][0]) {
            newTranscript += event.results[i][0].transcript;
          }
        }
        if (newTranscript) {
          setUserAnswer((prev) => {
            const separator = prev && !prev.endsWith(' ') ? ' ' : '';
            return prev + separator + newTranscript.trim();
          });
        }
      };

      recognitionRef.current = rec;
      try {
        rec.start();
      } catch (err) {
        console.error('Error starting SpeechRecognition:', err);
        shouldListenRef.current = false;
        setIsListening(false);
      }
    }
  };

  const handleAnswerSubmit = (e) => {
    if (e) e.preventDefault();
    if (hasSubmitted) return;

    const responseTime = Math.min(30, Math.floor((Date.now() - questionStartTime.current) / 1000));
    setHasSubmitted(true);
    
    // Stop voice mode
    shouldListenRef.current = false;
    recognitionRef.current?.stop();
    setIsListening(false);

    // Clear auto-save draft
    if (question) {
      localStorage.removeItem(`draft_room_${roomCode}_q_${question.id}`);
    }

    socket.emit('answer:submit', {
      roomCode,
      questionId: question.id,
      userAnswer,
      responseTimeSeconds: responseTime
    });
  };

  // Timer Circle Math
  const radius = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft / 30) * circumference;

  // Color transitions: Green (>15s), Yellow (15-5s), Red (<5s)
  const timerColor = timeLeft > 15 
    ? 'stroke-neonGreen shadow-glow-green' 
    : timeLeft > 5 
    ? 'stroke-amber-500 shadow-glow-orange' 
    : 'stroke-neonRed animate-pulse shadow-glow-red';

  if (generatingReport) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 text-center max-w-md mx-auto px-4">
        <Loader className="w-16 h-16 text-neonViolet animate-spin shadow-glow-violet rounded-full p-2 border border-neonViolet/30 bg-neonViolet/5" />
        <h2 className="text-2xl font-bold text-slate-100 font-outfit">Generating AI Evaluation Report</h2>
        <p className="text-slate-400 text-sm animate-pulse font-outfit">
          Claude is analyzing your answer history, formulating feedback, and assembling your report card...
        </p>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        {/* Animated Loading Skeleton */}
        <div className="w-full max-w-4xl space-y-6 animate-pulse">
          <div className="flex justify-between items-center">
            <div className="h-6 bg-slate-800 rounded w-1/4" />
            <div className="h-10 bg-slate-800 rounded-full w-28" />
          </div>
          <div className="h-64 bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Progress & Circular Timer header */}
      <div className="flex items-center justify-between bg-slate-950/40 border border-brandBorder p-5 rounded-2xl">
        <div className="space-y-2 flex-1 max-w-sm mr-4">
          <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Match Progress</span>
            <span>{Math.round(((questionIndex + 1) / totalQuestions) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2 border border-brandBorder overflow-hidden">
            <div 
              className="bg-gradient-to-r from-neonIndigo to-neonViolet h-full rounded-full transition-all duration-300 shadow-glow-indigo"
              style={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Circular Countdown Timer */}
        <div className="flex items-center gap-3 bg-slate-900/60 border border-brandBorder/80 px-4 py-2 rounded-full">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
              <circle
                cx="18"
                cy="18"
                r={radius}
                className="stroke-slate-800"
                strokeWidth="2.5"
                fill="transparent"
              />
              <circle
                cx="18"
                cy="18"
                r={radius}
                className={`transition-all duration-1000 ${timerColor}`}
                strokeWidth="2.5"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>
            <span className={`absolute text-xs font-black ${timeLeft < 10 ? 'text-neonRed animate-pulse' : 'text-slate-200'}`}>
              {timeLeft}
            </span>
          </div>
          <span className="text-xs font-bold text-slate-400 hidden sm:inline">Time Remaining</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Main Question / Input Card (Left 3 columns) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-card p-6 md:p-8 border-brandBorder/80 space-y-6 relative overflow-hidden pb-24 md:pb-8">
            <div className="absolute top-0 right-0 h-1.5 w-full bg-gradient-to-r from-neonIndigo to-neonViolet" />
            
            {/* Topic and Difficulty indicators */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brandBorder/40 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-slate-950 text-slate-400 px-3 py-1 rounded-md border border-brandBorder uppercase tracking-wider">
                  Question {questionIndex + 1} of {totalQuestions}
                </span>
                <span className="text-xs font-semibold bg-neonIndigo/10 text-neonIndigo px-3 py-1 rounded-md border border-neonIndigo/20 uppercase tracking-wider">
                  {topic === 'WebDev' ? 'Web Dev' : topic}
                </span>
                <span className={`text-xs font-semibold px-3 py-1 rounded-md border uppercase tracking-wider ${
                  difficulty === 'Easy' ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/40' :
                  difficulty === 'Medium' ? 'bg-amber-950/20 text-amber-400 border-amber-900/40' :
                  'bg-rose-950/20 text-rose-400 border-rose-900/40'
                }`}>
                  {difficulty}
                </span>
              </div>
              
              <span className="text-xs bg-slate-950 text-slate-400 font-bold px-3 py-1 rounded-md border border-brandBorder uppercase tracking-wider">
                {question.questionType === 'MCQ' ? 'Multiple Choice' : 'Conceptual Free Response'}
              </span>
            </div>

            <h3 className="text-xl md:text-2xl font-bold text-slate-100 leading-snug">
              {question.questionText}
            </h3>

            {/* Answer input area */}
            {!personalResult && !grading && (
              <form onSubmit={handleAnswerSubmit} className="space-y-6 pt-4">
                {question.questionType === 'MCQ' ? (
                  <div className="grid gap-3">
                    {question.options.map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => !hasSubmitted && setUserAnswer(opt)}
                        disabled={hasSubmitted}
                        className={`w-full py-4 px-5 rounded-xl border text-left font-medium transition-all flex items-center justify-between ${
                          userAnswer === opt
                            ? 'bg-neonIndigo/10 border-neonIndigo text-white shadow-glow-indigo'
                            : 'bg-slate-950/40 border-brandBorder text-slate-300 hover:border-slate-800'
                        } ${hasSubmitted ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-extrabold transition-all ${
                            userAnswer === opt ? 'bg-neonIndigo text-white shadow-glow-indigo' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {['A', 'B', 'C', 'D'][i]}
                          </span>
                          <span>{opt}</span>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          userAnswer === opt ? 'border-neonIndigo bg-neonIndigo' : 'border-slate-700'
                        }`}>
                          {userAnswer === opt && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2 relative">
                    {/* Speech Error Banner */}
                    {speechError && (
                      <div className="text-xs text-neonRed bg-neonRed/10 border border-neonRed/20 px-3 py-2 rounded-lg flex items-center justify-between mb-2">
                        <span className="flex items-center gap-1.5">⚠️ {speechError}</span>
                        <button type="button" onClick={() => setSpeechError('')} className="text-slate-400 hover:text-white font-bold text-sm ml-2">×</button>
                      </div>
                    )}
                    {/* Voice mode toggle */}
                    <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
                      {draftSaved && (
                        <span className="text-[10px] bg-slate-900 text-slate-400 font-bold px-2 py-1 rounded border border-brandBorder flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-neonGreen" /> Draft Saved
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={toggleVoiceMode}
                        disabled={hasSubmitted}
                        className={`p-2 rounded-lg border transition-all ${
                          isListening 
                            ? 'bg-neonRed/10 border-neonRed text-neonRed shadow-glow-red animate-pulse' 
                            : 'bg-slate-900 hover:bg-slate-800 border-brandBorder text-slate-400'
                        } ${hasSubmitted ? 'opacity-40 cursor-not-allowed' : ''}`}
                        title={isListening ? "Stop listening" : "Speak your answer"}
                      >
                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </button>
                    </div>

                    <textarea
                      placeholder={isListening ? "Listening... Speak clearly to type." : "Type your explanation here. Use technical keywords and explain the concepts thoroughly for full marks..."}
                      value={userAnswer}
                      onChange={(e) => !hasSubmitted && setUserAnswer(e.target.value)}
                      disabled={hasSubmitted}
                      rows={6}
                      className="w-full input-glass resize-none font-mono text-sm leading-relaxed pr-14 pt-12"
                    />
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold px-1 uppercase tracking-wider">
                      <span>Tip: Aim for at least 30 words. Use technical terms for higher scores.</span>
                      <span>{userAnswer.trim().split(/\s+/).filter(Boolean).length} words</span>
                    </div>
                  </div>
                )}

                {/* Mobile Sticky Button Bar */}
                <div className="md:relative fixed bottom-0 left-0 right-0 md:p-0 p-4 bg-slate-950/90 border-t border-brandBorder md:border-none md:bg-transparent z-40 md:z-auto flex justify-between items-center gap-3">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider hidden md:inline">
                    Press <kbd className="bg-slate-900 px-1.5 py-0.5 rounded border border-brandBorder font-mono">Ctrl + Enter</kbd> to submit
                  </span>
                  <button
                    type="submit"
                    disabled={hasSubmitted || !userAnswer.trim()}
                    className="btn-neon-grad py-3.5 px-6 flex items-center justify-center gap-2 disabled:opacity-40 ml-auto md:w-auto w-full font-bold shadow-glow-indigo"
                  >
                    <Send className="w-4 h-4" />
                    Submit Answer
                  </button>
                </div>
              </form>
            )}

            {/* GRADING IN PROGRESS OVERLAY */}
            {grading && (
              <div className="py-16 text-center flex flex-col items-center gap-4">
                <Loader className="w-10 h-10 text-neonViolet animate-spin shadow-glow-violet rounded-full" />
                <h4 className="font-bold text-slate-200">Submissions Closed</h4>
                <p className="text-slate-400 text-sm animate-pulse">Evaluating answers using AI engine...</p>
              </div>
            )}

            {/* PERSONAL GRADING RESULT DISPLAY */}
            {personalResult && (
              <div className="space-y-6 pt-6 border-t border-brandBorder/40">
                <div className={`flex items-start gap-4 p-5 rounded-2xl border ${
                  personalResult.isCorrect 
                    ? 'bg-emerald-950/20 border-emerald-900/60 text-emerald-300' 
                    : 'bg-rose-950/10 border-rose-900/40 text-rose-300'
                }`}>
                  {personalResult.isCorrect ? (
                    <CheckCircle2 className="w-7 h-7 text-neonGreen flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-7 h-7 text-neonRed flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4 className="font-bold text-lg text-slate-100 flex items-center gap-2">
                      {personalResult.isCorrect ? 'Correct Answer!' : 'Incorrect / Partial Credit'}
                      <span className="text-xs bg-slate-900 text-slate-400 py-1 px-2.5 rounded-full border border-brandBorder font-semibold">
                        Score: {personalResult.score}/10
                      </span>
                    </h4>
                    <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                      {personalResult.feedbackText}
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5 text-sm pt-2">
                  <div className="bg-slate-950/50 border border-brandBorder p-5 rounded-xl">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-2 font-mono">
                      Correct Answer Guide
                    </span>
                    <p className="text-slate-300 font-medium leading-relaxed">
                      {personalResult.correctAnswer}
                    </p>
                  </div>

                  <div className="bg-slate-950/50 border border-brandBorder p-5 rounded-xl">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-2 font-mono">
                      AI Concept Explanation
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      {personalResult.explanation}
                    </p>
                  </div>
                </div>
                
                <div className="bg-neonIndigo/5 border border-neonIndigo/20 p-3.5 rounded-xl flex items-center justify-center gap-2 text-xs text-slate-400 mt-4">
                  <Hourglass className="w-4 h-4 text-neonIndigo animate-spin" />
                  Next question starts automatically in a few seconds...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Competitors & Leaderboard (Right 1 column) */}
        <div className="space-y-6">
          <div className="glass-card p-5 border-brandBorder/80">
            <h3 className="font-bold text-base text-slate-200 mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-neonIndigo" />
              Live Scoreboard
            </h3>

            <div className="space-y-3.5">
              {leaderboard.length > 0 ? (
                leaderboard
                  .sort((a, b) => b.score - a.score)
                  .map((player, index) => {
                    const isSelf = currentUser && player.userId === currentUser.id;
                    const hasUserSubmitted = submittingUserIds.has(player.userId) || (isSelf && hasSubmitted);
                    
                    return (
                      <div
                        key={player.userId}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                          isSelf 
                            ? 'bg-neonIndigo/10 border-neonIndigo/40 shadow-glow-indigo' 
                            : 'bg-slate-950/40 border-brandBorder'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className="text-xs font-bold text-slate-500 w-4 text-right">
                            {index + 1}
                          </span>
                          <span className={`text-sm font-semibold truncate ${isSelf ? 'text-white' : 'text-slate-300'}`}>
                            {player.username}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {hasUserSubmitted && !personalResult && (
                            <span className="text-[10px] bg-emerald-950 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-900 uppercase tracking-wider animate-pulse">
                              Sent
                            </span>
                          )}
                          <span className="text-sm font-extrabold text-slate-100 font-mono">
                            {player.score}
                          </span>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="text-center py-4 text-xs text-slate-500">
                  Initializing standings...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {showCountdownOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="glass-card p-12 max-w-sm w-full text-center border-neonIndigo/30 shadow-glow-indigo flex flex-col items-center justify-center space-y-6 transform scale-100 transition-all duration-300">
            <div className="text-xs uppercase tracking-widest text-neonViolet font-bold animate-pulse">
              Challenge Starting
            </div>
            <div className="w-32 h-32 rounded-full border-4 border-neonIndigo/20 flex items-center justify-center bg-slate-900/60 shadow-inner relative">
              <div className="absolute inset-0 rounded-full border-4 border-t-neonIndigo border-r-neonViolet animate-spin duration-1000 opacity-60" />
              <span className="text-6xl font-black font-outfit text-white drop-shadow-[0_0_15px_rgba(99,102,241,0.6)]">
                {countdown === 0 ? 'GO!' : countdown}
              </span>
            </div>
            <p className="text-slate-400 text-sm font-medium">
              {countdown === 0 ? 'Prepare your answers!' : 'Get ready to explain your logic...'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
