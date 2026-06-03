import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, getUser } from '../utils/api.js';
import { Loader, ShieldAlert, Award, ArrowLeft, Printer, Award as SealIcon } from 'lucide-react';

export default function Certificate() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const currentUser = getUser();

  const [loading, setLoading] = useState(true);
  const [matchData, setMatchData] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await api.dashboard.getMatch(matchId);
        setMatchData(data.match);
        
        // Find current user's stats
        const pStats = data.participants?.find(p => p.userId === currentUser?.id);
        if (!pStats) {
          throw new Error("You are not a participant in this match.");
        }
        
        const maxScore = data.match.questions.length * 10;
        const accuracy = maxScore > 0 ? (pStats.totalScore / maxScore) * 100 : 0;
        
        if (accuracy < 70) {
          throw new Error("A score of 70% or higher is required to generate a certificate.");
        }
        
        setParticipant(pStats);
      } catch (err) {
        console.error('Error loading certificate data:', err);
        setError(err.message || 'Failed to retrieve certificate details.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [matchId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader className="w-8 h-8 text-neonIndigo animate-spin" />
        <p className="text-slate-400 font-medium font-outfit">Generating credential certificate...</p>
      </div>
    );
  }

  if (error || !matchData || !participant) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center glass-card p-8 border-neonRed/20">
        <h3 className="text-xl font-bold text-neonRed mb-2 flex items-center justify-center gap-2">
          <ShieldAlert className="w-6 h-6" /> Certificate Error
        </h3>
        <p className="text-slate-400 mb-6">{error || 'Unable to load certificate.'}</p>
        <button onClick={() => navigate(-1)} className="btn-secondary w-full py-2.5 flex items-center justify-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  const accuracy = ((participant.totalScore / (matchData.questions.length * 10)) * 100).toFixed(0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      {/* Print Controls (Hidden during print) */}
      <div className="no-print flex items-center justify-between bg-slate-900/60 border border-brandBorder p-4 rounded-2xl">
        <Link to={`/results/${matchId}`} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-semibold transition-all">
          <ArrowLeft className="w-4 h-4" /> Back to Results
        </Link>
        <button
          onClick={handlePrint}
          className="btn-neon-grad flex items-center gap-2 py-2 px-5 text-sm font-semibold"
        >
          <Printer className="w-4 h-4" /> Print / Save as PDF
        </button>
      </div>

      {/* Style for printing landscape */}
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
          .print-container {
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            background: #090d16 !important;
            width: 100vw !important;
            height: 100vh !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          #certificate-border {
            border-width: 16px !important;
            border-color: #4f46e5 !important;
            width: 90% !important;
            max-width: 100% !important;
            margin: auto !important;
            padding: 40px !important;
          }
        }
      `}</style>

      {/* Certificate Frame */}
      <div className="print-container flex justify-center">
        <div 
          id="certificate-border"
          className="relative w-full max-w-3xl bg-slate-950/80 border-[12px] border-neonIndigo rounded-3xl p-8 md:p-12 text-center space-y-8 shadow-glow-indigo overflow-hidden"
        >
          {/* Certificate background watermark / styling */}
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-neonViolet/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-neonIndigo/5 rounded-full blur-3xl pointer-events-none" />

          {/* Heading */}
          <div className="space-y-2">
            <div className="flex justify-center mb-4">
              <Award className="w-16 h-16 text-neonViolet animate-float shadow-glow-violet bg-neonViolet/10 p-2.5 rounded-full border border-neonViolet/25" />
            </div>
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-neonIndigo font-mono">
              Certificate of Completion
            </h2>
            <div className="h-[2px] w-24 bg-gradient-to-r from-neonIndigo to-neonViolet mx-auto my-3" />
            <p className="text-slate-400 text-xs italic">
              Verified Technical Challenge Credential
            </p>
          </div>

          {/* Body content */}
          <div className="space-y-6">
            <p className="text-slate-400 text-sm">
              This is to certify that the developer
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-wide border-b border-brandBorder/40 pb-4 max-w-md mx-auto">
              {currentUser?.username || 'Candidate'}
            </h1>
            <p className="text-slate-300 text-sm max-w-xl mx-auto leading-relaxed">
              has successfully completed the AI-evaluated tech interview round on the topic
              <span className="font-extrabold text-white block text-lg mt-1 bg-slate-900/60 py-2 px-4 rounded-xl border border-brandBorder/50 inline-block">
                {matchData.topic === 'WebDev' ? 'Web Dev' : matchData.topic} ({matchData.difficulty} Level)
              </span>
            </p>
            <p className="text-slate-300 text-sm">
              achieving an overall assessment accuracy score of
              <span className="font-extrabold text-neonGreen shadow-glow-green ml-1.5">{accuracy}%</span>
            </p>
          </div>

          {/* Signatures & Seal */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-brandBorder/40 max-w-lg mx-auto">
            {/* Signature Left */}
            <div className="text-center space-y-1.5">
              <span className="font-mono text-xs text-slate-300 italic block">Claude 3.5 Sonnet</span>
              <div className="h-[1px] w-28 bg-slate-700 mx-auto" />
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">AI Interviewer Engine</span>
            </div>

            {/* Seal Right */}
            <div className="flex flex-col items-center justify-center space-y-1">
              <SealIcon className="w-8 h-8 text-neonViolet" />
              <span className="text-[9px] font-extrabold text-slate-300 uppercase tracking-widest block font-mono">
                INTERVIEW.AI VERIFIED
              </span>
              <span className="text-[8px] text-slate-500 font-mono">
                ID: {matchId.slice(0, 8).toUpperCase()}
              </span>
            </div>
          </div>
          
          <div className="text-[9px] text-slate-600 font-mono pt-4">
            Verification Date: {new Date(matchData.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}
