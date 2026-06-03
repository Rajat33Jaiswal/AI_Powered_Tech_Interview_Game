import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, getUser } from '../utils/api.js';
import { Loader, Send, CheckCircle2, XCircle, Hourglass, ShieldAlert, Mic, MicOff, CheckCircle } from 'lucide-react';

export default function SoloGame() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const currentUser = getUser();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Game session details
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Active question state
  const [userAnswer, setUserAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [grading, setGrading] = useState(false);
  const [personalResult, setPersonalResult] = useState(null);
  
  // Auto-save draft status
  const [draftSaved, setDraftSaved] = useState(false);
  
  // Voice listening status
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const shouldListenRef = useRef(false);
  const [speechError, setSpeechError] = useState('');

  // Final report card state
  const [generatingReport, setGeneratingReport] = useState(false);

  // Countdown overlay state
  const [countdown, setCountdown] = useState(3);
  const [showCountdownOverlay, setShowCountdownOverlay] = useState(true);

  // Timers
  const timerRef = useRef(null);
  const questionStartTime = useRef(Date.now());

  // 1. Load / Resume match details on mount
  useEffect(() => {
    async function loadSoloMatch() {
      try {
        setLoading(true);
        const data = await api.dashboard.getMatch(matchId);
        
        if (data.match.mode !== 'solo') {
          setError('This match is not in Solo Mode. Please return to the homepage.');
          setLoading(false);
          return;
        }

        if (data.match.status === 'completed') {
          navigate(`/results/${matchId}`);
          return;
        }

        setTopic(data.match.topic);
        setDifficulty(data.match.difficulty);
        setQuestions(data.match.questions || []);

        // Recompute current question index from user's already graded answers
        const userParticipant = data.participants.find(p => p.userId === currentUser?.id);
        const userAnswers = userParticipant?.answers || [];
        
        let firstUnansweredIdx = 0;
        for (let i = 0; i < data.match.questions.length; i++) {
          const q = data.match.questions[i];
          const hasAnswered = userAnswers.some(ans => ans.questionText === q.questionText);
          if (!hasAnswered) {
            firstUnansweredIdx = i;
            break;
          }
          firstUnansweredIdx = i + 1;
        }

        if (firstUnansweredIdx >= data.match.questions.length) {
          handleFinishGame();
        } else {
          setCurrentIndex(firstUnansweredIdx);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading solo game:', err);
        setError("Couldn't connect to server. Check your internet connection and retry.");
        setLoading(false);
      }
    }

    loadSoloMatch();
  }, [matchId]);

  // Countdown useEffect
  useEffect(() => {
    if (loading || currentIndex !== 0) {
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
  }, [loading, currentIndex, showCountdownOverlay]);

  // 2. Manage 30-second timer per question
  useEffect(() => {
    if (loading || generatingReport || personalResult || grading || showCountdownOverlay) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setTimeLeft(30);
    questionStartTime.current = Date.now();

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          autoSubmitTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, loading, generatingReport, personalResult, grading, showCountdownOverlay]);

  // 3. Auto-save drafts to localStorage
  const currentQ = questions[currentIndex];
  useEffect(() => {
    if (loading || hasSubmitted || !userAnswer || userAnswer.trim() === '' || !currentQ) return;

    const saveTimeout = setTimeout(() => {
      localStorage.setItem(`draft_match_${matchId}_q_${currentQ.id}`, userAnswer);
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 1500);
    }, 2000);

    return () => clearTimeout(saveTimeout);
  }, [userAnswer, matchId, currentQ?.id, loading, hasSubmitted]);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      recognitionRef.current?.stop();
    };
  }, []);

  // 4. Recover drafts when index shifts
  useEffect(() => {
    if (currentQ?.id) {
      const savedDraft = localStorage.getItem(`draft_match_${matchId}_q_${currentQ.id}`);
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
  }, [currentIndex, currentQ?.id, matchId]);

  // 5. Unsaved Answer warn leaving page
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

  // 6. Keyboard shortcuts (Ctrl+Enter to submit, Alt+N for next, 1-4 for MCQ selection, Enter to submit MCQ)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 1-4 keys for MCQ selection
      if (!hasSubmitted && currentQ && currentQ.questionType === 'MCQ' && !grading && !personalResult) {
        if (e.key >= '1' && e.key <= '4') {
          const optIndex = parseInt(e.key) - 1;
          if (currentQ.options && currentQ.options[optIndex]) {
            e.preventDefault();
            setUserAnswer(currentQ.options[optIndex]);
          }
        }
      }

      // Enter key for MCQ submission (directly, no Ctrl required)
      if (e.key === 'Enter' && !e.ctrlKey) {
        if (currentQ && currentQ.questionType === 'MCQ') {
          if (!hasSubmitted && userAnswer.trim() !== '' && !grading && !personalResult) {
            e.preventDefault();
            submitGrading(userAnswer);
          }
        }
      }

      if (e.ctrlKey && e.key === 'Enter') {
        if (!hasSubmitted && userAnswer.trim() !== '' && !grading && !personalResult) {
          e.preventDefault();
          submitGrading(userAnswer);
        }
      }
      if (e.altKey && e.key === 'n') {
        if (personalResult) {
          e.preventDefault();
          handleNextQuestion();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [userAnswer, hasSubmitted, grading, personalResult, currentQ]);

  // 7. Speech-to-Text Voice Mode
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

  const autoSubmitTimeout = () => {
    if (hasSubmitted) return;
    setHasSubmitted(true);
    // Stop voice mode
    shouldListenRef.current = false;
    recognitionRef.current?.stop();
    setIsListening(false);
    submitGrading('');
  };

  const handleAnswerSubmit = (e) => {
    e.preventDefault();
    if (hasSubmitted || !userAnswer.trim()) return;

    setHasSubmitted(true);
    // Stop voice mode
    shouldListenRef.current = false;
    recognitionRef.current?.stop();
    setIsListening(false);
    submitGrading(userAnswer);
  };

  const submitGrading = async (answerText) => {
    setGrading(true);
    const elapsedSeconds = Math.min(30, Math.floor((Date.now() - questionStartTime.current) / 1000));
    
    // Clear auto-save draft on submission
    if (currentQ) {
      localStorage.removeItem(`draft_match_${matchId}_q_${currentQ.id}`);
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/solo/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          matchId,
          questionId: currentQ.id,
          userAnswer: answerText,
          responseTimeSeconds: elapsedSeconds
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setGrading(false);
      setPersonalResult(data);
    } catch (err) {
      console.error('Error grading answer:', err);
      setGrading(false);
      setError("Grade grading failed. Check your network link and retry.");
    }
  };

  const handleNextQuestion = () => {
    setPersonalResult(null);
    setHasSubmitted(false);
    setUserAnswer('');
    
    const nextIdx = currentIndex + 1;
    if (nextIdx < questions.length) {
      setCurrentIndex(nextIdx);
    } else {
      handleFinishGame();
    }
  };

  const handleFinishGame = async () => {
    setGeneratingReport(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/solo/finish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ matchId })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      navigate(`/results/${matchId}`);
    } catch (err) {
      console.error('Error finishing solo match:', err);
      setError("Failed to compile final report card. Try refreshing the page to retry.");
      setGeneratingReport(false);
    }
  };

  if (loading) {
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

  if (generatingReport) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 text-center max-w-md mx-auto px-4">
        <Loader className="w-16 h-16 text-neonViolet animate-spin shadow-glow-violet rounded-full p-2 border border-neonViolet/30 bg-neonViolet/5" />
        <h2 className="text-2xl font-bold text-slate-100 font-outfit">Compiling Report Card</h2>
        <p className="text-slate-400 text-sm animate-pulse font-outfit">
          Claude is analyzing your answer logs, checking structural accuracy, and formatting your report card...
        </p>
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center glass-card p-8 border-neonRed/20">
        <h3 className="text-xl font-bold text-neonRed mb-2 flex items-center justify-center gap-2">
          <ShieldAlert className="w-6 h-6" /> Game Error
        </h3>
        <p className="text-slate-400 mb-6">{error}</p>
        <button onClick={() => navigate('/')} className="btn-secondary w-full py-2.5">
          Back to Home
        </button>
      </div>
    );
  }

  // Circular Timer Math
  const radius = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft / 30) * circumference;

  // Color ranges: Green (>15s), Yellow (15-5s), Red (<5s)
  const timerColor = timeLeft > 15 
    ? 'stroke-neonGreen shadow-glow-green' 
    : timeLeft > 5 
    ? 'stroke-amber-500 shadow-glow-orange' 
    : 'stroke-neonRed animate-pulse shadow-glow-red';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {error && (
        <div className="bg-neonRed/10 border border-neonRed/30 text-neonRed text-sm p-4 rounded-xl flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-xs underline font-semibold ml-2 hover:text-white">Dismiss</button>
        </div>
      )}

      {/* Progress & Circular Timer header */}
      <div className="flex items-center justify-between bg-slate-950/40 border border-brandBorder p-5 rounded-2xl">
        <div className="space-y-2 flex-1 max-w-sm mr-4">
          <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Round Progress</span>
            <span>{Math.round(((currentIndex + 1) / questions.length) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2 border border-brandBorder overflow-hidden">
            <div 
              className="bg-gradient-to-r from-neonIndigo to-neonViolet h-full rounded-full transition-all duration-300 shadow-glow-indigo"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
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

      <div className="glass-card p-6 md:p-8 border-brandBorder/80 space-y-6 relative overflow-hidden pb-24 md:pb-8">
        <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-neonIndigo to-neonViolet" />
        
        {/* Topic and Difficulty indicators */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brandBorder/40 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-slate-950 text-slate-400 px-3 py-1 rounded-md border border-brandBorder uppercase tracking-wider">
              Question {currentIndex + 1} of {questions.length}
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
            {currentQ.questionType === 'MCQ' ? 'Multiple Choice' : 'Conceptual Free Response'}
          </span>
        </div>

        <h3 className="text-xl md:text-2xl font-bold text-slate-100 leading-snug">
          {currentQ.questionText}
        </h3>

        {/* Input Form */}
        {!personalResult && !grading && (
          <form onSubmit={handleAnswerSubmit} className="space-y-6 pt-4">
            {currentQ.questionType === 'MCQ' ? (
              <div className="grid gap-3">
                {currentQ.options.map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => !hasSubmitted && setUserAnswer(opt)}
                    disabled={hasSubmitted}
                    className={`w-full py-4 px-5 rounded-xl border text-left font-medium transition-all flex items-center justify-between ${
                      userAnswer === opt
                        ? 'bg-neonIndigo/10 border-neonIndigo text-white shadow-glow-indigo'
                        : 'bg-slate-950/40 border-brandBorder text-slate-300 hover:border-slate-800'
                    }`}
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
                  placeholder={isListening ? "Listening... Speak clearly to type." : "Explain the topic details. Claude will grade you based on correct concepts and keywords..."}
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
                className="btn-neon-grad py-3.5 px-6 flex items-center justify-center gap-2 disabled:opacity-40 ml-auto md:w-auto w-full"
              >
                <Send className="w-4 h-4" /> Submit Answer
              </button>
            </div>
          </form>
        )}

        {/* Grading Loader */}
        {grading && (
          <div className="py-16 text-center flex flex-col items-center gap-4">
            <Loader className="w-10 h-10 text-neonViolet animate-spin shadow-glow-violet rounded-full" />
            <h4 className="font-bold text-slate-200">Evaluating Submission</h4>
            <p className="text-slate-400 text-sm animate-pulse">Checking answer parameters with AI grader...</p>
          </div>
        )}

        {/* Results Screen */}
        {personalResult && (
          <div className="space-y-6 pt-6 border-t border-brandBorder/40 animate-fade-in">
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
                  {personalResult.isCorrect ? 'Fully Correct!' : 'Partial/Incorrect Score'}
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
                  Reference Answer
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

            <div className="md:relative fixed bottom-0 left-0 right-0 md:p-0 p-4 bg-slate-950/90 border-t border-brandBorder md:border-none md:bg-transparent z-40 md:z-auto flex justify-between items-center gap-3">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider hidden md:inline">
                Press <kbd className="bg-slate-900 px-1.5 py-0.5 rounded border border-brandBorder font-mono">Alt + N</kbd> for next question
              </span>
              <button
                onClick={handleNextQuestion}
                className="btn-neon-grad py-3.5 px-6 flex items-center justify-center gap-2 ml-auto md:w-auto w-full font-bold"
              >
                {currentIndex + 1 < questions.length ? 'Next Question' : 'Finish Challenge'}
              </button>
            </div>
          </div>
        )}
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
