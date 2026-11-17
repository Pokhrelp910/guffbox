// GuffBox Cricket Studio — Master Application & Broadcast Orchestrator

import React, { useState, useEffect, useRef } from 'react';
import {
  MatchState,
  BallDeliveryEvent,
  MediaEventKey,
  Team,
  MatchMetadata,
  TossInfo,
  InningsState,
  Player,
} from './core/types';
import { createInitialInningsState } from './core/state-machine';
import { InningsHistoryManager } from './core/history-manager';
import { calculatePenalties } from './core/penalty-rules';
import { syncMatchToSupabase } from './lib/supabase';
import { syncTeamsWithSupabase } from './lib/teamDatabase';
import { saveMatchState, loadSavedMatch, clearSavedMatch } from './utils/matchStorage';
import { StarSportsTicker } from './overlays/StarSportsTicker';
import { HeaderStatsDrawer } from './overlays/HeaderStatsDrawer';
import { AnimationOverlay } from './overlays/AnimationOverlay';
import { WatchalongStudio } from './overlays/WatchalongStudio';
import { FullScorecard } from './overlays/FullScorecard';
import { WagonWheelModal } from './overlays/WagonWheelModal';
import { BroadcastCards, PresentationCardType } from './overlays/BroadcastCards';
import { SocialScorecardCard } from './overlays/SocialScorecardCard';
import { AudiencePollWidget } from './overlays/AudiencePollWidget';
import { MovableCircularCam } from './components/MovableCircularCam';
import { ScorerHUD } from './components/ScorerHUD';
import { PreMatchModal } from './components/PreMatchModal';
import { AudioSoundboard } from './components/AudioSoundboard';
import { stadiumAudio } from './utils/soundEffects';
import { broadcastSync, BroadcastMessageType, StreamPollData } from './utils/broadcastSync';
import { Settings, Tv, ExternalLink, Radio } from 'lucide-react';

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

// Build player names dictionary for quick lookup
const buildPlayerNamesMap = (teamA: Team, teamB: Team): Record<string, string> => {
  const map: Record<string, string> = {};
  teamA.squad.forEach((p) => { map[p.id] = p.name; });
  teamB.squad.forEach((p) => { map[p.id] = p.name; });
  return map;
};

// Returns only the playing XI players of a team (or full squad if playing11 not configured)
const getPlayingSquad = (team: Team): Player[] => {
  if (team.playing11 && team.playing11.length > 0) {
    const active = team.squad.filter((p) => team.playing11.includes(p.id));
    if (active.length > 0) return active;
  }
  return team.squad;
};

