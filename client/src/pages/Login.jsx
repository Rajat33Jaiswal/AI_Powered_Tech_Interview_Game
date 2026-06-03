import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/api.js';
import { Terminal, Mail, Lock, ArrowRight, Eye, EyeOff, CheckCircle2, ShieldAlert } from 'lucide-react';
import socket from '../socket.js';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [guestLoading, setGuestLoading] = useState(false);

  // Real-time validations
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (val) => {
    setEmail(val);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (val && !emailRegex.test(val)) {
      setEmailError('Invalid email format (e.g., name@domain.com)');
    } else {
      setEmailError('');
    }
  };

  const validatePassword = (val) => {
    setPassword(val);
    if (val && val.length < 6) {
      setPasswordError('Password must be at least 6 characters');
    } else {
      setPasswordError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (emailError || passwordError || !email || !password) return;

    try {
      setError('');
      setLoading(true);
      setLoadingMessage('Signing you in...');

      const timer = setTimeout(() => {
        setLoadingMessage('Preparing your dashboard...');
      }, 1000);

      const data = await api.auth.login(email, password);
      clearTimeout(timer);

      socket.auth = { token: data.token };
      socket.connect();
      navigate('/');
    } catch (err) {
      setError(
        err.message === 'Invalid email or password.'
          ? 'Incorrect email or password. Please check your credentials or continue as guest.'
          : err.message || 'Connection lost. Please check your network.'
      );
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const handleGuestLogin = async () => {
    try {
      setError('');
      setGuestLoading(true);
      setLoadingMessage('Signing in as Guest...');

      const timer = setTimeout(() => {
        setLoadingMessage('Configuring mock sandbox...');
      }, 1000);

      const data = await api.auth.guest();
      clearTimeout(timer);

      socket.auth = { token: data.token };
      socket.connect();
      navigate('/');
    } catch (err) {
      console.error('Guest access failed:', err);
      setError("Couldn't start guest session. Please verify your connection.");
    } finally {
      setGuestLoading(false);
      setLoadingMessage('');
    }
  };

  const formValid = email && password && !emailError && !passwordError && !loading && !guestLoading;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-brandBg font-outfit text-slate-100">
      {/* Left Column: Access form & trust badges */}
      <div className="flex-1 flex flex-col justify-center px-6 py-8 md:py-12 lg:px-16 xl:px-20 max-w-lg md:max-w-none mx-auto w-full">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 group mb-4 no-print">
            <div className="bg-gradient-to-br from-neonIndigo to-neonViolet p-2 rounded-lg shadow-glow-indigo">
              <Terminal className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white">
              INTERVIEW<span className="text-neonIndigo">.AI</span>
            </span>
          </Link>

          <h1 className="text-3xl font-extrabold text-white tracking-tight leading-none">
            Ace Your Technical Interviews
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Practice conceptual questions, check real-time evaluations, and challenge developers worldwide.
          </p>
        </div>

        {error && (
          <div className="bg-neonRed/10 border border-neonRed/30 text-neonRed text-xs p-3.5 rounded-xl mb-5 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              placeholder="developer@domain.com"
              value={email}
              onChange={(e) => validateEmail(e.target.value)}
              className={`w-full input-glass text-sm ${emailError ? 'border-neonRed/50 focus:border-neonRed' : ''}`}
              required
              disabled={loading || guestLoading}
            />
            {emailError && (
              <span className="text-[10px] text-neonRed font-semibold mt-1 block">
                {emailError}
              </span>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => validatePassword(e.target.value)}
                className={`w-full input-glass pr-11 text-sm ${passwordError ? 'border-neonRed/50 focus:border-neonRed' : ''}`}
                required
                disabled={loading || guestLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordError && (
              <span className="text-[10px] text-neonRed font-semibold mt-1 block">
                {passwordError}
              </span>
            )}
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="submit"
              disabled={!formValid}
              className="w-full btn-neon-grad flex items-center justify-center gap-2 py-3 text-sm font-bold disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed shadow-glow-indigo"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" /> {loadingMessage}
                </span>
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </button>

            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={loading || guestLoading}
              className="w-full py-3 bg-slate-900/60 border border-brandBorder/80 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
            >
              {guestLoading ? (
                <span className="flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" /> {loadingMessage}
                </span>
              ) : (
                'Continue as Guest (No Sign Up)'
              )}
            </button>
          </div>
        </form>

        {/* Social logins */}
        <div className="mt-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-[1px] flex-1 bg-brandBorder/60" />
            <span className="text-[9px] uppercase font-extrabold text-slate-500 tracking-wider">or continue with</span>
            <div className="h-[1px] flex-1 bg-brandBorder/60" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 py-2.5 bg-slate-950/40 border border-brandBorder rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition-all opacity-80 cursor-not-allowed" title="OAuth coming soon">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" /></svg>
              GitHub
            </button>
            <button className="flex items-center justify-center gap-2 py-2.5 bg-slate-950/40 border border-brandBorder rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition-all opacity-80 cursor-not-allowed" title="OAuth coming soon">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.107C18.281 1.094 15.566 0 12.24 0c-6.63 0-12 5.37-12 12s5.37 12 12 12c6.93 0 11.52-4.875 11.52-11.715 0-.795-.085-1.4-.195-2H12.24z" /></svg>
              Google
            </button>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-6 grid grid-cols-3 gap-2 border-t border-brandBorder/40 pt-4 text-center">
          <div className="text-[10px] text-slate-400 font-semibold flex flex-col items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-neonGreen shadow-glow-green" />
            <span>AI Evaluation</span>
          </div>
          <div className="text-[10px] text-slate-400 font-semibold flex flex-col items-center gap-1 border-x border-brandBorder/40">
            <CheckCircle2 className="w-3.5 h-3.5 text-neonGreen shadow-glow-green" />
            <span>Real Questions</span>
          </div>
          <div className="text-[10px] text-slate-400 font-semibold flex flex-col items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-neonGreen shadow-glow-green" />
            <span>Multiplayer Standings</span>
          </div>
        </div>

        <p className="text-center text-slate-400 text-sm mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-neonIndigo hover:text-white font-semibold transition-all">
            Create Account
          </Link>
        </p>
      </div>

      {/* Right Column: Animated visual previews (Hidden on Mobile) */}
      <div className="hidden md:flex flex-1 bg-slate-950 items-center justify-center p-8 relative overflow-hidden border-l border-brandBorder/80">
        <div className="absolute -right-24 -top-24 w-80 h-80 bg-neonIndigo/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-24 -bottom-24 w-80 h-80 bg-neonViolet/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Animated Stack mockup */}
        <div className="w-full max-w-sm space-y-6 relative z-10 scale-95 lg:scale-100 transition-all duration-300">
          
          {/* Mock Scoreboard widget */}
          <div className="glass-card p-5 border-brandBorder/60 bg-brandBg/60 backdrop-blur-md relative transform -rotate-2 hover:rotate-0 hover:scale-105 transition-all duration-500 shadow-glow-indigo">
            <span className="text-[9px] uppercase tracking-widest font-extrabold text-neonIndigo block mb-3 font-mono">Live Lobby Board</span>
            <div className="space-y-2">
              <div className="flex justify-between items-center bg-slate-950/40 p-2 rounded-lg border border-brandBorder/40">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-neonGreen shadow-glow-green" /> Rajat
                </span>
                <span className="text-xs font-black text-slate-300 font-mono">92 pts</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/20 p-2 rounded-lg border border-brandBorder/20 opacity-70">
                <span className="text-xs text-slate-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Aman (Guest)
                </span>
                <span className="text-xs text-slate-500 font-mono">75 pts</span>
              </div>
            </div>
          </div>

          {/* Active Question circular countdown widget */}
          <div className="glass-card p-5 border-brandBorder/60 bg-brandBg/60 backdrop-blur-md relative transform rotate-1 hover:rotate-0 hover:scale-105 transition-all duration-500 shadow-glow-violet">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[9px] text-neonViolet font-extrabold uppercase tracking-widest font-mono">Active round</span>
                <h4 className="text-xs font-extrabold text-white leading-tight">Virtual DOM Scoping</h4>
                <p className="text-[10px] text-slate-500">Explain reconciliation diffing...</p>
              </div>

              {/* Mock Ring */}
              <div className="relative w-12 h-12 flex items-center justify-center bg-slate-950 rounded-full border border-brandBorder">
                <span className="text-xs font-black text-neonRed animate-pulse">04s</span>
              </div>
            </div>
          </div>

          {/* Mock evaluation feedback widget */}
          <div className="glass-card p-5 border-brandBorder/60 bg-brandBg/60 backdrop-blur-md relative transform -rotate-1 hover:rotate-0 hover:scale-105 transition-all duration-500">
            <span className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400 block mb-2 font-mono">AI Evaluation Report</span>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-slate-300">Technical Depth</span>
                <span className="text-neonGreen">90%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-1 border border-brandBorder">
                <div className="bg-neonGreen h-full rounded-full w-[90%]" />
              </div>
              <p className="text-[9px] text-slate-500 italic mt-1 leading-normal">
                "Candidate explains fiber nodes correctly but should cover scheduling priorities..."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple loader helper inline
function Loader({ className }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
