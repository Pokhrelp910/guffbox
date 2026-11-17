// GuffBox Cricket Studio — Single-Monitor Scorer HUD Cockpit

import React, { useState } from 'react';
import {
  MatchState,
  BallDeliveryEvent,
  DismissalType,
  ExtraType,
  MediaEventKey,
  Player,
} from '../core/types';
import { useCricketHotkeys } from './HotkeyListener';
import { createPenaltyEvent } from '../core/penalty-rules';
import { calculateCurtailedOversQuota } from '../core/target-calculator';
import { RunOutModal } from './RunOutModal';
import { WicketModal } from './WicketModal';
import { AdvancedExtrasModal, AdvancedExtraSubmitParams } from './AdvancedExtrasModal';
import { PenaltyModal } from './PenaltyModal';
import { InterruptionModal } from './InterruptionModal';
import { MediaManagerModal } from './MediaManagerModal';
import { HotkeyModal } from './HotkeyModal';
import { FullScorecard } from '../overlays/FullScorecard';
import { LivePlayerPickerModal } from './LivePlayerPickerModal';
import { stadiumAudio } from '../utils/soundEffects';
import { broadcastSync } from '../utils/broadcastSync';

interface ScorerHUDProps {
  match: MatchState;
  onDeliverBall: (event: BallDeliveryEvent, animationKey?: MediaEventKey) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onSwapStrikeManual: () => void;
  onChangeStriker?: (newStrikerId: string) => void;
  onChangeNonStriker?: (newNonStrikerId: string) => void;
  onChangeBowler: (newBowlerId: string) => void;
  onAddPlayerToTeam?: (
    teamId: string,
    player: Player,
    selectAs?: 'striker' | 'nonStriker' | 'bowler' | 'nextBatter'
  ) => void;
  onStartSecondInnings: () => void;
  onUpdateMetadata: (curtailedOvers: number, revisedTarget?: number) => void;
  onTriggerAnimation: (key: MediaEventKey) => void;
  onOpenPreMatch?: () => void;
  onResetMatch?: () => void;
}

