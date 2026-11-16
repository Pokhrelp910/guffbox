// GuffBox Cricket Studio — 1-Click Run Out Selector

import React, { useState } from 'react';
import { Player } from '../core/types';

interface RunOutModalProps {
  isOpen: boolean;
  striker: Player;
  nonStriker: Player;
  availableBatters: Player[];
  onConfirm: (params: {
    playerOutId: string;
    runsCompleted: number;
    fielderName?: string;
    newBatterId: string;
  }) => void;
  onClose: () => void;
}

export const RunOutModal: React.FC<RunOutModalProps> = ({
  isOpen,
  striker,
  nonStriker,
  availableBatters,
  onConfirm,
  onClose,
}) => {
  const [selectedOutId, setSelectedOutId] = useState<string>(striker.id);
  const [runsCompleted, setRunsCompleted] = useState<number>(0);
  const [fielderName, setFielderName] = useState<string>('');
  const [newBatterId, setNewBatterId] = useState<string>(availableBatters[0]?.id || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      playerOutId: selectedOutId,
      runsCompleted,
      fielderName: fielderName.trim() || undefined,
      newBatterId,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 font-sans text-white">
      <div className="bg-slate-900 border-2 border-red-500 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">⚡</span>
            <h2 className="text-xl font-black font-['Teko'] tracking-wider text-red-400">
              RUN OUT DISMISSAL (MCC LAW 38)
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Who was Run Out? */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              1. Which batter was run out?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedOutId(striker.id)}
                className={`py-3 px-4 rounded-xl font-bold text-sm border transition flex flex-col items-center ${
                  selectedOutId === striker.id
                    ? 'bg-red-600 border-white text-white shadow-lg'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>Striker</span>
                <span className="text-xs font-normal text-yellow-300">{striker.name}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOutId(nonStriker.id)}
                className={`py-3 px-4 rounded-xl font-bold text-sm border transition flex flex-col items-center ${
                  selectedOutId === nonStriker.id
                    ? 'bg-red-600 border-white text-white shadow-lg'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>Non-Striker</span>
                <span className="text-xs font-normal text-yellow-300">{nonStriker.name}</span>
              </button>
            </div>
          </div>

          {/* 2. Runs Completed Before Out */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              2. Physical runs completed before the run-out?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRunsCompleted(r)}
                  className={`py-2.5 rounded-xl font-black text-base border transition ${
                    runsCompleted === r
                      ? 'bg-amber-500 border-white text-slate-950 shadow-md'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {r} {r === 1 ? 'Run' : 'Runs'}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 italic">
              {runsCompleted === 1
                ? 'Batsmen crossed. Strike will rotate for the new batter / surviving partner.'
                : 'Runs will be added to total and batter score.'}
            </p>
          </div>

          {/* 3. Fielder Involved */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
              3. Fielder / Direct Hit (Optional)
            </label>
            <input
              type="text"
              value={fielderName}
              onChange={(e) => setFielderName(e.target.value)}
              placeholder="e.g. Rohit Sharma / Direct Hit"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
            />
          </div>

          {/* 4. New Batter Coming In */}
          {availableBatters.length > 0 && (
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                4. Select New Batter Coming In
              </label>
              <select
                value={newBatterId}
                onChange={(e) => setNewBatterId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-yellow-300 font-bold focus:outline-none focus:border-yellow-400"
              >
                {availableBatters.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Actions */}
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
              className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black py-2.5 rounded-xl shadow-lg transition"
            >
              Confirm Run Out ⚡
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