// Initial match initialization helper
const createInitialMatch = (
  metadata = DEFAULT_METADATA,
  teamA = DEFAULT_TEAM_A,
  teamB = DEFAULT_TEAM_B,
  toss: TossInfo = { winnerTeamId: 'nep', electedTo: 'bat' },
  striker = teamA.squad[0],
  nonStriker = teamA.squad[1],
  openingBowler = teamB.squad[8] || teamB.squad[0]
): MatchState => {
  const battingTeamIsA = (toss.winnerTeamId === teamA.id && toss.electedTo === 'bat') ||
    (toss.winnerTeamId === teamB.id && toss.electedTo === 'bowl');

  const battingTeam = battingTeamIsA ? teamA : teamB;
  const bowlingTeam = battingTeamIsA ? teamB : teamA;
  const battingPlayingSquad = getPlayingSquad(battingTeam);

  const innings1 = createInitialInningsState({
    inningsNumber: 1,
    battingTeamId: battingTeam.id,
    bowlingTeamId: bowlingTeam.id,
    striker,
    nonStriker,
    openingBowler,
    allBatters: battingPlayingSquad,
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

export const App: React.FC = () => {
  // Check routes: OBS transparent overlay vs. YouTube Watchalong Studio mode
  const isObsOverlayMode = window.location.pathname.includes('overlay') || window.location.search.includes('overlay=true');
  const isWatchalongMode = window.location.pathname.includes('watchalong') || window.location.search.includes('mode=watchalong') || window.location.search.includes('scene=watchalong');

  // Load saved state from storage if available
  const savedInitialData = useRef(loadSavedMatch());

  const [match, setMatch] = useState<MatchState>(() => {
    if (savedInitialData.current) {
      return savedInitialData.current.match;
    }
    return createInitialMatch();
  });

  const [showPreMatchModal, setShowPreMatchModal] = useState<boolean>(false);
  const [activeAnimation, setActiveAnimation] = useState<MediaEventKey | null>(null);
  const [highlightBallId, setHighlightBallId] = useState<string | undefined>();
  const [showPartnershipDrawer, setShowPartnershipDrawer] = useState<boolean>(false);
  const [milestoneAlert, setMilestoneAlert] = useState<string | null>(null);
  const [showStreamScorecard, setShowStreamScorecard] = useState<boolean>(false);
  const [streamPresentationCard, setStreamPresentationCard] = useState<PresentationCardType>('none');
  const [showStreamWagonWheel, setShowStreamWagonWheel] = useState<boolean>(false);
  const [showSocialModal, setShowSocialModal] = useState<boolean>(false);
  const [showPollDirector, setShowPollDirector] = useState<boolean>(false);
  const [showCamWidget, setShowCamWidget] = useState<boolean>(true);
  const [streamPoll, setStreamPoll] = useState<StreamPollData>({
    isOpen: false,
    question: 'Will Nepal chase down the target today?',
    optionA: { label: 'Yes, Comfortable Win', votes: 142 },
    optionB: { label: 'No, Bowlers Defend', votes: 68 },
  });

  // Guarantee 100% background transparency for OBS Studio Browser Sources
  useEffect(() => {
    if (isObsOverlayMode) {
      document.documentElement.classList.add('overlay-mode');
      document.body.classList.add('overlay-mode');
      return () => {
        document.documentElement.classList.remove('overlay-mode');
        document.body.classList.remove('overlay-mode');
      };
    }
  }, [isObsOverlayMode]);

  // Subscribe to real-time broadcast commands (animations, scorecard popups, soundboard, presentation cards)
  useEffect(() => {
    const unsubscribe = broadcastSync.subscribe((msg: BroadcastMessageType) => {
      if (msg.type === 'TRIGGER_ANIMATION') {
        setActiveAnimation(msg.key);
      } else if (msg.type === 'CLEAR_ANIMATION') {
        setActiveAnimation(null);
      } else if (msg.type === 'TOGGLE_STREAM_SCORECARD') {
        setShowStreamScorecard(msg.show);
      } else if (msg.type === 'TOGGLE_STREAM_PARTNERSHIP') {
        setShowPartnershipDrawer(msg.show);
      } else if (msg.type === 'SET_STREAM_PRESENTATION_CARD') {
        if (msg.card === 'wagon_wheel') {
          setShowStreamWagonWheel(true);
          setStreamPresentationCard('none');
        } else {
          setShowStreamWagonWheel(false);
          setStreamPresentationCard(msg.card);
        }
      } else if (msg.type === 'TRIGGER_SOUND') {
        if (msg.sound === 'airhorn') stadiumAudio.playAirhorn();
        else if (msg.sound === 'cheer') stadiumAudio.playCrowdCheer();
        else if (msg.sound === 'appeal') stadiumAudio.playAppeal();
        else if (msg.sound === 'clap') stadiumAudio.playClapping();
        else if (msg.sound === 'whistle') stadiumAudio.playWhistle();
        else if (msg.sound === 'fanfare') stadiumAudio.playFanfare();
      } else if (msg.type === 'TOGGLE_AMBIENT_CROWD') {
        if (msg.active) stadiumAudio.startAmbientCrowd(msg.volume ?? 0.15);
        else stadiumAudio.stopAmbientCrowd();
      } else if (msg.type === 'UPDATE_STREAM_POLL') {
        setStreamPoll(msg.poll);
      }
    });
    return () => unsubscribe();
  }, []);

  // Initial baseline states for recalculations
  const initialInnings1Ref = useRef<InningsState>(
    savedInitialData.current?.initialInnings1 || match.innings1
  );
  const initialInnings2Ref = useRef<InningsState | null>(
    savedInitialData.current?.initialInnings2 || match.innings2
  );

  // History Manager ref
  const playerNames = buildPlayerNamesMap(match.teamA, match.teamB);
  const isSecondInnings = match.currentInningsNumber === 2;
  const activeInningsInitial = isSecondInnings && initialInnings2Ref.current
    ? initialInnings2Ref.current
    : initialInnings1Ref.current;
  const activeDeliveries = isSecondInnings && match.innings2
    ? match.innings2.deliveries
    : match.innings1.deliveries;

  const historyManagerRef = useRef<InningsHistoryManager>(
    new InningsHistoryManager(
      activeInningsInitial,
      playerNames,
      activeDeliveries,
      savedInitialData.current?.redoStack
    )
  );

  // Autosave match state and sync to Supabase whenever match updates
  useEffect(() => {
    saveMatchState({
      match,
      initialInnings1: initialInnings1Ref.current,
      initialInnings2: initialInnings2Ref.current,
      redoStack: historyManagerRef.current.getRedoStack(),
      savedAt: Date.now(),
    });
    syncMatchToSupabase(match);
  }, [match]);

  // Sync teams with Supabase cloud on initial mount
  useEffect(() => {
    syncTeamsWithSupabase().catch((err) => console.warn('Teams Supabase sync error:', err));
  }, []);

  // Real-time synchronization across browser tabs/windows (e.g. OBS Browser Source)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'guffbox_active_match_v2' && e.newValue) {
        try {
          const freshData = JSON.parse(e.newValue);
          if (freshData?.match) {
            setMatch(freshData.match);
            initialInnings1Ref.current = freshData.initialInnings1;
            initialInnings2Ref.current = freshData.initialInnings2;
          }
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Delivery handler with choreographed reveal & cross-tab sting broadcast
  const handleDeliverBall = (event: BallDeliveryEvent, animationKey?: MediaEventKey) => {
    // 1. Play animation/video sting and broadcast to all live streams
    if (animationKey) {
      setActiveAnimation(animationKey);
      broadcastSync.publish({ type: 'TRIGGER_ANIMATION', key: animationKey });
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
    broadcastSync.publish({ type: 'CLEAR_ANIMATION' });
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

  // Change Striker
  const handleChangeStriker = (newStrikerId: string) => {
    setMatch((prev) => {
      const cur = prev.currentInningsNumber === 1 ? prev.innings1 : prev.innings2;
      if (!cur || cur.strikerId === newStrikerId) return prev;

      let updatedNonStrikerId = cur.nonStrikerId;
      if (newStrikerId === cur.nonStrikerId) {
        updatedNonStrikerId = cur.strikerId; // swap if already non-striker
      }

      const updatedBatterStats = { ...cur.batterStats };
      if (!updatedBatterStats[newStrikerId]) {
        updatedBatterStats[newStrikerId] = {
          playerId: newStrikerId,
          name: playerNames[newStrikerId] || 'Striker',
          runs: 0,
          ballsFaced: 0,
          fours: 0,
          sixes: 0,
          strikeRate: 0,
          isOut: false,
        };
      }

      const updated = {
        ...cur,
        strikerId: newStrikerId,
        nonStrikerId: updatedNonStrikerId,
        batterStats: updatedBatterStats,
      };
      return prev.currentInningsNumber === 1 ? { ...prev, innings1: updated } : { ...prev, innings2: updated };
    });
  };

  // Change Non-Striker
  const handleChangeNonStriker = (newNonStrikerId: string) => {
    setMatch((prev) => {
      const cur = prev.currentInningsNumber === 1 ? prev.innings1 : prev.innings2;
      if (!cur || cur.nonStrikerId === newNonStrikerId) return prev;

      let updatedStrikerId = cur.strikerId;
      if (newNonStrikerId === cur.strikerId) {
        updatedStrikerId = cur.nonStrikerId; // swap if already striker
      }

      const updatedBatterStats = { ...cur.batterStats };
      if (!updatedBatterStats[newNonStrikerId]) {
        updatedBatterStats[newNonStrikerId] = {
          playerId: newNonStrikerId,
          name: playerNames[newNonStrikerId] || 'Non-Striker',
          runs: 0,
          ballsFaced: 0,
          fours: 0,
          sixes: 0,
          strikeRate: 0,
          isOut: false,
        };
      }

      const updated = {
        ...cur,
        strikerId: updatedStrikerId,
        nonStrikerId: newNonStrikerId,
        batterStats: updatedBatterStats,
      };
      return prev.currentInningsNumber === 1 ? { ...prev, innings1: updated } : { ...prev, innings2: updated };
    });
  };

  // Change Bowler
  const handleChangeBowler = (newBowlerId: string) => {
    setMatch((prev) => {
      const cur = prev.currentInningsNumber === 1 ? prev.innings1 : prev.innings2;
      if (!cur) return prev;

      const updatedBowlerStats = { ...cur.bowlerStats };
      if (!updatedBowlerStats[newBowlerId]) {
        updatedBowlerStats[newBowlerId] = {
          playerId: newBowlerId,
          name: playerNames[newBowlerId] || 'Bowler',
          legalBallsBowled: 0,
          oversFormatted: '0.0',
          maidens: 0,
          runsConceded: 0,
          wickets: 0,
          economyRate: 0,
          noBalls: 0,
          wides: 0,
          dotsCount: 0,
        };
      }

      const updated = {
        ...cur,
        currentBowlerId: newBowlerId,
        bowlerStats: updatedBowlerStats,
      };
      return prev.currentInningsNumber === 1 ? { ...prev, innings1: updated } : { ...prev, innings2: updated };
    });
  };

  // Dynamically add a player to a team mid-match (from WicketModal or ScorerHUD Bowler/Batter picker)
  const handleAddPlayerMidMatch = (
    teamId: string,
    newPlayer: Player,
    selectAs?: 'striker' | 'nonStriker' | 'bowler' | 'nextBatter'
  ) => {
    setMatch((prev) => {
      const isTeamA = prev.teamA.id === teamId;
      const targetTeam = isTeamA ? prev.teamA : prev.teamB;

      // Duplicate check (case-insensitive)
      const existingPlayer = targetTeam.squad.find(
        (p) => p.name.trim().toLowerCase() === newPlayer.name.trim().toLowerCase()
      );

      const resolvedPlayer = existingPlayer || newPlayer;
      const updatedSquad = existingPlayer ? targetTeam.squad : [...targetTeam.squad, resolvedPlayer];
      const updatedPlaying11 = targetTeam.playing11.includes(resolvedPlayer.id)
        ? targetTeam.playing11
        : [...targetTeam.playing11, resolvedPlayer.id];

      const updatedTeam = {
        ...targetTeam,
        squad: updatedSquad,
        playing11: updatedPlaying11,
      };

      const updatedTeamA = isTeamA ? updatedTeam : prev.teamA;
      const updatedTeamB = !isTeamA ? updatedTeam : prev.teamB;

      // Update active innings if player should be selected right now
      const cur = prev.currentInningsNumber === 1 ? prev.innings1 : prev.innings2;
      let updatedInnings = cur;

      if (cur) {
        if (selectAs === 'bowler') {
          const updatedBowlerStats = { ...cur.bowlerStats };
          if (!updatedBowlerStats[resolvedPlayer.id]) {
            updatedBowlerStats[resolvedPlayer.id] = {
              playerId: resolvedPlayer.id,
              name: resolvedPlayer.name,
              legalBallsBowled: 0,
              oversFormatted: '0.0',
              maidens: 0,
              runsConceded: 0,
              wickets: 0,
              economyRate: 0,
              noBalls: 0,
              wides: 0,
              dotsCount: 0,
            };
          }
          updatedInnings = {
            ...cur,
            currentBowlerId: resolvedPlayer.id,
            bowlerStats: updatedBowlerStats,
          };
        } else if (selectAs === 'striker') {
          const updatedBatterStats = { ...cur.batterStats };
          if (!updatedBatterStats[resolvedPlayer.id]) {
            updatedBatterStats[resolvedPlayer.id] = {
              playerId: resolvedPlayer.id,
              name: resolvedPlayer.name,
              runs: 0,
              ballsFaced: 0,
              fours: 0,
              sixes: 0,
              strikeRate: 0,
              isOut: false,
            };
          }
          updatedInnings = {
            ...cur,
            strikerId: resolvedPlayer.id,
            batterStats: updatedBatterStats,
          };
        } else if (selectAs === 'nonStriker') {
          const updatedBatterStats = { ...cur.batterStats };
          if (!updatedBatterStats[resolvedPlayer.id]) {
            updatedBatterStats[resolvedPlayer.id] = {
              playerId: resolvedPlayer.id,
              name: resolvedPlayer.name,
              runs: 0,
              ballsFaced: 0,
              fours: 0,
              sixes: 0,
              strikeRate: 0,
              isOut: false,
            };
          }
          updatedInnings = {
            ...cur,
            nonStrikerId: resolvedPlayer.id,
            batterStats: updatedBatterStats,
          };
        }
      }

      return {
        ...prev,
        teamA: updatedTeamA,
        teamB: updatedTeamB,
        innings1: prev.currentInningsNumber === 1 ? updatedInnings! : prev.innings1,
        innings2: prev.currentInningsNumber === 2 ? updatedInnings! : prev.innings2,
      };
    });

    // Update history manager player name dictionary
    historyManagerRef.current.updatePlayerNames({ [newPlayer.id]: newPlayer.name });
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

    const battingPlayingSquad = getPlayingSquad(battingTeam);
    const bowlingPlayingSquad = getPlayingSquad(bowlingTeam);

    const striker = battingPlayingSquad[0] || battingTeam.squad[0];
    const nonStriker = battingPlayingSquad[1] || battingTeam.squad[1];
    const openingBowler =
      bowlingPlayingSquad.find((p) => p.role === 'bowler') ||
      bowlingPlayingSquad[0] ||
      bowlingTeam.squad[0];

    // Calculate effective target taking into account any penalty runs
    const penalties = calculatePenalties(match);
    const targetRuns = penalties.effectiveTarget;

    const innings2 = createInitialInningsState({
      inningsNumber: 2,
      battingTeamId: battingTeam.id,
      bowlingTeamId: bowlingTeam.id,
      striker,
      nonStriker,
      openingBowler,
      allBatters: battingPlayingSquad,
    });

    initialInnings2Ref.current = innings2;

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

  // Update Match Details without resetting scores or deliveries
  const handleUpdateMatchDetails = (params: {
    metadata: MatchMetadata;
    teamA: Team;
    teamB: Team;
  }) => {
    const names = buildPlayerNamesMap(params.teamA, params.teamB);

    setMatch((prev) => {
      const updateInningsNames = (innings: InningsState | null): InningsState | null => {
        if (!innings) return null;
        const updatedBatterStats = { ...innings.batterStats };
        Object.keys(updatedBatterStats).forEach((pId) => {
          if (names[pId]) {
            updatedBatterStats[pId] = {
              ...updatedBatterStats[pId],
              name: names[pId],
            };
          }
        });

        const updatedBowlerStats = { ...innings.bowlerStats };
        Object.keys(updatedBowlerStats).forEach((pId) => {
          if (names[pId]) {
            updatedBowlerStats[pId] = {
              ...updatedBowlerStats[pId],
              name: names[pId],
            };
          }
        });

        return {
          ...innings,
          batterStats: updatedBatterStats,
          bowlerStats: updatedBowlerStats,
        };
      };

      const updatedInnings1 = updateInningsNames(prev.innings1)!;
      const updatedInnings2 = updateInningsNames(prev.innings2);

      return {
        ...prev,
        metadata: params.metadata,
        teamA: params.teamA,
        teamB: params.teamB,
        innings1: updatedInnings1,
        innings2: updatedInnings2,
      };
    });

    setShowPreMatchModal(false);
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
    const openingBowler = bowlingTeam.squad.find((p) => p.id === params.openingBowlerId) || bowlingTeam.squad[8] || bowlingTeam.squad[0];

    const initialMatch = createInitialMatch(
      params.metadata,
      params.teamA,
      params.teamB,
      params.toss,
      striker,
      nonStriker,
      openingBowler
    );

    initialInnings1Ref.current = initialMatch.innings1;
    initialInnings2Ref.current = null;

    const names = buildPlayerNamesMap(params.teamA, params.teamB);
    historyManagerRef.current = new InningsHistoryManager(initialMatch.innings1, names);
    setMatch(initialMatch);
    setShowPreMatchModal(false);
    setActiveAnimation('toss');
  };

  // Reset Match Handler
  const handleResetMatch = () => {
    if (confirm('Are you sure you want to reset the match? All current scores and ball deliveries will be cleared.')) {
      clearSavedMatch();
      const freshMatch = createInitialMatch();
      initialInnings1Ref.current = freshMatch.innings1;
      initialInnings2Ref.current = null;
      const names = buildPlayerNamesMap(freshMatch.teamA, freshMatch.teamB);
      historyManagerRef.current = new InningsHistoryManager(freshMatch.innings1, names);
      setMatch(freshMatch);
      setShowPreMatchModal(true);
    }
  };

  const currentInnings = isSecondInnings && match.innings2 ? match.innings2 : match.innings1;
  const battingTeam = currentInnings.battingTeamId === match.teamA.id ? match.teamA : match.teamB;
  const bowlingTeam = currentInnings.bowlingTeamId === match.teamA.id ? match.teamA : match.teamB;

  // Calculate live effective target incorporating Innings 1 and Innings 2 penalties & DLS
  const penaltyAdjustment = calculatePenalties(match);
  const liveTarget = isSecondInnings
    ? penaltyAdjustment.effectiveTarget
    : match.metadata.targetRuns;

  // YOUTUBE WATCHALONG FULL 1080P STUDIO MODE
  if (isWatchalongMode) {
    return (
      <WatchalongStudio
        match={match}
        onTriggerAnimation={(key) => {
          setActiveAnimation(key);
          broadcastSync.publish({ type: 'TRIGGER_ANIMATION', key });
        }}
      />
    );
  }

  // PURE OBS OVERLAY ROUTE RENDER (100% Transparent Lower-Third Layer)
  if (isObsOverlayMode) {
    return (
      <div className="w-screen h-screen bg-transparent overflow-hidden relative flex flex-col justify-end p-4 sm:p-6 select-none">
        {/* Top Contextual Infographics */}
        {showPartnershipDrawer && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-4xl px-4 flex justify-center pointer-events-none">
            <HeaderStatsDrawer
              partnership={currentInnings.currentPartnership}
              innings={currentInnings}
              battingTeam={battingTeam}
              isVisible={showPartnershipDrawer}
              milestoneMessage={milestoneAlert}
            />
          </div>
        )}

        {/* Video / Graphic Animation Stings */}
        <AnimationOverlay
          eventKey={activeAnimation}
          onComplete={handleAnimationComplete}
        />

        {/* Bottom Ticker — Firmly anchored to bottom */}
        <div className="w-full z-20 mt-auto max-w-[1920px] mx-auto">
          <StarSportsTicker
            battingTeam={battingTeam}
            bowlingTeam={bowlingTeam}
            innings={currentInnings}
            metadata={match.metadata}
            isSecondInnings={isSecondInnings}
            target={liveTarget}
            highlightNewBallId={highlightBallId}
          />
        </div>

        {/* Full Scorecard Popup when stream director triggers it */}
        {showStreamScorecard && (
          <FullScorecard
            battingTeam={battingTeam}
            bowlingTeam={bowlingTeam}
            innings={currentInnings}
            metadata={match.metadata}
            onClose={() => setShowStreamScorecard(false)}
          />
        )}

        {/* Wagon Wheel & Pitch Map Modal on Stream */}
        {showStreamWagonWheel && (
          <WagonWheelModal
            isOpen={showStreamWagonWheel}
            onClose={() => setShowStreamWagonWheel(false)}
            innings={currentInnings}
            battingTeam={battingTeam}
            bowlingTeam={bowlingTeam}
          />
        )}

        {/* Live Audience Poll Widget on OBS Overlay */}
        {streamPoll.isOpen && (
          <div className="absolute top-20 right-8 z-30 max-w-sm w-full">
            <AudiencePollWidget poll={streamPoll} />
          </div>
        )}

        {/* Presentation Cards on Stream */}
        {streamPresentationCard !== 'none' && (
          <BroadcastCards
            cardType={streamPresentationCard}
            match={match}
            onClose={() => setStreamPresentationCard('none')}
          />
        )}
      </div>
    );
  }

  // OPERATOR COCKPIT & LIVE MONITOR VIEW
  return (
    <div className="min-h-screen bg-[#050a18] text-white flex flex-col font-sans">
      
      {/* APP NAVBAR */}
      <header className="bg-gradient-to-r from-[#0b1739] via-[#070e24] to-[#260810] border-b border-yellow-500/20 px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-yellow-400 flex items-center justify-center font-black text-[#050a18] font-['Teko'] text-2xl shadow-lg">
            GB
          </div>
          <div>
            <h1 className="text-lg font-black tracking-wider text-yellow-400 font-['Teko']">
              GUFFBOX CRICKET STUDIO
            </h1>
            <p className="text-[11px] text-white/80 -mt-1 font-medium">
              Elite Broadcast Scoring Cockpit & YouTube Stream Engine
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* YouTube Watchalong Studio Link */}
          <a
            href="/?mode=watchalong"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 bg-[#24060e] hover:bg-[#3d0a17] border border-red-800 text-yellow-300 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow"
            title="Open 1080p YouTube Watchalong Live Studio Screen"
          >
            <Radio className="w-3.5 h-3.5 text-yellow-400" />
            <span>📺 YouTube Studio Screen</span>
            <ExternalLink className="w-3 h-3 ml-0.5 text-yellow-400" />
          </a>

          {/* OBS Lower-Third Transparent Overlay Link */}
          <a
            href="/?overlay=true"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 bg-[#0e1938] hover:bg-[#152554] border border-yellow-500/30 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition shadow"
            title="Open pure transparent lower-third broadcast layer for OBS Studio Browser Source"
          >
            <Tv className="w-3.5 h-3.5 text-yellow-400" />
            <span>🎬 OBS Overlay</span>
            <ExternalLink className="w-3 h-3 ml-0.5 text-yellow-400" />
          </a>

          {/* Stream Director Scorecard Toggle */}
          <button
            onClick={() => {
              const next = !showStreamScorecard;
              setShowStreamScorecard(next);
              broadcastSync.publish({ type: 'TOGGLE_STREAM_SCORECARD', show: next });
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow border cursor-pointer ${
              showStreamScorecard
                ? 'bg-yellow-400 text-[#050a18] border-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.6)] font-black'
                : 'bg-[#14224c] hover:bg-[#1f3575] text-white border-yellow-500/30'
            }`}
            title="Toggle Full Scorecard on live YouTube / OBS stream"
          >
            <span>📊</span>
            <span>{showStreamScorecard ? 'Hide Stream Scorecard' : 'Stream Scorecard'}</span>
          </button>

          {/* Pre-Match Setup */}
          <button
            onClick={() => setShowPreMatchModal(true)}
            className="flex items-center space-x-1.5 bg-yellow-400 hover:bg-yellow-300 text-[#050a18] px-3 py-1.5 rounded-xl text-xs font-black shadow transition cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Pre-Match Setup</span>
          </button>
        </div>
      </header>

      {/* ═══ STREAM DIRECTOR TOOLBAR & AUDIO SOUNDBOARD ═══ */}
      <div className="bg-gradient-to-r from-[#081026] via-[#050a18] to-[#1c050a] border-b border-yellow-500/20 px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-yellow-400 text-[#050a18] font-['Teko'] text-sm shadow">
            STREAM DIRECTOR
          </span>
          <span className="text-white/80 font-bold">Live Stream Overlays:</span>

          {/* Direct Presentation Cards Switcher */}
          <button
            onClick={() => {
              const next = streamPresentationCard === 'toss' ? 'none' : 'toss';
              setStreamPresentationCard(next);
              broadcastSync.publish({ type: 'SET_STREAM_PRESENTATION_CARD', card: next });
            }}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center space-x-1 border cursor-pointer ${
              streamPresentationCard === 'toss'
                ? 'bg-yellow-400 text-[#050a18] border-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.6)] font-black'
                : 'bg-[#0e1938] text-white hover:text-yellow-300 border-yellow-500/30'
            }`}
            title="Broadcast Toss Presentation on Stream"
          >
            <span>🪙</span>
            <span>Toss</span>
          </button>

          <button
            onClick={() => {
              const next = streamPresentationCard === 'playing11' ? 'none' : 'playing11';
              setStreamPresentationCard(next);
              broadcastSync.publish({ type: 'SET_STREAM_PRESENTATION_CARD', card: next });
            }}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center space-x-1 border cursor-pointer ${
              streamPresentationCard === 'playing11'
                ? 'bg-yellow-400 text-[#050a18] border-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.6)] font-black'
                : 'bg-[#0e1938] text-white hover:text-yellow-300 border-yellow-500/30'
            }`}
            title="Broadcast Playing XI Team Lineups on Stream"
          >
            <span>👥</span>
            <span>Playing XI</span>
          </button>

          <button
            onClick={() => {
              const next = !showStreamWagonWheel;
              setShowStreamWagonWheel(next);
              broadcastSync.publish({ type: 'SET_STREAM_PRESENTATION_CARD', card: next ? 'wagon_wheel' : 'none' });
            }}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center space-x-1 border cursor-pointer ${
              showStreamWagonWheel
                ? 'bg-yellow-400 text-[#050a18] border-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.6)] font-black'
                : 'bg-[#0e1938] text-white hover:text-yellow-300 border-yellow-500/30'
            }`}
            title="Broadcast Wagon Wheel & Pitch Map on Stream"
          >
            <span>🏏</span>
            <span>Wagon Wheel</span>
          </button>

          <button
            onClick={() => {
              const next = streamPresentationCard === 'interval' ? 'none' : 'interval';
              setStreamPresentationCard(next);
              broadcastSync.publish({ type: 'SET_STREAM_PRESENTATION_CARD', card: next });
            }}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center space-x-1 border cursor-pointer ${
              streamPresentationCard === 'interval'
                ? 'bg-yellow-400 text-[#050a18] border-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.6)] font-black'
                : 'bg-[#0e1938] text-white hover:text-yellow-300 border-yellow-500/30'
            }`}
            title="Broadcast Innings Break Summary on Stream"
          >
            <span>⏸️</span>
            <span>Innings Break</span>
          </button>

          <button
            onClick={() => {
              const next = streamPresentationCard === 'victory' ? 'none' : 'victory';
              setStreamPresentationCard(next);
              broadcastSync.publish({ type: 'SET_STREAM_PRESENTATION_CARD', card: next });
            }}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center space-x-1 border cursor-pointer ${
              streamPresentationCard === 'victory'
                ? 'bg-yellow-400 text-[#050a18] border-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.6)] font-black'
                : 'bg-[#0e1938] text-white hover:text-yellow-300 border-yellow-500/30'
            }`}
            title="Broadcast Match Victory Card on Stream"
          >
            <span>🏆</span>
            <span>Victory Card</span>
          </button>

          <button
            onClick={() => {
              const next = streamPresentationCard === 'milestone' ? 'none' : 'milestone';
              setStreamPresentationCard(next);
              broadcastSync.publish({ type: 'SET_STREAM_PRESENTATION_CARD', card: next });
            }}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center space-x-1 border cursor-pointer ${
              streamPresentationCard === 'milestone'
                ? 'bg-yellow-400 text-[#050a18] border-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.6)] font-black'
                : 'bg-[#0e1938] text-white hover:text-yellow-300 border-yellow-500/30'
            }`}
            title="Broadcast Player Spotlight & Milestone Graphic Card on Stream"
          >
            <span>⭐</span>
            <span>Spotlight</span>
          </button>

          <button
            onClick={() => setShowPollDirector(true)}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center space-x-1 border cursor-pointer ${
              streamPoll.isOpen
                ? 'bg-yellow-400 text-[#050a18] border-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.6)] font-black'
                : 'bg-[#0e1938] text-white hover:text-yellow-300 border-yellow-500/30'
            }`}
            title="Launch / Control Live YouTube Audience Poll on Stream"
          >
            <span>📊</span>
            <span>Live Poll {streamPoll.isOpen ? '●' : ''}</span>
          </button>

          <button
            onClick={() => setShowSocialModal(true)}
            className="px-2.5 py-1 rounded-lg font-bold transition flex items-center space-x-1 border cursor-pointer bg-[#0e1938] text-white hover:text-yellow-300 border-yellow-500/30 hover:border-yellow-400"
            title="Export 1200x675 HD Match Summary Graphic PNG for YouTube Community / Social Media"
          >
            <span>📥</span>
            <span>Match Graphic</span>
          </button>

          <button
            onClick={() => setShowCamWidget(!showCamWidget)}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center space-x-1 border cursor-pointer ${
              showCamWidget
                ? 'bg-yellow-400 text-[#050a18] border-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.6)] font-black'
                : 'bg-[#0e1938] text-white hover:text-yellow-300 border-yellow-500/30'
            }`}
            title="Toggle Movable Circular Camera (PiP)"
          >
            <span>🎥</span>
            <span>Circle Cam {showCamWidget ? '●' : ''}</span>
          </button>
        </div>

        {/* Embedded Soundboard pads */}
        <AudioSoundboard compact={true} />
      </div>

      {/* OPERATOR SCORER HUD COCKPIT */}
      <ScorerHUD
        match={match}
        onDeliverBall={handleDeliverBall}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyManagerRef.current.canUndo()}
        canRedo={historyManagerRef.current.canRedo()}
        onSwapStrikeManual={handleSwapStrikeManual}
        onChangeStriker={handleChangeStriker}
        onChangeNonStriker={handleChangeNonStriker}
        onChangeBowler={handleChangeBowler}
        onAddPlayerToTeam={handleAddPlayerMidMatch}
        onStartSecondInnings={handleStartSecondInnings}
        onUpdateMetadata={handleUpdateMetadata}
        onTriggerAnimation={(key) => {
          setActiveAnimation(key);
          broadcastSync.publish({ type: 'TRIGGER_ANIMATION', key });
        }}
        onOpenPreMatch={() => setShowPreMatchModal(true)}
        onResetMatch={handleResetMatch}
      />

      {/* LIVE BROADCAST PREVIEW SECTION */}
      <main className="px-3 py-2 sm:px-6 sm:py-3 flex flex-col justify-between relative bg-gradient-to-b from-[#081026] via-[#050a18] to-[#1c050a] overflow-hidden mt-1 border-t border-yellow-500/20">
        
        {/* Stadium Grass Background Pattern Preview */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 50% 50%, #1e3a8a 10%, transparent 80%)',
          }}
        />

        {/* Top Infographics Drawer */}
        <div className="w-full flex justify-center z-10 mb-3">
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
          <div className="text-xs font-bold text-white/80 uppercase tracking-widest mb-1.5 flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping inline-block" />
              <span>Live Broadcast Feed Preview (Synced with OBS & YouTube Studio)</span>
            </span>
            <span className="text-[11px] text-yellow-400 font-mono font-bold">● Stream Ready</span>
          </div>
          <StarSportsTicker
            battingTeam={battingTeam}
            bowlingTeam={bowlingTeam}
            innings={currentInnings}
            metadata={match.metadata}
            isSecondInnings={isSecondInnings}
            target={liveTarget}
            highlightNewBallId={highlightBallId}
          />
        </div>
      </main>

      {/* Full Scorecard Modal when shown */}
      {showStreamScorecard && (
        <FullScorecard
          battingTeam={battingTeam}
          bowlingTeam={bowlingTeam}
          innings={currentInnings}
          metadata={match.metadata}
          onClose={() => {
            setShowStreamScorecard(false);
            broadcastSync.publish({ type: 'TOGGLE_STREAM_SCORECARD', show: false });
          }}
        />
      )}

      {/* Wagon Wheel & Pitch Map Modal */}
      {showStreamWagonWheel && (
        <WagonWheelModal
          isOpen={showStreamWagonWheel}
          onClose={() => {
            setShowStreamWagonWheel(false);
            broadcastSync.publish({ type: 'SET_STREAM_PRESENTATION_CARD', card: 'none' });
          }}
          innings={currentInnings}
          battingTeam={battingTeam}
          bowlingTeam={bowlingTeam}
        />
      )}

      {/* Broadcast Presentation Cards Modal */}
      {streamPresentationCard !== 'none' && (
        <BroadcastCards
          cardType={streamPresentationCard}
          match={match}
          onClose={() => {
            setStreamPresentationCard('none');
            broadcastSync.publish({ type: 'SET_STREAM_PRESENTATION_CARD', card: 'none' });
          }}
        />
      )}

      {/* Pre-Match Setup Modal */}
      {showPreMatchModal && (
        <PreMatchModal
          isOpen={showPreMatchModal}
          currentMatch={match}
          onStartMatch={handleStartMatch}
          onUpdateMatchDetails={handleUpdateMatchDetails}
          onClose={() => setShowPreMatchModal(false)}
          onResetMatch={handleResetMatch}
        />
      )}

      {/* Social Media Match Summary Graphic PNG Exporter Modal */}
      {showSocialModal && (
        <SocialScorecardCard
          isOpen={showSocialModal}
          onClose={() => setShowSocialModal(false)}
          match={match}
        />
      )}

      {/* Live YouTube Audience Poll Director Modal */}
      {showPollDirector && (
        <AudiencePollWidget
          poll={streamPoll}
          isDirectorMode={true}
          onUpdatePoll={(newPoll) => setStreamPoll(newPoll)}
          onCloseDirector={() => setShowPollDirector(false)}
        />
      )}

      {/* Floating Movable Circular Camera Widget (Bottom Right) */}
      <MovableCircularCam
        streamerName="GUFFBOX LIVE"
        isVisible={showCamWidget}
        onClose={() => setShowCamWidget(false)}
      />

    </div>
  );
};
