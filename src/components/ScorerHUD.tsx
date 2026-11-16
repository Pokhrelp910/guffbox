// GuffBox Cricket Studio — Single-Monitor Scorer HUD Cockpit

import React, { useState } from 'react';
import {
  MatchState,
  BallDeliveryEvent,
  DismissalType,
  MediaEventKey,
  Player,
} from '../core/types';
import { useCricketHotkeys } from './HotkeyListener';
import { createPenaltyEvent } from '../core/penalty-rules';
import { RunOutModal } from './RunOutModal';
import { PenaltyModal } from './PenaltyModal';
import { InterruptionModal } from './InterruptionModal';
import { MediaManagerModal } from './MediaManagerModal';
import { FullScorecard } from '../overlays/FullScorecard';

interface ScorerHUDProps {
  match: MatchState;
  onDeliverBall: (event: BallDeliveryEvent, animationKey?: MediaEventKey) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onSwapStrikeManual: () => void;
  onChangeBowler: (newBowlerId: string) => void;
  onStartSecondInnings: () => void;
  onUpdateMetadata: (curtailedOvers: number, revisedTarget?: number) => void;
  onTriggerAnimation: (key: MediaEventKey) => void;
}

export const ScorerHUD: React.FC<ScorerHUDProps> = ({
  match,
  onDeliverBall,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onSwapStrikeManual,
  onChangeBowler,
  onStartSecondInnings,
  onUpdateMetadata,
  onTriggerAnimation,
}) => {
  const isSecondInnings = match.currentInningsNumber === 2;
  const currentInnings = isSecondInnings && match.innings2 ? match.innings2 : match.innings1;
  const battingTeam = currentInnings.battingTeamId === match.teamA.id ? match.teamA : match.teamB;
  const bowlingTeam = currentInnings.bowlingTeamId === match.teamA.id ? match.teamA : match.teamB;

  const striker = currentInnings.batterStats[currentInnings.strikerId];
  const nonStriker = currentInnings.batterStats[currentInnings.nonStrikerId];

  // Modals state
  const [showRunOutModal, setShowRunOutModal] = useState(false);
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [showInterruptionModal, setShowInterruptionModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showScorecardModal, setShowScorecardModal] = useState(false);
  const [showWicketDropdown, setShowWicketDropdown] = useState(false);
  const [showWideSubmenu, setShowWideSubmenu] = useState(false);
  const [showNoBallSubmenu, setShowNoBallSubmenu] = useState(false);
  const [showByesSubmenu, setShowByesSubmenu] = useState(false);
  const [showLegByesSubmenu, setShowLegByesSubmenu] = useState(false);

  // Available batters who haven't batted yet
  const availableBatters: Player[] = battingTeam.squad.filter(
    (p) => !currentInnings.batterStats[p.id]?.isOut && p.id !== currentInnings.strikerId && p.id !== currentInnings.nonStrikerId
  );

  // Available bowlers in bowling squad
  const availableBowlers: Player[] = bowlingTeam.squad;

  // Helper to generate unique ball id
  const newBallId = () => `ball_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  // 1. Scoring standard runs off bat
  const handleScoreRuns = (runs: number) => {
    const isFour = runs === 4;
    const isSix = runs === 6;
    const isBoundary = isFour || isSix;
    // Boundary 4 & 6 have 0 physical runs ran; 1, 2, 3 have physical runs ran!
    const physicalRunsRan = isBoundary ? 0 : runs;

    const delivery: BallDeliveryEvent = {
      id: newBallId(),
      inningsNumber: match.currentInningsNumber,
      overIndex: Math.floor(currentInnings.legalBalls / 6),
      ballInOver: (currentInnings.currentOverLegalBalls % 6) + 1,
      legalBallCounted: true,
      strikerId: currentInnings.strikerId,
      nonStrikerId: currentInnings.nonStrikerId,
      bowlerId: currentInnings.currentBowlerId,
      runsBat: runs,
      runsExtras: 0,
      extraType: 'none',
      physicalRunsRan,
      isBoundary,
      isFour,
      isSix,
      isFreeHitDelivery: currentInnings.isFreeHitActive,
      causesFreeHit: false,
      displayBadge: String(runs),
      timestamp: Date.now(),
    };

    let animKey: MediaEventKey = 'dot';
    if (runs === 1) animKey = 'run_1';
    else if (runs === 2) animKey = 'run_2';
    else if (runs === 3) animKey = 'run_3';
    else if (runs === 4) animKey = 'four';
    else if (runs === 6) animKey = 'six';

    onDeliverBall(delivery, animKey);
  };

  // 2. Wide deliveries
  const handleWide = (additionalByes: number = 0) => {
    setShowWideSubmenu(false);
    const totalRuns = 1 + additionalByes;
    // If additionalByes ran is odd (e.g. 1 bye ran on wide), physicalRunsRan = additionalByes, so strike rotates!
    // If boundary (additionalByes === 4), physicalRunsRan = 0
    const physicalRunsRan = additionalByes === 4 ? 0 : additionalByes;

    const badge = additionalByes > 0 ? `Wd+${additionalByes}` : 'Wd';

    const delivery: BallDeliveryEvent = {
      id: newBallId(),
      inningsNumber: match.currentInningsNumber,
      overIndex: Math.floor(currentInnings.legalBalls / 6),
      ballInOver: currentInnings.currentOverLegalBalls,
      legalBallCounted: false,
      strikerId: currentInnings.strikerId,
      nonStrikerId: currentInnings.nonStrikerId,
      bowlerId: currentInnings.currentBowlerId,
      runsBat: 0,
      runsExtras: totalRuns,
      extraType: 'wide',
      physicalRunsRan,
      isBoundary: additionalByes === 4,
      isFour: additionalByes === 4,
      isSix: false,
      isFreeHitDelivery: currentInnings.isFreeHitActive,
      causesFreeHit: false,
      displayBadge: badge,
      timestamp: Date.now(),
    };

    onDeliverBall(delivery, 'wide');
  };

  // 3. No-Ball deliveries
  const handleNoBall = (runsOffBat: number = 0, byesOnNb: number = 0) => {
    setShowNoBallSubmenu(false);
    const isBoundary = runsOffBat === 4 || runsOffBat === 6 || byesOnNb === 4;
    const physicalRunsRan = isBoundary ? 0 : runsOffBat + byesOnNb;
    const badge = runsOffBat > 0 ? `Nb+${runsOffBat}` : byesOnNb > 0 ? `Nb+${byesOnNb}B` : 'Nb';

    const delivery: BallDeliveryEvent = {
      id: newBallId(),
      inningsNumber: match.currentInningsNumber,
      overIndex: Math.floor(currentInnings.legalBalls / 6),
      ballInOver: currentInnings.currentOverLegalBalls,
      legalBallCounted: false,
      strikerId: currentInnings.strikerId,
      nonStrikerId: currentInnings.nonStrikerId,
      bowlerId: currentInnings.currentBowlerId,
      runsBat: runsOffBat,
      runsExtras: 1 + byesOnNb, // 1 for NB + any byes
      extraType: 'noball',
      physicalRunsRan,
      isBoundary,
      isFour: runsOffBat === 4,
      isSix: runsOffBat === 6,
      isFreeHitDelivery: currentInnings.isFreeHitActive,
      causesFreeHit: true, // No-ball causes next ball to be free hit!
      displayBadge: badge,
      timestamp: Date.now(),
    };

    onDeliverBall(delivery, 'noball');
  };

  // 4. Byes and Leg-Byes
  const handleByes = (runs: number, isLegBye: boolean = false) => {
    setShowByesSubmenu(false);
    setShowLegByesSubmenu(false);
    const isBoundary = runs === 4;
    const physicalRunsRan = isBoundary ? 0 : runs;
    const badge = isLegBye ? `${runs}Lb` : `${runs}B`;

    const delivery: BallDeliveryEvent = {
      id: newBallId(),
      inningsNumber: match.currentInningsNumber,
      overIndex: Math.floor(currentInnings.legalBalls / 6),
      ballInOver: (currentInnings.currentOverLegalBalls % 6) + 1,
      legalBallCounted: true,
      strikerId: currentInnings.strikerId,
      nonStrikerId: currentInnings.nonStrikerId,
      bowlerId: currentInnings.currentBowlerId,
      runsBat: 0,
      runsExtras: runs,
      extraType: isLegBye ? 'leg_bye' : 'bye',
      physicalRunsRan,
      isBoundary,
      isFour: isBoundary,
      isSix: false,
      isFreeHitDelivery: currentInnings.isFreeHitActive,
      causesFreeHit: false,
      displayBadge: badge,
      timestamp: Date.now(),
    };

    onDeliverBall(delivery, isLegBye ? 'leg_bye' : 'bye');
  };

  // 5. Standard Wickets
  const handleWicket = (type: DismissalType, newBatterId?: string) => {
    setShowWicketDropdown(false);

    // Free hit dismissal check: Only run_out, obstructing_field, hit_ball_twice are out on Free Hit
    if (
      currentInnings.isFreeHitActive &&
      type !== 'run_out' &&
      type !== 'obstructing_field' &&
      type !== 'hit_ball_twice'
    ) {
      alert("NOT OUT! Batter cannot be dismissed on a Free Hit via Bowled, Caught, LBW, or Stumped (ICC Law 21.19).");
      return;
    }

    const nextBatter = newBatterId || availableBatters[0]?.id;
    const isGoldenDuck = striker?.ballsFaced === 0 && (type === 'bowled' || type === 'lbw');
    const isDuck = striker?.runs === 0 && !isGoldenDuck;

    const creditBowler = [
      'bowled',
      'caught',
      'caught_behind',
      'caught_and_bowled',
      'lbw',
      'stumped',
      'hit_wicket',
    ].includes(type);

    const delivery: BallDeliveryEvent = {
      id: newBallId(),
      inningsNumber: match.currentInningsNumber,
      overIndex: Math.floor(currentInnings.legalBalls / 6),
      ballInOver: (currentInnings.currentOverLegalBalls % 6) + 1,
      legalBallCounted: true,
      strikerId: currentInnings.strikerId,
      nonStrikerId: currentInnings.nonStrikerId,
      bowlerId: currentInnings.currentBowlerId,
      runsBat: 0,
      runsExtras: 0,
      extraType: 'none',
      physicalRunsRan: 0,
      isBoundary: false,
      isFour: false,
      isSix: false,
      isFreeHitDelivery: currentInnings.isFreeHitActive,
      causesFreeHit: false,
      wicket: {
        type,
        playerOutId: currentInnings.strikerId,
        runsCompletedBeforeOut: 0,
        creditBowler,
        newBatterId: nextBatter,
      },
      displayBadge: 'W',
      timestamp: Date.now(),
    };

    let animKey: MediaEventKey = type as MediaEventKey;
    if (isGoldenDuck) animKey = 'golden_duck';
    else if (isDuck) animKey = 'duck_out';

    onDeliverBall(delivery, animKey);
  };

  // 6. Run Out from modal
  const handleConfirmRunOut = (params: {
    playerOutId: string;
    runsCompleted: number;
    fielderName?: string;
    newBatterId: string;
  }) => {
    setShowRunOutModal(false);

    const delivery: BallDeliveryEvent = {
      id: newBallId(),
      inningsNumber: match.currentInningsNumber,
      overIndex: Math.floor(currentInnings.legalBalls / 6),
      ballInOver: (currentInnings.currentOverLegalBalls % 6) + 1,
      legalBallCounted: true,
      strikerId: currentInnings.strikerId,
      nonStrikerId: currentInnings.nonStrikerId,
      bowlerId: currentInnings.currentBowlerId,
      runsBat: params.runsCompleted,
      runsExtras: 0,
      extraType: 'none',
      physicalRunsRan: params.runsCompleted,
      isBoundary: false,
      isFour: false,
      isSix: false,
      isFreeHitDelivery: currentInnings.isFreeHitActive,
      causesFreeHit: false,
      wicket: {
        type: 'run_out',
        playerOutId: params.playerOutId,
        assistedById: params.fielderName,
        runsCompletedBeforeOut: params.runsCompleted,
        creditBowler: false,
        newBatterId: params.newBatterId,
      },
      displayBadge: params.runsCompleted > 0 ? `W+${params.runsCompleted}` : 'W',
      timestamp: Date.now(),
    };

    onDeliverBall(delivery, 'run_out');
  };

  // 7. Penalty runs from modal
  const handleAwardPenalty = (benefitedTeam: 'batting' | 'fielding', reason: string) => {
    setShowPenaltyModal(false);

    const delivery = createPenaltyEvent({
      inningsNumber: match.currentInningsNumber,
      overIndex: Math.floor(currentInnings.legalBalls / 6),
      ballInOver: currentInnings.currentOverLegalBalls,
      strikerId: currentInnings.strikerId,
      nonStrikerId: currentInnings.nonStrikerId,
      bowlerId: currentInnings.currentBowlerId,
      teamBenefited: benefitedTeam,
      reason,
      runs: 5,
    });

    onDeliverBall(delivery, 'penalty_5');
  };

  // Bind keyboard hotkeys
  useCricketHotkeys({
    onScoreRuns: handleScoreRuns,
    onWicket: () => setShowWicketDropdown(true),
    onWide: () => handleWide(0),
    onNoBall: () => handleNoBall(0, 0),
    onBye: () => handleByes(1, false),
    onLegBye: () => handleByes(1, true),
    onPenalty: () => setShowPenaltyModal(true),
    onUndo,
    onRedo,
    onSwapStrike: onSwapStrikeManual,
    disabled: showRunOutModal || showPenaltyModal || showInterruptionModal || showMediaModal || showScorecardModal,
  });

  return (
    <div className="w-full bg-slate-900 border-b-2 border-slate-700 text-white select-none shadow-xl">
      
      {/* TOP STATUS BAR & OPERATOR ACTIONS */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-slate-950 border-b border-slate-800 text-xs">
        <div className="flex items-center space-x-3">
          <span className="font-extrabold text-yellow-400 font-['Teko'] text-lg tracking-wider">
            GUFFBOX COCKPIT
          </span>
          <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
            Innings {match.currentInningsNumber} • {battingTeam.shortName} vs {bowlingTeam.shortName}
          </span>
          {currentInnings.isFreeHitActive && (
            <span className="bg-red-600 text-white font-bold px-2 py-0.5 rounded animate-pulse">
              ⚡ FREE HIT ACTIVE
            </span>
          )}
        </div>

        {/* Global Controls */}
        <div className="flex items-center space-x-2">
          {/* Strike Swap */}
          <button
            onClick={onSwapStrikeManual}
            title="Swap Strike (Hot key: S)"
            className="bg-slate-800 hover:bg-slate-700 text-yellow-300 font-bold px-3 py-1 rounded-lg border border-slate-700 flex items-center gap-1 transition"
          >
            <span>⇄ Strike [S]</span>
          </button>

          {/* Bowler Selector */}
          <div className="flex items-center space-x-1">
            <span className="text-slate-400 font-semibold">Bowler:</span>
            <select
              value={currentInnings.currentBowlerId}
              onChange={(e) => onChangeBowler(e.target.value)}
              className="bg-slate-800 text-yellow-300 font-bold px-2 py-1 rounded-lg border border-slate-700 focus:outline-none"
            >
              {availableBowlers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({currentInnings.bowlerStats[b.id]?.oversFormatted || '0.0'})
                </option>
              ))}
            </select>
          </div>

          {/* Undo / Redo */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo Last Ball (Ctrl+Z)"
            className={`font-bold px-3 py-1 rounded-lg border transition ${
              canUndo
                ? 'bg-amber-600/80 hover:bg-amber-600 text-white border-amber-500'
                : 'bg-slate-800 text-slate-500 border-slate-800 cursor-not-allowed'
            }`}
          >
            ↶ Undo
          </button>

          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo Undone Ball (Ctrl+Y)"
            className={`font-bold px-3 py-1 rounded-lg border transition ${
              canRedo
                ? 'bg-blue-600/80 hover:bg-blue-600 text-white border-blue-500'
                : 'bg-slate-800 text-slate-500 border-slate-800 cursor-not-allowed'
            }`}
          >
            ↷ Redo
          </button>

          {/* Next Innings */}
          {!isSecondInnings && (
            <button
              onClick={onStartSecondInnings}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-3 py-1 rounded-lg shadow transition"
            >
              Start 2nd Innings ➔
            </button>
          )}

          {/* Modals Triggers */}
          <button
            onClick={() => setShowInterruptionModal(true)}
            className="bg-slate-800 hover:bg-slate-700 text-blue-300 font-bold px-2.5 py-1 rounded-lg border border-slate-700"
          >
            🌧️ Rain/DLS
          </button>

          <button
            onClick={() => setShowMediaModal(true)}
            className="bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold px-2.5 py-1 rounded-lg border border-slate-700"
          >
            🎬 Media Stings
          </button>

          <button
            onClick={() => setShowScorecardModal(true)}
            className="bg-slate-800 hover:bg-slate-700 text-yellow-300 font-bold px-2.5 py-1 rounded-lg border border-slate-700"
          >
            📊 Scorecard
          </button>
        </div>
      </div>

      {/* MAIN COCKPIT BUTTONS BAR */}
      <div className="p-3 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        
        {/* Runs Pads (0, 1, 2, 3, 4, 6) */}
        <div className="md:col-span-5 flex items-center space-x-2">
          <button
            onClick={() => handleScoreRuns(0)}
            className="flex-1 h-12 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl font-black text-xl text-slate-200 transition shadow"
            title="Dot Ball [Key: 0]"
          >
            0
          </button>
          <button
            onClick={() => handleScoreRuns(1)}
            className="flex-1 h-12 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl font-black text-xl text-white transition shadow"
            title="Single 1 Run [Key: 1]"
          >
            1
          </button>
          <button
            onClick={() => handleScoreRuns(2)}
            className="flex-1 h-12 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl font-black text-xl text-white transition shadow"
            title="2 Runs [Key: 2]"
          >
            2
          </button>
          <button
            onClick={() => handleScoreRuns(3)}
            className="flex-1 h-12 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl font-black text-xl text-white transition shadow"
            title="3 Runs [Key: 3]"
          >
            3
          </button>
          <button
            onClick={() => handleScoreRuns(4)}
            className="flex-1 h-12 bg-blue-600 hover:bg-blue-500 border-2 border-blue-400 rounded-xl font-black text-2xl text-white transition shadow-lg ring-1 ring-blue-300"
            title="Four Boundary [Key: 4]"
          >
            4
          </button>
          <button
            onClick={() => handleScoreRuns(6)}
            className="flex-1 h-12 bg-purple-600 hover:bg-purple-500 border-2 border-purple-400 rounded-xl font-black text-2xl text-yellow-300 transition shadow-lg ring-1 ring-purple-300"
            title="Six Maximum [Key: 6]"
          >
            6
          </button>
        </div>

        {/* Extras Strip (Wide, NoBall, Byes, LegByes, Penalty) */}
        <div className="md:col-span-4 flex items-center space-x-2 relative">
          
          {/* Wide Dropdown Button */}
          <div className="flex-1 relative">
            <button
              onClick={() => setShowWideSubmenu(!showWideSubmenu)}
              className="w-full h-12 bg-amber-600 hover:bg-amber-500 border border-amber-400 rounded-xl font-bold text-sm text-white transition shadow"
              title="Wide Ball [Key: D]"
            >
              Wide ▾
            </button>
            {showWideSubmenu && (
              <div className="absolute top-14 left-0 w-36 bg-slate-900 border border-amber-500 rounded-xl shadow-2xl py-1 z-30">
                <button onClick={() => handleWide(0)} className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-amber-600 text-white">
                  Wide Only (+1)
                </button>
                <button onClick={() => handleWide(1)} className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-amber-600 text-white">
                  Wide + 1 Bye (+2)
                </button>
                <button onClick={() => handleWide(2)} className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-amber-600 text-white">
                  Wide + 2 Byes (+3)
                </button>
                <button onClick={() => handleWide(3)} className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-amber-600 text-white">
                  Wide + 3 Byes (+4)
                </button>
                <button onClick={() => handleWide(4)} className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-amber-600 text-white">
                  Wide + 4 (Boundary)
                </button>
              </div>
            )}
          </div>

          {/* NoBall Dropdown Button */}
          <div className="flex-1 relative">
            <button
              onClick={() => setShowNoBallSubmenu(!showNoBallSubmenu)}
              className="w-full h-12 bg-orange-600 hover:bg-orange-500 border border-orange-400 rounded-xl font-bold text-sm text-white transition shadow"
              title="No Ball [Key: N]"
            >
              No-Ball ▾
            </button>
            {showNoBallSubmenu && (
              <div className="absolute top-14 left-0 w-40 bg-slate-900 border border-orange-500 rounded-xl shadow-2xl py-1 z-30">
                <button onClick={() => handleNoBall(0, 0)} className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-orange-600 text-white">
                  NB Only (+1)
                </button>
                <button onClick={() => handleNoBall(1, 0)} className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-orange-600 text-white">
                  NB + 1 Bat (+2)
                </button>
                <button onClick={() => handleNoBall(2, 0)} className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-orange-600 text-white">
                  NB + 2 Bat (+3)
                </button>
                <button onClick={() => handleNoBall(4, 0)} className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-orange-600 text-white">
                  NB + 4 Bat (+5)
                </button>
                <button onClick={() => handleNoBall(6, 0)} className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-orange-600 text-white">
                  NB + 6 Bat (+7)
                </button>
                <button onClick={() => handleNoBall(0, 1)} className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-orange-600 text-white">
                  NB + 1 Bye (+2)
                </button>
              </div>
            )}
          </div>

          {/* Byes */}
          <div className="flex-1 relative">
            <button
              onClick={() => setShowByesSubmenu(!showByesSubmenu)}
              className="w-full h-12 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl font-bold text-xs text-slate-200 transition"
              title="Byes [Key: B]"
            >
              Bye ▾
            </button>
            {showByesSubmenu && (
              <div className="absolute top-14 left-0 w-28 bg-slate-900 border border-slate-600 rounded-xl shadow-2xl py-1 z-30">
                {[1, 2, 3, 4].map((r) => (
                  <button
                    key={r}
                    onClick={() => handleByes(r, false)}
                    className="w-full text-left px-3 py-1 text-xs font-bold hover:bg-slate-800 text-white"
                  >
                    {r} Bye{r > 1 ? 's' : ''}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Leg-Byes */}
          <div className="flex-1 relative">
            <button
              onClick={() => setShowLegByesSubmenu(!showLegByesSubmenu)}
              className="w-full h-12 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl font-bold text-xs text-slate-200 transition"
              title="Leg-Byes [Key: L]"
            >
              Lb ▾
            </button>
            {showLegByesSubmenu && (
              <div className="absolute top-14 left-0 w-28 bg-slate-900 border border-slate-600 rounded-xl shadow-2xl py-1 z-30">
                {[1, 2, 3, 4].map((r) => (
                  <button
                    key={r}
                    onClick={() => handleByes(r, true)}
                    className="w-full text-left px-3 py-1 text-xs font-bold hover:bg-slate-800 text-white"
                  >
                    {r} Leg-Bye{r > 1 ? 's' : ''}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Penalty */}
          <button
            onClick={() => setShowPenaltyModal(true)}
            className="flex-1 h-12 bg-emerald-700 hover:bg-emerald-600 border border-emerald-500 rounded-xl font-bold text-xs text-white transition shadow"
            title="+5 Penalty Runs [Key: P]"
          >
            +5 Pen
          </button>
        </div>

        {/* Wickets & Compound Events */}
        <div className="md:col-span-3 flex items-center space-x-2 relative">
          
          {/* Main Wicket Dropdown Button */}
          <div className="flex-1 relative">
            <button
              onClick={() => setShowWicketDropdown(!showWicketDropdown)}
              className="w-full h-12 bg-red-600 hover:bg-red-500 border-2 border-red-400 rounded-xl font-black text-sm text-white transition shadow-lg ring-1 ring-red-400"
              title="Wicket Dismissals [Key: W]"
            >
              WICKET ▾
            </button>

            {showWicketDropdown && (
              <div className="absolute top-14 right-0 w-52 bg-slate-900 border-2 border-red-500 rounded-2xl shadow-2xl py-2 z-40 max-h-72 overflow-y-auto">
                <span className="px-3 text-[10px] uppercase font-bold text-slate-400 block pb-1 border-b border-slate-800">
                  Select Dismissal:
                </span>
                <button onClick={() => handleWicket('bowled')} className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-red-600 text-white">
                  Clean Bowled
                </button>
                <button onClick={() => handleWicket('caught')} className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-red-600 text-white">
                  Caught Out
                </button>
                <button onClick={() => handleWicket('caught_behind')} className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-red-600 text-white">
                  Caught Behind (WK)
                </button>
                <button onClick={() => handleWicket('caught_and_bowled')} className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-red-600 text-white">
                  Caught & Bowled
                </button>
                <button onClick={() => handleWicket('lbw')} className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-red-600 text-white">
                  LBW
                </button>
                <button onClick={() => handleWicket('stumped')} className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-red-600 text-white">
                  Stumped (WK)
                </button>
                <button onClick={() => handleWicket('hit_wicket')} className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-red-600 text-white">
                  Hit Wicket
                </button>
                <button onClick={() => handleWicket('mankad')} className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-red-600 text-white">
                  Mankad (Non-Striker)
                </button>
                <button onClick={() => handleWicket('obstructing_field')} className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-red-600 text-white">
                  Obstructing Field
                </button>
                <button onClick={() => handleWicket('retired_out')} className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-red-600 text-white">
                  Retired Out
                </button>
                <button onClick={() => handleWicket('retired_hurt')} className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-red-600 text-white">
                  Retired Hurt
                </button>
              </div>
            )}
          </div>

          {/* Quick Run-out 1-Click Modal Trigger */}
          <button
            onClick={() => setShowRunOutModal(true)}
            className="flex-1 h-12 bg-red-700 hover:bg-red-600 border border-red-500 rounded-xl font-black text-xs text-yellow-300 transition shadow"
            title="Compound Run Out Selector"
          >
            RUN OUT ⚡
          </button>
        </div>

      </div>

      {/* POPUP MODALS */}
      {showRunOutModal && (
        <RunOutModal
          isOpen={showRunOutModal}
          striker={striker ? { id: striker.playerId, name: striker.name, role: 'batsman' } : { id: 's', name: 'Striker', role: 'batsman' }}
          nonStriker={nonStriker ? { id: nonStriker.playerId, name: nonStriker.name, role: 'batsman' } : { id: 'ns', name: 'Non-Striker', role: 'batsman' }}
          availableBatters={availableBatters}
          onConfirm={handleConfirmRunOut}
          onClose={() => setShowRunOutModal(false)}
        />
      )}

      {showPenaltyModal && (
        <PenaltyModal
          isOpen={showPenaltyModal}
          inningsNumber={match.currentInningsNumber}
          battingTeamName={battingTeam.name}
          fieldingTeamName={bowlingTeam.name}
          onAwardPenalty={handleAwardPenalty}
          onClose={() => setShowPenaltyModal(false)}
        />
      )}

      {showInterruptionModal && (
        <InterruptionModal
          isOpen={showInterruptionModal}
          scheduledOvers={match.metadata.scheduledOvers}
          currentCurtailedOvers={match.metadata.curtailedOvers}
          currentTarget={match.metadata.targetRuns}
          onApply={(curtailedOvers, revisedTarget) => {
            setShowInterruptionModal(false);
            onUpdateMetadata(curtailedOvers, revisedTarget);
          }}
          onClose={() => setShowInterruptionModal(false)}
        />
      )}

      {showMediaModal && (
        <MediaManagerModal
          isOpen={showMediaModal}
          onClose={() => setShowMediaModal(false)}
          onPreviewEvent={onTriggerAnimation}
        />
      )}

      {showScorecardModal && (
        <FullScorecard
          battingTeam={battingTeam}
          bowlingTeam={bowlingTeam}
          innings={currentInnings}
          metadata={match.metadata}
          onClose={() => setShowScorecardModal(false)}
        />
      )}
    </div>
  );
};
