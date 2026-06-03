import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, getUser } from '../utils/api.js';
import { Loader, Home, Award, Calendar, BarChart2, Star, BookOpen, Printer, CheckCircle, XCircle } from 'lucide-react';

export default function Results() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const currentUser = getUser();

  const [loading, setLoading] = useState(true);
  const [matchData, setMatchData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [userReport, setUserReport] = useState('');
  const [error, setError] = useState('');
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    async function loadResults() {
      try {
        setLoading(true);
        // Load details from database
        const data = await api.dashboard.getMatch(matchId);
        setMatchData(data.match);
        setParticipants(data.participants || []);

        // Find the report for this user in the participants array from database
        const currentUserStats = data.participants?.find(p => p.userId === currentUser?.id);
        let report = currentUserStats?.aiReportCard;

        if (!report) {
          // Fallback: If not in database yet, check session storage (ongoing socket event)
          const storedStr = sessionStorage.getItem(`match_report_${matchId}`);
          if (storedStr) {
            const parsed = JSON.parse(storedStr);
            const userReportObj = parsed.reports?.find(r => r.userId === currentUser?.id);
            if (userReportObj) {
              report = userReportObj.reportCard;
            }
          }
        }
        
        // Final fallback: Use the match feedback summary
        if (!report && data.match.aiFeedbackSummary) {
          report = data.match.aiFeedbackSummary;
        }

        setUserReport(report || '');
      } catch (err) {
        console.error('Error loading results:', err);
        setError("Failed to retrieve game results. Check your internet connection and retry.");
      } finally {
        setLoading(false);
      }
    }

    loadResults();
  }, [matchId, currentUser?.id]);

  // Keyboard shortcut to return Home using Alt+N
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key === 'n') {
        e.preventDefault();
        navigate('/');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const stats = participants.find(p => p.userId === currentUser?.id);
    const score = stats?.totalScore || 0;
    const max = matchData.questions.length * 10;
    const acc = max > 0 ? (score / max) * 100 : 0;
    const shareText = `I scored ${score}/${max} (${acc.toFixed(0)}%) on ${matchData.topic} (${matchData.difficulty}) in Interview.AI! 🚀 Practice your AI-graded technical mock interviews at ${window.location.origin}`;
    navigator.clipboard.writeText(shareText);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  // Basic Custom Markdown Formatter to render AI feedback with premium styling
  const renderMarkdown = (text) => {
    if (!text) return null;
    
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      
      // H3
      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={idx} className="text-lg font-bold text-slate-100 mt-6 mb-3 flex items-center gap-2 border-b border-brandBorder/40 pb-1.5 text-gradient">
            {trimmed.substring(4)}
          </h3>
        );
      }
      
      // H4
      if (trimmed.startsWith('#### ')) {
        return (
          <h4 key={idx} className="text-sm font-extrabold uppercase tracking-wider text-neonIndigo mt-4 mb-2">
            {trimmed.substring(5)}
          </h4>
        );
      }
      
      // Bullet items
      if (trimmed.startsWith('- ')) {
        // Parse bold elements inside bullet
        const content = trimmed.substring(2);
        return (
          <li key={idx} className="text-sm text-slate-300 ml-4 list-disc mb-1.5 leading-relaxed">
            {parseBoldText(content)}
          </li>
        );
      }
      
      // Empty line
      if (trimmed === '') {
        return <div key={idx} className="h-2" />;
      }
      
      // Regular paragraph
      return (
        <p key={idx} className="text-sm text-slate-300 leading-relaxed mb-3">
          {parseBoldText(trimmed)}
        </p>
      );
    });
  };

  // Helper to highlight **bold** text
  const parseBoldText = (text) => {
    const parts = text.split('**');
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="text-slate-100 font-semibold">{part}</strong>;
      }
      return part;
    });
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-8 animate-pulse">
        {/* Top Header Banner Skeleton */}
        <div className="flex flex-col items-center space-y-3 pb-8 border-b border-brandBorder/40">
          <div className="w-16 h-16 bg-slate-800 rounded-full" />
          <div className="h-8 bg-slate-800 rounded w-1/3" />
          <div className="h-4 bg-slate-800 rounded w-1/4" />
        </div>
        
        {/* Main Grid Skeleton */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column Stats (1 Col) */}
          <div className="space-y-6">
            <div className="h-48 bg-slate-800 rounded-2xl" />
            <div className="h-64 bg-slate-800 rounded-2xl" />
          </div>
          {/* Right Column Content (2 Cols) */}
          <div className="md:col-span-2 space-y-6">
            <div className="h-96 bg-slate-800 rounded-2xl" />
            <div className="h-64 bg-slate-800 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !matchData) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center glass-card p-8 border-neonRed/20">
        <h3 className="text-xl font-bold text-neonRed mb-2 font-mono">Error Loading Results</h3>
        <p className="text-slate-400 mb-6">{error || 'Data is unavailable.'}</p>
        <button onClick={() => navigate('/')} className="btn-neon-grad py-3 px-6 w-full flex items-center justify-center gap-2">
          <Home className="w-4 h-4" /> Back to Home
        </button>
      </div>
    );
  }

  // Find user's score details
  const currentUserStats = participants.find(p => p.userId === currentUser?.id);
  const userScore = currentUserStats?.totalScore || 0;
  const userCorrect = currentUserStats?.correctCount || 0;
  const maxPossible = matchData.questions.length * 10;
  const accuracyPercentage = maxPossible > 0 ? (userScore / maxPossible) * 100 : 0;

  // Sorting participants to determine winner
  const sortedParticipants = [...participants].sort((a, b) => b.totalScore - a.totalScore);
  const isWinner = sortedParticipants[0]?.userId === currentUser?.id;

  // 13. Dynamic AI sub-score calculations
  const answers = currentUserStats?.answers || [];
  const shortAnswers = answers.filter(a => !a.options || a.questionType === 'short');
  
  // A. Problem Solving: match accuracy
  const problemSolvingScore = Math.round(accuracyPercentage);
  
  // B. Technical Depth: avg score of conceptual questions (scale 0-10 to 0-100)
  const avgShortScore = shortAnswers.length 
    ? (shortAnswers.reduce((sum, a) => sum + a.score, 0) / shortAnswers.length) 
    : (userScore / maxPossible) * 10;
  const techDepthScore = Math.min(100, Math.max(30, Math.round(avgShortScore * 10)));

  // C. Communication: word count of short answers
  let totalWords = 0;
  shortAnswers.forEach(a => {
    totalWords += (a.userAnswer || '').trim().split(/\s+/).filter(Boolean).length;
  });
  const avgWords = shortAnswers.length ? (totalWords / shortAnswers.length) : 0;
  const communicationScore = Math.min(100, Math.max(45, Math.round(avgWords * 1.5 + 50)));

  // D. Confidence: speed of answer response
  let totalResponseTime = 0;
  answers.forEach(a => {
    totalResponseTime += a.responseTimeSeconds || 30;
  });
  const avgTime = answers.length ? (totalResponseTime / answers.length) : 15;
  const confidenceScore = Math.min(100, Math.max(50, Math.round(100 - (avgTime * 1.5))));

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Printable CSS formatting styles */}
      <style>{`
        @media print {
          body {
            background: #090d16 !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .print-border {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>

      {/* Print / Certificate controls */}
      <div className="no-print flex items-center justify-between mb-8 bg-slate-900/60 border border-brandBorder p-4 rounded-2xl">
        <Link to="/" className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-semibold transition-all">
          <Home className="w-4 h-4" /> Back to Home
        </Link>

        <div className="flex gap-2">
          <button
            onClick={() => navigate('/', { state: { rematchTopic: matchData.topic, rematchDifficulty: matchData.difficulty } })}
            className="py-2.5 px-4 bg-neonViolet/15 hover:bg-neonViolet/25 text-neonViolet border border-neonViolet/35 rounded-xl hover:shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all text-xs font-bold flex items-center gap-1.5"
          >
            Play Again
          </button>

          <button
            onClick={handleShare}
            className="py-2.5 px-4 bg-slate-900 border border-slate-700/80 hover:border-slate-500 rounded-xl hover:text-white transition-all text-xs font-semibold flex items-center gap-1.5"
          >
            {copiedShare ? <CheckCircle className="w-4 h-4 text-neonGreen" /> : <Star className="w-4 h-4 text-slate-400" />}
            {copiedShare ? 'Copied Details!' : 'Share Result'}
          </button>

          {accuracyPercentage >= 70 && (
            <Link
              to={`/certificate/${matchId}`}
              className="py-2.5 px-4 bg-gradient-to-r from-neonIndigo to-neonViolet text-white border border-neonIndigo/20 rounded-xl hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all text-xs font-bold flex items-center gap-1.5"
            >
              <Award className="w-4 h-4" /> View Certificate
            </Link>
          )}

          <button
            onClick={handlePrint}
            className="py-2.5 px-4 bg-slate-900 border border-slate-700/80 hover:border-slate-500 rounded-xl hover:text-white transition-all text-xs font-semibold flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" /> Export Report (PDF)
          </button>
        </div>
      </div>

      {/* Top Banner */}
      <div className="text-center mb-10">
        <div className="inline-flex justify-center bg-neonViolet/10 p-4 rounded-full border border-neonViolet/20 mb-4 animate-float">
          <Award className="w-12 h-12 text-neonViolet shadow-glow-violet" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-100">
          {matchData.mode === 'solo' 
            ? 'Training Session Complete' 
            : isWinner 
            ? '🏆 Victory! Match Finished' 
            : 'Match Finished'}
        </h1>
        <p className="text-slate-400 text-sm mt-2">
          Match ID: <span className="font-mono text-slate-300">{matchData.id}</span> | {new Date(matchData.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 items-start">
        {/* Left Column: Player Stats & Leaderboard (1 Column) */}
        <div className="space-y-6">
          {/* User Score Card */}
          <div className="glass-card p-6 border-brandBorder relative overflow-hidden print-border flex flex-col items-center">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-neonIndigo no-print" />
            <h3 className="font-bold text-slate-200 text-sm mb-4 uppercase tracking-wider flex items-center gap-2 self-start w-full">
              <BarChart2 className="w-4 h-4 text-neonIndigo" /> Performance Stats
            </h3>
            
            {/* Circular score ring */}
            <div className="flex flex-col items-center justify-center py-4 border-b border-brandBorder/40 mb-4 w-full">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    className="stroke-slate-800"
                    strokeWidth="3"
                    fill="transparent"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    className="stroke-neonIndigo shadow-glow-indigo transition-all duration-1000"
                    strokeWidth="3"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 16}
                    strokeDashoffset={(2 * Math.PI * 16) - (accuracyPercentage / 100) * (2 * Math.PI * 16)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-white">{accuracyPercentage.toFixed(0)}%</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Accuracy</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 w-full text-left">
              <div>
                <span className="text-xs text-slate-400 block">Total Match Score</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-extrabold text-white">{userScore}</span>
                  <span className="text-xs text-slate-500 font-bold">/ {maxPossible}</span>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 block">Correct Submissions</span>
                <span className="text-lg font-bold text-slate-200 mt-1 block">
                  {userCorrect} <span className="text-xs text-slate-500 font-bold">out of {matchData.questions.length}</span>
                </span>
              </div>
            </div>
          </div>

          {/* AI Score Breakdown Card */}
          <div className="glass-card p-6 border-brandBorder print-border space-y-4">
            <h3 className="font-bold text-slate-200 text-sm border-b border-brandBorder/40 pb-2 uppercase tracking-wider flex items-center gap-2">
              <Star className="w-4 h-4 text-neonYellow" /> Score Breakdown
            </h3>
            
            <div className="space-y-4">
              {[
                { label: 'Communication', val: communicationScore },
                { label: 'Technical Depth', val: techDepthScore },
                { label: 'Problem Solving', val: problemSolvingScore },
                { label: 'Confidence', val: confidenceScore }
              ].map((sub) => (
                <div key={sub.label} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">{sub.label}</span>
                    <span className="text-slate-400">{sub.val}%</span>
                  </div>
                  <div className="w-full bg-slate-950/80 rounded-full h-2 border border-brandBorder overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-neonIndigo to-neonViolet h-full rounded-full transition-all duration-500 shadow-glow-indigo"
                      style={{ width: `${sub.val}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Standings list */}
          <div className="glass-card p-6 border-brandBorder print-border">
            <h3 className="font-bold text-slate-200 text-sm mb-4 uppercase tracking-wider flex items-center gap-2">
              <Star className="w-4 h-4 text-neonViolet" /> Match Standings
            </h3>
            
            <div className="space-y-3">
              {sortedParticipants.map((p, idx) => {
                const isSelf = currentUser && p.userId === currentUser.id;
                return (
                  <div 
                    key={p.userId}
                    className={`flex items-center justify-between p-3 rounded-xl border ${
                      isSelf ? 'bg-neonIndigo/10 border-neonIndigo/40' : 'bg-slate-950/40 border-brandBorder'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-xs font-bold text-slate-500 w-4 text-right">{idx + 1}</span>
                      <span className="text-sm font-semibold truncate text-slate-200">{p.username}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-300 font-mono">{p.totalScore} pts</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: AI Report Card & Review (2 Columns) */}
        <div className="md:col-span-2 space-y-6">
          {/* AI Report Card */}
          <div className="glass-card p-6 md:p-8 border-brandBorder/80 print-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-neonViolet/10 p-2.5 rounded-xl border border-neonViolet/20 no-print">
                <BookOpen className="w-5 h-5 text-neonViolet shadow-glow-violet" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-100">Personalized AI Feedback</h3>
                <span className="text-xs text-slate-400">Generated by Claude Engine</span>
              </div>
            </div>

            <div className="bg-slate-950/50 border border-brandBorder rounded-2xl p-6 prose max-w-none print-border">
              {userReport ? (
                renderMarkdown(userReport)
              ) : (
                <p className="text-slate-400 text-sm">No report card generated for this match.</p>
              )}
            </div>
          </div>

          {/* Question Review List */}
          <div className="glass-card p-6 md:p-8 border-brandBorder/80 print-border">
            <h3 className="font-bold text-lg text-slate-100 mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-neonIndigo" />
              Question & Answer Log
            </h3>
            
            <div className="space-y-5">
              {matchData.questions.map((q, idx) => {
                const userAnsObj = currentUserStats?.answers?.find(a => a.questionText === q.questionText);
                return (
                  <div key={q.id} className="bg-slate-950/40 border border-brandBorder rounded-xl p-5 space-y-3 print-border">
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mt-1">
                        Question {idx + 1}
                      </span>
                      {userAnsObj && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                          userAnsObj.isCorrect 
                            ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-400' 
                            : 'bg-rose-950/30 border-rose-900/40 text-neonRed'
                        }`}>
                          {userAnsObj.isCorrect ? `Correct (+${userAnsObj.score})` : `Incorrect (${userAnsObj.score}/10)`}
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-semibold text-slate-200 leading-snug">{q.questionText}</p>
                    
                    <div className="text-xs text-slate-400 space-y-2.5 pt-3 border-t border-brandBorder/35">
                      <div>
                        <span className="font-bold text-slate-300 block">Your Answer:</span>
                        <p className="font-mono bg-slate-950/80 p-2.5 rounded border border-brandBorder/50 mt-1 text-slate-300 break-words whitespace-pre-wrap">
                          {userAnsObj ? userAnsObj.userAnswer : 'No submission (Timed Out)'}
                        </p>
                      </div>

                      {q.correctAnswer && (
                        <div>
                          <span className="font-bold text-neonGreen block">Correct Approach Guide:</span>
                          <p className="bg-emerald-950/10 border border-emerald-900/40 p-2.5 rounded text-slate-300 mt-1 leading-relaxed">
                            {q.correctAnswer}
                          </p>
                        </div>
                      )}
                      
                      {userAnsObj?.feedbackText && (
                        <div>
                          <span className="font-bold text-neonViolet block">AI Evaluation Feedback:</span>
                          <p className="text-slate-300 mt-1 leading-relaxed italic bg-neonViolet/5 p-2.5 rounded border border-neonViolet/10">
                            {userAnsObj.feedbackText}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
