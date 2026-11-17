// The Cricket Guff Studio — Advanced Extras & Compound Delivery Modal (MCC Laws 21, 22, 23 & 38)

import React, { useState, useEffect, useMemo } from 'react';
import {
  DismissalType,
  MediaEventKey,
  Player,
} from '../core/types';

export interface AdvancedExtraSubmitParams {
  extraType: 'wide' | 'noball' | 'bye' | 'leg_bye';
  extraSubType?: 'bye' | 'leg_bye';
  runsBat: number;
  runsExtras: number;
  physicalRunsRan: number;
  isBoundary: boolean;
  isFour: boolean;
  isSix: boolean;
  wicket?: {
    type: DismissalType;
    playerOutId: string;
    assistedById?: string;
    runsCompletedBeforeOut: number;
    creditBowler: boolean;
    newBatterId?: string;
  };
  displayBadge: string;
  animKey?: MediaEventKey;
}

interface AdvancedExtrasModalProps {
  isOpen: boolean;
  initialExtraType?: 'wide' | 'noball' | 'bye' | 'leg_bye';
  striker: Player;
  nonStriker: Player;
  availableBatters: Player[];
  bowlerName: string;
  isFreeHitActive: boolean;
  onConfirm: (params: AdvancedExtraSubmitParams) => void;
  onClose: () => void;
}

