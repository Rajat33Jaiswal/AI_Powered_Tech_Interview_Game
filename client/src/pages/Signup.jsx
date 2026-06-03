import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/api.js';
import { Terminal, User, Mail, Lock, ArrowRight, Eye, EyeOff, CheckCircle2, ShieldAlert } from 'lucide-react';
import socket from '../socket.js';

export default function Signup() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [guestLoading, setGuestLoading] = useState(false);

  // Real-time validations
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateUsername = (val) => {
    setUsername(val);
    if (val && val.trim().length < 3) {
      setUsernameError('Username must be at least 3 characters');
    } else {
      setUsernameError('');
    }
  };

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
    if (usernameError || emailError || passwordError || !username || !email || !password) return;

    try {
      setError('');
      setLoading(true);
      setLoadingMessage('Creating your profile...');

      const timer = setTimeout(() => {
        setLoadingMessage('Configuring developer workspace...');
      }, 1000);

      const data = await api.auth.signup(username, email, password);
      clearTimeout(timer);

      socket.auth = { token: data.token };
      socket.connect();
      navigate('/');
    } catch (err) {
      setError(
        err.message === 'Username or email already in use.'
          ? 'Username or email is already registered. Try signing in instead.'
          : err.message || 'Signup failed. Please try again.'
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

  const formValid = username && email && password && !usernameError && !emailError && !passwordError && !loading && !guestLoading;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-brandBg font-outfit text-slate-100">
      {/* Left Column: Form & trust badges */}
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
            Join the Challenge Portal
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Set up an account to save your streak, compare scores on leaderboards, and get certified.
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
              Username
            </label>
            <input
              type="text"
              placeholder="developer_101"
              value={username}
              onChange={(e) => validateUsername(e.target.value)}
              className={`w-full input-glass text-sm ${usernameError ? 'border-neonRed/50 focus:border-neonRed' : ''}`}
              required
              disabled={loading || guestLoading}
            />
            {usernameError && (
              <span className="text-[10px] text-neonRed font-semibold mt-1 block">
                {usernameError}
              </span>
            )}
          </div>

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
                placeholder="Minimum 6 characters"
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
                <>Get Started <ArrowRight className="w-4 h-4" /></>
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

        {/* Trust Indicators */}
        <div className="mt-8 grid grid-cols-3 gap-2 border-t border-brandBorder/40 pt-4 text-center">
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
          Already have an account?{' '}
          <Link to="/login" className="text-neonIndigo hover:text-white font-semibold transition-all">
            Sign In
          </Link>
        </p>
      </div>

      {/* Right Column: Previews (Hidden on Mobile) */}
      <div className="hidden md:flex flex-1 bg-slate-950 items-center justify-center p-8 relative overflow-hidden border-l border-brandBorder/80">
        <div className="absolute -right-24 -top-24 w-80 h-80 bg-neonIndigo/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-24 -bottom-24 w-80 h-80 bg-neonViolet/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Animated mock panel */}
        <div className="w-full max-w-sm space-y-6 relative z-10 scale-95 lg:scale-100 transition-all duration-300">
          {/* Mock Scoreboard */}
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

          {/* Active Question */}
          <div className="glass-card p-5 border-brandBorder/60 bg-brandBg/60 backdrop-blur-md relative transform rotate-1 hover:rotate-0 hover:scale-105 transition-all duration-500 shadow-glow-violet">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[9px] text-neonViolet font-extrabold uppercase tracking-widest font-mono">Active round</span>
                <h4 className="text-xs font-extrabold text-white leading-tight">Virtual DOM Scoping</h4>
                <p className="text-[10px] text-slate-500">Explain reconciliation diffing...</p>
              </div>
              <div className="relative w-12 h-12 flex items-center justify-center bg-slate-950 rounded-full border border-brandBorder">
                <span className="text-xs font-black text-neonRed animate-pulse">04s</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Loader({ className }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