export const ScorerHUD: React.FC<ScorerHUDProps> = ({
  match,
  onDeliverBall,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onSwapStrikeManual,
  onChangeStriker,
  onChangeNonStriker,
  onChangeBowler,
  onAddPlayerToTeam,
  onStartSecondInnings,
  onUpdateMetadata,
  onTriggerAnimation,
  onOpenPreMatch,
  onResetMatch,
}) => {
  const [playerPickerConfig, setPlayerPickerConfig] = useState<{
    isOpen: boolean;
    mode: 'bowler' | 'striker' | 'nonStriker';
  } | null>(null);
  const isSecondInnings = match.currentInningsNumber === 2;
  const currentInnings = isSecondInnings && match.innings2 ? match.innings2 : match.innings1;
  const battingTeam = currentInnings.battingTeamId === match.teamA.id ? match.teamA : match.teamB;
  const bowlingTeam = currentInnings.bowlingTeamId === match.teamA.id ? match.teamA : match.teamB;

  const striker = currentInnings.batterStats[currentInnings.strikerId];
  const nonStriker = currentInnings.batterStats[currentInnings.nonStrikerId];

  // Bowler quota calculation based on curtailed or scheduled overs
  const maxOversLimit = match.metadata.curtailedOvers || match.metadata.scheduledOvers;
  const bowlerQuota = calculateCurtailedOversQuota(match.metadata.scheduledOvers, maxOversLimit);

  // Modals state
  const [showRunOutModal, setShowRunOutModal] = useState(false);
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [showInterruptionModal, setShowInterruptionModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showScorecardModal, setShowScorecardModal] = useState(false);
  const [showHotkeyModal, setShowHotkeyModal] = useState(false);
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [pendingDismissalType, setPendingDismissalType] = useState<DismissalType>('bowled');
  const [showWicketDropdown, setShowWicketDropdown] = useState(false);
  const [showWideSubmenu, setShowWideSubmenu] = useState(false);
  const [showNoBallSubmenu, setShowNoBallSubmenu] = useState(false);
  const [showByesSubmenu, setShowByesSubmenu] = useState(false);
  const [showLegByesSubmenu, setShowLegByesSubmenu] = useState(false);
  const [showAdvancedExtrasModal, setShowAdvancedExtrasModal] = useState(false);
  const [advancedExtraInitialType, setAdvancedExtraInitialType] = useState<'wide' | 'noball' | 'bye' | 'leg_bye'>('wide');

  const openAdvancedExtras = (type: 'wide' | 'noball' | 'bye' | 'leg_bye' = 'wide') => {
    setShowWideSubmenu(false);
    setShowNoBallSubmenu(false);
    setShowByesSubmenu(false);
    setShowLegByesSubmenu(false);
    setAdvancedExtraInitialType(type);
    setShowAdvancedExtrasModal(true);
  };

  // Available batters who haven't batted yet (filtered by Playing XI)
  const playing11Batters: Player[] = battingTeam.playing11 && battingTeam.playing11.length > 0
    ? battingTeam.squad.filter((p) => battingTeam.playing11.includes(p.id))
    : battingTeam.squad;

  const availableBatters: Player[] = playing11Batters.filter(
    (p) => !currentInnings.batterStats[p.id]?.isOut && p.id !== currentInnings.strikerId && p.id !== currentInnings.nonStrikerId
  );

  // Available bowlers in bowling squad (filtered by Playing XI)
  const playing11Bowlers: Player[] = bowlingTeam.playing11 && bowlingTeam.playing11.length > 0
    ? bowlingTeam.squad.filter((p) => bowlingTeam.playing11.includes(p.id))
    : bowlingTeam.squad;

  const availableBowlers: Player[] = playing11Bowlers.length > 0 ? playing11Bowlers : bowlingTeam.squad;

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
      ballInOver: (currentInnings.currentOverLegalBalls % 6) + 1,
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
      ballInOver: (currentInnings.currentOverLegalBalls % 6) + 1,
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

  // 4b. Wide + Stumped (compound delivery)
  const handleWideStumped = (newBatterId?: string) => {
    setShowWideSubmenu(false);
    const nextBatter = newBatterId || availableBatters[0]?.id;

    const delivery: BallDeliveryEvent = {
      id: newBallId(),
      inningsNumber: match.currentInningsNumber,
      overIndex: Math.floor(currentInnings.legalBalls / 6),
      ballInOver: (currentInnings.currentOverLegalBalls % 6) + 1,
      legalBallCounted: false, // Wide does not count as legal ball
      strikerId: currentInnings.strikerId,
      nonStrikerId: currentInnings.nonStrikerId,
      bowlerId: currentInnings.currentBowlerId,
      runsBat: 0,
      runsExtras: 1, // 1 wide extra
      extraType: 'wide',
      physicalRunsRan: 0,
      isBoundary: false,
      isFour: false,
      isSix: false,
      isFreeHitDelivery: currentInnings.isFreeHitActive,
      causesFreeHit: false,
      wicket: {
        type: 'stumped',
        playerOutId: currentInnings.strikerId,
        assistedById: 'wk',
        runsCompletedBeforeOut: 0,
        creditBowler: true, // Stumped on wide credits bowler!
        newBatterId: nextBatter,
      },
      displayBadge: 'Wd+W',
      timestamp: Date.now(),
    };

    onDeliverBall(delivery, 'stumped');
  };

  // 5. Standard Wickets — opens WicketModal so commentator explicitly selects the incoming batter!
  const handleWicket = (type: DismissalType) => {
    setShowWicketDropdown(false);

    // Free hit dismissal check: Only run_out, obstructing_field, hit_ball_twice, handling_ball, timed_out are out on Free Hit (ICC Law 21.19)
    if (
      currentInnings.isFreeHitActive &&
      type !== 'run_out' &&
      type !== 'obstructing_field' &&
      type !== 'hit_ball_twice' &&
      type !== 'handling_ball' &&
      type !== 'timed_out'
    ) {
      alert("NOT OUT! Batter cannot be dismissed on a Free Hit via Bowled, Caught, LBW, or Stumped (ICC Law 21.19).");
      return;
    }

    setPendingDismissalType(type);
    setShowWicketModal(true);
  };

  const handleConfirmWicketModal = (params: {
    dismissalType: DismissalType;
    playerOutId: string;
    newBatterId: string;
    assistedByName?: string;
  }) => {
    setShowWicketModal(false);

    const dismissedBatter = currentInnings.batterStats[params.playerOutId];
    const isGoldenDuck = dismissedBatter?.ballsFaced === 0;
    const isDuck = dismissedBatter?.runs === 0 && !isGoldenDuck;

    const creditBowler = [
      'bowled',
      'caught',
      'caught_behind',
      'caught_and_bowled',
      'lbw',
      'stumped',
      'hit_wicket',
    ].includes(params.dismissalType);

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
        type: params.dismissalType,
        playerOutId: params.playerOutId,
        assistedById: params.assistedByName,
        runsCompletedBeforeOut: 0,
        creditBowler,
        newBatterId: params.newBatterId || undefined,
      },
      displayBadge: 'W',
      timestamp: Date.now(),
    };

    let animKey: MediaEventKey = params.dismissalType as MediaEventKey;
    if (isGoldenDuck) animKey = 'golden_duck';
    else if (isDuck) animKey = 'duck_out';

    onDeliverBall(delivery, animKey);
  };

  // 6. Run Out from modal (supports Legal, Wide, or No-ball)
  const handleConfirmRunOut = (params: {
    playerOutId: string;
    runsCompleted: number;
    fielderName?: string;
    newBatterId: string;
    deliveryType: 'legal' | 'wide' | 'noball' | 'bye' | 'leg_bye';
  }) => {
    setShowRunOutModal(false);

    const isWide = params.deliveryType === 'wide';
    const isNoBall = params.deliveryType === 'noball';
    const isBye = params.deliveryType === 'bye';
    const isLegBye = params.deliveryType === 'leg_bye';
    const legalBallCounted = !isWide && !isNoBall;

    let runsBat = 0;
    let runsExtras = 0;
    let extraType: ExtraType = 'none';
    let badge = 'W';

    if (isWide) {
      extraType = 'wide';
      runsExtras = 1 + params.runsCompleted; // 1 wide + completed runs as byes
      runsBat = 0;
      badge = params.runsCompleted > 0 ? `Wd+W(${params.runsCompleted})` : 'Wd+W';
    } else if (isNoBall) {
      extraType = 'noball';
      runsExtras = 1; // 1 noball penalty
      runsBat = params.runsCompleted;
      badge = params.runsCompleted > 0 ? `Nb+W(${params.runsCompleted})` : 'Nb+W';
    } else if (isBye) {
      extraType = 'bye';
      runsExtras = params.runsCompleted;
      runsBat = 0;
      badge = params.runsCompleted > 0 ? `${params.runsCompleted}B+W` : 'B+W';
    } else if (isLegBye) {
      extraType = 'leg_bye';
      runsExtras = params.runsCompleted;
      runsBat = 0;
      badge = params.runsCompleted > 0 ? `${params.runsCompleted}Lb+W` : 'Lb+W';
    } else {
      runsBat = params.runsCompleted;
      runsExtras = 0;
      extraType = 'none';
      badge = params.runsCompleted > 0 ? `W+${params.runsCompleted}` : 'W';
    }

    const delivery: BallDeliveryEvent = {
      id: newBallId(),
      inningsNumber: match.currentInningsNumber,
      overIndex: Math.floor(currentInnings.legalBalls / 6),
      ballInOver: (currentInnings.currentOverLegalBalls % 6) + 1,
      legalBallCounted,
      strikerId: currentInnings.strikerId,
      nonStrikerId: currentInnings.nonStrikerId,
      bowlerId: currentInnings.currentBowlerId,
      runsBat,
      runsExtras,
      extraType,
      physicalRunsRan: params.runsCompleted,
      isBoundary: false,
      isFour: false,
      isSix: false,
      isFreeHitDelivery: currentInnings.isFreeHitActive,
      causesFreeHit: isNoBall,
      wicket: {
        type: 'run_out',
        playerOutId: params.playerOutId,
        assistedById: params.fielderName,
        runsCompletedBeforeOut: params.runsCompleted,
        creditBowler: false,
        newBatterId: params.newBatterId,
      },
      displayBadge: badge,
      timestamp: Date.now(),
    };

    onDeliverBall(delivery, 'run_out');
  };

  // 6b. Advanced Extras & Compound Delivery Confirmation (MCC Laws 21, 22, 23 & 38)
  const handleConfirmAdvancedExtra = (params: AdvancedExtraSubmitParams) => {
    setShowAdvancedExtrasModal(false);

    const isWide = params.extraType === 'wide';
    const isNoBall = params.extraType === 'noball';
    const legalBallCounted = !isWide && !isNoBall;

    const delivery: BallDeliveryEvent = {
      id: newBallId(),
      inningsNumber: match.currentInningsNumber,
      overIndex: Math.floor(currentInnings.legalBalls / 6),
      ballInOver: (currentInnings.currentOverLegalBalls % 6) + 1,
      legalBallCounted,
      strikerId: currentInnings.strikerId,
      nonStrikerId: currentInnings.nonStrikerId,
      bowlerId: currentInnings.currentBowlerId,
      runsBat: params.runsBat,
      runsExtras: params.runsExtras,
      extraType: params.extraType,
      extraSubType: params.extraSubType,
      physicalRunsRan: params.physicalRunsRan,
      isBoundary: params.isBoundary,
      isFour: params.isFour,
      isSix: params.isSix,
      isFreeHitDelivery: currentInnings.isFreeHitActive,
      causesFreeHit: isNoBall,
      wicket: params.wicket,
      displayBadge: params.displayBadge,
      timestamp: Date.now(),
    };

    onDeliverBall(delivery, params.animKey);
  };

  // 7. Penalty runs from modal
  const handleAwardPenalty = (benefitedTeam: 'batting' | 'fielding', reason: string) => {
    setShowPenaltyModal(false);

    const delivery = createPenaltyEvent({
      inningsNumber: match.currentInningsNumber,
      overIndex: Math.floor(currentInnings.legalBalls / 6),
      ballInOver: (currentInnings.currentOverLegalBalls % 6) + 1,
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
    onToggleHelp: () => setShowHotkeyModal((prev) => !prev),
    onCustomExtra: () => openAdvancedExtras('wide'),
    onTriggerSound: (sound) => {
      if (sound === 'airhorn') stadiumAudio.playAirhorn();
      else if (sound === 'cheer') stadiumAudio.playCrowdCheer();
      else if (sound === 'appeal') stadiumAudio.playAppeal();
      else if (sound === 'clap') stadiumAudio.playClapping();
      else if (sound === 'whistle') stadiumAudio.playWhistle();
      else if (sound === 'fanfare') stadiumAudio.playFanfare();
      broadcastSync.publish({ type: 'TRIGGER_SOUND', sound });
    },
    disabled: showRunOutModal || showPenaltyModal || showInterruptionModal || showMediaModal || showScorecardModal || showHotkeyModal || showAdvancedExtrasModal,
  });

  return (
    <div
      className="w-full text-white select-none shadow-xl border-b-2"
      style={{
        background: 'linear-gradient(145deg, #070d1e 0%, #1c050a 100%)',
        borderColor: 'rgba(250,204,21,0.3)',
      }}
    >
      
      {/* TOP STATUS BAR & OPERATOR ACTIONS */}
      <div
        className="flex flex-wrap items-center justify-between px-4 py-2 text-xs border-b"
        style={{
          background: 'linear-gradient(90deg, rgba(8,16,38,0.98) 0%, rgba(32,5,11,0.98) 50%, rgba(8,16,38,0.98) 100%)',
          borderColor: 'rgba(250,204,21,0.2)',
        }}
      >
        <div className="flex items-center space-x-3">
          <span className="font-extrabold text-yellow-400 font-['Teko'] text-lg tracking-wider">
            GUFFBOX COCKPIT
          </span>
          <span className="bg-blue-950/90 text-white border border-yellow-500/30 px-2 py-0.5 rounded font-mono">
            Innings {match.currentInningsNumber} • <span className="text-yellow-400 font-bold">{battingTeam.shortName}</span> vs <span className="text-white">{bowlingTeam.shortName}</span>
          </span>
          {currentInnings.isFreeHitActive && (
            <span className="bg-red-600 text-yellow-300 font-bold px-2 py-0.5 rounded animate-pulse border border-yellow-400">
              ⚡ FREE HIT ACTIVE
            </span>
          )}
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Pre-Match Setup */}
          {onOpenPreMatch && (
            <button
              onClick={onOpenPreMatch}
              className="bg-slate-800 hover:bg-slate-700 text-yellow-300 font-bold px-2.5 py-1 rounded-lg border border-slate-700 flex items-center space-x-1"
              title="Open Pre-Match Setup & Teams"
            >
              <span>⚙️</span>
              <span>Pre-Match</span>
            </button>
          )}

          {/* Strike Swap */}
          <button
            onClick={onSwapStrikeManual}
            title="Swap Strike (Hot key: S)"
            className="bg-slate-800 hover:bg-slate-700 text-yellow-300 font-bold px-3 py-1 rounded-lg border border-slate-700 flex items-center gap-1 transition"
          >
            <span>⇄ Strike [S]</span>
          </button>

          {/* Bowler Selector */}
          <div className="flex items-center space-x-1.5">
            <span className="text-white/80 font-bold text-xs">Bowler:</span>
            <select
              value={currentInnings.currentBowlerId}
              onChange={(e) => {
                if (e.target.value === '__FIND_OR_ADD_BOWLER__') {
                  setPlayerPickerConfig({ isOpen: true, mode: 'bowler' });
                } else {
                  onChangeBowler(e.target.value);
                }
              }}
              className="bg-[#0a1226] text-yellow-300 font-bold px-2 py-1 rounded-lg border border-yellow-500/30 focus:outline-none text-xs cursor-pointer"
            >
              {availableBowlers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({currentInnings.bowlerStats[b.id]?.oversFormatted || '0.0'} / max {bowlerQuota.maxOversPerBowler} ov)
                </option>
              ))}
              <option value="__FIND_OR_ADD_BOWLER__">➕ Type & Find / Create Bowler...</option>
            </select>
            <button
              type="button"
              onClick={() => setPlayerPickerConfig({ isOpen: true, mode: 'bowler' })}
              className="bg-[#14224c] hover:bg-[#1f3575] text-yellow-300 font-bold px-2 py-1 rounded-lg border border-yellow-500/30 text-xs flex items-center space-x-1 cursor-pointer"
              title="Type & Find Bowler or Create New Bowler"
            >
              <span>🔍/+</span>
            </button>
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
              className="bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 text-yellow-300 font-black px-3 py-1 rounded-lg shadow border border-yellow-500/40 transition"
            >
              Start 2nd Innings ➔
            </button>
          )}

          {/* Modals Triggers */}
          <button
            onClick={() => setShowInterruptionModal(true)}
            className="bg-[#0a1226] hover:bg-[#121f42] text-white font-bold px-2.5 py-1 rounded-lg border border-yellow-500/30"
          >
            🌧️ Rain/DLS
          </button>

          <button
            onClick={() => setShowMediaModal(true)}
            className="bg-[#1c0810] hover:bg-[#2e0d1b] text-yellow-300 font-bold px-2.5 py-1 rounded-lg border border-yellow-500/30"
          >
            🎬 Media Stings
          </button>

          <button
            onClick={() => setShowScorecardModal(true)}
            className="bg-[#0a1226] hover:bg-[#121f42] text-yellow-300 font-bold px-2.5 py-1 rounded-lg border border-yellow-500/30"
          >
            📊 Scorecard
          </button>

          {/* Hotkey Cheatsheet */}
          <button
            onClick={() => setShowHotkeyModal(true)}
            className="bg-[#0a1226] hover:bg-[#121f42] text-yellow-300 font-bold px-2.5 py-1 rounded-lg border border-yellow-500/30 flex items-center space-x-1"
            title="Keyboard Shortcuts Cheatsheet (Press ? or H)"
          >
            <span>⌨️</span>
            <span>Hotkeys [?]</span>
          </button>

          {/* Reset Match */}
          {onResetMatch && (
            <button
              onClick={onResetMatch}
              className="bg-[#1c0810] hover:bg-red-950 text-white hover:text-yellow-300 font-bold px-2.5 py-1 rounded-lg border border-red-800 hover:border-yellow-500/50 transition"
              title="Reset live match"
            >
              🔄 Reset
            </button>
          )}
        </div>
      </div>

      {/* PROMINENT ACTIVE CREASE (BATTERS & BOWLER) SELECTOR STRIP */}
      <div
        className="px-3 sm:px-6 py-2 border-b flex flex-wrap items-center justify-between gap-2.5 text-xs"
        style={{
          background: 'rgba(5,9,20,0.96)',
          borderColor: 'rgba(250,204,21,0.2)',
        }}
      >
        
        {/* Striker Card & Select */}
        <div className="flex items-center space-x-2 bg-[#0a1228] border-2 border-yellow-400 rounded-2xl px-3 py-1.5 shadow-md">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-wider text-yellow-400 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span>🏏</span>
                <span>Striker (Facing)</span>
              </span>
              <button
                type="button"
                onClick={() => setPlayerPickerConfig({ isOpen: true, mode: 'striker' })}
                className="ml-2 text-[9px] bg-[#14224c] hover:bg-[#1f3575] text-yellow-300 px-1.5 py-0.2 rounded border border-yellow-500/30 font-bold"
                title="Type & Find Striker or Create New Batter"
              >
                🔍/+
              </button>
            </span>
            <div className="flex items-center space-x-2 mt-0.5">
              {onChangeStriker ? (
                <select
                  value={currentInnings.strikerId}
                  onChange={(e) => {
                    if (e.target.value === '__FIND_OR_ADD_STRIKER__') {
                      setPlayerPickerConfig({ isOpen: true, mode: 'striker' });
                    } else {
                      onChangeStriker(e.target.value);
                    }
                  }}
                  className="bg-[#050914] text-white font-black text-xs px-2.5 py-1 rounded-xl border border-yellow-500/40 focus:outline-none focus:border-yellow-400 cursor-pointer"
                  title="Choose or change current Striker"
                >
                  {playing11Batters.map((p) => {
                    const stats = currentInnings.batterStats[p.id];
                    const isOut = stats?.isOut;
                    return (
                      <option key={p.id} value={p.id} disabled={isOut}>
                        {p.name} {p.id === currentInnings.strikerId ? '*' : ''} ({stats?.runs || 0} off {stats?.ballsFaced || 0}){isOut ? ' [OUT]' : ''}
                      </option>
                    );
                  })}
                  <option value="__FIND_OR_ADD_STRIKER__">➕ Type & Find / Create Batter...</option>
                </select>
              ) : (
                <span className="font-extrabold text-white text-xs">{striker?.name || 'Striker'}*</span>
              )}
              <span className="text-yellow-300 font-mono font-bold text-xs">
                {striker?.runs || 0} <span className="text-[10px] text-white/70">({striker?.ballsFaced || 0})</span>
              </span>
            </div>
          </div>
        </div>

        {/* Swap Ends Button */}
        <button
          onClick={onSwapStrikeManual}
          title="Swap Strike (Key: S)"
          className="bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black px-3.5 py-2 rounded-2xl border border-yellow-400 flex items-center space-x-1 shadow-md hover:scale-105 transition cursor-pointer"
        >
          <span className="text-base font-black">⇄</span>
          <span className="text-xs font-black tracking-wider uppercase">Swap Strike</span>
        </button>

        {/* Non-Striker Card & Select */}
        <div className="flex items-center space-x-2 bg-[#070e22] border border-yellow-500/30 rounded-2xl px-3 py-1.5 shadow">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span>🏃</span>
                <span>Non-Striker (Runner)</span>
              </span>
              <button
                type="button"
                onClick={() => setPlayerPickerConfig({ isOpen: true, mode: 'nonStriker' })}
                className="ml-2 text-[9px] bg-[#14224c] hover:bg-[#1f3575] text-yellow-300 px-1.5 py-0.2 rounded border border-yellow-500/30 font-bold"
                title="Type & Find Non-Striker or Create New Batter"
              >
                🔍/+
              </button>
            </span>
            <div className="flex items-center space-x-2 mt-0.5">
              {onChangeNonStriker ? (
                <select
                  value={currentInnings.nonStrikerId}
                  onChange={(e) => {
                    if (e.target.value === '__FIND_OR_ADD_NON_STRIKER__') {
                      setPlayerPickerConfig({ isOpen: true, mode: 'nonStriker' });
                    } else {
                      onChangeNonStriker(e.target.value);
                    }
                  }}
                  className="bg-[#050914] text-white font-extrabold text-xs px-2.5 py-1 rounded-xl border border-yellow-500/30 focus:outline-none focus:border-yellow-400 cursor-pointer"
                  title="Choose or change current Non-Striker"
                >
                  {playing11Batters.map((p) => {
                    const stats = currentInnings.batterStats[p.id];
                    const isOut = stats?.isOut;
                    return (
                      <option key={p.id} value={p.id} disabled={isOut}>
                        {p.name} ({stats?.runs || 0} off {stats?.ballsFaced || 0}){isOut ? ' [OUT]' : ''}
                      </option>
                    );
                  })}
                  <option value="__FIND_OR_ADD_NON_STRIKER__">➕ Type & Find / Create Batter...</option>
                </select>
              ) : (
                <span className="font-extrabold text-white text-xs">{nonStriker?.name || 'Non-Striker'}</span>
              )}
              <span className="text-yellow-300 font-mono font-bold text-xs">
                {nonStriker?.runs || 0} <span className="text-[10px] text-white/70">({nonStriker?.ballsFaced || 0})</span>
              </span>
            </div>
          </div>
        </div>

        {/* Bowler Card & Select (Dark Red Velvet with Gold Accents) */}
        <div className="flex items-center space-x-2 bg-[#200408] border border-yellow-500/40 rounded-2xl px-3 py-1.5 shadow">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span>🎯</span>
                <span>Current Bowler</span>
              </span>
              <button
                type="button"
                onClick={() => setPlayerPickerConfig({ isOpen: true, mode: 'bowler' })}
                className="ml-2 text-[9px] bg-[#3b0b14] hover:bg-[#520f1c] text-yellow-300 px-1.5 py-0.2 rounded border border-yellow-500/40 font-bold"
                title="Type & Find Bowler or Create New Bowler"
              >
                🔍 Find / + New
              </button>
            </span>
            <div className="flex items-center space-x-2 mt-0.5">
              <select
                value={currentInnings.currentBowlerId}
                onChange={(e) => {
                  if (e.target.value === '__FIND_OR_ADD_BOWLER__') {
                    setPlayerPickerConfig({ isOpen: true, mode: 'bowler' });
                  } else {
                    onChangeBowler(e.target.value);
                  }
                }}
                className="bg-[#050914] text-yellow-300 font-extrabold text-xs px-2.5 py-1 rounded-xl border border-yellow-500/40 focus:outline-none focus:border-yellow-400 cursor-pointer"
              >
                {availableBowlers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({currentInnings.bowlerStats[b.id]?.oversFormatted || '0.0'} / max {bowlerQuota.maxOversPerBowler} ov)
                  </option>
                ))}
                <option value="__FIND_OR_ADD_BOWLER__">➕ Type & Find / Create Bowler...</option>
              </select>
            </div>
          </div>
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
              <div className="absolute top-14 left-0 w-44 bg-slate-900 border border-amber-500 rounded-xl shadow-2xl py-1 z-30">
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
                <button onClick={() => handleWideStumped()} className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-red-600 text-yellow-300 border-t border-slate-800">
                  ⚡ Wide + Stumped (WK)
                </button>
                <button
                  onClick={() => openAdvancedExtras('wide')}
                  className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-amber-600 text-yellow-300 border-t border-slate-800 flex items-center justify-between"
                >
                  <span>⚡ Custom / Wicket...</span>
                  <span className="text-[10px] bg-amber-500/30 px-1 rounded text-amber-200">Law 22</span>
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
                <button
                  onClick={() => openAdvancedExtras('noball')}
                  className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-orange-600 text-yellow-300 border-t border-slate-800 flex items-center justify-between"
                >
                  <span>⚡ Custom Bat/Byes/Wkt...</span>
                  <span className="text-[10px] bg-orange-500/30 px-1 rounded text-orange-200">Law 21</span>
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
              <div className="absolute top-14 left-0 w-36 bg-slate-900 border border-slate-600 rounded-xl shadow-2xl py-1 z-30">
                {[1, 2, 3, 4].map((r) => (
                  <button
                    key={r}
                    onClick={() => handleByes(r, false)}
                    className="w-full text-left px-3 py-1 text-xs font-bold hover:bg-slate-800 text-white"
                  >
                    {r} Bye{r > 1 ? 's' : ''}
                  </button>
                ))}
                <button
                  onClick={() => openAdvancedExtras('bye')}
                  className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-blue-600 text-yellow-300 border-t border-slate-800"
                >
                  ⚡ Custom / Wicket...
                </button>
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
              <div className="absolute top-14 left-0 w-36 bg-slate-900 border border-slate-600 rounded-xl shadow-2xl py-1 z-30">
                {[1, 2, 3, 4].map((r) => (
                  <button
                    key={r}
                    onClick={() => handleByes(r, true)}
                    className="w-full text-left px-3 py-1 text-xs font-bold hover:bg-slate-800 text-white"
                  >
                    {r} Leg-Bye{r > 1 ? 's' : ''}
                  </button>
                ))}
                <button
                  onClick={() => openAdvancedExtras('leg_bye')}
                  className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-indigo-600 text-yellow-300 border-t border-slate-800"
                >
                  ⚡ Custom / Wicket...
                </button>
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

          {/* Dedicated Custom Extra / Wicket Modal Trigger */}
          <button
            onClick={() => openAdvancedExtras('wide')}
            className="flex-1 h-12 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 border border-amber-400 rounded-xl font-black text-xs text-yellow-200 transition shadow flex items-center justify-center space-x-1"
            title="Open Advanced Extras & Compound Delivery Dialog (Wide, No-Ball, Byes, Compound Wickets)"
          >
            <span>⚡</span>
            <span>Extra+Wkt</span>
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
                <button onClick={() => handleWicket('hit_ball_twice')} className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-red-600 text-white">
                  Hit Ball Twice
                </button>
                <button onClick={() => handleWicket('handling_ball')} className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-red-600 text-white">
                  Handled The Ball
                </button>
                <button onClick={() => handleWicket('timed_out')} className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-red-600 text-white">
                  Timed Out
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
      {showWicketModal && pendingDismissalType && (
        <WicketModal
          isOpen={showWicketModal}
          dismissalType={pendingDismissalType}
          striker={striker ? { id: striker.playerId, name: striker.name, role: 'batsman' } : { id: 's', name: 'Striker', role: 'batsman' }}
          nonStriker={nonStriker ? { id: nonStriker.playerId, name: nonStriker.name, role: 'batsman' } : { id: 'ns', name: 'Non-Striker', role: 'batsman' }}
          availableBatters={availableBatters}
          bowlerName={currentInnings.bowlerStats[currentInnings.currentBowlerId]?.name || 'Bowler'}
          battingTeam={battingTeam}
          fieldingTeam={bowlingTeam}
          onAddNewBatter={(tId, p) => {
            if (onAddPlayerToTeam) {
              onAddPlayerToTeam(tId, p, 'nextBatter');
            }
          }}
          onConfirm={handleConfirmWicketModal}
          onClose={() => setShowWicketModal(false)}
        />
      )}

      {/* Live Match Player Picker (Type & Find + Create New) */}
      {playerPickerConfig?.isOpen && (
        <LivePlayerPickerModal
          isOpen={playerPickerConfig.isOpen}
          mode={playerPickerConfig.mode}
          team={playerPickerConfig.mode === 'bowler' ? bowlingTeam : battingTeam}
          currentSelectedId={
            playerPickerConfig.mode === 'bowler'
              ? currentInnings.currentBowlerId
              : playerPickerConfig.mode === 'striker'
              ? currentInnings.strikerId
              : currentInnings.nonStrikerId
          }
          onSelectPlayer={(id) => {
            if (playerPickerConfig.mode === 'bowler') {
              onChangeBowler(id);
            } else if (playerPickerConfig.mode === 'striker' && onChangeStriker) {
              onChangeStriker(id);
            } else if (playerPickerConfig.mode === 'nonStriker' && onChangeNonStriker) {
              onChangeNonStriker(id);
            }
          }}
          onAddNewPlayer={(tId, p, asMode) => {
            if (onAddPlayerToTeam) {
              onAddPlayerToTeam(tId, p, asMode);
            }
          }}
          onClose={() => setPlayerPickerConfig(null)}
          bowlerStats={currentInnings.bowlerStats}
          batterStats={currentInnings.batterStats}
          maxOversPerBowler={bowlerQuota.maxOversPerBowler}
          excludePlayerIds={
            playerPickerConfig.mode === 'striker'
              ? [currentInnings.nonStrikerId]
              : playerPickerConfig.mode === 'nonStriker'
              ? [currentInnings.strikerId]
              : []
          }
        />
      )}

      {showRunOutModal && (
        <RunOutModal
          isOpen={showRunOutModal}
          striker={striker ? { id: striker.playerId, name: striker.name, role: 'batsman' } : { id: 's', name: 'Striker', role: 'batsman' }}
          nonStriker={nonStriker ? { id: nonStriker.playerId, name: nonStriker.name, role: 'batsman' } : { id: 'ns', name: 'Non-Striker', role: 'batsman' }}
          availableBatters={availableBatters}
          fieldingTeam={bowlingTeam}
          onConfirm={handleConfirmRunOut}
          onClose={() => setShowRunOutModal(false)}
        />
      )}

      {showAdvancedExtrasModal && (
        <AdvancedExtrasModal
          isOpen={showAdvancedExtrasModal}
          initialExtraType={advancedExtraInitialType}
          striker={striker ? { id: striker.playerId, name: striker.name, role: 'batsman' } : { id: 's', name: 'Striker', role: 'batsman' }}
          nonStriker={nonStriker ? { id: nonStriker.playerId, name: nonStriker.name, role: 'batsman' } : { id: 'ns', name: 'Non-Striker', role: 'batsman' }}
          availableBatters={availableBatters}
          bowlerName={currentInnings.bowlerStats[currentInnings.currentBowlerId]?.name || 'Bowler'}
          isFreeHitActive={currentInnings.isFreeHitActive}
          onConfirm={handleConfirmAdvancedExtra}
          onClose={() => setShowAdvancedExtrasModal(false)}
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

      {showHotkeyModal && (
        <HotkeyModal
          isOpen={showHotkeyModal}
          onClose={() => setShowHotkeyModal(false)}
        />
      )}
    </div>
  );
};
