import React, { useState, useEffect } from 'react';
import { api, getUser } from '../utils/api.js';
import { Loader, Award, Trophy, User } from 'lucide-react';

export default function Leaderboard() {
  const currentUser = getUser();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        setLoading(true);
        const data = await api.dashboard.getLeaderboard();
        setUsers(data.leaderboard || []);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('Failed to load global standings.');
      } finally {
        setLoading(false);
      }
    }

    loadLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 animate-pulse">
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-800 rounded-full mb-3" />
          <div className="h-6 bg-slate-800 rounded w-1/3 mb-2" />
          <div className="h-4 bg-slate-800 rounded w-1/2" />
        </div>
        <div className="glass-card p-6 md:p-8 border-brandBorder/80 max-w-2xl mx-auto space-y-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="h-16 bg-slate-900 border border-brandBorder/40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center mb-10">
        <div className="inline-flex justify-center bg-neonViolet/10 p-3.5 rounded-full border border-neonViolet/20 mb-3 animate-float">
          <Trophy className="w-10 h-10 text-neonViolet shadow-glow-violet" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-100">Global Standings</h1>
        <p className="text-slate-400 text-sm mt-1">
          Top-performing developers ranked by Peak Match Score and average interview accuracy.
        </p>
      </div>

      {error && (
        <div className="bg-neonRed/10 border border-neonRed/30 text-neonRed text-sm p-4 rounded-xl max-w-md mx-auto">
          {error}
        </div>
      )}

      <div className="glass-card p-6 md:p-8 border-brandBorder/80 max-w-2xl mx-auto">
        {users.length > 0 ? (
          <div className="space-y-3.5">
            {users.map((player, idx) => {
              const rank = idx + 1;
              const isSelf = currentUser && player.id === currentUser.id;
              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    isSelf
                      ? 'bg-neonIndigo/10 border-neonIndigo shadow-glow-indigo text-slate-100'
                      : rank === 1 ? 'bg-amber-500/5 border-amber-500/30' :
                      rank === 2 ? 'bg-slate-300/5 border-slate-300/20' :
                      rank === 3 ? 'bg-amber-700/5 border-amber-700/20' :
                      'bg-slate-950/40 border-brandBorder'
                  }`}
                >
                  <div className="flex items-center gap-4 truncate">
                    {/* Medal/Rank Indicator */}
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                      {rank === 1 ? <span className="text-2xl" title="1st Place">🥇</span> :
                       rank === 2 ? <span className="text-2xl" title="2nd Place">🥈</span> :
                       rank === 3 ? <span className="text-2xl" title="3rd Place">🥉</span> :
                       <span className={isSelf ? 'text-neonIndigo' : 'text-slate-500'}>{rank}</span>}
                    </div>

                    <div className="flex items-center gap-2 truncate">
                      <div className="bg-slate-900 border border-slate-800 p-1.5 rounded-lg">
                        <User className="w-4 h-4 text-slate-400" />
                      </div>
                      <span className="font-semibold text-slate-200 text-sm md:text-base truncate">
                        {player.username} {isSelf && <span className="text-[10px] bg-neonIndigo/20 text-neonIndigo px-1.5 py-0.5 rounded font-bold ml-1 uppercase">You</span>}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 md:gap-10 text-right">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">Matches</span>
                      <span className="text-xs font-semibold text-slate-300 font-mono">{player.gamesPlayed}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">Avg Score</span>
                      <span className="text-xs font-semibold text-slate-300 font-mono">{player.avgScore.toFixed(1)}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-neonViolet font-bold block uppercase">Peak Score</span>
                      <span className="text-sm font-extrabold text-white font-mono shadow-glow-violet">
                        {player.maxScore}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500 text-sm">
            No entries on the leaderboard yet. Be the first to play!
          </div>
        )}
      </div>
    </div>
  );
}
