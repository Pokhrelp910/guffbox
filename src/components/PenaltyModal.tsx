// GuffBox Cricket Studio — Penalty Runs Modal (MCC Law 41 & 42)

import React, { useState } from 'react';

interface PenaltyModalProps {
  isOpen: boolean;
  inningsNumber: 1 | 2;
  battingTeamName: string;
  fieldingTeamName: string;
  onAwardPenalty: (benefitedTeam: 'batting' | 'fielding', reason: string) => void;
  onClose: () => void;
}

export const PenaltyModal: React.FC<PenaltyModalProps> = ({
  isOpen,
  inningsNumber,
  battingTeamName,
  fieldingTeamName,
  onAwardPenalty,
  onClose,
}) => {
  const [benefitedTeam, setBenefitedTeam] = useState<'batting' | 'fielding'>('batting');
  const [reason, setReason] = useState<string>('Ball struck fielding helmet on ground (Law 28.3)');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAwardPenalty(benefitedTeam, reason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 font-sans text-white">
      <div className="bg-slate-900 border-2 border-emerald-500 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">⚖️</span>
            <h2 className="text-xl font-black font-['Teko'] tracking-wider text-emerald-400">
              AWARD +5 PENALTY RUNS (MCC LAW 41 & 42)
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold">✕</button>
        </div>

        {/* Innings Rules Card */}
        <div className="bg-slate-950/80 border border-emerald-500/30 p-4 rounded-xl text-xs space-y-2 text-slate-300">
          <span className="text-emerald-400 font-bold uppercase tracking-wider block">
            Current Stage: Innings {inningsNumber}
          </span>
          {inningsNumber === 1 ? (
            <p>
              • If awarded to <strong>{battingTeamName}</strong> (Batting): +5 added directly to Innings 1 total score.<br />
              • If awarded to <strong>{fieldingTeamName}</strong> (Fielding): Target for Innings 2 drops by 5 runs (Fielding team effectively starts chase 5/0).
            </p>
          ) : (
            <p>
              • If awarded to <strong>{battingTeamName}</strong> (Chasing): +5 added to chase score (runs required decreases by 5).<br />
              • If awarded to <strong>{fieldingTeamName}</strong> (Defending): +5 added to Team 1 total score (Target rises by 5 runs).
            </p>
          )}
          <p className="text-[11px] text-yellow-400/90 italic">
            * Penalty runs never consume legal balls and never rotate strike.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              Award +5 Runs To:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setBenefitedTeam('batting')}
                className={`py-3 px-4 rounded-xl font-bold text-sm border transition flex flex-col items-center ${
                  benefitedTeam === 'batting'
                    ? 'bg-emerald-600 border-white text-white shadow-lg'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>Batting Team</span>
                <span className="text-xs text-yellow-300 font-semibold">{battingTeamName}</span>
              </button>

              <button
                type="button"
                onClick={() => setBenefitedTeam('fielding')}
                className={`py-3 px-4 rounded-xl font-bold text-sm border transition flex flex-col items-center ${
                  benefitedTeam === 'fielding'
                    ? 'bg-emerald-600 border-white text-white shadow-lg'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>Fielding Team</span>
                <span className="text-xs text-yellow-300 font-semibold">{fieldingTeamName}</span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Select Penalty Infraction:
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="Ball struck fielding helmet on ground (Law 28.3)">
                Ball struck fielding helmet on ground (Law 28.3)
              </option>
              <option value="Unfair play / Ball tampering (Law 41.3)">
                Unfair play / Ball tampering (Law 41.3)
              </option>
              <option value="Deliberate short run (Law 18.5)">
                Deliberate short run (Law 18.5)
              </option>
              <option value="Running on pitch / Pitch damage (Law 41.12)">
                Running on pitch / Pitch damage (Law 41.12)
              </option>
              <option value="Unfair distraction of batter (Law 41.4)">
                Unfair distraction of batter (Law 41.4)
              </option>
              <option value="Player misconduct / Level 3 or 4 offense (Law 42)">
                Player misconduct / Level 3 or 4 offense (Law 42)
              </option>
            </select>
          </div>

          <div className="flex space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl border border-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2.5 rounded-xl shadow-lg transition"
            >
              Award +5 Penalty Runs ⚖️
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