export const AdvancedExtrasModal: React.FC<AdvancedExtrasModalProps> = ({
  isOpen,
  initialExtraType = 'wide',
  striker,
  nonStriker,
  availableBatters,
  bowlerName,
  isFreeHitActive,
  onConfirm,
  onClose,
}) => {
  // Extra Type tab
  const [extraType, setExtraType] = useState<'wide' | 'noball' | 'bye' | 'leg_bye'>(initialExtraType);

  // No-Ball specific: Was ball hit off bat or byes?
  const [noBallSource, setNoBallSource] = useState<'bat' | 'bye' | 'leg_bye'>('bat');

  // Runs inputs
  const [runsOffBat, setRunsOffBat] = useState<number>(0);
  const [byesRuns, setByesRuns] = useState<number>(0);
  const [isBoundaryManual, setIsBoundaryManual] = useState<boolean>(false);

  // Compound Wicket State
  const [hasWicket, setHasWicket] = useState<boolean>(false);
  const [dismissalType, setDismissalType] = useState<DismissalType>('run_out');
  const [playerOutId, setPlayerOutId] = useState<string>(striker.id);
  const [assistedByName, setAssistedByName] = useState<string>('');
  const [runsCompletedBeforeOut, setRunsCompletedBeforeOut] = useState<number>(0);
  const [newBatterId, setNewBatterId] = useState<string>(availableBatters[0]?.id || '');

  // Reset when opening or when initialExtraType changes
  useEffect(() => {
    if (isOpen) {
      setExtraType(initialExtraType);
      setRunsOffBat(0);
      setByesRuns(0);
      setIsBoundaryManual(false);
      setHasWicket(false);
      setAssistedByName('');
      setRunsCompletedBeforeOut(0);
      setPlayerOutId(striker.id);
      setNewBatterId(availableBatters[0]?.id || '');
      setNoBallSource('bat');

      // Default dismissal types per law
      if (initialExtraType === 'wide') {
        setDismissalType('stumped');
      } else {
        setDismissalType('run_out');
      }
    }
  }, [isOpen, initialExtraType, striker.id, availableBatters]);

  // Adjust default dismissal type and players when extraType changes
  useEffect(() => {
    if (extraType === 'wide') {
      if (dismissalType !== 'stumped' && dismissalType !== 'run_out' && dismissalType !== 'hit_wicket' && dismissalType !== 'obstructing_field') {
        setDismissalType('stumped');
      }
    } else if (extraType === 'noball') {
      if (dismissalType !== 'run_out' && dismissalType !== 'obstructing_field' && dismissalType !== 'hit_ball_twice') {
        setDismissalType('run_out');
      }
    } else {
      // bye or leg_bye
      if (dismissalType !== 'run_out' && dismissalType !== 'obstructing_field') {
        setDismissalType('run_out');
      }
    }
  }, [extraType, dismissalType]);

  // If dismissal type is stumped or hit_wicket, player out must be striker!
  useEffect(() => {
    if (dismissalType === 'stumped' || dismissalType === 'hit_wicket') {
      setPlayerOutId(striker.id);
    }
  }, [dismissalType, striker.id]);

  // Auto-set boundary flag on 4 or 6 off bat, or boundary 4 on extras
  useEffect(() => {
    if (extraType === 'noball' && noBallSource === 'bat') {
      if (runsOffBat === 4 || runsOffBat === 6) {
        setIsBoundaryManual(true);
      } else {
        setIsBoundaryManual(false);
      }
    } else if (byesRuns === 4) {
      setIsBoundaryManual(true);
    }
  }, [runsOffBat, byesRuns, extraType, noBallSource]);

  // Sync runs completed before out with runs input if wicket is active
  const handleRunsCompletedChange = (val: number) => {
    setRunsCompletedBeforeOut(val);
    if (extraType === 'noball' && noBallSource === 'bat') {
      setRunsOffBat(val);
    } else {
      setByesRuns(val);
    }
  };

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Calculations for live preview & submission
  const calculation = useMemo(() => {
    let finalRunsBat = 0;
    let finalRunsExtras = 0;
    let finalPhysicalRunsRan = 0;
    let isFour = false;
    let isSix = false;
    let extraSubType: 'bye' | 'leg_bye' | undefined = undefined;
    let badge = '';
    let bowlerRunsConceded = 0;
    let legalBallCounted = false;
    let creditBowler = false;

    if (extraType === 'wide') {
      legalBallCounted = false;
      finalRunsBat = 0;
      finalRunsExtras = 1 + (hasWicket && dismissalType === 'run_out' ? runsCompletedBeforeOut : byesRuns);
      isFour = isBoundaryManual && finalRunsExtras >= 4;
      finalPhysicalRunsRan = isBoundaryManual ? 0 : (hasWicket && dismissalType === 'run_out' ? runsCompletedBeforeOut : byesRuns);
      bowlerRunsConceded = finalRunsExtras; // All wide extras charged to bowler
      creditBowler = dismissalType === 'stumped' || dismissalType === 'hit_wicket';

      if (hasWicket) {
        const runsLabel = finalRunsExtras > 1 ? `(${finalRunsExtras - 1})` : '';
        if (dismissalType === 'stumped') badge = 'Wd+W';
        else if (dismissalType === 'hit_wicket') badge = 'Wd+HW';
        else badge = runsLabel ? `Wd+W${runsLabel}` : 'Wd+W';
      } else {
        badge = byesRuns > 0 ? `Wd+${byesRuns}` : 'Wd';
      }
    } else if (extraType === 'noball') {
      legalBallCounted = false;
      if (noBallSource === 'bat') {
        const batRuns = hasWicket && dismissalType === 'run_out' ? runsCompletedBeforeOut : runsOffBat;
        finalRunsBat = batRuns;
        finalRunsExtras = 1; // 1 NB penalty
        isFour = isBoundaryManual && batRuns === 4;
        isSix = isBoundaryManual && batRuns === 6;
        finalPhysicalRunsRan = isBoundaryManual ? 0 : batRuns;
        bowlerRunsConceded = 1 + batRuns; // Bowler charged 1 NB + bat runs
        creditBowler = false; // No bowler wicket credit on No-ball

        if (hasWicket) {
          badge = batRuns > 0 ? `Nb+${batRuns}+W` : 'Nb+W';
        } else {
          badge = batRuns > 0 ? `Nb+${batRuns}` : 'Nb';
        }
      } else {
        // Byes or leg-byes on NB
        extraSubType = noBallSource;
        const extrasOnNb = hasWicket && dismissalType === 'run_out' ? runsCompletedBeforeOut : byesRuns;
        finalRunsBat = 0;
        finalRunsExtras = 1 + extrasOnNb;
        isFour = isBoundaryManual && extrasOnNb >= 4;
        finalPhysicalRunsRan = isBoundaryManual ? 0 : extrasOnNb;
        bowlerRunsConceded = 1; // Bowler charged ONLY 1 for NB penalty! Byes are not charged to bowler.
        creditBowler = false;

        const tag = noBallSource === 'leg_bye' ? 'Lb' : 'B';
        if (hasWicket) {
          badge = extrasOnNb > 0 ? `Nb+${extrasOnNb}${tag}+W` : 'Nb+W';
        } else {
          badge = extrasOnNb > 0 ? `Nb+${extrasOnNb}${tag}` : 'Nb';
        }
      }
    } else {
      // bye or leg_bye
      legalBallCounted = true; // Legal ball counted in over!
      finalRunsBat = 0;
      const bRuns = hasWicket && dismissalType === 'run_out' ? runsCompletedBeforeOut : byesRuns;
      finalRunsExtras = bRuns;
      isFour = isBoundaryManual && bRuns >= 4;
      finalPhysicalRunsRan = isBoundaryManual ? 0 : bRuns;
      bowlerRunsConceded = 0; // Byes and leg-byes NEVER charged to bowler!
      creditBowler = false;

      const tag = extraType === 'leg_bye' ? 'Lb' : 'B';
      if (hasWicket) {
        badge = bRuns > 0 ? `${bRuns}${tag}+W` : `${tag}+W`;
      } else {
        badge = `${bRuns}${tag}`;
      }
    }

    const totalRuns = finalRunsBat + finalRunsExtras;
    const isOddPhysical = finalPhysicalRunsRan % 2 !== 0;

    // Animation key
    let animKey: MediaEventKey = 'wide';
    if (hasWicket) {
      if (dismissalType === 'stumped') animKey = 'stumped';
      else if (dismissalType === 'run_out') animKey = 'run_out';
      else if (dismissalType === 'hit_wicket') animKey = 'hit_wicket';
      else animKey = 'generic_wicket';
    } else if (extraType === 'noball') {
      if (isSix) animKey = 'six';
      else if (isFour) animKey = 'four';
      else animKey = 'noball';
    } else if (extraType === 'bye') {
      animKey = 'bye';
    } else if (extraType === 'leg_bye') {
      animKey = 'leg_bye';
    }

    return {
      finalRunsBat,
      finalRunsExtras,
      totalRuns,
      finalPhysicalRunsRan,
      isBoundary: isBoundaryManual,
      isFour,
      isSix,
      extraSubType,
      badge,
      bowlerRunsConceded,
      legalBallCounted,
      creditBowler,
      isOddPhysical,
      animKey,
    };
  }, [
    extraType,
    noBallSource,
    runsOffBat,
    byesRuns,
    isBoundaryManual,
    hasWicket,
    dismissalType,
    runsCompletedBeforeOut,
  ]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const result: AdvancedExtraSubmitParams = {
      extraType,
      extraSubType: calculation.extraSubType,
      runsBat: calculation.finalRunsBat,
      runsExtras: calculation.finalRunsExtras,
      physicalRunsRan: calculation.finalPhysicalRunsRan,
      isBoundary: calculation.isBoundary,
      isFour: calculation.isFour,
      isSix: calculation.isSix,
      displayBadge: calculation.badge,
      animKey: calculation.animKey,
      wicket: hasWicket
        ? {
            type: dismissalType,
            playerOutId,
            assistedById: assistedByName.trim() || undefined,
            runsCompletedBeforeOut: dismissalType === 'run_out' ? runsCompletedBeforeOut : 0,
            creditBowler: calculation.creditBowler,
            newBatterId: newBatterId || undefined,
          }
        : undefined,
    };

    onConfirm(result);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans text-white overflow-y-auto"
      style={{
        background: 'radial-gradient(circle at center, rgba(14,25,56,0.92) 0%, rgba(26,4,8,0.96) 100%)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="bg-gradient-to-br from-[#081026] via-[#050a18] to-[#1c050a] border-2 border-yellow-500/50 rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-6 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-yellow-500/20 pb-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">⚡</span>
            <div>
              <h2 className="text-xl font-black font-['Teko'] tracking-wider text-yellow-400 leading-tight">
                ADVANCED EXTRA & COMPOUND DELIVERY
              </h2>
              <p className="text-[11px] text-white/80">
                Custom bat runs, byes/overthrows, and compound dismissals (MCC Laws 21, 22, 23 & 38)
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-white/80">
                  Bowler: <strong className="text-yellow-300">{bowlerName}</strong>
                </span>
                {isFreeHitActive && (
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-red-700 text-yellow-300 animate-pulse border border-yellow-400/50">
                    ⚡ FREE HIT ACTIVE
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#14224c] hover:bg-[#1f3575] text-white hover:text-yellow-300 flex items-center justify-center transition border border-yellow-500/30 cursor-pointer"
            title="Close [Esc]"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* 1. SELECT EXTRA TYPE (TABS) */}
          <div>
            <label className="text-xs font-bold text-yellow-400 uppercase tracking-wider block mb-2">
              1. Delivery Extra Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setExtraType('wide')}
                className={`py-2.5 px-2 rounded-2xl font-black text-xs border transition flex flex-col items-center ${
                  extraType === 'wide'
                    ? 'bg-yellow-400 border-yellow-200 text-[#050a18] shadow-lg ring-2 ring-yellow-400/50'
                    : 'bg-[#0e1938] border-yellow-500/30 text-white hover:bg-[#152554]'
                }`}
              >
                <span>WIDE BALL</span>
                <span className="text-[10px] font-normal opacity-90">Law 22 (+1 Extra)</span>
              </button>

              <button
                type="button"
                onClick={() => setExtraType('noball')}
                className={`py-2.5 px-2 rounded-2xl font-black text-xs border transition flex flex-col items-center ${
                  extraType === 'noball'
                    ? 'bg-red-700 border-red-300 text-white shadow-lg ring-2 ring-red-400/50'
                    : 'bg-[#24060e] border-yellow-500/30 text-white hover:bg-[#380916]'
                }`}
              >
                <span>NO-BALL</span>
                <span className="text-[10px] font-normal opacity-90">Law 21 (Free Hit)</span>
              </button>

              <button
                type="button"
                onClick={() => setExtraType('bye')}
                className={`py-2.5 px-2 rounded-2xl font-black text-xs border transition flex flex-col items-center ${
                  extraType === 'bye'
                    ? 'bg-[#14224c] border-yellow-400 text-yellow-300 shadow-lg ring-2 ring-yellow-400/50'
                    : 'bg-[#0e1938] border-yellow-500/30 text-white hover:bg-[#152554]'
                }`}
              >
                <span>BYES</span>
                <span className="text-[10px] font-normal opacity-90">Law 23 (Legal Ball)</span>
              </button>

              <button
                type="button"
                onClick={() => setExtraType('leg_bye')}
                className={`py-2.5 px-2 rounded-2xl font-black text-xs border transition flex flex-col items-center ${
                  extraType === 'leg_bye'
                    ? 'bg-[#1b2b5a] border-yellow-400 text-yellow-300 shadow-lg ring-2 ring-yellow-400/50'
                    : 'bg-[#0e1938] border-yellow-500/30 text-white hover:bg-[#152554]'
                }`}
              >
                <span>LEG-BYES</span>
                <span className="text-[10px] font-normal opacity-90">Law 23 (Off Pad)</span>
              </button>
            </div>
          </div>

          {/* 2. RUNS BREAKDOWN */}
          <div className="bg-[#050a18]/80 border border-yellow-500/30 rounded-2xl p-4 space-y-4">
            
            {/* NO-BALL CONFIGURATION */}
            {extraType === 'noball' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-yellow-400 uppercase tracking-wider block mb-1">
                    No-Ball Runs Source
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setNoBallSource('bat')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                        noBallSource === 'bat'
                          ? 'bg-yellow-400 border-white text-[#050a18] shadow'
                          : 'bg-[#0e1938] border-yellow-500/30 text-white hover:bg-[#152554]'
                      }`}
                    >
                      🏏 Off Bat (Striker Hit)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNoBallSource('bye')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                        noBallSource === 'bye'
                          ? 'bg-yellow-400 border-white text-[#050a18] shadow'
                          : 'bg-[#0e1938] border-yellow-500/30 text-white hover:bg-[#152554]'
                      }`}
                    >
                      🏃 Byes on No-Ball
                    </button>
                    <button
                      type="button"
                      onClick={() => setNoBallSource('leg_bye')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                        noBallSource === 'leg_bye'
                          ? 'bg-yellow-400 border-white text-[#050a18] shadow'
                          : 'bg-[#0e1938] border-yellow-500/30 text-white hover:bg-[#152554]'
                      }`}
                    >
                      🦵 Leg-Byes on No-Ball
                    </button>
                  </div>
                </div>

                {noBallSource === 'bat' ? (
                  <div>
                    <label className="text-xs font-bold text-white block mb-1">
                      Runs Scored off Bat:
                    </label>
                    <div className="flex items-center space-x-2">
                      {[0, 1, 2, 3, 4, 6].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setRunsOffBat(num)}
                          className={`w-11 h-10 rounded-xl font-black text-sm border transition ${
                            runsOffBat === num
                              ? 'bg-yellow-400 border-white text-[#050a18] shadow'
                              : 'bg-[#0e1938] border-yellow-500/30 text-white hover:bg-[#152554]'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                      <div className="flex-1 flex items-center space-x-1 pl-2">
                        <span className="text-xs text-yellow-300 font-bold">Custom:</span>
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={runsOffBat}
                          onChange={(e) => setRunsOffBat(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-16 bg-[#070e24] border border-yellow-500/40 rounded-xl px-2 py-1.5 text-center font-bold text-sm text-yellow-300 focus:outline-none focus:border-yellow-400"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-bold text-white block mb-1">
                      {noBallSource === 'bye' ? 'Byes' : 'Leg-Byes'} ran on No-Ball:
                    </label>
                    <div className="flex items-center space-x-2">
                      {[0, 1, 2, 3, 4].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setByesRuns(num)}
                          className={`w-11 h-10 rounded-xl font-black text-sm border transition ${
                            byesRuns === num
                              ? 'bg-yellow-400 border-white text-[#050a18] shadow'
                              : 'bg-[#0e1938] border-yellow-500/30 text-white hover:bg-[#152554]'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                      <div className="flex-1 flex items-center space-x-1 pl-2">
                        <span className="text-xs text-yellow-300 font-bold">Custom:</span>
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={byesRuns}
                          onChange={(e) => setByesRuns(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-16 bg-[#070e24] border border-yellow-500/40 rounded-xl px-2 py-1.5 text-center font-bold text-sm text-yellow-300 focus:outline-none focus:border-yellow-400"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* WIDE CONFIGURATION */}
            {extraType === 'wide' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-yellow-400 uppercase tracking-wider">
                    Additional Byes / Overthrows on Wide:
                  </label>
                  <span className="text-[11px] text-white/80 italic">
                    (Wide = 1 Penalty + byes/overthrows)
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {[0, 1, 2, 3, 4].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setByesRuns(num)}
                      className={`w-11 h-10 rounded-xl font-black text-sm border transition ${
                        byesRuns === num
                          ? 'bg-yellow-400 border-white text-[#050a18] shadow'
                          : 'bg-[#0e1938] border-yellow-500/30 text-white hover:bg-[#152554]'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                  <div className="flex-1 flex items-center space-x-1 pl-2">
                    <span className="text-xs text-yellow-300 font-bold">Custom:</span>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={byesRuns}
                      onChange={(e) => setByesRuns(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-16 bg-[#070e24] border border-yellow-500/40 rounded-xl px-2 py-1.5 text-center font-bold text-sm text-yellow-300 focus:outline-none focus:border-yellow-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* BYES / LEG-BYES CONFIGURATION */}
            {(extraType === 'bye' || extraType === 'leg_bye') && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-yellow-400 uppercase tracking-wider">
                    {extraType === 'bye' ? 'Byes' : 'Leg-Byes'} Runs Scored:
                  </label>
                  <span className="text-[11px] text-yellow-300 font-bold">
                    ✓ Legal Ball (Over advances)
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setByesRuns(num)}
                      className={`w-11 h-10 rounded-xl font-black text-sm border transition ${
                        byesRuns === num
                          ? 'bg-yellow-400 border-white text-[#050a18] shadow'
                          : 'bg-[#0e1938] border-yellow-500/30 text-white hover:bg-[#152554]'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                  <div className="flex-1 flex items-center space-x-1 pl-2">
                    <span className="text-xs text-yellow-300 font-bold">Custom:</span>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={byesRuns}
                      onChange={(e) => setByesRuns(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 bg-[#070e24] border border-yellow-500/40 rounded-xl px-2 py-1.5 text-center font-bold text-sm text-yellow-300 focus:outline-none focus:border-yellow-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Boundary Checkbox */}
            <div className="flex items-center justify-between pt-1 border-t border-yellow-500/20">
              <label className="flex items-center space-x-2 cursor-pointer text-xs text-white select-none">
                <input
                  type="checkbox"
                  checked={isBoundaryManual}
                  onChange={(e) => setIsBoundaryManual(e.target.checked)}
                  className="w-4 h-4 rounded border-yellow-500 text-yellow-400 focus:ring-0 cursor-pointer accent-yellow-400"
                />
                <span className="font-bold">Ball reached boundary rope (0 physical runs ran, no strike rotation)</span>
              </label>
            </div>

          </div>

          {/* 3. COMPOUND WICKET SECTION */}
          <div className="bg-[#1c050a]/90 border border-red-900/80 rounded-2xl p-4 space-y-4">
            
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasWicket}
                  onChange={(e) => setHasWicket(e.target.checked)}
                  className="w-5 h-5 rounded border-red-500 text-red-600 focus:ring-0 cursor-pointer accent-red-600"
                />
                <span className="font-black text-sm text-yellow-400 flex items-center gap-1.5">
                  <span>⚡ WICKET FELL ON THIS EXTRA DELIVERY?</span>
                </span>
              </label>
              {hasWicket && (
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-red-700 text-yellow-300 border border-yellow-400/40">
                  Wicket Active
                </span>
              )}
            </div>

            {hasWicket && (
              <div className="space-y-4 pt-2 border-t border-red-900/60">
                
                {/* Dismissal Type Selector (Strictly MCC filtered) */}
                <div>
                  <label className="text-xs font-bold text-white uppercase tracking-wider block mb-1">
                    Dismissal Type (Permissible under MCC Law):
                  </label>
                  
                  {extraType === 'wide' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => setDismissalType('stumped')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                          dismissalType === 'stumped'
                            ? 'bg-red-700 border-yellow-400 text-white shadow'
                            : 'bg-[#0e1938] border-yellow-500/30 text-white hover:bg-[#152554]'
                        }`}
                      >
                        ⚡ Stumped (WK)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDismissalType('run_out')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                          dismissalType === 'run_out'
                            ? 'bg-red-700 border-yellow-400 text-white shadow'
                            : 'bg-[#0e1938] border-yellow-500/30 text-white hover:bg-[#152554]'
                        }`}
                      >
                        🏃 Run Out
                      </button>
                      <button
                        type="button"
                        onClick={() => setDismissalType('hit_wicket')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                          dismissalType === 'hit_wicket'
                            ? 'bg-red-700 border-yellow-400 text-white shadow'
                            : 'bg-[#0e1938] border-yellow-500/30 text-white hover:bg-[#152554]'
                        }`}
                      >
                        🎯 Hit Wicket
                      </button>
                      <button
                        type="button"
                        onClick={() => setDismissalType('obstructing_field')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                          dismissalType === 'obstructing_field'
                            ? 'bg-red-700 border-yellow-400 text-white shadow'
                            : 'bg-[#0e1938] border-yellow-500/30 text-white hover:bg-[#152554]'
                        }`}
                      >
                        🚫 Obstructing
                      </button>
                    </div>
                  )}

                  {extraType === 'noball' && (
                    <div className="space-y-1.5">
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setDismissalType('run_out')}
                          className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                            dismissalType === 'run_out'
                              ? 'bg-red-700 border-yellow-400 text-white shadow'
                              : 'bg-[#0e1938] border-yellow-500/30 text-white hover:bg-[#152554]'
                          }`}
                        >
                          🏃 Run Out
                        </button>
                        <button
                          type="button"
                          onClick={() => setDismissalType('obstructing_field')}
                          className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                            dismissalType === 'obstructing_field'
                              ? 'bg-red-700 border-yellow-400 text-white shadow'
                              : 'bg-[#0e1938] border-yellow-500/30 text-white hover:bg-[#152554]'
                          }`}
                        >
                          🚫 Obstructing Field
                        </button>
                        <button
                          type="button"
                          onClick={() => setDismissalType('hit_ball_twice')}
                          className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                            dismissalType === 'hit_ball_twice'
                              ? 'bg-red-700 border-yellow-400 text-white shadow'
                              : 'bg-[#0e1938] border-yellow-500/30 text-white hover:bg-[#152554]'
                          }`}
                        >
                          🏏 Hit Ball Twice
                        </button>
                      </div>
                      <p className="text-[10px] text-yellow-300 italic">
                        Note: Per ICC/MCC Law 21.18, Bowled, Caught, LBW, and Stumped are NOT possible on a No-Ball.
                      </p>
                    </div>
                  )}

                  {(extraType === 'bye' || extraType === 'leg_bye') && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDismissalType('run_out')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                          dismissalType === 'run_out'
                            ? 'bg-red-700 border-yellow-400 text-white shadow'
                            : 'bg-[#0e1938] border-yellow-500/30 text-white hover:bg-[#152554]'
                        }`}
                      >
                        🏃 Run Out
                      </button>
                      <button
                        type="button"
                        onClick={() => setDismissalType('obstructing_field')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                          dismissalType === 'obstructing_field'
                            ? 'bg-red-700 border-yellow-400 text-white shadow'
                            : 'bg-[#0e1938] border-yellow-500/30 text-white hover:bg-[#152554]'
                        }`}
                      >
                        🚫 Obstructing Field
                      </button>
                    </div>
                  )}
                </div>

                {/* Batter Dismissed (Striker vs Non-Striker) */}
                <div>
                  <label className="text-xs font-bold text-white uppercase tracking-wider block mb-1">
                    Batter Dismissed:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      disabled={dismissalType === 'stumped' || dismissalType === 'hit_wicket'}
                      onClick={() => setPlayerOutId(striker.id)}
                      className={`py-2.5 px-3 rounded-xl font-bold text-xs border transition flex flex-col items-center ${
                        playerOutId === striker.id
                          ? 'bg-red-700 border-yellow-400 text-white shadow-lg'
                          : 'bg-[#0e1938] border-yellow-500/30 text-white hover:bg-[#152554]'
                      }`}
                    >
                      <span>Striker</span>
                      <span className="text-[11px] font-normal text-yellow-300">{striker.name}</span>
                    </button>

                    <button
                      type="button"
                      disabled={dismissalType === 'stumped' || dismissalType === 'hit_wicket'}
                      onClick={() => setPlayerOutId(nonStriker.id)}
                      className={`py-2.5 px-3 rounded-xl font-bold text-xs border transition flex flex-col items-center ${
                        playerOutId === nonStriker.id
                          ? 'bg-red-700 border-yellow-400 text-white shadow-lg'
                          : 'bg-[#0e1938] border-yellow-500/30 text-white hover:bg-[#152554]'
                      } ${dismissalType === 'stumped' || dismissalType === 'hit_wicket' ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      <span>Non-Striker (Runner)</span>
                      <span className="text-[11px] font-normal text-yellow-300">{nonStriker.name}</span>
                    </button>
                  </div>
                </div>

                {/* Runs completed before Run Out */}
                {dismissalType === 'run_out' && (
                  <div>
                    <label className="text-xs font-bold text-white uppercase tracking-wider block mb-1">
                      Runs completed before Run Out occurred:
                    </label>
                    <div className="flex items-center space-x-2">
                      {[0, 1, 2, 3].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handleRunsCompletedChange(num)}
                          className={`w-11 h-10 rounded-xl font-black text-sm border transition ${
                            runsCompletedBeforeOut === num
                              ? 'bg-yellow-400 border-white text-[#050a18] shadow'
                              : 'bg-[#0e1938] border-yellow-500/30 text-white hover:bg-[#152554]'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                      <span className="text-[11px] text-white/80 italic pl-2">
                        {runsCompletedBeforeOut === 1
                          ? 'Batsmen crossed. Strike will rotate.'
                          : runsCompletedBeforeOut > 0
                          ? `${runsCompletedBeforeOut} runs credited before dismissal.`
                          : 'Zero runs completed before run-out.'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Fielder / Assistant */}
                <div>
                  <label className="text-xs font-bold text-white uppercase tracking-wider block mb-1">
                    Fielder / Assistant (Optional):
                  </label>
                  <input
                    type="text"
                    value={assistedByName}
                    onChange={(e) => setAssistedByName(e.target.value)}
                    placeholder={dismissalType === 'stumped' ? 'Wicketkeeper name' : 'e.g. Rohit Sharma / Direct Hit'}
                    className="w-full bg-[#070e24] border border-yellow-500/40 rounded-xl px-4 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-yellow-400"
                  />
                </div>

                {/* New Batter Coming In */}
                {availableBatters.length > 0 && (
                  <div>
                    <label className="text-xs font-bold text-white uppercase tracking-wider block mb-1">
                      Incoming New Batter:
                    </label>
                    <select
                      value={newBatterId}
                      onChange={(e) => setNewBatterId(e.target.value)}
                      className="w-full bg-[#070e24] border border-yellow-500/40 rounded-xl px-4 py-2 text-xs text-yellow-300 font-bold focus:outline-none focus:border-yellow-400"
                    >
                      {availableBatters.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.role})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

              </div>
            )}

          </div>

          {/* 4. LIVE INTERACTIVE DELIVERY PREVIEW BOX */}
          <div className="bg-gradient-to-r from-[#070e24] via-[#050a18] to-[#20050c] border border-yellow-500/40 rounded-2xl p-4 shadow-inner space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400">
                LIVE DELIVERY SUMMARY PREVIEW
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/80">Badge:</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-yellow-400 text-[#050a18] shadow">
                  {calculation.badge}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="bg-[#0e1938]/90 p-2 rounded-xl border border-yellow-500/20">
                <span className="text-[10px] text-white/70 block">Total Runs</span>
                <span className="text-lg font-black text-yellow-300">+{calculation.totalRuns}</span>
                <span className="text-[10px] text-white/70 block">
                  ({calculation.finalRunsBat} bat + {calculation.finalRunsExtras} ext)
                </span>
              </div>

              <div className="bg-[#0e1938]/90 p-2 rounded-xl border border-yellow-500/20">
                <span className="text-[10px] text-white/70 block">Bowler Conceded</span>
                <span className="text-lg font-black text-yellow-400">{calculation.bowlerRunsConceded}</span>
                <span className="text-[10px] text-white/70 block">
                  {calculation.creditBowler ? '+1 Wicket credited' : 'No wkt credit'}
                </span>
              </div>

              <div className="bg-[#0e1938]/90 p-2 rounded-xl border border-yellow-500/20">
                <span className="text-[10px] text-white/70 block">Legal Ball</span>
                <span className={`text-sm font-black ${calculation.legalBallCounted ? 'text-yellow-300' : 'text-red-400'}`}>
                  {calculation.legalBallCounted ? '✓ Counts in Over' : '✗ Over unchanged'}
                </span>
                <span className="text-[10px] text-yellow-300 block">
                  {extraType === 'noball' ? '⚡ Free Hit next' : ''}
                </span>
              </div>

              <div className="bg-[#0e1938]/90 p-2 rounded-xl border border-yellow-500/20">
                <span className="text-[10px] text-white/70 block">Strike on Next Ball</span>
                <span className="text-xs font-black text-yellow-300">
                  {calculation.isOddPhysical ? 'Strike Swapped (Odd)' : 'Striker Stays (Even)'}
                </span>
                <span className="text-[10px] text-white/70 block">
                  {calculation.finalPhysicalRunsRan} physical ran
                </span>
              </div>
            </div>
          </div>

          {/* 5. SUBMIT & CANCEL BUTTONS */}
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#14224c] hover:bg-[#1e3474] text-white font-bold py-3 rounded-2xl border border-yellow-500/30 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-2 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 hover:from-yellow-400 hover:to-amber-300 text-[#050a18] font-black py-3 px-6 rounded-2xl shadow-xl transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>⚡ Deliver Ball & Record Score</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
