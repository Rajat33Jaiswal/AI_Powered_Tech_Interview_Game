import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socket from '../socket.js';
import { getToken, getUser } from '../utils/api.js';
import { Users, Copy, Check, Play, Loader, Shield, ArrowLeft, Send, MessageSquare, Share2 } from 'lucide-react';

export default function Lobby() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const currentUser = getUser();

  const [lobby, setLobby] = useState(null);
  const [players, setPlayers] = useState([]);
  const [copied, setCopied] = useState(false);
  const [linkShared, setLinkShared] = useState(false);
  const [starting, setStarting] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState('');

  // Chat states
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return navigate('/login');

    // Attempt to join socket room if refreshed in lobby
    socket.emit('room:join', { token, roomCode });

    socket.on('room:joined', (data) => {
      setLobby(data);
      setPlayers(data.players || []);
    });

    socket.on('room:players_update', (data) => {
      setPlayers(data.players || []);
    });

    socket.on('lobby:chat_receive', (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    socket.on('game:loading', (data) => {
      setStarting(true);
      setLoadingMsg(data.message);
    });

    socket.on('game:started', () => {
      navigate(`/game/${roomCode}`);
    });

    socket.on('error', (data) => {
      setError(data.message);
    });

    return () => {
      socket.off('room:joined');
      socket.off('room:players_update');
      socket.off('lobby:chat_receive');
      socket.off('game:loading');
      socket.off('game:started');
      socket.off('error');
    };
  }, [roomCode, navigate]);

  useEffect(() => {
    // Scroll chat to bottom when messages update
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyInviteLink = () => {
    const inviteLink = `${window.location.origin}/?join=${roomCode}`;
    navigator.clipboard.writeText(inviteLink);
    setLinkShared(true);
    setTimeout(() => setLinkShared(false), 2000);
  };

  const getWhatsAppShareUrl = () => {
    const text = `Join my Interview.AI competitive challenge! Topic: ${lobby?.topic}, Difficulty: ${lobby?.difficulty}. Join Code: ${roomCode}. Direct Link: ${window.location.origin}/?join=${roomCode}`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  };

  const toggleReady = () => {
    socket.emit('lobby:ready_toggle', { roomCode, token: getToken() });
  };

  const sendChatMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socket.emit('lobby:chat_send', { roomCode, message: chatInput });
    setChatInput('');
  };

  const handleStartGame = () => {
    setStarting(true);
    setLoadingMsg('Requesting questions...');
    socket.emit('game:start', { roomCode });
  };

  const isHost = lobby && currentUser && players.length > 0 && players[0].userId === currentUser.id;
  const selfPlayer = players.find(p => p.userId === currentUser?.id);
  const allGuestsReady = players.filter(p => p.userId !== lobby?.hostId).every(p => p.ready);

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center glass-card p-8 border-neonRed/20">
        <h3 className="text-xl font-bold text-neonRed mb-2">Lobby Error</h3>
        <p className="text-slate-400 mb-6">{error}</p>
        <button onClick={() => navigate('/')} className="btn-secondary py-2 px-4 w-full flex items-center justify-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
      </div>
    );
  }

  if (!lobby) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader className="w-8 h-8 text-neonIndigo animate-spin" />
        <p className="text-slate-400 font-medium font-outfit">Entering Lobby...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {starting ? (
        <div className="glass-card p-12 text-center border-brandBorder max-w-md mx-auto flex flex-col items-center gap-6">
          <Loader className="w-12 h-12 text-neonIndigo animate-spin shadow-glow-indigo rounded-full" />
          <h2 className="text-2xl font-bold text-slate-100 font-outfit">Preparing Match</h2>
          <p className="text-slate-400 text-sm animate-pulse font-outfit">{loadingMsg}</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-5 gap-8 items-start">
          {/* Lobby Info (Left Side - 2 columns) */}
          <div className="lg:col-span-2 glass-card p-6 border-brandBorder/80 space-y-6">
            <div>
              <span className="text-xs font-semibold text-neonIndigo uppercase tracking-widest bg-neonIndigo/10 px-3 py-1 rounded-full border border-neonIndigo/20">
                Lobby Active
              </span>
              <h2 className="text-xl font-extrabold text-slate-100 mt-4 leading-snug">
                Competitive Interview Room
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-3 border-y border-brandBorder/50 py-4 text-center">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider mb-1 font-bold">Topic</span>
                <span className="font-semibold text-sm text-slate-200">{lobby.topic === 'WebDev' ? 'Web Dev' : lobby.topic}</span>
              </div>
              <div className="border-x border-brandBorder/40">
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider mb-1 font-bold">Difficulty</span>
                <span className={`font-semibold text-[10px] py-0.5 px-2 rounded block w-max mx-auto ${
                  lobby.difficulty === 'Easy' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' :
                  lobby.difficulty === 'Medium' ? 'bg-amber-950 text-amber-400 border border-amber-900' :
                  'bg-rose-950 text-rose-400 border border-rose-900'
                }`}>{lobby.difficulty}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider mb-1 font-bold">Rounds</span>
                <span className="font-semibold text-sm text-slate-200">{lobby.rounds}</span>
              </div>
            </div>

            {/* Share Info Box */}
            <div className="bg-slate-950/60 border border-brandBorder rounded-2xl p-5 space-y-4">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-extrabold">Room Join Code</span>
                <span className="text-2xl font-extrabold tracking-widest text-slate-100 font-mono mt-1 block">
                  {roomCode}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={copyCode}
                  className="py-2.5 px-3 bg-slate-900 border border-slate-700/60 rounded-xl hover:text-white transition-all text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  {copied ? <Check className="w-4 h-4 text-neonGreen" /> : <Copy className="w-4 h-4 text-slate-400" />}
                  {copied ? 'Copied Code' : 'Copy Code'}
                </button>

                <button
                  onClick={copyInviteLink}
                  className="py-2.5 px-3 bg-slate-900 border border-slate-700/60 rounded-xl hover:text-white transition-all text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  {linkShared ? <Check className="w-4 h-4 text-neonGreen" /> : <Share2 className="w-4 h-4 text-slate-400" />}
                  {linkShared ? 'Copied Link' : 'Share Link'}
                </button>
              </div>

              <a
                href={getWhatsAppShareUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-400 border border-emerald-900/60 rounded-xl transition-all text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <span>Share via WhatsApp</span>
              </a>
            </div>

            {/* Control buttons */}
            {isHost ? (
              <div className="space-y-3">
                <button
                  onClick={handleStartGame}
                  disabled={players.length < 2 || !allGuestsReady}
                  className="w-full btn-neon-grad flex items-center justify-center gap-2 py-3.5 disabled:opacity-40 disabled:scale-100"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Start Challenge
                </button>
                {(!allGuestsReady || players.length < 2) && (
                  <p className="text-[10px] text-center text-slate-500 font-bold uppercase tracking-wider">
                    {players.length < 2 
                      ? 'Waiting for at least 2 players...' 
                      : 'Waiting for all guests to ready up...'}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={toggleReady}
                  className={`w-full py-3.5 rounded-xl border text-sm font-bold transition-all ${
                    selfPlayer?.ready
                      ? 'bg-emerald-950/20 border-emerald-900 text-emerald-400 shadow-glow-green'
                      : 'bg-neonIndigo text-white border-neonIndigo shadow-glow-indigo'
                  }`}
                >
                  {selfPlayer?.ready ? '✓ Ready (Click to Cancel)' : 'Mark as Ready'}
                </button>
                <div className="text-center bg-slate-900/40 border border-brandBorder/50 p-3.5 rounded-xl">
                  <p className="text-slate-400 text-xs flex items-center justify-center gap-2">
                    <Loader className="w-3.5 h-3.5 text-neonViolet animate-spin" />
                    Waiting for host to start...
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Joined Players Panel (Center - 1.5 columns) */}
          <div className="lg:col-span-1.5 glass-card p-6 border-brandBorder/80 space-y-4">
            <h3 className="font-bold text-base text-slate-200 flex items-center gap-2 border-b border-brandBorder/40 pb-2">
              <Users className="w-4 h-4 text-neonIndigo" />
              Players ({players.length})
            </h3>
            
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {players.map((player, idx) => {
                const isPlayerHost = idx === 0;
                return (
                  <div 
                    key={player.userId}
                    className="flex items-center justify-between bg-slate-950/40 border border-brandBorder/60 p-3 rounded-xl hover:border-slate-800 transition-all"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className={`w-2 h-2 rounded-full ${player.ready || isPlayerHost ? 'bg-neonGreen shadow-glow-green' : 'bg-amber-500 animate-pulse'}`} />
                      <span className="font-medium text-slate-200 text-xs truncate">{player.username}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isPlayerHost ? (
                        <span className="flex items-center gap-0.5 text-[8px] bg-neonViolet/10 text-neonViolet font-bold border border-neonViolet/25 px-1.5 py-0.5 rounded uppercase">
                          <Shield className="w-2 h-2" /> Host
                        </span>
                      ) : (
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                          player.ready 
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-900/60' 
                            : 'bg-amber-950 text-amber-400 border-amber-900/60 animate-pulse'
                        }`}>
                          {player.ready ? 'Ready' : 'Waiting'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Waiting Room Chat (Right Side - 1.5 columns) */}
          <div className="lg:col-span-1.5 glass-card p-6 border-brandBorder/80 flex flex-col h-[480px]">
            <h3 className="font-bold text-base text-slate-200 flex items-center gap-2 border-b border-brandBorder/40 pb-2 flex-shrink-0">
              <MessageSquare className="w-4 h-4 text-neonViolet" />
              Lobby Chat
            </h3>

            {/* Chat message logs */}
            <div className="flex-1 overflow-y-auto space-y-3.5 py-4 pr-1 my-2 min-h-0">
              {chatMessages.length > 0 ? (
                chatMessages.map((msg, index) => (
                  <div key={index} className="space-y-1 text-xs">
                    <div className="flex items-baseline justify-between">
                      <span className="font-bold text-slate-300">{msg.username}</span>
                      <span className="text-[9px] text-slate-500">{msg.timestamp}</span>
                    </div>
                    <p className="text-slate-400 leading-normal bg-slate-950/40 p-2 rounded-lg border border-brandBorder/30 break-words">
                      {msg.message}
                    </p>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <MessageSquare className="w-8 h-8 text-slate-600 mb-2 opacity-50" />
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Lobby is quiet...</p>
                  <p className="text-[9px] text-slate-600 mt-1">Send a message to start interacting!</p>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Form inputs */}
            <form onSubmit={sendChatMessage} className="flex gap-2 flex-shrink-0 pt-2 border-t border-brandBorder/40">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 bg-slate-950 border border-brandBorder rounded-xl text-xs text-white placeholder-slate-500 focus:border-neonViolet/50 outline-none"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="p-2 bg-neonViolet text-white hover:bg-neonViolet/80 rounded-xl transition-all disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
