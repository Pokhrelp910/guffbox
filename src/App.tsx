// GuffBox Cricket Studio — Master Application & Broadcast Orchestrator

import React, { useState, useEffect, useRef } from 'react';
import {
  MatchState,
  BallDeliveryEvent,
  MediaEventKey,
  Team,
  MatchMetadata,
  TossInfo,
} from './core/types';
import { createInitialInningsState } from './core/state-machine';
import { InningsHistoryManager } from './core/history-manager';
import { calculatePenalties } from './core/penalty-rules';
import { syncMatchToSupabase } from './lib/supabase';
import { StarSportsTicker } from './overlays/StarSportsTicker';
import { HeaderStatsDrawer } from './overlays/HeaderStatsDrawer';
import { AnimationOverlay } from './overlays/AnimationOverlay';
import { ScorerHUD } from './components/ScorerHUD';
import { PreMatchModal } from './components/PreMatchModal';
import { Settings, Tv, ExternalLink } from 'lucide-react';

const DEFAULT_METADATA: MatchMetadata = {
  id: 'match_nep_ind_001',
  tournamentName: 'ICC T20 Cricket Championship',
  matchStage: 'Grand Final',
  venue: 'TU International Cricket Ground, Kirtipur',
  date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  scheduledOvers: 20,
};

const DEFAULT_TEAM_A: Team = {
  id: 'nep',
  name: 'Nepal',
  shortName: 'NEP',
  color: '#1e3a8a',
  playing11: ['nep_1', 'nep_2', 'nep_3', 'nep_4', 'nep_5', 'nep_6', 'nep_7', 'nep_8', 'nep_9', 'nep_10', 'nep_11'],
  squad: [
    { id: 'nep_1', name: 'Kushal Bhurtel', role: 'batsman' },
    { id: 'nep_2', name: 'Aasif Sheikh', role: 'wicket-keeper', isWicketKeeper: true },
    { id: 'nep_3', name: 'Rohit Paudel', role: 'batsman', isCaptain: true },
    { id: 'nep_4', name: 'Kushal Malla', role: 'all-rounder' },
    { id: 'nep_5', name: 'Dipendra Singh Airee', role: 'all-rounder' },
    { id: 'nep_6', name: 'Gulshan Jha', role: 'all-rounder' },
    { id: 'nep_7', name: 'Sompal Kami', role: 'bowler' },
    { id: 'nep_8', name: 'Karan KC', role: 'bowler' },
    { id: 'nep_9', name: 'Sandeep Lamichhane', role: 'bowler' },
    { id: 'nep_10', name: 'Lalit Rajbanshi', role: 'bowler' },
    { id: 'nep_11', name: 'Abinash Bohara', role: 'bowler' },
  ],
};

const DEFAULT_TEAM_B: Team = {
  id: 'ind',
  name: 'India',
  shortName: 'IND',
  color: '#0284c7',
  playing11: ['ind_1', 'ind_2', 'ind_3', 'ind_4', 'ind_5', 'ind_6', 'ind_7', 'ind_8', 'ind_9', 'ind_10', 'ind_11'],
  squad: [
    { id: 'ind_1', name: 'Rohit Sharma', role: 'batsman', isCaptain: true },
    { id: 'ind_2', name: 'Virat Kohli', role: 'batsman' },
    { id: 'ind_3', name: 'Rishabh Pant', role: 'wicket-keeper', isWicketKeeper: true },
    { id: 'ind_4', name: 'Suryakumar Yadav', role: 'batsman' },
    { id: 'ind_5', name: 'Hardik Pandya', role: 'all-rounder' },
    { id: 'ind_6', name: 'Ravindra Jadeja', role: 'all-rounder' },
    { id: 'ind_7', name: 'Axar Patel', role: 'all-rounder' },
    { id: 'ind_8', name: 'Kuldeep Yadav', role: 'bowler' },
    { id: 'ind_9', name: 'Jasprit Bumrah', role: 'bowler' },
    { id: 'ind_10', name: 'Arshdeep Singh', role: 'bowler' },
    { id: 'ind_11', name: 'Mohammed Siraj', role: 'bowler' },
  ],
};

