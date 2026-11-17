// The Cricket Guff Studio — Premium YouTube Watchalong Live Broadcast Studio (1080p 16:9)
// Designed specifically for YouTube Live Streamers, Cricket Watchalongs, and Commentary Shows.

import React, { useState, useEffect } from 'react';
import { MatchState, Team } from '../core/types';
import { calculateMatchRates, calculateDLSParScore } from '../core/target-calculator';
import { AnimationOverlay } from './AnimationOverlay';
import { FullScorecard } from './FullScorecard';
import { WagonWheelModal } from './WagonWheelModal';
import { BroadcastCards, PresentationCardType } from './BroadcastCards';
import { AudiencePollWidget } from './AudiencePollWidget';
import { MovableCircularCam } from '../components/MovableCircularCam';
import { stadiumAudio } from '../utils/soundEffects';
import { broadcastSync, BroadcastMessageType, StreamPollData } from '../utils/broadcastSync';
import { Radio, Award, Flame, Eye, Maximize2 } from 'lucide-react';
import { TeamLogo, PlayerAvatar } from '../utils/avatarUtils';

interface WatchalongStudioProps {
  match: MatchState;
  onTriggerAnimation?: (key: any) => void;
}

export const WatchalongStudio: React.FC<WatchalongStudioProps> = ({ match }) => {
  const [activeAnimation, setActiveAnimation] = useState<any | null>(null);
  const [showStreamScorecard, setShowStreamScorecard] = useState<boolean>(false);
  const [streamPresentationCard, setStreamPresentationCard] = useState<PresentationCardType>('none');
  const [showStreamWagonWheel, setShowStreamWagonWheel] = useState<boolean>(false);
  const [streamerName, setStreamerName] = useState<string>('THE CRICKET GUFF LIVE');
  const [isEditingStreamer, setIsEditingStreamer] = useState<boolean>(false);
  const [sponsorTicker, setSponsorTicker] = useState<string>('🏆 ICC T20 Championship • Official Broadcast • The Cricket Guff Studio • Comment your match predictions live!');
  const [isEditingSponsor, setIsEditingSponsor] = useState<boolean>(false);
  const [centerTab, setCenterTab] = useState<'commentary' | 'manhattan' | 'worm'>('commentary');
  const [streamPoll, setStreamPoll] = useState<StreamPollData>({
    isOpen: false,
    question: 'Will the batting team chase down the target today?',
    optionA: { label: 'Yes, Comfortable Win', votes: 142 },
    optionB: { label: 'No, Bowlers Defend', votes: 68 },
  });

  // Subscribe to real-time broadcast events (animations, audio soundboard, scorecard, cards)
  useEffect(() => {
    const unsubscribe = broadcastSync.subscribe((msg: BroadcastMessageType) => {
      if (msg.type === 'TRIGGER_ANIMATION') {
        setActiveAnimation(msg.key);
      } else if (msg.type === 'CLEAR_ANIMATION') {
        setActiveAnimation(null);
      } else if (msg.type === 'TOGGLE_STREAM_SCORECARD') {
        setShowStreamScorecard(msg.show);
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

  const isSecondInnings = match.currentInningsNumber === 2;
  const currentInnings = isSecondInnings && match.innings2 ? match.innings2 : match.innings1;
  const battingTeam: Team = currentInnings.battingTeamId === match.teamA.id ? match.teamA : match.teamB;
  const bowlingTeam: Team = currentInnings.bowlingTeamId === match.teamA.id ? match.teamA : match.teamB;

  const striker = currentInnings.batterStats[currentInnings.strikerId];
  const nonStriker = currentInnings.batterStats[currentInnings.nonStrikerId];
  const bowler = currentInnings.bowlerStats[currentInnings.currentBowlerId];

  const strikerPlayer = battingTeam.squad?.find((p) => p.id === currentInnings.strikerId);
  const nonStrikerPlayer = battingTeam.squad?.find((p) => p.id === currentInnings.nonStrikerId);
  const bowlerPlayer = bowlingTeam.squad?.find((p) => p.id === currentInnings.currentBowlerId);

  const maxOvers = match.metadata.curtailedOvers || match.metadata.scheduledOvers;
  const matchRates = calculateMatchRates({
    currentRuns: currentInnings.totalRuns,
    legalBallsBowled: currentInnings.legalBalls,
    maxOvers,
    target: match.metadata.targetRuns,
    wickets: currentInnings.totalWickets,
    battingTeamName: battingTeam.name,
    bowlingTeamName: bowlingTeam.name,
    isFirstInnings: !isSecondInnings,
  });

  const dlsResult = isSecondInnings && match.metadata.targetRuns
    ? calculateDLSParScore({
        firstInningsTotal: match.innings1.totalRuns,
        currentRuns: currentInnings.totalRuns,
        legalBallsBowled: currentInnings.legalBalls,
        wicketsLost: currentInnings.totalWickets,
        totalOvers: maxOvers,
      })
    : null;

  // Recent 5 deliveries with rich commentary
  const recentDeliveries = [...currentInnings.deliveries].slice(-5).reverse();

  // Over-by-Over Manhattan & Worm Calculation for Current Innings
  const currentOverCount = Math.max(1, Math.ceil(currentInnings.legalBalls / 6));
  const currentOverData: { over: number; runs: number; wickets: number; cumulative: number }[] = [];
  let cumRuns = 0;
  for (let o = 0; o < currentOverCount; o++) {
    const dels = currentInnings.deliveries.filter((d) => d.overIndex === o);
    const r = dels.reduce((sum, d) => sum + d.runsBat + d.runsExtras, 0);
    const w = dels.filter((d) => Boolean(d.wicket)).length;
    cumRuns += r;
    currentOverData.push({ over: o + 1, runs: r, wickets: w, cumulative: cumRuns });
  }

  // Innings 1 Worm Data (if in Innings 2)
  const inn1OverCount = match.innings1 ? Math.max(1, Math.ceil(match.innings1.legalBalls / 6)) : 0;
  const inn1OverData: { over: number; runs: number; wickets: number; cumulative: number }[] = [];
  let inn1Cum = 0;
  if (match.innings1) {
    for (let o = 0; o < inn1OverCount; o++) {
      const dels = match.innings1.deliveries.filter((d) => d.overIndex === o);
      const r = dels.reduce((sum, d) => sum + d.runsBat + d.runsExtras, 0);
      const w = dels.filter((d) => Boolean(d.wicket)).length;
      inn1Cum += r;
      inn1OverData.push({ over: o + 1, runs: r, wickets: w, cumulative: inn1Cum });
    }
  }

  // Helper to generate dynamic commentary line
  const allPlayers = [...match.teamA.squad, ...match.teamB.squad];
  const getPlayerName = (id: string, fallback: string = 'Player') =>
    allPlayers.find((p) => p.id === id)?.name || fallback;

  const getCommentaryLine = (del: any): string => {
    const sName = getPlayerName(del.strikerId, 'Batter');
    const bName = getPlayerName(del.bowlerId, 'Bowler');

    // Deterministic variant selector based on delivery id
    const hash = (del.id || '').split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);

    // 1. Compound Wicket on Extras
    if (del.wicket) {
      const wType = (del.wicket.type || 'out').replace(/_/g, ' ').toUpperCase();
      const pOutName = getPlayerName(del.wicket.playerOutId, sName);

      if (del.extraType === 'wide') {
        if (del.wicket.type === 'stumped') {
          return `${bName} to ${sName} — WIDE & STUMPED! Dragged his foot out, lightning hands by the keeper! Huge wicket!`;
        }
        return `${bName} to ${sName} — WIDE & RUN OUT! ${pOutName} dismissed attempting an extra run!`;
      }
      if (del.extraType === 'noball') {
        return `${bName} to ${sName} — NO BALL & RUN OUT! ${pOutName} run out after ${del.runsBat || 0} run(s)! Free Hit remains active next!`;
      }
      if (del.extraType === 'bye' || del.extraType === 'leg_bye') {
        const fielderInfo = del.wicket.assistedById ? ` by ${del.wicket.assistedById}` : '';
        return `${bName} to ${sName} — ${del.extraType === 'leg_bye' ? 'LEG-BYE' : 'BYE'} & RUN OUT! Direct hit / throw${fielderInfo}! ${pOutName} is OUT!`;
      }

      // Detailed dismissal commentary with fielder credit
      const fielderName = del.wicket.assistedById ? getPlayerName(del.wicket.assistedById, del.wicket.assistedById) : '';
      if (del.wicket.type === 'caught') {
        return `${bName} to ${sName} — OUT! CAUGHT! Sliced into the air and taken safely by ${fielderName || 'the fielder'}! ${pOutName} departs!`;
      }
      if (del.wicket.type === 'caught_behind') {
        return `${bName} to ${sName} — OUT! CAUGHT BEHIND! Edged and snapped up cleanly by keeper ${fielderName || 'behind the stumps'}!`;
      }
      if (del.wicket.type === 'caught_and_bowled') {
        return `${bName} to ${sName} — OUT! CAUGHT & BOWLED! Hit right back, and ${bName} takes a sharp return catch!`;
      }
      if (del.wicket.type === 'stumped') {
        return `${bName} to ${sName} — OUT! STUMPED! Dragged out of crease and whipped off in a flash by keeper ${fielderName || ''}!`;
      }
      if (del.wicket.type === 'run_out') {
        return `${bName} to ${sName} — OUT! RUN OUT! Superb fielding${fielderName ? ` by ${fielderName}` : ''}! ${pOutName} falls short of the crease!`;
      }
      if (del.wicket.type === 'bowled') {
        return `${bName} to ${sName} — OUT! CLEAN BOWLED! Rattles the timber! Stumps shattered by ${bName}!`;
      }
      if (del.wicket.type === 'lbw') {
        return `${bName} to ${sName} — OUT! LBW! Trapped right in front! Big appeal and the umpire raises the finger!`;
      }

      return `${bName} to ${sName} — OUT! ${wType}! ${pOutName} departs! Big celebration for ${bowlingTeam.name}!`;
    }

    // 2. Boundaries & Runs
    if (del.isSix) {
      if (del.extraType === 'noball') {
        return `${bName} to ${sName} — NO BALL & MAXIMUM SIX! Smashed out of the ground! 7 runs on the ball + Free Hit!`;
      }
      const sixLines = [
        `${bName} to ${sName} — SIX! Smashed high and handsome over the ropes! Maximum power!`,
        `${bName} to ${sName} — SIX! Lofted clean and straight into the crowd! Majestic hit!`,
        `${bName} to ${sName} — SIX! Picked up effortlessly over deep midwicket! Sensational shot!`,
      ];
      return sixLines[hash % sixLines.length];
    }
    if (del.isFour) {
      if (del.extraType === 'noball') {
        return `${bName} to ${sName} — NO BALL & FOUR! 5 runs scored! Free Hit next delivery!`;
      }
      const fourLines = [
        `${bName} to ${sName} — FOUR! Cracking drive through extra cover, finds the boundary rope!`,
        `${bName} to ${sName} — FOUR! Driven exquisitely through the covers with pure timing!`,
        `${bName} to ${sName} — FOUR! Pulled away behind square, races to the fence!`,
        `${bName} to ${sName} — FOUR! Slashed past point with surgical precision!`,
      ];
      return fourLines[hash % fourLines.length];
    }

    // 3. Extras
    if (del.extraType === 'wide') {
      const extraByes = (del.runsExtras || 1) - 1;
      if (extraByes > 0) {
        return `${bName} — WIDE + ${extraByes} BYE(S)! Fumbled down leg side, bonus runs taken.`;
      }
      return `${bName} — WIDE BALL! Straying down the leg side, extra run conceded.`;
    }
    if (del.extraType === 'noball') {
      if (del.runsBat > 0) {
        return `${bName} to ${sName} — NO BALL! Overstepped the crease and ${del.runsBat} run(s) taken off the bat. Free Hit next!`;
      }
      return `${bName} — NO BALL! Overstepping the crease! Free Hit next delivery!`;
    }
    if (del.extraType === 'bye') {
      return `${bName} to ${sName} — ${del.runsExtras || 1} Bye(s). Ball beat the keeper, batsmen stole a run.`;
    }
    if (del.extraType === 'leg_bye') {
      return `${bName} to ${sName} — ${del.runsExtras || 1} Leg-Bye(s). Struck the pads and deflected away.`;
    }
    if (del.extraType === 'penalty') {
      return `PENALTY AWARDED — 5 penalty runs awarded by the umpire.`;
    }

    // 4. Regular Balls
    if (del.runsBat === 0 && del.runsExtras === 0) {
      const dotLines = [
        `${bName} to ${sName} — Dot ball. Defended solidly back towards the bowler.`,
        `${bName} to ${sName} — Dot ball. Beaten outside off-stump with sharp movement!`,
        `${bName} to ${sName} — Dot ball. Pushed into the covers, straight to the fielder.`,
        `${bName} to ${sName} — Dot ball. Solid block off the front foot, tight line.`,
      ];
      return dotLines[hash % dotLines.length];
    }

    if (del.runsBat === 1) {
      const singleLines = [
        `${bName} to ${sName} — 1 run, pushed into the deep to rotate strike.`,
        `${bName} to ${sName} — 1 run, nudged gently towards square leg for a single.`,
        `${bName} to ${sName} — 1 run, steered down to third man for an easy single.`,
      ];
      return singleLines[hash % singleLines.length];
    }

    if (del.runsBat === 2) {
      const twoLines = [
        `${bName} to ${sName} — 2 runs, clipped through midwicket, excellent hustle between wickets!`,
        `${bName} to ${sName} — 2 runs, driven into the gap, hurried back for a couple.`,
      ];
      return twoLines[hash % twoLines.length];
    }

    if (del.runsBat === 3) {
      return `${bName} to ${sName} — 3 runs, great placement in the deep, long chase for the fielder!`;
    }

    return `${bName} to ${sName} — ${del.runsBat} run${del.runsBat > 1 ? 's' : ''} pushed into the deep.`;
  };

  // Helper to style ball badge for Recent Deliveries (Brand Kit: Dark Red / Dark Blue / Yellow / White)
  const getBallBadgeStyle = (ball: any): string => {
    if (ball.wicket)
      return 'bg-gradient-to-b from-red-600 to-red-950 text-white border-yellow-400 shadow-[0_0_10px_rgba(239,68,68,0.7)]';
    if (ball.isSix)
      return 'bg-gradient-to-b from-red-800 to-red-950 text-yellow-300 border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.6)]';
    if (ball.isFour)
      return 'bg-gradient-to-b from-blue-800 to-blue-950 text-white border-yellow-400/70 shadow-[0_0_10px_rgba(30,58,138,0.6)]';
    if (ball.extraType === 'wide' || ball.extraType === 'noball')
      return 'bg-gradient-to-b from-yellow-700 to-red-950 text-yellow-300 border-yellow-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]';
    if (ball.extraType === 'penalty')
      return 'bg-gradient-to-b from-blue-900 to-red-950 text-yellow-300 border-yellow-400';
    if (ball.runsBat === 0 && ball.runsExtras === 0)
      return 'bg-gradient-to-b from-blue-950 to-[#050914] text-white/90 border-blue-900/60';
    return 'bg-gradient-to-b from-blue-900 to-[#070d1e] text-yellow-300 border-blue-800/80';
  };

  return (
    <div
      className="w-screen h-screen overflow-hidden flex flex-col justify-between text-white select-none relative font-sans"
      style={{
        background: 'radial-gradient(ellipse at 25% 15%, #0f1d44 0%, #070d1e 50%, #03050c 100%), radial-gradient(ellipse at 85% 85%, #3d0710 0%, transparent 60%)',
      }}
    >
      {/* Brand Dual Floodlight Visual Accents (Dark Blue & Dark Red Glow) */}
      <div
        className="absolute top-0 left-1/4 w-96 h-96 rounded-full pointer-events-none opacity-25 blur-3xl"
        style={{ background: 'radial-gradient(circle, #1e3a8a 0%, transparent 70%)' }}
      />
      <div
        className="absolute top-0 right-1/4 w-96 h-96 rounded-full pointer-events-none opacity-25 blur-3xl"
        style={{ background: 'radial-gradient(circle, #7f1d1d 0%, transparent 70%)' }}
      />

      {/* ════ TOP BROADCAST BAR ════ */}
      <header
        className="relative z-20 flex items-center justify-between px-4 py-1.5 border-b flex-shrink-0"
        style={{
          background: 'linear-gradient(90deg, rgba(8,16,38,0.98) 0%, rgba(32,5,11,0.98) 50%, rgba(8,16,38,0.98) 100%)',
          borderColor: 'rgba(250,204,21,0.3)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.85)',
        }}
      >
        {/* Tournament & Venue */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 bg-yellow-500/15 border border-yellow-500/50 px-2.5 py-0.5 rounded-lg shadow">
            <Award className="w-3.5 h-3.5 text-yellow-400" />
            <span className="font-['Teko'] text-lg font-bold tracking-wider text-yellow-400 uppercase">
              {match.metadata.tournamentName}
            </span>
          </div>
          <div className="text-[11px] text-white font-medium">
            <span className="text-yellow-400 font-bold">{match.metadata.matchStage}</span>
            <span className="mx-1.5 text-yellow-500/60">•</span>
            <span className="text-white">{match.metadata.venue}</span>
            <span className="mx-1.5 text-yellow-500/60">•</span>
            <span className="text-yellow-300 font-semibold">{match.metadata.date}</span>
          </div>
        </div>

        {/* Live Indicator & Channel Badge */}
        <div className="flex items-center space-x-2.5">
          {/* Target Status if 2nd innings */}
          {isSecondInnings && matchRates.runsNeeded !== null && (
            <div className="bg-red-950/90 border border-red-500/60 px-2.5 py-0.5 rounded-lg text-[11px] font-bold text-white shadow">
              {battingTeam.shortName} NEED <span className="text-yellow-400 font-black">{matchRates.runsNeeded}</span> RUNS IN <span className="text-yellow-300 font-black">{matchRates.ballsRemaining}</span> BALLS
            </div>
          )}

          {/* YouTube Live Indicator */}
          <div className="flex items-center space-x-1.5 bg-red-700 text-white px-2.5 py-0.5 rounded-lg text-[11px] font-black tracking-widest shadow-[0_0_12px_rgba(220,38,38,0.6)] animate-pulse border border-red-400/40">
            <Radio className="w-3 h-3 text-yellow-300" />
            <span>🔴 LIVE WATCHALONG</span>
          </div>

          {/* Toggle Full Scorecard Button */}
          <button
            onClick={() => setShowStreamScorecard(!showStreamScorecard)}
            className="flex items-center space-x-1 bg-gradient-to-r from-red-900 to-blue-950 hover:from-red-800 hover:to-blue-900 text-white px-3 py-0.5 rounded-lg text-[11px] font-bold shadow transition border border-yellow-500/40 cursor-pointer"
          >
            <Eye className="w-3 h-3 text-yellow-400" />
            <span className="text-yellow-300">{showStreamScorecard ? 'Hide Scorecard' : 'Full Scorecard'}</span>
          </button>
        </div>
      </header>

      {/* ════ MAIN BROADCAST ARENA (1080p Grid) ════ */}
      <main className="flex-1 px-4 py-2 grid grid-cols-12 gap-3 relative z-10 overflow-hidden min-h-0">
        
        {/* ── LEFT COLUMN: HERO SCOREBOARD, RECENT BALLS & TEAM DUEL (4 cols) ── */}
        <div className="col-span-4 flex flex-col justify-between space-y-2 h-full min-h-0">
          
          {/* Main Big Score Card */}
          <div
            className="rounded-2xl p-3 border relative overflow-hidden flex flex-col justify-between shadow-2xl flex-1 min-h-0"
            style={{
              background: 'linear-gradient(145deg, rgba(10,18,44,0.96) 0%, rgba(38,6,14,0.95) 100%)',
              borderColor: 'rgba(250,204,21,0.35)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.85), inset 0 0 24px rgba(250,204,21,0.06)',
            }}
          >
            {/* Team Badges Row */}
            <div className="flex items-center justify-between pb-1.5 border-b border-yellow-500/20">
              {/* Batting Team */}
              <div className="flex items-center space-x-2">
                <TeamLogo
                  name={battingTeam.name}
                  shortName={battingTeam.shortName}
                  logoUrl={battingTeam.logoUrl}
                  color={battingTeam.color}
                  size="sm"
                  className="border border-yellow-400 shadow-md"
                />
                <div>
                  <div className="text-sm font-black tracking-wide text-white leading-none">
                    {battingTeam.name}
                  </div>
                  <div className="text-[9px] font-bold text-yellow-400 tracking-wider mt-0.5 uppercase">
                    🏏 BATTING NOW
                  </div>
                </div>
              </div>

              {/* VS Pill */}
              <div className="px-2 py-0.5 rounded-md bg-red-950/80 border border-yellow-500/30 text-[9px] font-black text-yellow-300">
                VS
              </div>

              {/* Bowling Team */}
              <div className="flex items-center space-x-2 text-right">
                <div>
                  <div className="text-xs font-bold text-white leading-none">
                    {bowlingTeam.name}
                  </div>
                  <div className="text-[9px] font-bold text-yellow-400 mt-0.5 uppercase">
                    🎯 BOWLING
                  </div>
                </div>
                <TeamLogo
                  name={bowlingTeam.name}
                  shortName={bowlingTeam.shortName}
                  logoUrl={bowlingTeam.logoUrl}
                  color={bowlingTeam.color}
                  size="xs"
                  className="border border-white/30 shadow"
                />
              </div>
            </div>

            {/* Giant Score Display */}
            <div className="py-1 text-center my-auto">
              <div className="flex items-baseline justify-center">
                <span
                  style={{
                    fontFamily: "'Teko', sans-serif",
                    fontSize: '4.2rem',
                    lineHeight: 0.85,
                    fontWeight: 700,
                    color: '#ffffff',
                    textShadow: '0 4px 20px rgba(255,255,255,0.4)',
                  }}
                >
                  {currentInnings.totalRuns}
                </span>
                <span
                  style={{
                    fontFamily: "'Teko', sans-serif",
                    fontSize: '2.8rem',
                    lineHeight: 0.85,
                    fontWeight: 600,
                    color: '#facc15',
                    textShadow: '0 0 20px rgba(250,204,21,0.8)',
                    marginLeft: '3px',
                  }}
                >
                  /{currentInnings.totalWickets}
                </span>
              </div>

              <div className="mt-0.5 text-xs font-bold tracking-widest text-white uppercase">
                OVERS:{' '}
                <span className="text-yellow-400 text-sm font-black font-mono">
                  {currentInnings.oversFormatted}
                </span>{' '}
                <span className="text-yellow-200/80">/ {maxOvers} OV</span>
              </div>
            </div>

            {/* Run Rate & Target Banner */}
            <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-yellow-500/20 text-center">
              <div className="bg-[#070d1e]/90 rounded-xl p-1.5 border border-yellow-500/25">
                <div className="text-[9px] font-bold text-yellow-400 uppercase tracking-widest">
                  CURRENT RUN RATE
                </div>
                <div className="text-sm font-black font-mono text-white">
                  {matchRates.crrFormatted}
                </div>
              </div>

              <div className="bg-[#1c050c]/90 rounded-xl p-1.5 border border-yellow-500/25">
                <div className="text-[9px] font-bold text-yellow-400 uppercase tracking-widest">
                  {isSecondInnings ? 'REQUIRED RATE' : 'PROJECTED (20 OV)'}
                </div>
                <div className="text-sm font-black font-mono text-yellow-300">
                  {isSecondInnings ? matchRates.rrrFormatted || '—' : Math.round(Number(matchRates.crrFormatted) * 20)}
                </div>
              </div>
            </div>

            {/* Recent Deliveries Strip (This Over) */}
            <div className="mt-1.5 bg-[#060a16]/90 rounded-xl p-1.5 border border-yellow-500/20 shadow-inner">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-yellow-400 flex items-center space-x-1">
                  <span>🎯</span>
                  <span>THIS OVER (RECENT DELIVERIES)</span>
                </span>
                <span className="text-[9px] font-mono text-white font-bold">
                  {currentInnings.recentBalls.length > 0
                    ? `${currentInnings.recentBalls.length} ball${currentInnings.recentBalls.length > 1 ? 's' : ''}`
                    : 'Over Start'}
                </span>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {currentInnings.recentBalls.length === 0 ? (
                  <div className="flex gap-1 py-0.5">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full border border-yellow-500/20 bg-blue-950/40 flex items-center justify-center text-[9px] text-yellow-500/50 font-bold"
                      >
                        •
                      </div>
                    ))}
                  </div>
                ) : (
                  currentInnings.recentBalls.map((ball) => (
                    <div
                      key={ball.id}
                      className={`min-w-6 h-6 px-1 rounded-full flex items-center justify-center text-[10px] font-black border ${getBallBadgeStyle(
                        ball
                      )} shadow transition-all`}
                    >
                      {ball.displayBadge}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Toss Outcome */}
            <div className="mt-1 text-[9px] text-center font-medium text-white bg-[#060a16]/80 py-0.5 px-2 rounded-md border border-yellow-500/20">
              🪙 Toss: <span className="text-yellow-400 font-bold">{match.toss.winnerTeamId === match.teamA.id ? match.teamA.name : match.teamB.name}</span> elected to {match.toss.electedTo} first
            </div>

            {/* DLS Par Score Telemetry */}
            {dlsResult && (
              <div className="mt-1 p-1.5 rounded-lg bg-red-950/90 border border-yellow-500/40 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                  <span className="font-bold text-yellow-300 text-[9px] uppercase tracking-wider">DLS PAR:</span>
                  <span className="font-mono font-black text-white text-xs">{dlsResult.parScore}</span>
                </div>
                <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded ${
                  dlsResult.isAhead
                    ? 'bg-blue-950/90 text-yellow-300 border border-yellow-500/50'
                    : dlsResult.isTied
                    ? 'bg-yellow-950/90 text-yellow-300 border border-yellow-500/50'
                    : 'bg-red-950/90 text-white border border-red-500/50'
                }`}>
                  {dlsResult.isAhead ? `+${dlsResult.diff} Ahead` : dlsResult.isTied ? 'Level' : `${dlsResult.diff} Behind`}
                </span>
              </div>
            )}
          </div>

          {/* Current Partnership Card */}
          <div
            className="rounded-xl p-2 border flex items-center justify-between shadow-md flex-shrink-0"
            style={{
              background: 'linear-gradient(90deg, rgba(46,7,16,0.96) 0%, rgba(12,22,50,0.96) 100%)',
              borderColor: 'rgba(250,204,21,0.3)',
            }}
          >
            <div className="flex items-center space-x-2">
              <Flame className="w-4 h-4 text-yellow-400 animate-bounce" />
              <div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-yellow-400 leading-tight">
                  CURRENT PARTNERSHIP
                </div>
                <div className="text-xs font-black text-white leading-tight">
                  {striker?.name.split(' ').pop()} & {nonStriker?.name.split(' ').pop()}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-black font-['Teko'] text-yellow-400 leading-none">
                {currentInnings.currentPartnership.runs} RUNS
              </div>
              <div className="text-[9px] text-white font-medium">
                ({currentInnings.currentPartnership.balls} balls)
              </div>
            </div>
          </div>

        </div>

        {/* ── CENTER COLUMN: ACTIVE BATSMEN & CURRENT BOWLER DUEL (4 cols) ── */}
        <div className="col-span-4 flex flex-col justify-between space-y-2 h-full min-h-0">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-0 px-1 flex-shrink-0">
            <span className="text-yellow-400 font-black uppercase tracking-wider flex items-center gap-1 font-['Teko'] text-sm">
              <span>🏏</span>
              <span>BATTERS & ACTIVE BOWLER STATS</span>
            </span>
            <span className="text-[9px] font-bold text-yellow-400 font-mono uppercase tracking-wider">
              LIVE DUEL
            </span>
          </div>

          {/* Striker Card (Dark Blue Velvet with Gold/Yellow Accents) */}
          <div
            className="rounded-2xl p-2.5 border relative overflow-hidden shadow-lg flex-1 min-h-0 flex flex-col justify-between"
            style={{
              background: 'linear-gradient(145deg, rgba(14,26,58,0.96) 0%, rgba(6,12,28,0.98) 100%)',
              borderColor: '#facc15',
              boxShadow: '0 0 16px rgba(250,204,21,0.2)',
            }}
          >
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-yellow-400 flex items-center space-x-1">
                <span>★ ON STRIKE</span>
              </span>
              <span className="text-[10px] text-yellow-300 font-mono font-bold">BATTER 1</span>
            </div>

            <div className="flex items-center space-x-2">
              <PlayerAvatar
                name={striker?.name || 'Striker'}
                photoUrl={strikerPlayer?.photoUrl}
                role="batsman"
                teamColor={battingTeam.color}
                size="sm"
                className="border border-yellow-400 shadow-md"
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-black text-white leading-tight truncate">
                  {striker?.name || 'Striker'}
                </div>
              </div>
            </div>

            <div className="flex items-baseline justify-between mt-0.5">
              <div className="flex items-baseline space-x-1">
                <span className="font-['Teko'] text-3xl font-bold text-yellow-400 leading-none">
                  {striker?.runs ?? 0}
                </span>
                <span className="text-[11px] text-white font-semibold">
                  ({striker?.ballsFaced ?? 0}b)
                </span>
              </div>
              <div className="text-right">
                <div className="text-[9px] font-bold text-yellow-400">SR</div>
                <div className="text-xs font-black font-mono text-white">
                  {striker?.strikeRate ?? 0}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 mt-1 text-[11px] text-white border-t border-yellow-500/20 pt-1 font-semibold">
              <span>4s: <strong className="text-yellow-400">{striker?.fours ?? 0}</strong></span>
              <span>6s: <strong className="text-yellow-300">{striker?.sixes ?? 0}</strong></span>
              <span className="text-yellow-200/80">Dots: <strong className="text-white">{Math.max(0, (striker?.ballsFaced ?? 0) - (striker?.runs ?? 0))}</strong></span>
            </div>
          </div>

          {/* Non-Striker Card (Dark Blue Velvet with White/Yellow Typography) */}
          <div
            className="rounded-2xl p-2.5 border relative overflow-hidden shadow-md flex-1 min-h-0 flex flex-col justify-between"
            style={{
              background: 'linear-gradient(145deg, rgba(10,18,40,0.94) 0%, rgba(5,9,20,0.96) 100%)',
              borderColor: 'rgba(250,204,21,0.25)',
            }}
          >
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[9px] font-bold uppercase tracking-widest text-yellow-400">
                NON-STRIKER
              </span>
              <span className="text-[10px] text-yellow-300 font-mono">BATTER 2</span>
            </div>

            <div className="flex items-center space-x-2">
              <PlayerAvatar
                name={nonStriker?.name || 'Non-Striker'}
                photoUrl={nonStrikerPlayer?.photoUrl}
                role="batsman"
                teamColor={battingTeam.color}
                size="xs"
                className="border border-yellow-400/40"
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white leading-tight truncate">
                  {nonStriker?.name || 'Non-Striker'}
                </div>
              </div>
            </div>

            <div className="flex items-baseline justify-between mt-0.5">
              <div className="flex items-baseline space-x-1">
                <span className="font-['Teko'] text-2xl font-bold text-white leading-none">
                  {nonStriker?.runs ?? 0}
                </span>
                <span className="text-[11px] text-yellow-300 font-semibold">
                  ({nonStriker?.ballsFaced ?? 0}b)
                </span>
              </div>
              <div className="text-right">
                <div className="text-[9px] font-bold text-yellow-400">SR</div>
                <div className="text-xs font-black font-mono text-white">
                  {nonStriker?.strikeRate ?? 0}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 mt-1 text-[11px] text-white border-t border-yellow-500/15 pt-1">
              <span>4s: <strong className="text-yellow-400">{nonStriker?.fours ?? 0}</strong></span>
              <span>6s: <strong className="text-yellow-300">{nonStriker?.sixes ?? 0}</strong></span>
            </div>
          </div>

          {/* Current Bowler Card (Dark Red Velvet Surface with Gold/Yellow Accents) */}
          <div
            className="rounded-2xl p-2.5 border relative overflow-hidden shadow-lg flex-1 min-h-0 flex flex-col justify-between"
            style={{
              background: 'linear-gradient(145deg, rgba(48,8,16,0.96) 0%, rgba(20,3,7,0.98) 100%)',
              borderColor: 'rgba(250,204,21,0.3)',
              boxShadow: '0 0 16px rgba(185,28,28,0.25)',
            }}
          >
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[9px] font-bold uppercase tracking-widest text-yellow-400 flex items-center space-x-1">
                <span>🎯 CURRENT BOWLER</span>
              </span>
              <span className="text-[10px] text-yellow-300 font-mono">SPELL STATS</span>
            </div>

            <div className="flex items-center space-x-2">
              <PlayerAvatar
                name={bowler?.name || 'Bowler'}
                photoUrl={bowlerPlayer?.photoUrl}
                role="bowler"
                teamColor={bowlingTeam.color}
                size="xs"
                className="border border-yellow-400/50"
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-black text-white leading-tight truncate">
                  {bowler?.name || 'Bowler'}
                </div>
              </div>
            </div>

            <div className="flex items-baseline justify-between mt-0.5">
              <div className="font-mono text-lg font-black text-yellow-400">
                {bowler?.wickets ?? 0}<span className="text-white text-xs"> / </span><span className="text-white">{bowler?.runsConceded ?? 0}</span>
              </div>
              <div className="text-right">
                <div className="text-[9px] font-bold text-yellow-400">ECO</div>
                <div className="text-xs font-black font-mono text-yellow-300">
                  {bowler?.economyRate ?? 0}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-1 text-[11px] text-white border-t border-yellow-500/20 pt-1 font-mono">
              <span>Overs: <strong className="text-yellow-300">{bowler?.oversFormatted ?? '0.0'}</strong></span>
              <span>Maidens: <strong className="text-white">{bowler?.maidens ?? 0}</strong></span>
              <span>Dots: <strong className="text-yellow-400">{bowler?.dotsCount ?? 0}</strong></span>
            </div>
          </div>

        </div>

        {/* ── RIGHT COLUMN: MATCH FOCUS, POLL & ANALYTICS DASHBOARD (4 cols) ── */}
        <div className="col-span-4 flex flex-col justify-between space-y-2 h-full min-h-0 overflow-hidden">
          
          {/* Top Broadcaster Status & Match Spotlight Header */}
          <div
            className="rounded-xl px-3 py-1.5 border flex items-center justify-between shadow-md flex-shrink-0"
            style={{
              background: 'linear-gradient(90deg, rgba(8,16,38,0.96) 0%, rgba(32,5,11,0.96) 100%)',
              borderColor: 'rgba(250,204,21,0.3)',
            }}
          >
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <div className="text-[11px] font-black uppercase tracking-wider text-white">
                {match.metadata.tournamentName} • <span className="text-yellow-400">{match.metadata.matchStage}</span>
              </div>
            </div>

            {/* Streamer Name Tag */}
            <div className="flex items-center space-x-1.5">
              {isEditingStreamer ? (
                <input
                  type="text"
                  value={streamerName}
                  onChange={(e) => setStreamerName(e.target.value)}
                  onBlur={() => setIsEditingStreamer(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingStreamer(false)}
                  autoFocus
                  className="bg-blue-950 text-yellow-400 font-black text-xs px-2 py-0.5 rounded outline-none border border-yellow-400"
                />
              ) : (
                <div
                  onClick={() => setIsEditingStreamer(true)}
                  className="font-black text-xs text-yellow-400 tracking-wider cursor-pointer hover:underline flex items-center space-x-1"
                  title="Click to edit streamer name"
                >
                  <span>🎙️ {streamerName}</span>
                </div>
              )}
              <span className="text-[9px] font-mono font-bold bg-red-950 text-yellow-300 border border-yellow-500/40 px-1.5 py-0.5 rounded">
                LIVE
              </span>
            </div>
          </div>

          {/* Live Audience Prediction Poll Widget */}
          {streamPoll.isOpen && (
            <div className="w-full">
              <AudiencePollWidget poll={streamPoll} />
            </div>
          )}

          {/* Live Center Telemetry / Commentary Feed Box */}
          <div
            className="rounded-2xl p-2.5 border flex-1 flex flex-col justify-between overflow-hidden shadow-xl min-h-0"
            style={{
              background: 'linear-gradient(180deg, rgba(8,16,38,0.96) 0%, rgba(28,5,10,0.96) 100%)',
              borderColor: 'rgba(250,204,21,0.25)',
            }}
          >
            {/* Tab Controls */}
            <div className="flex items-center justify-between border-b border-yellow-500/20 pb-1.5 mb-1.5 text-xs flex-shrink-0">
              <div className="flex items-center space-x-1 bg-[#050914] p-0.5 rounded-lg border border-yellow-500/30">
                <button
                  onClick={() => setCenterTab('commentary')}
                  className={`px-2 py-0.5 rounded-md font-bold text-xs transition flex items-center space-x-1 ${
                    centerTab === 'commentary'
                      ? 'bg-yellow-400 text-black font-black shadow'
                      : 'text-white hover:text-yellow-300'
                  }`}
                >
                  <span>🎙️ Commentary</span>
                </button>
                <button
                  onClick={() => setCenterTab('manhattan')}
                  className={`px-2 py-0.5 rounded-md font-bold text-xs transition flex items-center space-x-1 ${
                    centerTab === 'manhattan'
                      ? 'bg-yellow-400 text-black font-black shadow'
                      : 'text-white hover:text-yellow-300'
                  }`}
                >
                  <span>📊 Manhattan</span>
                </button>
                <button
                  onClick={() => setCenterTab('worm')}
                  className={`px-2 py-0.5 rounded-md font-bold text-xs transition flex items-center space-x-1 ${
                    centerTab === 'worm'
                      ? 'bg-yellow-400 text-black font-black shadow'
                      : 'text-white hover:text-yellow-300'
                  }`}
                >
                  <span>📈 Run Worm</span>
                </button>
              </div>

              <span className="text-[10px] text-yellow-400 font-mono font-bold">● Stream Ready</span>
            </div>

            {/* View 1: Commentary Feed */}
            {centerTab === 'commentary' && (
              <div className="space-y-1 flex-1 overflow-y-auto pr-1 min-h-0">
                {recentDeliveries.length === 0 ? (
                  <p className="text-xs text-white/60 italic py-3 text-center">
                    Waiting for match delivery to start...
                  </p>
                ) : (
                  recentDeliveries.map((del) => {
                    const ballNum = del.ballInOver === 0 ? 1 : del.ballInOver;
                    return (
                      <div
                        key={del.id}
                        className={`text-xs p-1.5 rounded-lg border flex items-start space-x-2 transition-all ${
                          del.wicket
                            ? 'bg-red-950/75 border-red-500/60 text-white'
                            : del.isSix
                            ? 'bg-red-950/60 border-yellow-500/40 text-yellow-300'
                            : del.isFour
                            ? 'bg-blue-950/70 border-yellow-500/35 text-white'
                            : 'bg-[#060b1c]/80 border-yellow-500/15 text-white'
                        }`}
                      >
                        <div className="flex flex-col items-center flex-shrink-0 min-w-[32px]">
                          <span className="font-bold text-yellow-400 font-mono text-xs leading-none">
                            {del.overIndex}.{ballNum}
                          </span>
                          {del.displayBadge && del.displayBadge !== String(del.runsBat) && (
                            <span className="text-[8px] font-black px-1 mt-0.5 rounded bg-yellow-950/90 border border-yellow-400/50 text-yellow-300">
                              {del.displayBadge}
                            </span>
                          )}
                        </div>
                        <span className="flex-1 font-medium leading-snug text-xs text-white">
                          {getCommentaryLine(del)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* View 2: Over-by-Over Manhattan Bar Chart */}
            {centerTab === 'manhattan' && (
              <div className="flex-1 flex flex-col justify-end p-2 bg-[#050914]/90 rounded-xl border border-yellow-500/20">
                <div className="flex items-center justify-between text-[10px] text-yellow-400 font-bold mb-2">
                  <span>RUNS SCORED PER OVER (MANHATTAN)</span>
                  <span className="text-yellow-300 flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                    <span>= Wicket Fell</span>
                  </span>
                </div>
                <div className="h-28 flex items-end space-x-1.5 overflow-x-auto pb-1">
                  {currentOverData.map((ov) => {
                    const maxR = Math.max(15, ...currentOverData.map((d) => d.runs));
                    const heightPct = Math.max(8, Math.round((ov.runs / maxR) * 100));
                    return (
                      <div key={ov.over} className="flex-1 min-w-[20px] flex flex-col items-center">
                        {ov.wickets > 0 && (
                          <span className="w-3.5 h-3.5 rounded-full bg-red-600 text-white text-[9px] font-black flex items-center justify-center mb-0.5 shadow">
                            W
                          </span>
                        )}
                        <span className="text-[9px] font-mono font-bold text-yellow-300 mb-0.5">
                          {ov.runs}
                        </span>
                        <div
                          className={`w-full rounded-t transition-all ${
                            ov.wickets > 0
                              ? 'bg-gradient-to-t from-red-700 to-yellow-400'
                              : ov.runs >= 12
                              ? 'bg-gradient-to-t from-yellow-600 to-yellow-300'
                              : 'bg-gradient-to-t from-blue-900 to-blue-600'
                          }`}
                          style={{ height: `${heightPct}%` }}
                        />
                        <span className="text-[8px] font-mono text-white/70 mt-1">
                          {ov.over}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* View 3: Cumulative Run Rate Worm */}
            {centerTab === 'worm' && (
              <div className="flex-1 flex flex-col justify-between p-2 bg-[#050914]/90 rounded-xl border border-yellow-500/20">
                <div className="flex items-center justify-between text-[10px] text-yellow-400 font-bold mb-1">
                  <span>CUMULATIVE RUN RATE WORM</span>
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center space-x-1 text-yellow-400">
                      <span className="w-2 h-0.5 bg-yellow-400 inline-block" />
                      <span>{match.innings1.battingTeamId === match.teamA.id ? match.teamA.shortName : match.teamB.shortName} (Inn 1)</span>
                    </span>
                    {isSecondInnings && (
                      <span className="flex items-center space-x-1 text-white">
                        <span className="w-2 h-0.5 bg-white inline-block" />
                        <span>{battingTeam.shortName} (Inn 2)</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* SVG Worm Graphic */}
                <svg className="w-full h-28" viewBox="0 0 300 100" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="25" x2="300" y2="25" stroke="#14224c" strokeDasharray="2,2" />
                  <line x1="0" y1="50" x2="300" y2="50" stroke="#14224c" strokeDasharray="2,2" />
                  <line x1="0" y1="75" x2="300" y2="75" stroke="#14224c" strokeDasharray="2,2" />

                  {/* Innings 1 Polyline */}
                  {inn1OverData.length > 0 && (() => {
                    const maxScore = Math.max(180, match.innings1.totalRuns, currentInnings.totalRuns);
                    const points = inn1OverData.map((d) => {
                      const x = (d.over / maxOvers) * 300;
                      const y = 95 - (d.cumulative / maxScore) * 85;
                      return `${x},${y}`;
                    }).join(' ');
                    return (
                      <g>
                        <polyline
                          fill="none"
                          stroke="#facc15"
                          strokeWidth="2.5"
                          strokeDasharray={isSecondInnings ? "3,2" : "none"}
                          points={`0,95 ${points}`}
                        />
                        {inn1OverData.filter(d => d.wickets > 0).map(d => {
                          const x = (d.over / maxOvers) * 300;
                          const y = 95 - (d.cumulative / maxScore) * 85;
                          return <circle key={`w1_${d.over}`} cx={x} cy={y} r="3" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />;
                        })}
                      </g>
                    );
                  })()}

                  {/* Innings 2 Polyline */}
                  {isSecondInnings && currentOverData.length > 0 && (() => {
                    const maxScore = Math.max(180, match.innings1.totalRuns, currentInnings.totalRuns);
                    const points = currentOverData.map((d) => {
                      const x = (d.over / maxOvers) * 300;
                      const y = 95 - (d.cumulative / maxScore) * 85;
                      return `${x},${y}`;
                    }).join(' ');
                    return (
                      <g>
                        <polyline
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="3"
                          points={`0,95 ${points}`}
                        />
                        {currentOverData.filter(d => d.wickets > 0).map(d => {
                          const x = (d.over / maxOvers) * 300;
                          const y = 95 - (d.cumulative / maxScore) * 85;
                          return <circle key={`w2_${d.over}`} cx={x} cy={y} r="3.5" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />;
                        })}
                      </g>
                    );
                  })()}
                </svg>

                <div className="flex justify-between text-[9px] text-white/70 font-mono">
                  <span>0 ov</span>
                  <span>5 ov</span>
                  <span>10 ov</span>
                  <span>15 ov</span>
                  <span>{maxOvers} ov</span>
                </div>
              </div>
            )}
          </div>

        </div>

      </main>

      {/* ════ LIVE SPONSOR & AUDIENCE SHOUTOUT BAR (BOTTOM BAR) ════ */}
      <div
        className="relative z-20 px-4 py-1 flex items-center justify-between text-xs shadow-2xl flex-shrink-0 h-7 border-t"
        style={{
          background: 'linear-gradient(90deg, rgba(8,16,38,0.98) 0%, rgba(32,5,11,0.98) 50%, rgba(8,16,38,0.98) 100%)',
          borderColor: 'rgba(250,204,21,0.3)',
        }}
      >
        <div className="flex items-center space-x-2 flex-1 overflow-hidden">
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-yellow-400/20 text-yellow-400 border border-yellow-400/40 flex-shrink-0">
            📢 LIVE FEED
          </span>
          {isEditingSponsor ? (
            <input
              type="text"
              value={sponsorTicker}
              onChange={(e) => setSponsorTicker(e.target.value)}
              onBlur={() => setIsEditingSponsor(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingSponsor(false)}
              autoFocus
              className="bg-blue-950 text-white text-xs px-2 py-0.5 rounded outline-none border border-yellow-500/50 flex-1"
            />
          ) : (
            <span
              onClick={() => setIsEditingSponsor(true)}
              className="text-white font-medium truncate cursor-pointer hover:text-yellow-300 transition"
              title="Click to edit live sponsor or shoutout text"
            >
              {sponsorTicker}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2 pl-4 flex-shrink-0 text-[11px] text-white">
          <button
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
              } else {
                document.exitFullscreen().catch(() => {});
              }
            }}
            className="flex items-center space-x-1 hover:text-yellow-400 transition cursor-pointer text-white"
            title="Toggle Fullscreen Mode (1080p)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>1080p Fullscreen</span>
          </button>
        </div>
      </div>



      {/* ════ EVENT ANIMATION STINGS OVERLAY ════ */}
      <AnimationOverlay
        eventKey={activeAnimation}
        onComplete={() => {
          setActiveAnimation(null);
          broadcastSync.publish({ type: 'CLEAR_ANIMATION' });
        }}
      />

      {/* ════ FULL SCORECARD MODAL (DIRECTOR POPUP) ════ */}
      {showStreamScorecard && (
        <FullScorecard
          battingTeam={battingTeam}
          bowlingTeam={bowlingTeam}
          innings={currentInnings}
          metadata={match.metadata}
          onClose={() => setShowStreamScorecard(false)}
        />
      )}

      {/* ════ WAGON WHEEL & PITCH MAP MODAL ════ */}
      {showStreamWagonWheel && (
        <WagonWheelModal
          isOpen={showStreamWagonWheel}
          onClose={() => setShowStreamWagonWheel(false)}
          innings={currentInnings}
          battingTeam={battingTeam}
          bowlingTeam={bowlingTeam}
        />
      )}

      {/* ════ BROADCAST PRESENTATION CARDS ════ */}
      {streamPresentationCard !== 'none' && (
        <BroadcastCards
          cardType={streamPresentationCard}
          match={match}
          onClose={() => setStreamPresentationCard('none')}
        />
      )}

      {/* ════ FLOATING MOVABLE CIRCULAR FACECAM (BOTTOM RIGHT) ════ */}
      <MovableCircularCam streamerName={streamerName} />

    </div>
  );
};
