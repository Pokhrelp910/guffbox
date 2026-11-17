// GuffBox Cricket Studio — Rain, Curtailed Overs & DLS Revision Modal

import React, { useState } from 'react';
import { calculateCurtailedOversQuota } from '../core/target-calculator';

interface InterruptionModalProps {
  isOpen: boolean;
  scheduledOvers: number;
  currentCurtailedOvers?: number;
  currentTarget?: number;
  onApply: (curtailedOvers: number, revisedTarget?: number) => void;
  onClose: () => void;
}

export const InterruptionModal: React.FC<InterruptionModalProps> = ({
  isOpen,
  scheduledOvers,
  currentCurtailedOvers,
  currentTarget,
  onApply,
  onClose,
}) => {
  const [overs, setOvers] = useState<number>(currentCurtailedOvers || scheduledOvers);
  const [target, setTarget] = useState<string>(currentTarget ? String(currentTarget) : '');

  if (!isOpen) return null;

  const quota = calculateCurtailedOversQuota(scheduledOvers, overs);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTarget = target ? parseInt(target, 10) : undefined;
    onApply(overs, parsedTarget);
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
            <span className="text-2xl">🌧️</span>
            <h2 className="text-xl font-black font-['Teko'] tracking-wider text-yellow-400">
              RAIN CURTAILED MATCH & TARGET REVISION
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#14224c] hover:bg-[#1f3575] text-white hover:text-yellow-300 flex items-center justify-center transition border border-yellow-500/30 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-yellow-400 uppercase tracking-wider block mb-1">
              Curtailed Match Overs (Original: {scheduledOvers} overs)
            </label>
            <input
              type="number"
              min={1}
              max={scheduledOvers}
              value={overs}
              onChange={(e) => setOvers(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full bg-[#070e24] border border-yellow-500/40 rounded-xl px-4 py-2.5 text-base font-bold text-yellow-300 focus:outline-none focus:border-yellow-400"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-white uppercase tracking-wider block mb-1">
              Revised Target Score (DLS / Umpire Sheet)
            </label>
            <input
              type="number"
              min={1}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="e.g. 128"
              className="w-full bg-[#070e24] border border-yellow-500/40 rounded-xl px-4 py-2.5 text-base font-bold text-white placeholder-white/40 focus:outline-none focus:border-yellow-400"
            />
          </div>

          {/* Dynamic Quota Preview Card */}
          <div className="bg-[#050a18]/80 border border-yellow-500/30 p-4 rounded-xl text-xs space-y-1.5 text-white">
            <span className="text-yellow-400 font-bold uppercase tracking-wider block">
              📊 ICC Limited Overs Quota Breakdown:
            </span>
            <p>• <strong>Max Bowler Quota:</strong> <span className="text-yellow-300">{quota.quotaDescription}</span></p>
            <p>• <strong>Mandatory Powerplay:</strong> <span className="text-yellow-300">{quota.powerplayOvers} Overs</span></p>
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
              Apply Revision 🌧️
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
