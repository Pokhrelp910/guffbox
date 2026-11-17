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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans text-white"
      style={{
        background: 'radial-gradient(circle at center, rgba(14,25,56,0.92) 0%, rgba(26,4,8,0.96) 100%)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="bg-gradient-to-br from-[#081026] via-[#050a18] to-[#1c050a] border-2 border-yellow-500/50 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-yellow-500/20 pb-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">⚖️</span>
            <h2 className="text-xl font-black font-['Teko'] tracking-wider text-yellow-400">
              AWARD +5 PENALTY RUNS (MCC LAW 41 & 42)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#14224c] hover:bg-[#1f3575] text-white hover:text-yellow-300 flex items-center justify-center transition border border-yellow-500/30 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Innings Rules Card */}
        <div className="bg-[#050a18]/80 border border-yellow-500/30 p-4 rounded-xl text-xs space-y-2 text-white">
          <span className="text-yellow-400 font-bold uppercase tracking-wider block">
            Current Stage: Innings {inningsNumber}
          </span>
          {inningsNumber === 1 ? (
            <p className="leading-relaxed">
              • If awarded to <strong className="text-yellow-300">{battingTeamName}</strong> (Batting): +5 added directly to Innings 1 total score.<br />
              • If awarded to <strong className="text-yellow-300">{fieldingTeamName}</strong> (Fielding): Target for Innings 2 drops by 5 runs (Fielding team effectively starts chase 5/0).
            </p>
          ) : (
            <p className="leading-relaxed">
              • If awarded to <strong className="text-yellow-300">{battingTeamName}</strong> (Chasing): +5 added to chase score (runs required decreases by 5).<br />
              • If awarded to <strong className="text-yellow-300">{fieldingTeamName}</strong> (Defending): +5 added to Team 1 total score (Target rises by 5 runs).
            </p>
          )}
          <p className="text-[11px] text-yellow-300 italic">
            * Penalty runs never consume legal balls and never rotate strike.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-yellow-400 uppercase tracking-wider block mb-2">
              Award +5 Runs To:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setBenefitedTeam('batting')}
                className={`py-3 px-4 rounded-xl font-bold text-sm border transition flex flex-col items-center ${
                  benefitedTeam === 'batting'
                    ? 'bg-yellow-400 border-white text-[#050a18] shadow-lg ring-2 ring-yellow-400/50'
                    : 'bg-[#0e1938] border-yellow-500/30 text-white hover:bg-[#152554]'
                }`}
              >
                <span>Batting Team</span>
                <span className={`text-xs font-semibold ${benefitedTeam === 'batting' ? 'text-[#050a18]' : 'text-yellow-300'}`}>{battingTeamName}</span>
              </button>

              <button
                type="button"
                onClick={() => setBenefitedTeam('fielding')}
                className={`py-3 px-4 rounded-xl font-bold text-sm border transition flex flex-col items-center ${
                  benefitedTeam === 'fielding'
                    ? 'bg-yellow-400 border-white text-[#050a18] shadow-lg ring-2 ring-yellow-400/50'
                    : 'bg-[#0e1938] border-yellow-500/30 text-white hover:bg-[#152554]'
                }`}
              >
                <span>Fielding Team</span>
                <span className={`text-xs font-semibold ${benefitedTeam === 'fielding' ? 'text-[#050a18]' : 'text-yellow-300'}`}>{fieldingTeamName}</span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-white uppercase tracking-wider block mb-1">
              Select Penalty Infraction:
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-[#070e24] border border-yellow-500/40 rounded-xl px-4 py-2.5 text-sm text-yellow-300 font-semibold focus:outline-none focus:border-yellow-400"
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

          <div className="flex space-x-3 pt-3 border-t border-yellow-500/20">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#14224c] hover:bg-[#1e3474] text-white font-bold py-2.5 rounded-xl border border-yellow-500/30 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 hover:from-yellow-400 hover:to-amber-300 text-[#050a18] font-black py-2.5 rounded-xl shadow-lg transition cursor-pointer"
            >
              Award +5 Penalty Runs ⚖️
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
