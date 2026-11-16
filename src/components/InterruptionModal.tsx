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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 font-sans text-white">
      <div className="bg-slate-900 border-2 border-blue-500 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🌧️</span>
            <h2 className="text-xl font-black font-['Teko'] tracking-wider text-blue-400">
              RAIN CURTAILED MATCH & TARGET REVISION
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Curtailed Match Overs (Original: {scheduledOvers} overs)
            </label>
            <input
              type="number"
              min={1}
              max={scheduledOvers}
              value={overs}
              onChange={(e) => setOvers(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-base font-bold text-yellow-300 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Revised Target Score (DLS / Umpire Sheet)
            </label>
            <input
              type="number"
              min={1}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="e.g. 128"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-base font-bold text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Dynamic Quota Preview Card */}
          <div className="bg-slate-950 border border-blue-500/30 p-4 rounded-xl text-xs space-y-1.5 text-slate-300">
            <span className="text-blue-400 font-bold uppercase tracking-wider block">
              📊 ICC Limited Overs Quota Breakdown:
            </span>
            <p>• <strong>Max Bowler Quota:</strong> {quota.quotaDescription}</p>
            <p>• <strong>Mandatory Powerplay:</strong> {quota.powerplayOvers} Overs</p>
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
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-2.5 rounded-xl shadow-lg transition"
            >
              Apply Revision 🌧️
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
