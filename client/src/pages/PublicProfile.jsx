import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../utils/api.js';
import { Loader, Trophy, ShieldAlert, Award, Calendar, Cpu, Zap, Star } from 'lucide-react';

export default function PublicProfile() {
  const { username } = useParams();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setError('');
        const data = await api.dashboard.getPublicProfile(username);
        setProfile(data.user);
      } catch (err) {
        console.error('Error loading public profile:', err);
        setError("Couldn't find that developer profile. Please check the spelling and try again.");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader className="w-8 h-8 text-neonIndigo animate-spin" />
        <p className="text-slate-400 font-medium font-outfit">Loading developer profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center glass-card p-8 border-neonRed/20">
        <h3 className="text-xl font-bold text-neonRed mb-2 flex items-center justify-center gap-2">
          <ShieldAlert className="w-6 h-6" /> Profile Not Found
        </h3>
        <p className="text-slate-400 mb-6">{error || 'Developer details are currently unavailable.'}</p>
        <Link to="/" className="btn-secondary w-full py-2.5 inline-block">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-10">
      {/* Header Banner */}
      <div className="glass-card p-8 border-brandBorder/80 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-neonIndigo to-neonViolet" />
        
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neonIndigo to-neonViolet flex items-center justify-center font-bold text-2xl text-white shadow-glow-indigo">
            {profile.username.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
              {profile.username}
            </h1>
            <p className="text-slate-400 text-sm mt-1 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> Member since {new Date(profile.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          {profile.streak > 0 && (
            <div className="flex items-center gap-2 bg-amber-950/40 border border-amber-800/40 px-4 py-2 rounded-full shadow-glow-orange">
              <span className="text-xl">🔥</span>
              <div>
                <span className="text-xs text-slate-400 block font-semibold leading-none">Streak</span>
                <span className="text-sm font-extrabold text-amber-400">{profile.streak} Days</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 bg-slate-900/60 border border-brandBorder px-4 py-2 rounded-full">
            <Trophy className="w-5 h-5 text-neonYellow shadow-glow-yellow" />
            <div>
              <span className="text-xs text-slate-400 block font-semibold leading-none">Rank</span>
              <span className="text-sm font-extrabold text-slate-200">#{profile.rank} Global</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards (Grid of 3) */}
      <div className="grid sm:grid-cols-3 gap-6">
        <div className="glass-card p-6 border-brandBorder/80 flex items-center gap-4">
          <div className="bg-neonIndigo/10 p-3.5 rounded-xl border border-neonIndigo/20">
            <Cpu className="w-6 h-6 text-neonIndigo shadow-glow-indigo" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Completed Rounds</span>
            <span className="text-3xl font-extrabold text-white mt-1 block">{profile.gamesPlayed}</span>
          </div>
        </div>

        <div className="glass-card p-6 border-brandBorder/80 flex items-center gap-4">
          <div className="bg-neonGreen/10 p-3.5 rounded-xl border border-neonGreen/20">
            <Zap className="w-6 h-6 text-neonGreen shadow-glow-green" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Average Accuracy</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-extrabold text-white">{profile.avgScore}</span>
              <span className="text-xs text-slate-500 font-bold">%</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 border-brandBorder/80 flex items-center gap-4">
          <div className="bg-neonViolet/10 p-3.5 rounded-xl border border-neonViolet/20">
            <Award className="w-6 h-6 text-neonViolet shadow-glow-violet" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Peak Score</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-extrabold text-white">{profile.maxScore}</span>
              <span className="text-xs text-slate-500 font-bold">/ 100</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-5 gap-8 items-start">
        {/* Skill Analytics (Left 2 Columns) */}
        <div className="md:col-span-2 glass-card p-6 md:p-8 border-brandBorder/80 space-y-6">
          <h3 className="font-bold text-lg text-slate-200 border-b border-brandBorder/40 pb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-neonIndigo" /> Skill Analytics
          </h3>

          <div className="space-y-5">
            {Object.entries(profile.topicAverages).map(([topic, val]) => (
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

        {/* Recent Matches History (Right 3 Columns) */}
        <div className="md:col-span-3 glass-card p-6 md:p-8 border-brandBorder/80 space-y-6">
          <h3 className="font-bold text-lg text-slate-200 border-b border-brandBorder/40 pb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-neonViolet" /> Recent Matches
          </h3>

          {profile.history && profile.history.length > 0 ? (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {profile.history.map((match) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between p-4 bg-slate-950/40 border border-brandBorder/60 hover:border-slate-800 rounded-xl transition-all"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-400 block uppercase">
                      {match.topic === 'WebDev' ? 'Web Dev' : match.topic}
                    </span>
                    <span className="text-xs text-slate-500 mt-1 block">
                      {match.mode} • {match.difficulty} • {new Date(match.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-extrabold text-slate-200 block font-mono">
                      {match.totalScore} <span className="text-xs text-slate-500 font-normal">/ {match.maxPossibleScore}</span>
                    </span>
                    <span className="text-[10px] text-neonGreen font-semibold uppercase mt-0.5 block">
                      {((match.totalScore / match.maxPossibleScore) * 100).toFixed(0)}% accuracy
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-xs text-slate-500">
              No recent challenge history found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
