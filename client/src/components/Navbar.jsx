import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api, getUser } from '../utils/api.js';
import { Terminal, Award, LogOut, LayoutDashboard, User as UserIcon, Menu, X } from 'lucide-react';
import socket from '../socket.js';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUserState] = useState(getUser());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [netStatus, setNetStatus] = useState(socket.connected ? 'connected' : 'disconnected');

  useEffect(() => {
    const handleAuthChange = () => {
      setUserState(getUser());
    };
    window.addEventListener('auth-change', handleAuthChange);

    // Network status listener
    const onConnect = () => setNetStatus('connected');
    const onDisconnect = () => setNetStatus('disconnected');
    const onReconnectAttempt = () => setNetStatus('reconnecting');

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('reconnect_attempt', onReconnectAttempt);
    socket.on('connect_error', onReconnectAttempt);

    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('reconnect_attempt', onReconnectAttempt);
      socket.off('connect_error', onReconnectAttempt);
    };
  }, []);

  const handleLogout = () => {
    api.auth.logout();
    socket.disconnect();
    setUserState(null);
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-brandBg/80 border-b border-brandBorder backdrop-blur-md px-6 py-4 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2 group">
        <div className="bg-gradient-to-br from-neonIndigo to-neonViolet p-2 rounded-lg shadow-glow-indigo group-hover:shadow-[0_0_20px_rgba(99,102,241,0.7)] transition-all">
          <Terminal className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-400 group-hover:text-white transition-all">
          INTERVIEW<span className="text-neonIndigo">.AI</span>
        </span>
      </Link>

      <div className="flex items-center gap-4">
        {/* Network Status Badge (Global) */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900/60 border border-brandBorder rounded-full text-[10px] font-bold">
          <span className={`w-2 h-2 rounded-full ${
            netStatus === 'connected' ? 'bg-neonGreen animate-pulse' :
            netStatus === 'reconnecting' ? 'bg-amber-500 animate-pulse' :
            'bg-neonRed'
          }`} />
          <span className={
            netStatus === 'connected' ? 'text-neonGreen' :
            netStatus === 'reconnecting' ? 'text-amber-500' :
            'text-neonRed'
          }>
            {netStatus === 'connected' ? 'Connected' :
             netStatus === 'reconnecting' ? 'Reconnecting...' :
             'Disconnected'}
          </span>
        </div>

        {user ? (
          <div className="flex items-center gap-6">
            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
              <Link 
                to="/" 
                className={`hover:text-neonIndigo transition-all flex flex-col items-center justify-center relative pb-1.5 ${isActive('/') ? 'text-neonIndigo' : ''}`}
              >
                <span>Play</span>
                {isActive('/') && <span className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-neonIndigo shadow-glow-indigo animate-pulse" />}
              </Link>
              <Link 
                to="/dashboard" 
                className={`hover:text-neonIndigo transition-all flex flex-col items-center justify-center relative pb-1.5 ${isActive('/dashboard') ? 'text-neonIndigo' : ''}`}
              >
                <span className="flex items-center gap-1.5"><LayoutDashboard className="w-4 h-4" /> Dashboard</span>
                {isActive('/dashboard') && <span className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-neonIndigo shadow-glow-indigo animate-pulse" />}
              </Link>
              <Link 
                to="/leaderboard" 
                className={`hover:text-neonIndigo transition-all flex flex-col items-center justify-center relative pb-1.5 ${isActive('/leaderboard') ? 'text-neonIndigo' : ''}`}
              >
                <span className="flex items-center gap-1.5"><Award className="w-4 h-4" /> Leaderboard</span>
                {isActive('/leaderboard') && <span className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-neonIndigo shadow-glow-indigo animate-pulse" />}
              </Link>
            </div>

            <div className="h-4 w-[1px] bg-brandBorder hidden md:block" />

            {/* Profile Bubble & Logout */}
            <div className="hidden md:flex items-center gap-3">
              <Link to={`/interviewer/${user.username}`} className="flex items-center gap-2 bg-slate-900/60 border border-brandBorder hover:border-neonViolet/40 py-1.5 px-3.5 rounded-full transition-all">
                <UserIcon className="w-3.5 h-3.5 text-neonViolet" />
                <span className="text-xs font-semibold text-slate-200 max-w-[100px] truncate">
                  {user.username}
                </span>
              </Link>
              
              <button 
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-neonRed hover:bg-neonRed/10 rounded-lg transition-all"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Hamburger Menu Toggle */}
            <button 
              onClick={() => setDrawerOpen(true)}
              className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-all"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link 
              to="/login" 
              className="text-sm font-semibold text-slate-300 hover:text-white transition-all px-4 py-2"
            >
              Sign In
            </Link>
            <Link 
              to="/signup" 
              className="text-sm font-semibold bg-gradient-to-r from-neonIndigo to-neonViolet text-white shadow-glow-indigo hover:shadow-[0_0_20px_rgba(99,102,241,0.6)] py-2 px-4 rounded-lg transition-all"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>

      {/* Mobile Slider Navigation Drawer */}
      {drawerOpen && user && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm md:hidden animate-fade-in" onClick={() => setDrawerOpen(false)}>
          <div 
            className="absolute right-0 top-0 bottom-0 w-72 bg-brandBg border-l border-brandBorder p-6 flex flex-col gap-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-brandBorder pb-4">
              <span className="font-extrabold text-sm text-slate-200 tracking-wider uppercase font-mono">Navigation Menu</span>
              <button 
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4 text-sm font-semibold">
              <Link 
                to="/" 
                onClick={() => setDrawerOpen(false)}
                className={`py-2 px-3 rounded-lg transition-all ${isActive('/') ? 'bg-neonIndigo/10 text-neonIndigo border-l-2 border-neonIndigo' : 'text-slate-300 hover:bg-slate-900'}`}
              >
                Play / Rooms
              </Link>
              <Link 
                to="/dashboard" 
                onClick={() => setDrawerOpen(false)}
                className={`py-2 px-3 rounded-lg transition-all ${isActive('/dashboard') ? 'bg-neonIndigo/10 text-neonIndigo border-l-2 border-neonIndigo' : 'text-slate-300 hover:bg-slate-900'}`}
              >
                Dashboard
              </Link>
              <Link 
                to="/leaderboard" 
                onClick={() => setDrawerOpen(false)}
                className={`py-2 px-3 rounded-lg transition-all ${isActive('/leaderboard') ? 'bg-neonIndigo/10 text-neonIndigo border-l-2 border-neonIndigo' : 'text-slate-300 hover:bg-slate-900'}`}
              >
                Leaderboard
              </Link>
              <Link 
                to={`/interviewer/${user.username}`} 
                onClick={() => setDrawerOpen(false)}
                className={`py-2 px-3 rounded-lg transition-all ${isActive(`/interviewer/${user.username}`) ? 'bg-neonIndigo/10 text-neonIndigo border-l-2 border-neonIndigo' : 'text-slate-300 hover:bg-slate-900'}`}
              >
                My Public Profile
              </Link>
            </div>

            <div className="mt-auto border-t border-brandBorder pt-4 flex flex-col gap-4">
              <div className="flex items-center gap-3 px-3 py-2 bg-slate-950/60 border border-brandBorder rounded-xl">
                <UserIcon className="w-4 h-4 text-neonViolet" />
                <span className="text-xs font-semibold text-slate-200 truncate">{user.username}</span>
              </div>
              <button 
                onClick={() => {
                  handleLogout();
                  setDrawerOpen(false);
                }}
                className="w-full py-3 bg-neonRed/10 text-neonRed hover:bg-neonRed/20 border border-neonRed/20 rounded-xl transition-all flex items-center justify-center gap-2 text-sm font-semibold"
              >
                <LogOut className="w-4 h-4" /> Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
