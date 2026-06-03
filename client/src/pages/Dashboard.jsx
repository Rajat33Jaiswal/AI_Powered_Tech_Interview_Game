import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, getToken, getUser } from '../utils/api.js';
import { Loader, Trophy, Cpu, Zap, ArrowRight, Play, LayoutDashboard, Star, Calendar } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const currentUser = getUser();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ 
    gamesPlayed: 0, 
    avgScore: 0, 
    maxScore: 0, 
    topicAverages: { DSA: 0, OS: 0, DBMS: 0, Java: 0, WebDev: 0, OOP: 0, SystemDesign: 0 },
    performanceTrend: [],
    streak: 0
  });
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getToken()) {
      return navigate('/login');
    }

    async function loadDashboard() {
      try {
        setLoading(true);
        setError('');
        const [statsData, historyData] = await Promise.all([
          api.dashboard.getStats(),
          api.dashboard.getHistory()
        ]);
        setStats(statsData.stats);
        setHistory(historyData.history);
      } catch (err) {
        console.error('Error fetching dashboard:', err);
        setError("Couldn't retrieve your stats. Check your connection and retry.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [navigate]);

  // SVG Trend Chart Builder
  const renderTrendChart = (trend) => {
    if (!trend || trend.length === 0) {
      return (
        <div className="text-center py-12 text-xs text-slate-500 font-bold uppercase tracking-wider">
          Play matches to view performance history.
        </div>
      );
    }
    
    const width = 500;
    const height = 150;
    const padding = 25;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    const pointsCount = trend.length;
    const xStep = pointsCount > 1 ? chartWidth / (pointsCount - 1) : chartWidth;
    
    const coords = trend.map((score, index) => {
      const x = padding + index * xStep;
      const y = height - padding - (score / 100) * chartHeight;
      return { x, y, score };
    });
    
    let d = '';
    if (coords.length > 0) {
      d = `M ${coords[0].x} ${coords[0].y}`;
      for (let i = 1; i < coords.length; i++) {
        d += ` L ${coords[i].x} ${coords[i].y}`;
      }
    }
    
    let fillD = '';
    if (coords.length > 0) {
      fillD = `${d} L ${coords[coords.length - 1].x} ${height - padding} L ${coords[0].x} ${height - padding} Z`;
    }
    
    return (
      <div className="w-full overflow-hidden pt-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 3" />
          <line x1={padding} y1={height/2} x2={width - padding} y2={height/2} stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#334155" strokeWidth="0.8" />
          
          {/* Area under trend line */}
          {fillD && <path d={fillD} fill="url(#trendGrad)" />}
          
          {/* Trend line */}
          {d && <path d={d} fill="none" stroke="#6366f1" strokeWidth="2.5" className="drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]" />}
          
          {/* Circles and values */}
          {coords.map((pt, idx) => (
            <g key={idx}>
              <circle cx={pt.x} cy={pt.y} r="4" className="fill-slate-950 stroke-neonIndigo stroke-[2.5]" />
              <text x={pt.x} y={pt.y - 8} textAnchor="middle" className="text-[10px] font-black fill-slate-200 font-mono">
                {pt.score}%
              </text>
              <text x={pt.x} y={height - padding + 15} textAnchor="middle" className="text-[9px] font-bold fill-slate-500 font-mono">
                M{idx + 1}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-10 animate-pulse">
        {/* Loading skeleton layout */}
        <div className="flex justify-between items-center border-b border-brandBorder/50 pb-6">
          <div className="space-y-3 w-1/3">
            <div className="h-7 bg-slate-800 rounded w-3/4" />
            <div className="h-4 bg-slate-800 rounded w-1/2" />
          </div>
          <div className="h-10 bg-slate-800 rounded-lg w-32" />
        </div>
        <div className="grid sm:grid-cols-4 gap-6">
          <div className="h-24 bg-slate-800 rounded-2xl" />
          <div className="h-24 bg-slate-800 rounded-2xl" />
          <div className="h-24 bg-slate-800 rounded-2xl" />
          <div className="h-24 bg-slate-800 rounded-2xl" />
        </div>
        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-2 h-64 bg-slate-800 rounded-2xl" />
          <div className="md:col-span-3 h-64 bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-10">
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brandBorder pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 flex items-center gap-2">
            <LayoutDashboard className="w-8 h-8 text-neonIndigo" />
            Developer Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Track your interview performance, review AI feedback report cards, and check stats.
          </p>
        </div>
        
        <div className="flex gap-3">
          <Link to={`/interviewer/${currentUser?.username}`} className="btn-secondary flex items-center justify-center gap-2 py-3 px-5 text-sm font-semibold">
            View Public Profile
          </Link>
          <Link to="/" className="btn-neon-grad flex items-center justify-center gap-2 py-3 px-5 text-sm">
            <Play className="w-4 h-4 fill-current" /> Start New Practice
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-neonRed/10 border border-neonRed/30 text-neonRed text-sm p-4 rounded-xl flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-xs underline font-semibold ml-2 hover:text-white">Dismiss</button>
        </div>
      )}

      {/* Stats Cards (Grid of 4 including Streak) */}
      <div className="grid sm:grid-cols-4 gap-6">
        {/* Streak card */}
        <div className="glass-card p-6 border-brandBorder/80 relative overflow-hidden flex items-center gap-4">
          <div className="bg-amber-950/20 p-3.5 rounded-xl border border-amber-800/40 flex-shrink-0">
            <span className="text-2xl">🔥</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Practice Streak</span>
            <span className="text-2xl font-extrabold text-amber-400 mt-1 block">{stats.streak} Days</span>
          </div>
        </div>

        {/* Games Played */}
        <div className="glass-card p-6 border-brandBorder/80 relative overflow-hidden flex items-center gap-4">
          <div className="bg-neonIndigo/10 p-3.5 rounded-xl border border-neonIndigo/20 flex-shrink-0">
            <Cpu className="w-6 h-6 text-neonIndigo shadow-glow-indigo" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Matches Done</span>
            <span className="text-2xl font-extrabold text-white mt-1 block">{stats.gamesPlayed}</span>
          </div>
        </div>

        {/* Avg Score */}
        <div className="glass-card p-6 border-brandBorder/80 relative overflow-hidden flex items-center gap-4">
          <div className="bg-neonGreen/10 p-3.5 rounded-xl border border-neonGreen/20 flex-shrink-0">
            <Zap className="w-6 h-6 text-neonGreen shadow-glow-green" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Average Accuracy</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-extrabold text-white">{stats.avgScore}</span>
              <span className="text-xs text-slate-500 font-bold">%</span>
            </div>
          </div>
        </div>

        {/* Max Score */}
        <div className="glass-card p-6 border-brandBorder/80 relative overflow-hidden flex items-center gap-4">
          <div className="bg-neonViolet/10 p-3.5 rounded-xl border border-neonViolet/20 flex-shrink-0">
            <Trophy className="w-6 h-6 text-neonViolet shadow-glow-violet" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Peak Score</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-extrabold text-white">{stats.maxScore}</span>
              <span className="text-xs text-slate-500 font-bold">/ 100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Row */}
      <div className="grid md:grid-cols-5 gap-8">
        {/* Skill Analytics */}
        <div className="md:col-span-2 glass-card p-6 md:p-8 border-brandBorder/80 space-y-6">
          <h3 className="font-bold text-lg text-slate-200 border-b border-brandBorder/40 pb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-neonIndigo" /> Skill Analytics
          </h3>

          <div className="space-y-4 pt-2">
            {Object.entries(stats.topicAverages).map(([topic, val]) => (
              <div key={topic} className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">{topic === 'WebDev' ? 'Web Dev' : topic}</span>
                  <span className="text-slate-400">{val}%</span>
                </div>
                <div className="w-full bg-slate-950/80 rounded-full h-2 border border-brandBorder overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-neonIndigo to-neonViolet h-full rounded-full transition-all duration-500 shadow-glow-indigo"
                    style={{ width: `${val}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Trend */}
        <div className="md:col-span-3 glass-card p-6 md:p-8 border-brandBorder/80 space-y-4">
          <h3 className="font-bold text-lg text-slate-200 border-b border-brandBorder/40 pb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-neonViolet" /> Accuracy Trend (Last 10 Matches)
          </h3>
          {renderTrendChart(stats.performanceTrend)}
        </div>
      </div>

      {/* Match History Table */}
      <div className="glass-card p-6 md:p-8 border-brandBorder/80">
        <h2 className="text-xl font-bold text-slate-100 mb-6">Recent Match History</h2>

        {history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brandBorder/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="pb-4 font-bold">Topic</th>
                  <th className="pb-4 font-bold">Difficulty</th>
                  <th className="pb-4 font-bold">Mode</th>
                  <th className="pb-4 font-bold">Completion Date</th>
                  <th className="pb-4 font-bold">Accuracy Score</th>
                  <th className="pb-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brandBorder/40">
                {history.map((match) => (
                  <tr key={match.id} className="text-sm text-slate-300 hover:bg-slate-900/30 transition-colors">
                    <td className="py-4 font-semibold text-slate-200">{match.topic === 'WebDev' ? 'Web Dev' : match.topic}</td>
                    <td className="py-4">
                      <span className={`text-[10px] font-bold py-0.5 px-2 rounded uppercase ${
                        match.difficulty === 'Easy' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/60' :
                        match.difficulty === 'Medium' ? 'bg-amber-950 text-amber-400 border border-amber-900/60' :
                        'bg-rose-950 text-rose-400 border border-rose-900/60'
                      }`}>
                        {match.difficulty}
                      </span>
                    </td>
                    <td className="py-4 capitalize">{match.mode}</td>
                    <td className="py-4 text-slate-400">{new Date(match.createdAt).toLocaleDateString()}</td>
                    <td className="py-4 font-mono font-bold text-slate-200">
                      {match.totalScore} <span className="text-xs text-slate-500 font-normal">/ {match.maxPossibleScore}</span>
                    </td>
                    <td className="py-4 text-right">
                      <Link
                        to={`/results/${match.id}`}
                        className="inline-flex items-center gap-1 text-xs text-neonIndigo hover:text-white font-bold transition-all"
                      >
                        View Report <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 flex flex-col items-center justify-center gap-4 max-w-sm mx-auto animate-fade-in">
            <div className="bg-slate-900/60 p-5 rounded-full border border-brandBorder/60 shadow-glow-indigo/5 mb-2">
              <svg className="w-12 h-12 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
              </svg>
            </div>
            <h4 className="text-slate-200 font-bold text-base">Your Interview Journey Awaits</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              You haven't completed any interview sessions yet. Launch a mock interview to evaluate your technical depth, communication, and response times.
            </p>
            <Link to="/" className="btn-neon-grad py-3 px-6 text-xs font-bold shadow-glow-indigo mt-2">
              Take Your First AI Challenge
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
