import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import socket from '../socket.js';
import { getToken } from '../utils/api.js';
import { User, Users, Play, ShieldAlert, Award, Terminal } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Tab states: 'solo' or 'multiplayer'
  const [activeTab, setActiveTab] = useState('solo');
  
  // Settings states
  const [topic, setTopic] = useState('DSA');
  const [difficulty, setDifficulty] = useState('Medium');

  // Pre-fill topic/difficulty if returning from results (Rematch UX)
  useEffect(() => {
    if (location.state?.rematchTopic) {
      setTopic(location.state.rematchTopic);
    }
    if (location.state?.rematchDifficulty) {
      setDifficulty(location.state.rematchDifficulty);
    }
  }, [location.state]);
  const [rounds, setRounds] = useState('10');
  
  // Join Room state
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check authentication
    if (!getToken()) {
      navigate('/login');
    }

    // Auto-fill room code if join parameter is present in URL
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get('join');
    if (joinCode && joinCode.length === 6) {
      setRoomCode(joinCode.toUpperCase());
      setActiveTab('multiplayer');
    }

    // Socket listeners for room creation / join
    socket.on('room:created', (data) => {
      setLoading(false);
      if (data.mode === 'solo') {
        navigate(`/game/${data.roomCode}`);
      } else {
        navigate(`/lobby/${data.roomCode}`);
      }
    });

    socket.on('room:joined', (data) => {
      setLoading(false);
      navigate(`/lobby/${data.roomCode}`);
    });

    socket.on('room:quick_join_found', (data) => {
      const token = getToken();
      socket.emit('room:join', { token, roomCode: data.roomCode });
    });

    socket.on('room:quick_join_not_found', (data) => {
      setLoading(false);
      setError(data.message || 'No active lobbies found.');
    });

    socket.on('error', (data) => {
      setLoading(false);
      setError(data.message || 'An error occurred.');
    });

    return () => {
      socket.off('room:created');
      socket.off('room:joined');
      socket.off('room:quick_join_found');
      socket.off('room:quick_join_not_found');
      socket.off('error');
    };
  }, [navigate]);

  const handleCreateGame = async (e) => {
    e.preventDefault();
    const token = getToken();
    if (!token) return navigate('/login');

    setError('');
    setLoading(true);

    if (activeTab === 'solo') {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/solo/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ topic, difficulty, rounds })
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to start solo match');
        
        setLoading(false);
        navigate(`/solo/${data.matchId}`, { state: { questions: data.questions, topic, difficulty } });
      } catch (err) {
        console.error('REST Solo Start Error:', err);
        setError(err.message || 'Failed to start solo match.');
        setLoading(false);
      }
    } else {
      socket.emit('room:create', {
        token,
        topic,
        difficulty,
        rounds,
        mode: activeTab
      });
    }
  };

  const handleJoinGame = (e) => {
    e.preventDefault();
    if (!roomCode || roomCode.length !== 6) {
      return setError('Please enter a valid 6-character room code.');
    }
    
    const token = getToken();
    if (!token) return navigate('/login');

    setError('');
    setLoading(true);
    socket.emit('room:join', {
      token,
      roomCode
    });
  };

  const handleQuickJoin = (e) => {
    e.preventDefault();
    const token = getToken();
    if (!token) return navigate('/login');

    setError('');
    setLoading(true);
    socket.emit('room:quick_join_search');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header Banner */}
      <div className="text-center mb-12 animate-float">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          Test Your Skills Against <span className="text-gradient">AI Interviewers</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Challenge yourself or compete with friends in real-time. Answer DSA, System Design, DBMS, and OOP questions evaluated instantly by AI.
        </p>
      </div>

      {error && (
        <div className="max-w-md mx-auto bg-neonRed/10 border border-neonRed/30 text-neonRed text-sm p-4 rounded-xl mb-8 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Mode Selectors */}
      <div className="grid md:grid-cols-5 gap-8 items-start">
        {/* Settings Panel (Left/Center) */}
        <div className="md:col-span-3 glass-card p-6 md:p-8 border-brandBorder/80">
          {/* Custom Tab Switcher */}
          <div className="flex bg-slate-950/80 p-1.5 rounded-xl border border-brandBorder mb-8">
            <button
              onClick={() => setActiveTab('solo')}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'solo'
                  ? 'bg-gradient-to-r from-neonIndigo to-neonViolet text-white shadow-glow-indigo'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-4 h-4" />
              Solo Training
            </button>
            <button
              onClick={() => setActiveTab('multiplayer')}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'multiplayer'
                  ? 'bg-gradient-to-r from-neonIndigo to-neonViolet text-white shadow-glow-indigo'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              Multiplayer Room
            </button>
          </div>

          <form onSubmit={handleCreateGame} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                 Select Interview Topic
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: 'DSA', icon: '🧮', desc: 'Data Structures & Algorithms', detail: 'Complexity, Graphs, Trees, Recursion' },
                  { key: 'OS', icon: '💻', desc: 'Operating Systems', detail: 'CPU Scheduling, Threads, Virtual Memory' },
                  { key: 'DBMS', icon: '🗄️', desc: 'Database Systems', detail: 'Transactions, SQL, Indexes, Normalization' },
                  { key: 'Java', icon: '☕', desc: 'Java Core & OOP', detail: 'Garbage Collection, Streams, Inheritance' },
                  { key: 'WebDev', icon: '🌐', desc: 'Frontend Web Dev', detail: 'React Hooks, Virtual DOM, CSS grid' },
                  { key: 'OOP', icon: '📦', desc: 'Object-Oriented Programming', detail: 'Polymorphism, SOLID, Design Patterns' },
                  { key: 'SystemDesign', icon: '🏗️', desc: 'System Design', detail: 'Scalability, Load Balancers, Caching, CAP' }
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTopic(t.key)}
                    className={`p-4 rounded-xl border text-left transition-all flex gap-3 items-start ${
                      topic === t.key
                        ? 'bg-neonIndigo/10 border-neonIndigo text-slate-100 shadow-glow-indigo'
                        : 'bg-slate-950/50 border-brandBorder text-slate-400 hover:border-slate-800 hover:text-slate-300'
                    }`}
                  >
                    <span className="text-2xl mt-0.5 select-none">{t.icon}</span>
                    <div className="flex-1">
                      <span className="font-extrabold text-sm text-slate-100 block">
                        {t.key === 'WebDev' ? 'Web Dev' : t.key === 'SystemDesign' ? 'System Design' : t.key}
                      </span>
                      <span className="text-xs text-slate-300 mt-0.5 block font-medium">{t.desc}</span>
                      <span className="text-[10px] text-slate-500 mt-1 block leading-normal">{t.detail}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Difficulty Level
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full input-glass appearance-none cursor-pointer"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Number of Rounds
                </label>
                <select
                  value={rounds}
                  onChange={(e) => setRounds(e.target.value)}
                  className="w-full input-glass appearance-none cursor-pointer"
                >
                  <option value="5">5 Questions</option>
                  <option value="10">10 Questions</option>
                  <option value="30">30 Questions</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-neon-grad flex items-center justify-center gap-2 py-4 mt-8"
            >
              <Play className="w-5 h-5 fill-current" />
              {loading
                ? 'Initializing Session...'
                : activeTab === 'solo'
                ? 'Start Solo Challenge'
                : 'Create Multiplayer Lobby'}
            </button>
          </form>
        </div>

        {/* Join Multiplayer Room Card (Right Side) */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass-card p-6 md:p-8 border-brandBorder/80">
            <h3 className="font-bold text-lg text-slate-200 mb-2 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-neonViolet" />
              Join with Code
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              Enter a 6-character room code shared by your friend or interviewer.
            </p>

            <form onSubmit={handleJoinGame} className="space-y-4">
              <input
                type="text"
                maxLength={6}
                placeholder="ENTER CODE (e.g. AB12CD)"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="w-full input-glass text-center text-xl font-bold tracking-widest uppercase py-4"
              />

              <button
                type="submit"
                disabled={loading || roomCode.length !== 6}
                className="w-full btn-secondary flex items-center justify-center gap-2 py-3.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Join Match
              </button>

              <div className="flex items-center justify-center gap-2 py-1">
                <div className="h-[1px] flex-1 bg-brandBorder/60" />
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">or</span>
                <div className="h-[1px] flex-1 bg-brandBorder/60" />
              </div>

              <button
                onClick={handleQuickJoin}
                disabled={loading}
                className="w-full btn-neon-grad flex items-center justify-center gap-2 py-3.5"
              >
                Quick Matchmaking
              </button>
            </form>
          </div>

          {/* Quick Stats banner */}
          <div className="glass-card p-5 bg-gradient-to-br from-slate-900/40 to-slate-950/60 border-brandBorder flex items-center gap-4">
            <div className="bg-neonGreen/10 p-3 rounded-xl border border-neonGreen/20">
              <Award className="w-6 h-6 text-neonGreen shadow-glow-green" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-200 text-sm">Real-time Leaderboard</h4>
              <p className="text-xs text-slate-400">Play multiplayer rounds and climb the global ranks.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