export const App: React.FC = () => {
  // Check if current route is pure OBS overlay (e.g. /overlay or ?overlay=true)
  const isObsOverlayMode = window.location.pathname.includes('overlay') || window.location.search.includes('overlay=true');

  // Build player names dictionary for quick lookup
  const buildPlayerNamesMap = (teamA: Team, teamB: Team): Record<string, string> => {
    const map: Record<string, string> = {};
    teamA.squad.forEach((p) => { map[p.id] = p.name; });
    teamB.squad.forEach((p) => { map[p.id] = p.name; });
    return map;
  };

  // Initial match initialization helper
  const createInitialMatch = (
    metadata = DEFAULT_METADATA,
    teamA = DEFAULT_TEAM_A,
    teamB = DEFAULT_TEAM_B,
    toss: TossInfo = { winnerTeamId: 'nep', electedTo: 'bat' },
    striker = teamA.squad[0],
    nonStriker = teamA.squad[1],
    openingBowler = teamB.squad[8]
  ): MatchState => {
    const battingTeamIsA = (toss.winnerTeamId === teamA.id && toss.electedTo === 'bat') ||
      (toss.winnerTeamId === teamB.id && toss.electedTo === 'bowl');

    const battingTeam = battingTeamIsA ? teamA : teamB;
    const bowlingTeam = battingTeamIsA ? teamB : teamA;

    const innings1 = createInitialInningsState({
      inningsNumber: 1,
      battingTeamId: battingTeam.id,
      bowlingTeamId: bowlingTeam.id,
      striker,
      nonStriker,
      openingBowler,
      allBatters: battingTeam.squad,
    });

    return {
      metadata,
      teamA,
      teamB,
      toss,
      currentInningsNumber: 1,
      innings1,
      innings2: null,
    };
  };

  const [match, setMatch] = useState<MatchState>(() => createInitialMatch());
  const [showPreMatchModal, setShowPreMatchModal] = useState<boolean>(false);
  const [activeAnimation, setActiveAnimation] = useState<MediaEventKey | null>(null);
  const [highlightBallId, setHighlightBallId] = useState<string | undefined>();
  const [showPartnershipDrawer, setShowPartnershipDrawer] = useState<boolean>(false);
  const [milestoneAlert, setMilestoneAlert] = useState<string | null>(null);

  // History Manager ref
  const playerNames = buildPlayerNamesMap(match.teamA, match.teamB);
  const historyManagerRef = useRef<InningsHistoryManager>(
    new InningsHistoryManager(match.innings1, playerNames)
  );

  // Sync to Supabase in background
  useEffect(() => {
    syncMatchToSupabase(match);
  }, [match]);

  // Delivery delivery handler with choreographed reveal
  const handleDeliverBall = (event: BallDeliveryEvent, animationKey?: MediaEventKey) => {
    // 1. Play animation/video sting first
    if (animationKey) {
      setActiveAnimation(animationKey);
    }

    // 2. Push event into history manager
    const nextInnings = historyManagerRef.current.pushDelivery(event);

    // 3. Check for milestones (50, 100, 5w haul)
    const strikerStats = nextInnings.batterStats[event.strikerId];
    if (strikerStats) {
      if (strikerStats.runs >= 100 && strikerStats.runs - event.runsBat < 100) {
        setMilestoneAlert(`💯 Century! ${strikerStats.name} reaches 100!`);
      } else if (strikerStats.runs >= 50 && strikerStats.runs - event.runsBat < 50) {
        setMilestoneAlert(`🌟 Half-Century! ${strikerStats.name} reaches 50!`);
      }
    }

    // 4. Update match state
    setMatch((prev) => {
      if (prev.currentInningsNumber === 1) {
        return { ...prev, innings1: nextInnings };
      } else {
        return { ...prev, innings2: nextInnings };
      }
    });

    setHighlightBallId(event.id);
    setShowPartnershipDrawer(true);
  };

  // When animation finishes
  const handleAnimationComplete = () => {
    setActiveAnimation(null);
  };

  // Undo / Redo
  const handleUndo = () => {
    const restored = historyManagerRef.current.undo();
    if (restored) {
      setMatch((prev) => (prev.currentInningsNumber === 1 ? { ...prev, innings1: restored } : { ...prev, innings2: restored }));
    }
  };

  const handleRedo = () => {
    const restored = historyManagerRef.current.redo();
    if (restored) {
      setMatch((prev) => (prev.currentInningsNumber === 1 ? { ...prev, innings1: restored } : { ...prev, innings2: restored }));
    }
  };

  // Manual Strike Swap
  const handleSwapStrikeManual = () => {
    setMatch((prev) => {
      const cur = prev.currentInningsNumber === 1 ? prev.innings1 : prev.innings2;
      if (!cur) return prev;
      const updated = {
        ...cur,
        strikerId: cur.nonStrikerId,
        nonStrikerId: cur.strikerId,
      };
      return prev.currentInningsNumber === 1 ? { ...prev, innings1: updated } : { ...prev, innings2: updated };
    });
  };

  // Change Bowler
  const handleChangeBowler = (newBowlerId: string) => {
    setMatch((prev) => {
      const cur = prev.currentInningsNumber === 1 ? prev.innings1 : prev.innings2;
      if (!cur) return prev;
      const updated = { ...cur, currentBowlerId: newBowlerId };
      return prev.currentInningsNumber === 1 ? { ...prev, innings1: updated } : { ...prev, innings2: updated };
    });
  };

  // Rain / DLS Update
  const handleUpdateMetadata = (curtailedOvers: number, revisedTarget?: number) => {
    setMatch((prev) => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        curtailedOvers,
        dlsRevisedTarget: revisedTarget,
      },
    }));
  };

  // Start Second Innings
  const handleStartSecondInnings = () => {
    // Batting and bowling swap
    const battingTeamIsA = match.innings1.battingTeamId === match.teamB.id;
    const battingTeam = battingTeamIsA ? match.teamA : match.teamB;
    const bowlingTeam = battingTeamIsA ? match.teamB : match.teamA;

    // Calculate effective target taking into account any penalty runs
    const penalties = calculatePenalties(match);
    const targetRuns = penalties.effectiveTarget;

    const innings2 = createInitialInningsState({
      inningsNumber: 2,
      battingTeamId: battingTeam.id,
      bowlingTeamId: bowlingTeam.id,
      striker: battingTeam.squad[0],
      nonStriker: battingTeam.squad[1],
      openingBowler: bowlingTeam.squad[8] || bowlingTeam.squad[0],
      allBatters: battingTeam.squad,
    });

    const nextMatch: MatchState = {
      ...match,
      currentInningsNumber: 2,
      metadata: {
        ...match.metadata,
        targetRuns,
      },
      innings2,
    };

    historyManagerRef.current = new InningsHistoryManager(innings2, playerNames);
    setMatch(nextMatch);
    setActiveAnimation('innings_break');
  };

  // New Match Setup from PreMatchModal
  const handleStartMatch = (params: {
    metadata: MatchMetadata;
    teamA: Team;
    teamB: Team;
    toss: TossInfo;
    strikerId: string;
    nonStrikerId: string;
    openingBowlerId: string;
  }) => {
    const battingTeamIsA = (params.toss.winnerTeamId === params.teamA.id && params.toss.electedTo === 'bat') ||
      (params.toss.winnerTeamId === params.teamB.id && params.toss.electedTo === 'bowl');

    const battingTeam = battingTeamIsA ? params.teamA : params.teamB;
    const bowlingTeam = battingTeamIsA ? params.teamB : params.teamA;

    const striker = battingTeam.squad.find((p) => p.id === params.strikerId) || battingTeam.squad[0];
    const nonStriker = battingTeam.squad.find((p) => p.id === params.nonStrikerId) || battingTeam.squad[1];
    const openingBowler = bowlingTeam.squad.find((p) => p.id === params.openingBowlerId) || bowlingTeam.squad[8];

    const initialMatch = createInitialMatch(
      params.metadata,
      params.teamA,
      params.teamB,
      params.toss,
      striker,
      nonStriker,
      openingBowler
    );

    const names = buildPlayerNamesMap(params.teamA, params.teamB);
    historyManagerRef.current = new InningsHistoryManager(initialMatch.innings1, names);
    setMatch(initialMatch);
    setShowPreMatchModal(false);
    setActiveAnimation('toss');
  };

  const isSecondInnings = match.currentInningsNumber === 2;
  const currentInnings = isSecondInnings && match.innings2 ? match.innings2 : match.innings1;
  const battingTeam = currentInnings.battingTeamId === match.teamA.id ? match.teamA : match.teamB;
  const bowlingTeam = currentInnings.bowlingTeamId === match.teamA.id ? match.teamA : match.teamB;

  // PURE OBS OVERLAY ROUTE RENDER
  if (isObsOverlayMode) {
    return (
      <div className="w-screen h-screen bg-transparent overflow-hidden relative flex flex-col justify-between p-6">
        {/* Top Contextual Infographics */}
        <HeaderStatsDrawer
          partnership={currentInnings.currentPartnership}
          innings={currentInnings}
          battingTeam={battingTeam}
          isVisible={showPartnershipDrawer}
          milestoneMessage={milestoneAlert}
        />

        {/* Video / Graphic Animation Stings */}
        <AnimationOverlay
          eventKey={activeAnimation}
          onComplete={handleAnimationComplete}
        />

        {/* Bottom Ticker */}
        <div className="w-full">
          <StarSportsTicker
            battingTeam={battingTeam}
            bowlingTeam={bowlingTeam}
            innings={currentInnings}
            metadata={match.metadata}
            isSecondInnings={isSecondInnings}
            target={match.metadata.targetRuns}
            highlightNewBallId={highlightBallId}
          />
        </div>
      </div>
    );
  }

  // OPERATOR COCKPIT & LIVE MONITOR VIEW
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* APP NAVBAR */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-yellow-500 flex items-center justify-center font-black text-slate-950 font-['Teko'] text-2xl shadow-lg">
            GB
          </div>
          <div>
            <h1 className="text-lg font-black tracking-wider text-yellow-400 font-['Teko']">
              GUFFBOX CRICKET STUDIO
            </h1>
            <p className="text-[11px] text-slate-400 -mt-1 font-medium">
              Elite Broadcast Scoring Cockpit & OBS Stream Engine
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <a
            href="/?overlay=true"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 bg-blue-900/40 hover:bg-blue-800/60 border border-blue-500/40 text-blue-300 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow"
            title="Open pure transparent broadcast layer for OBS Studio Browser Source"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>OBS Overlay URL</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </a>

          <button
            onClick={() => setShowPreMatchModal(true)}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-700 transition"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Pre-Match Setup</span>
          </button>
        </div>
      </header>

      {/* OPERATOR SCORER HUD COCKPIT */}
      <ScorerHUD
        match={match}
        onDeliverBall={handleDeliverBall}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyManagerRef.current.canUndo()}
        canRedo={historyManagerRef.current.canRedo()}
        onSwapStrikeManual={handleSwapStrikeManual}
        onChangeBowler={handleChangeBowler}
        onStartSecondInnings={handleStartSecondInnings}
        onUpdateMetadata={handleUpdateMetadata}
        onTriggerAnimation={(key) => setActiveAnimation(key)}
      />

      {/* LIVE BROADCAST PREVIEW SECTION */}
      <main className="flex-1 p-6 flex flex-col justify-between relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
        
        {/* Stadium Grass Background Pattern Preview */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 50% 50%, #15803d 10%, transparent 80%)',
          }}
        />

        {/* Top Infographics Drawer */}
        <div className="w-full flex justify-center z-10">
          <HeaderStatsDrawer
            partnership={currentInnings.currentPartnership}
            innings={currentInnings}
            battingTeam={battingTeam}
            isVisible={showPartnershipDrawer}
            milestoneMessage={milestoneAlert}
          />
        </div>

        {/* Animation Overlays & Stings */}
        <AnimationOverlay
          eventKey={activeAnimation}
          onComplete={handleAnimationComplete}
        />

        {/* Broadcast Lower-Third Ticker */}
        <div className="w-full z-10 mt-auto">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center justify-between">
            <span>🔴 Live Broadcast Feed Preview (OBS 1080p Layer)</span>
            <span className="text-[11px] text-emerald-400 font-mono">Status: Stream Ready</span>
          </div>
          <StarSportsTicker
            battingTeam={battingTeam}
            bowlingTeam={bowlingTeam}
            innings={currentInnings}
            metadata={match.metadata}
            isSecondInnings={isSecondInnings}
            target={match.metadata.targetRuns}
            highlightNewBallId={highlightBallId}
          />
        </div>
      </main>

      {/* Pre-Match Setup Modal */}
      {showPreMatchModal && (
        <PreMatchModal
          isOpen={showPreMatchModal}
          onStartMatch={handleStartMatch}
          onClose={() => setShowPreMatchModal(false)}
        />
      )}

    </div>
  );
};
