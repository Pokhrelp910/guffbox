// The Cricket Guff Studio — 1-Click Run Out Selector

import React, { useState, useMemo } from 'react';
import { Player, Team } from '../core/types';
import { PlayerAvatar } from '../utils/avatarUtils';

interface RunOutModalProps {
  isOpen: boolean;
  striker: Player;
  nonStriker: Player;
  availableBatters: Player[];
  fieldingTeam?: Team;
  onConfirm: (params: {
    playerOutId: string;
    runsCompleted: number;
    fielderName?: string;
    newBatterId: string;
    deliveryType: 'legal' | 'wide' | 'noball' | 'bye' | 'leg_bye';
  }) => void;
  onClose: () => void;
}

export const RunOutModal: React.FC<RunOutModalProps> = ({
  isOpen,
  striker,
  nonStriker,
  availableBatters,
  fieldingTeam,
  onConfirm,
  onClose,
}) => {
  const [selectedOutId, setSelectedOutId] = useState<string>(striker.id);
  const [runsCompleted, setRunsCompleted] = useState<number>(0);
  const [deliveryType, setDeliveryType] = useState<'legal' | 'wide' | 'noball' | 'bye' | 'leg_bye'>('legal');
  const [fielderName, setFielderName] = useState<string>('');
  const [newBatterId, setNewBatterId] = useState<string>(availableBatters[0]?.id || '');

  const fieldingPlayers = useMemo(() => {
    if (!fieldingTeam?.squad) return [];
    if (fieldingTeam.playing11 && fieldingTeam.playing11.length > 0) {
      return fieldingTeam.squad.filter((p) => fieldingTeam.playing11.includes(p.id));
    }
    return fieldingTeam.squad;
  }, [fieldingTeam]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      playerOutId: selectedOutId,
      runsCompleted,
      fielderName: fielderName.trim() || undefined,
      newBatterId,
      deliveryType,
    });
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
            <span className="text-2xl">⚡</span>
            <h2 className="text-xl font-black font-['Teko'] tracking-wider text-yellow-400">
              RUN OUT DISMISSAL (MCC LAW 38)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#14224c] hover:bg-[#1f3575] text-white hover:text-yellow-300 flex items-center justify-center transition border border-yellow-500/30 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Delivery Type (Legal / Wide / No-ball / Bye / Leg-Bye) */}
          <div>
            <label className="text-xs font-bold text-yellow-400 uppercase tracking-wider block mb-2">
              Delivery Type
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              <button
                type="button"
                onClick={() => setDeliveryType('legal')}
                className={`py-2 px-1.5 rounded-xl font-bold text-xs border transition text-center ${
                  deliveryType === 'legal'
                    ? 'bg-yellow-400 border-white text-[#050a18] shadow'
                    : 'bg-[#0e1938] border-yellow-500/30 text-white hover:bg-[#152554]'
                }`}
              >
                Legal
              </button>
              <button
                type="button"
                onClick={() => setDeliveryType('wide')}
                className={`py-2 px-1.5 rounded-xl font-bold text-xs border transition text-center ${
                  deliveryType === 'wide'
                    ? 'bg-yellow-400 border-white text-[#050a18] shadow'
                    : 'bg-[#0e1938] border-yellow-500/30 text-white hover:bg-[#152554]'
                }`}
              >
                Wide
              </button>
              <button
                type="button"
                onClick={() => setDeliveryType('noball')}
                className={`py-2 px-1.5 rounded-xl font-bold text-xs border transition text-center ${
                  deliveryType === 'noball'
                    ? 'bg-red-700 border-white text-white shadow'
                    : 'bg-[#24060e] border-yellow-500/30 text-white hover:bg-[#380916]'
                }`}
              >
                No-Ball
              </button>
              <button
                type="button"
                onClick={() => setDeliveryType('bye')}
                className={`py-2 px-1.5 rounded-xl font-bold text-xs border transition text-center ${
                  deliveryType === 'bye'
                    ? 'bg-yellow-400 border-white text-[#050a18] shadow'
                    : 'bg-[#0e1938] border-yellow-500/30 text-white hover:bg-[#152554]'
                }`}
              >
                Byes
              </button>
              <button
                type="button"
                onClick={() => setDeliveryType('leg_bye')}
                className={`py-2 px-1.5 rounded-xl font-bold text-xs border transition text-center ${
                  deliveryType === 'leg_bye'
                    ? 'bg-yellow-400 border-white text-[#050a18] shadow'
                    : 'bg-[#0e1938] border-yellow-500/30 text-white hover:bg-[#152554]'
                }`}
              >
                Leg-Byes
              </button>
            </div>
          </div>

          {/* 1. Who was Run Out? */}
          <div>
            <label className="text-xs font-bold text-yellow-400 uppercase tracking-wider block mb-2">
              1. Which batter was run out?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedOutId(striker.id)}
                className={`py-3 px-4 rounded-xl font-bold text-sm border transition flex flex-col items-center ${
                  selectedOutId === striker.id
                    ? 'bg-red-700 border-yellow-400 text-white shadow-lg ring-2 ring-yellow-400/50'
                    : 'bg-[#0e1938] border-yellow-500/30 text-white hover:bg-[#152554]'
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
                    ? 'bg-red-700 border-yellow-400 text-white shadow-lg ring-2 ring-yellow-400/50'
                    : 'bg-[#0e1938] border-yellow-500/30 text-white hover:bg-[#152554]'
                }`}
              >
                <span>Non-Striker</span>
                <span className="text-xs font-normal text-yellow-300">{nonStriker.name}</span>
              </button>
            </div>
          </div>

          {/* 2. Runs Completed Before Out */}
          <div>
            <label className="text-xs font-bold text-yellow-400 uppercase tracking-wider block mb-2">
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
                      ? 'bg-yellow-400 border-white text-[#050a18] shadow-md'
                      : 'bg-[#0e1938] border-yellow-500/30 text-white hover:bg-[#152554]'
                  }`}
                >
                  {r} {r === 1 ? 'Run' : 'Runs'}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-white/80 mt-1 italic">
              {runsCompleted === 1
                ? 'Batsmen crossed. Strike will rotate for the new batter / surviving partner.'
                : 'Runs will be added to total and batter score.'}
            </p>
          </div>

          {/* 3. Fielder Involved / Direct Hit */}
          <div className="space-y-2 p-3 bg-[#070e24] border border-yellow-500/30 rounded-2xl">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>🎯</span>
                <span>3. Fielder(s) Involved (रन आउट गर्ने फिल्डर)</span>
              </label>
              {fielderName && (
                <span className="text-[11px] font-bold text-yellow-300 bg-red-950/80 px-2 py-0.5 rounded-lg border border-red-700">
                  {fielderName}
                </span>
              )}
            </div>

            {/* Quick Pills */}
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => setFielderName('Direct Hit')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition border cursor-pointer ${
                  fielderName === 'Direct Hit'
                    ? 'bg-yellow-400 text-slate-950 border-white font-black'
                    : 'bg-[#1c0810] text-yellow-300 border-red-800 hover:border-yellow-500/40'
                }`}
              >
                🎯 Direct Hit
              </button>

              {fieldingPlayers.map((fp) => {
                const isSelected = fielderName.includes(fp.name);
                const isWK = fp.isWicketKeeper || fp.role === 'wicket-keeper';
                return (
                  <button
                    key={fp.id}
                    type="button"
                    onClick={() => {
                      if (!fielderName || fielderName === 'Direct Hit') {
                        setFielderName(fp.name);
                      } else if (!fielderName.includes(fp.name)) {
                        setFielderName(`${fielderName} / ${fp.name}`);
                      } else {
                        setFielderName(fp.name);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
                      isSelected
                        ? 'bg-yellow-400 text-slate-950 border-white shadow-md font-black scale-105'
                        : 'bg-[#0e1938] hover:bg-[#162758] text-white border-yellow-500/30'
                    }`}
                  >
                    <PlayerAvatar
                      name={fp.name}
                      role={fp.role}
                      teamColor={fieldingTeam?.color}
                      size="xs"
                    />
                    <span>{fp.name}</span>
                    {isWK && <span className="text-[9px] text-yellow-300 font-black">(WK)</span>}
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              value={fielderName}
              onChange={(e) => setFielderName(e.target.value)}
              placeholder="e.g. Rohit Sharma / Direct Hit"
              className="w-full bg-[#050a18] border border-yellow-500/40 rounded-xl px-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-yellow-400 font-semibold"
            />
          </div>

          {/* 4. New Batter Coming In */}
          {availableBatters.length > 0 && (
            <div>
              <label className="text-xs font-bold text-yellow-400 uppercase tracking-wider block mb-1">
                4. Select New Batter Coming In
              </label>
              <select
                value={newBatterId}
                onChange={(e) => setNewBatterId(e.target.value)}
                className="w-full bg-[#070e24] border border-yellow-500/40 rounded-xl px-4 py-2.5 text-sm text-yellow-300 font-bold focus:outline-none focus:border-yellow-400"
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
              className="flex-1 bg-gradient-to-r from-red-800 via-red-700 to-red-800 hover:from-red-700 hover:to-red-600 text-white font-black py-2.5 rounded-xl shadow-lg transition border border-yellow-500/40 cursor-pointer"
            >
              Confirm Run Out ⚡
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
