import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Lobby from './pages/Lobby.jsx';
import Game from './pages/Game.jsx';
import Results from './pages/Results.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import SoloGame from './pages/SoloGame.jsx';
import PublicProfile from './pages/PublicProfile.jsx';
import Certificate from './pages/Certificate.jsx';
import { getToken } from './utils/api.js';
import socket from './socket.js';

// Route protection component
function PrivateRoute({ children }) {
  const authed = getToken();
  return authed ? children : <Navigate to="/login" replace />;
}

export default function App() {
  useEffect(() => {
    const token = getToken();
    if (token) {
      socket.auth = { token };
      socket.connect();
    }
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-brandBg text-slate-100 flex flex-col font-outfit">
        <Navbar />
        
        {/* Main Page Container */}
        <main className="flex-1">
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected Routes */}
            <Route 
              path="/" 
              element={
                <PrivateRoute>
                  <Home />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/solo/:matchId" 
              element={
                <PrivateRoute>
                  <SoloGame />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/lobby/:roomCode" 
              element={
                <PrivateRoute>
                  <Lobby />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/game/:roomCode" 
              element={
                <PrivateRoute>
                  <Game />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/results/:matchId" 
              element={
                <PrivateRoute>
                  <Results />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/leaderboard" 
              element={
                <PrivateRoute>
                  <Leaderboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/interviewer/:username" 
              element={
                <PublicProfile />
              } 
            />
            <Route 
              path="/certificate/:matchId" 
              element={
                <PrivateRoute>
                  <Certificate />
                </PrivateRoute>
              } 
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
