// GuffBox Cricket Studio — Star Sports Premium Broadcast Lower-Third Ticker v2.0

import React from 'react';
import { InningsState, Team, MatchMetadata, BallDeliveryEvent } from '../core/types';
import { calculateMatchRates } from '../core/target-calculator';

interface StarSportsTickerProps {
  battingTeam: Team;
  bowlingTeam: Team;
  innings: InningsState;
  metadata: MatchMetadata;
  isSecondInnings: boolean;
  target?: number;
  highlightNewBallId?: string;
}

export const StarSportsTicker: React.FC<StarSportsTickerProps> = ({
  battingTeam,
  bowlingTeam,
  innings,
  metadata,
  isSecondInnings,
  target,
  highlightNewBallId,
}) => {
  const striker = innings.batterStats[innings.strikerId];
  const nonStriker = innings.batterStats[innings.nonStrikerId];
  const bowler = innings.bowlerStats[innings.currentBowlerId];

  const maxOvers = metadata.curtailedOvers || metadata.scheduledOvers;
  const matchRates = calculateMatchRates({
    currentRuns: innings.totalRuns,
    legalBallsBowled: innings.legalBalls,
    maxOvers,
    target: target || metadata.targetRuns,
    wickets: innings.totalWickets,
    battingTeamName: battingTeam.name,
    bowlingTeamName: bowlingTeam.name,
    isFirstInnings: !isSecondInnings,
  });

  const getBallStyle = (ball: BallDeliveryEvent): string => {
    if (ball.wicket)
      return 'bg-gradient-to-b from-red-600 to-red-950 text-white border-yellow-400 shadow-[0_0_12px_rgba(239,68,68,0.8)]';
    if (ball.isSix)
      return 'bg-gradient-to-b from-red-800 to-red-950 text-yellow-300 border-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.7)]';
    if (ball.isFour)
      return 'bg-gradient-to-b from-blue-800 to-blue-950 text-white border-yellow-400/80 shadow-[0_0_12px_rgba(30,58,138,0.7)]';
    if (ball.extraType === 'wide' || ball.extraType === 'noball')
      return 'bg-gradient-to-b from-yellow-700 to-red-950 text-yellow-300 border-yellow-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]';
    if (ball.extraType === 'penalty')
      return 'bg-gradient-to-b from-blue-900 to-red-950 text-yellow-300 border-yellow-400';
    if (ball.runsBat === 0 && ball.runsExtras === 0)
      return 'bg-gradient-to-b from-blue-950 to-[#040818] text-white/90 border-blue-900/60';
    return 'bg-gradient-to-b from-blue-900 to-[#070d1e] text-yellow-300 border-blue-800/80';
  };

  const teamColor = battingTeam.color || '#1e3a8a';

  return (
    <div className="w-full font-sans select-none" style={{ filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.9))' }}>

      {/* ═══ MAIN LOWER-THIRD BAR ═══ */}
      <div className="relative flex items-stretch overflow-hidden" style={{ height: '76px' }}>

        {/* Cinematic background */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, rgba(8,16,38,0.98) 0%, rgba(32,5,11,0.98) 50%, rgba(8,16,38,0.98) 100%)',
          }}
        />

        {/* Top gold accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, #d4a017 15%, #facc15 40%, #fde68a 50%, #facc15 60%, #d4a017 85%, transparent 100%)',
          }}
        />

        {/* ── SECTION 1: TEAM BADGE + SCORE ── */}
        <div
          className="relative flex items-center px-4 gap-3 z-10 flex-shrink-0"
          style={{
            minWidth: '210px',
            background: `linear-gradient(135deg, ${teamColor}cc 0%, ${teamColor}44 60%, transparent 100%)`,
          }}
        >
          {/* Team badge circle */}
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center font-black text-base tracking-wider flex-shrink-0 border-2"
            style={{
              borderColor: '#facc15',
              background: 'rgba(0,0,0,0.6)',
              color: '#facc15',
              boxShadow: '0 0 15px rgba(250,204,21,0.4)',
              fontFamily: "'Teko', sans-serif",
              letterSpacing: '0.05em',
            }}
          >
            {battingTeam.shortName.substring(0, 3)}
          </div>

          {/* Score block */}
          <div className="flex flex-col leading-none">
            {/* Team name */}
            <span
              className="text-[12px] font-bold uppercase tracking-widest text-white"
              style={{ letterSpacing: '0.12em' }}
            >
              {battingTeam.shortName}
            </span>
            {/* Score */}
            <div className="flex items-baseline gap-1">
              <span
                style={{
                  fontFamily: "'Teko', sans-serif",
                  fontSize: '2.3rem',
                  lineHeight: 1,
                  fontWeight: 700,
                  color: '#ffffff',
                  textShadow: '0 2px 20px rgba(255,255,255,0.4)',
                  letterSpacing: '0.02em',
                }}
              >
                {innings.totalRuns}
              </span>
              <span
                style={{
                  fontFamily: "'Teko', sans-serif",
                  fontSize: '1.6rem',
                  lineHeight: 1,
                  fontWeight: 600,
                  color: '#facc15',
                  textShadow: '0 0 15px rgba(250,204,21,0.6)',
                }}
              >
                /{innings.totalWickets}
              </span>
            </div>
            {/* Overs */}
            <span className="text-[11px] font-semibold mt-0.5 text-white">
              <span className="text-white">OV </span>
              <span style={{ color: '#facc15', fontWeight: 800 }}>{innings.oversFormatted}</span>
              <span className="text-white/80"> / {maxOvers}</span>
            </span>
          </div>

          {/* Right divider */}
          <div
            className="absolute right-0 top-3 bottom-3 w-px"
            style={{ background: 'linear-gradient(180deg, transparent, rgba(250,204,21,0.4), transparent)' }}
          />
        </div>

        {/* ── SECTION 2: RUN RATES ── */}
        <div
          className="relative flex flex-col justify-center px-3 z-10 flex-shrink-0"
          style={{ minWidth: '115px', background: 'rgba(0,0,0,0.3)' }}
        >
          <div
            className="text-[10px] uppercase font-bold tracking-widest mb-1 text-yellow-400"
            style={{ letterSpacing: '0.15em' }}
          >
            {isSecondInnings ? 'CHASE' : 'INNINGS 1'}
          </div>
          <div className="text-[12px] font-semibold flex items-center gap-1.5">
            <span className="text-white">CRR</span>
            <span
              className="font-black"
              style={{ color: '#ffffff', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.95rem' }}
            >
              {matchRates.crrFormatted}
            </span>
          </div>
          {isSecondInnings && matchRates.targetRuns ? (
            <>
              <div
                className="text-[12px] font-bold mt-0.5 text-yellow-300"
              >
                TGT <span style={{ color: '#facc15', fontFamily: "'Teko', sans-serif", fontSize: '1.1rem' }}>{matchRates.targetRuns}</span>
              </div>
              <div
                className="text-[11px] font-bold text-yellow-400"
              >
                RRR <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{matchRates.rrrFormatted}</span>
              </div>
            </>
          ) : (
            <div className="text-[10px] mt-0.5 text-white/80 uppercase font-bold" style={{ letterSpacing: '0.1em' }}>
              {metadata.matchStage || '1st Inn'}
            </div>
          )}
          <div
            className="absolute right-0 top-3 bottom-3 w-px"
            style={{ background: 'linear-gradient(180deg, transparent, rgba(250,204,21,0.2), transparent)' }}
          />
        </div>

        {/* ── SECTION 3: BATSMEN ── */}
        <div
          className="relative flex flex-1 items-center px-4 gap-5 z-10"
          style={{ background: 'rgba(0,0,0,0.2)' }}
        >
          {/* Striker */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{
                background: '#facc15',
                boxShadow: '0 0 10px rgba(250,204,21,1), 0 0 20px rgba(250,204,21,0.6)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
            <div className="flex flex-col leading-none">
              <span
                className="font-bold text-[14px]"
                style={{ color: '#facc15', textShadow: '0 0 15px rgba(250,204,21,0.5)', whiteSpace: 'nowrap' }}
              >
                {striker?.name || 'Striker'} ★
              </span>
              <div className="flex items-center gap-2.5 mt-0.5">
                <span style={{ fontFamily: "'Teko', sans-serif", fontSize: '1.25rem', color: '#fff', lineHeight: 1, fontWeight: 700 }}>
                  {striker?.runs ?? 0}
                </span>
                <span className="text-[11px] font-semibold text-white">
                  ({striker?.ballsFaced ?? 0}b)
                </span>
                <span className="text-[11px] font-bold text-white">4s:{striker?.fours ?? 0}</span>
                <span className="text-[11px] font-black text-yellow-300">6s:{striker?.sixes ?? 0}</span>
                <span className="text-[11px] font-bold text-white">
                  SR:{striker?.strikeRate ?? 0}
                </span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-8 w-px flex-shrink-0" style={{ background: 'rgba(250,204,21,0.2)' }} />

          {/* Non-Striker */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.7)', flexShrink: 0 }}
            />
            <div className="flex flex-col leading-none">
              <span className="font-semibold text-[13px] text-white" style={{ whiteSpace: 'nowrap' }}>
                {nonStriker?.name || 'Non-Striker'}
              </span>
              <div className="flex items-center gap-2.5 mt-0.5">
                <span style={{ fontFamily: "'Teko', sans-serif", fontSize: '1.15rem', color: '#ffffff', lineHeight: 1, fontWeight: 600 }}>
                  {nonStriker?.runs ?? 0}
                </span>
                <span className="text-[11px] font-semibold text-yellow-300">
                  ({nonStriker?.ballsFaced ?? 0}b)
                </span>
                <span className="text-[11px] font-bold text-white">4s:{nonStriker?.fours ?? 0}</span>
                <span className="text-[11px] font-black text-yellow-300">6s:{nonStriker?.sixes ?? 0}</span>
              </div>
            </div>
          </div>

          <div
            className="absolute right-0 top-3 bottom-3 w-px"
            style={{ background: 'linear-gradient(180deg, transparent, rgba(250,204,21,0.2), transparent)' }}
          />
        </div>

        {/* ── SECTION 4: BOWLER ── */}
        <div
          className="relative flex items-center px-3 z-10 flex-shrink-0"
          style={{ minWidth: '165px', background: 'rgba(0,0,0,0.3)' }}
        >
          <div className="flex flex-col leading-none">
            <span
              className="text-[10px] font-bold uppercase tracking-widest mb-1 text-yellow-400"
              style={{ letterSpacing: '0.15em' }}
            >
              🎯 Bowling
            </span>
            <span
              className="font-bold text-[14px] truncate text-white"
              style={{ maxWidth: '140px' }}
            >
              {bowler?.name || 'Bowler'}
            </span>
            <div
              className="text-[12px] mt-0.5 font-bold"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: '#ffffff' }}
            >
              {bowler?.oversFormatted ?? '0.0'}-{bowler?.maidens ?? 0}-
              <span style={{ color: '#fff' }}>{bowler?.runsConceded ?? 0}</span>-
              <span style={{ color: '#facc15', fontWeight: 900 }}>{bowler?.wickets ?? 0}</span>
              <span className="text-[10px] font-semibold ml-1.5 text-yellow-300">
                eco:{bowler?.economyRate ?? 0}
              </span>
            </div>
          </div>
          <div
            className="absolute right-0 top-3 bottom-3 w-px"
            style={{ background: 'linear-gradient(180deg, transparent, rgba(250,204,21,0.2), transparent)' }}
          />
        </div>

        {/* ── SECTION 5: THIS OVER BALLS ── */}
        <div
          className="relative flex items-center px-3 gap-2 z-10 flex-shrink-0"
          style={{ minWidth: '210px', background: 'rgba(0,0,0,0.4)' }}
        >
          <span
            className="text-[9px] font-bold uppercase tracking-widest flex-shrink-0"
            style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '0.18em', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            THIS OVER
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {innings.recentBalls.length === 0 ? (
              <div className="flex gap-1">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border flex items-center justify-center"
                    style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}
                  />
                ))}
              </div>
            ) : (
              innings.recentBalls.map((ball) => {
                const isJustDocked = ball.id === highlightNewBallId;
                return (
                  <div
                    key={ball.id}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border ${getBallStyle(ball)} transition-all duration-300 ${
                      isJustDocked ? 'scale-125 ring-2 ring-yellow-300 animate-dock-ball' : ''
                    }`}
                  >
                    {ball.displayBadge}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Free Hit badge ── */}
        {innings.isFreeHitActive && (
          <div
            className="absolute top-2 right-3 z-20 text-[10px] font-black px-2 py-0.5 rounded"
            style={{
              background: 'linear-gradient(135deg, #dc2626, #991b1b)',
              color: '#fef3c7',
              boxShadow: '0 0 15px rgba(220,38,38,0.7)',
              animation: 'pulse 1s ease-in-out infinite',
              letterSpacing: '0.08em',
            }}
          >
            ⚡ FREE HIT
          </div>
        )}
      </div>

      {/* ═══ SECOND INNINGS CHASE BAR (Brand Kit: Dark Red Velvet with Yellow/White Text) ═══ */}
      {isSecondInnings && matchRates.runsNeeded !== null && (
        <div
          className="relative overflow-hidden border-t"
          style={{
            background: 'linear-gradient(90deg, #1a0408 0%, #2e060d 30%, #450812 50%, #2e060d 70%, #1a0408 100%)',
            borderColor: 'rgba(250,204,21,0.25)',
            height: '24px',
          }}
        >
          {/* Progress fill */}
          <div
            className="absolute left-0 top-0 bottom-0 transition-all duration-700"
            style={{
              width: `${Math.min(100, (innings.totalRuns / (matchRates.targetRuns || 1)) * 100)}%`,
              background: 'linear-gradient(90deg, rgba(185,28,28,0.5), rgba(250,204,21,0.6))',
              borderRight: '2px solid #facc15',
            }}
          />
          <div className="relative z-10 h-full flex items-center justify-between px-4">
            <span className="text-[11px] font-black tracking-wider text-white">
              {battingTeam.name.toUpperCase()} NEED{' '}
              <span style={{ color: '#facc15', fontSize: '0.85rem' }}>{matchRates.runsNeeded}</span> OFF{' '}
              <span className="text-white font-bold">{matchRates.ballsRemaining} BALLS</span>
            </span>
            {innings.isFreeHitActive && (
              <span
                className="text-[9px] font-black px-2 py-0.5 rounded border border-yellow-400"
                style={{ background: '#b91c1c', color: '#fef3c7', letterSpacing: '0.08em' }}
              >
                ⚡ FREE HIT NEXT BALL
              </span>
            )}
            <span className="text-[11px] font-bold text-white/90">
              TARGET: <span style={{ color: '#facc15', fontWeight: 900 }}>{matchRates.targetRuns}</span>{' '}
              <span className="text-yellow-300">({maxOvers} OV)</span>
            </span>
          </div>
        </div>
      )}

    </div>
  );
};
