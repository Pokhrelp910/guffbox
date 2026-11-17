// GuffBox Cricket Studio — Premium TV Broadcast Full Scoreboard v2.0

import React, { useEffect } from 'react';
import { InningsState, Team, MatchMetadata } from '../core/types';
import { TeamLogo, PlayerAvatar } from '../utils/avatarUtils';

interface FullScorecardProps {
  battingTeam: Team;
  bowlingTeam: Team;
  innings: InningsState;
  metadata: MatchMetadata;
  onClose?: () => void;
}

export const FullScorecard: React.FC<FullScorecardProps> = ({
  battingTeam,
  bowlingTeam,
  innings,
  metadata,
  onClose,
}) => {
  const maxOvers = metadata.curtailedOvers || metadata.scheduledOvers;
  const battersList = Object.values(innings.batterStats);
  const bowlersList = Object.values(innings.bowlerStats);
  const runRate = (innings.totalRuns / Math.max(1, innings.legalBalls / 6)).toFixed(2);

  // Keyboard shortcut listener to close on ESC key
  useEffect(() => {
    if (!onClose) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto select-none"
      style={{
        background: 'radial-gradient(ellipse at 20% 20%, #0d1b40 0%, #060b1c 60%, #02040a 100%), radial-gradient(ellipse at 80% 80%, #3d0710 0%, transparent 70%)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* ═══ FIXED FLOATING CLOSE BUTTON (ALWAYS VISIBLE & NEVER SCROLLS AWAY) ═══ */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="fixed top-4 right-6 z-[60] bg-red-700 hover:bg-red-600 text-yellow-300 font-black px-4 py-2 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.6)] flex items-center space-x-2 border border-yellow-400/60 hover:scale-105 transition cursor-pointer"
          title="Close Full Scorecard [Esc]"
        >
          <span className="text-base leading-none text-white">✕</span>
          <span className="text-xs uppercase tracking-wider text-yellow-300">Close [Esc]</span>
        </button>
      )}

      {/* ═══ HEADER (STICKY SO IT STAYS VISIBLE ON SCROLL) ═══ */}
      <div
        className="sticky top-0 z-40 overflow-hidden px-6 sm:px-8 pt-4 pb-4 shadow-xl backdrop-blur-md"
        style={{
          borderBottom: '1px solid rgba(250,204,21,0.25)',
          background: 'linear-gradient(90deg, rgba(8,16,38,0.98) 0%, rgba(32,5,11,0.98) 50%, rgba(8,16,38,0.98) 100%)',
        }}
      >
        {/* Background shimmer */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(250,204,21,0.5), transparent 70%)',
          }}
        />

        {/* Top gold line */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background: 'linear-gradient(90deg, transparent, #d4a017 20%, #facc15 50%, #d4a017 80%, transparent)',
          }}
        />

        <div className="relative z-10 flex items-start justify-between">
          {/* Tournament info */}
          <div>
            <div
              className="font-black uppercase tracking-widest"
              style={{
                fontFamily: "'Teko', sans-serif",
                fontSize: '1.6rem',
                color: '#facc15',
                textShadow: '0 0 20px rgba(250,204,21,0.5)',
                letterSpacing: '0.12em',
              }}
            >
              {metadata.tournamentName.toUpperCase()}
            </div>
            <div
              className="font-bold uppercase tracking-widest mt-0.5 text-white/80"
              style={{
                fontSize: '0.75rem',
                letterSpacing: '0.2em',
              }}
            >
              <span className="text-yellow-400">{metadata.matchStage}</span> &nbsp;•&nbsp; <span className="text-white">{metadata.venue}</span> &nbsp;•&nbsp; <span className="text-yellow-300">{metadata.date}</span>
            </div>
            <div
              className="mt-1 text-sm font-semibold text-white"
            >
              {battingTeam.name}{' '}
              <span className="text-yellow-400">vs</span>{' '}
              {bowlingTeam.name}
            </div>
          </div>

          {/* Score hero */}
          <div className="flex items-center gap-4">
            <TeamLogo
              name={battingTeam.name}
              shortName={battingTeam.shortName}
              logoUrl={battingTeam.logoUrl}
              color={battingTeam.color}
              size="lg"
              className="border border-yellow-400/40 shadow-lg"
            />
            <div className="text-right">
              <div
                className="font-black"
                style={{
                  fontFamily: "'Teko', sans-serif",
                  fontSize: '3rem',
                  lineHeight: 1,
                  color: '#ffffff',
                  textShadow: '0 0 30px rgba(255,255,255,0.3)',
                }}
              >
                {battingTeam.shortName}{' '}
                <span style={{ color: '#facc15' }}>{innings.totalRuns}</span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '2rem' }}>/{innings.totalWickets}</span>
              </div>
              <div
                className="text-xs font-bold mt-0.5"
                style={{ color: 'rgba(250,204,21,0.7)', letterSpacing: '0.12em', textTransform: 'uppercase' }}
              >
                {innings.oversFormatted} / {maxOvers} Overs &nbsp;·&nbsp; RR: {runRate}
              </div>
            </div>

            {/* Close button */}
            {onClose && (
              <button
                onClick={onClose}
                className="transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#94a3b8',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  (e.target as HTMLButtonElement).style.background = 'rgba(239,68,68,0.15)';
                  (e.target as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.4)';
                  (e.target as HTMLButtonElement).style.color = '#fca5a5';
                }}
                onMouseLeave={e => {
                  (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
                  (e.target as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)';
                  (e.target as HTMLButtonElement).style.color = '#94a3b8';
                }}
              >
                ✕ Close
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ═══ CONTENT GRID ═══ */}
      <div className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── BATTING SCORECARD ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Section title */}
          <div className="flex items-center gap-2 pb-2">
            <div className="w-1 h-6 rounded-full" style={{ background: 'linear-gradient(180deg, #facc15, #d97706)' }} />
            <h2
              className="font-black uppercase tracking-widest"
              style={{ color: '#facc15', fontSize: '0.75rem', letterSpacing: '0.2em' }}
            >
              🏏 Batting — {battingTeam.name.toUpperCase()}
            </h2>
          </div>

          {/* Table */}
          <div
            className="overflow-hidden"
            style={{
              borderRadius: '14px',
              border: '1px solid rgba(250,204,21,0.25)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
              background: 'linear-gradient(145deg, rgba(10,18,44,0.96) 0%, rgba(5,10,24,0.98) 100%)',
            }}
          >
            <table className="w-full text-left">
              <thead>
                <tr
                  style={{
                    background: 'rgba(0,0,0,0.6)',
                    borderBottom: '1px solid rgba(250,204,21,0.25)',
                  }}
                >
                  {['Batter', 'How Out', 'R', 'B', '4s', '6s', 'SR'].map((h, i) => (
                    <th
                      key={h}
                      className="py-3 font-bold uppercase"
                      style={{
                        fontSize: '0.65rem',
                        letterSpacing: '0.18em',
                        color: '#facc15',
                        paddingLeft: i === 0 ? '1.25rem' : '0.75rem',
                        paddingRight: i === 6 ? '1.25rem' : '0.5rem',
                        textAlign: i >= 2 ? 'right' : 'left',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {battersList.map((b, idx) => {
                  const isStriker = b.playerId === innings.strikerId;
                  const isNonStriker = b.playerId === innings.nonStrikerId;
                  const isBatting = !b.isOut && b.ballsFaced > 0;

                  return (
                    <tr
                      key={b.playerId}
                      style={{
                        background: isStriker
                          ? 'rgba(250,204,21,0.12)'
                          : isNonStriker
                          ? 'rgba(250,204,21,0.05)'
                          : idx % 2 === 0
                          ? 'rgba(255,255,255,0.02)'
                          : 'transparent',
                        borderBottom: '1px solid rgba(250,204,21,0.1)',
                        transition: 'background 0.2s',
                      }}
                    >
                      <td className="py-2 pl-3 pr-2">
                        <div className="flex items-center gap-2">
                          <PlayerAvatar
                            name={b.name}
                            photoUrl={battingTeam.squad?.find((p) => p.id === b.playerId)?.photoUrl}
                            role="batsman"
                            teamColor={battingTeam.color}
                            size="xs"
                          />
                          {isStriker && (
                            <div
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ background: '#facc15', boxShadow: '0 0 6px rgba(250,204,21,0.9)' }}
                            />
                          )}
                          {!isStriker && <div className="w-1.5 flex-shrink-0" />}
                          <span
                            className="font-bold text-sm"
                            style={{
                              color: isStriker ? '#fde047' : isBatting ? '#ffffff' : b.isOut ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.4)',
                              textShadow: isStriker ? '0 0 10px rgba(250,204,21,0.4)' : 'none',
                            }}
                          >
                            {b.name}
                            {isStriker && <span style={{ color: '#facc15', marginLeft: '4px' }}>*</span>}
                          </span>
                        </div>
                      </td>
                      <td
                        className="py-2.5 px-3 text-xs italic"
                        style={{ color: b.isOut ? '#ffffff' : isBatting ? '#fde047' : 'rgba(255,255,255,0.35)' }}
                      >
                        {b.isOut ? (b.dismissalDescription || 'out') : (b.ballsFaced > 0 ? 'not out' : 'yet to bat')}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className="font-black text-sm"
                          style={{
                            color: '#facc15',
                            textShadow: b.runs >= 50 ? '0 0 10px rgba(250,204,21,0.6)' : 'none',
                          }}
                        >
                          {b.runs}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-sm" style={{ color: '#ffffff', fontFamily: "'JetBrains Mono', monospace" }}>
                        {b.ballsFaced}
                      </td>
                      <td className="py-2.5 px-3 text-right text-sm font-bold" style={{ color: '#ffffff' }}>
                        {b.fours}
                      </td>
                      <td className="py-2.5 px-3 text-right text-sm font-black" style={{ color: '#facc15' }}>
                        {b.sixes}
                      </td>
                      <td
                        className="py-2.5 pl-3 pr-5 text-right font-bold text-sm"
                        style={{
                          color: b.strikeRate >= 100 ? '#facc15' : '#ffffff',
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {b.strikeRate.toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Extras & Total */}
          <div
            className="flex items-center justify-between px-5 py-3 text-sm"
            style={{
              borderRadius: '12px',
              border: '1px solid rgba(250,204,21,0.25)',
              background: 'linear-gradient(90deg, rgba(10,18,44,0.96) 0%, rgba(38,6,14,0.95) 100%)',
            }}
          >
            <div style={{ color: '#ffffff' }}>
              <span className="font-bold uppercase tracking-wide text-xs" style={{ color: '#facc15', letterSpacing: '0.15em' }}>Extras </span>
              <span style={{ color: '#ffffff' }}>
                <strong style={{ color: '#facc15' }}>{innings.extras.total}</strong>
                {' '}(w {innings.extras.wides}, nb {innings.extras.noBalls}, b {innings.extras.byes}, lb {innings.extras.legByes}
                {innings.extras.penalties > 0 ? `, pen ${innings.extras.penalties}` : ''})
              </span>
            </div>
            <div
              className="font-black"
              style={{
                fontFamily: "'Teko', sans-serif",
                fontSize: '1.3rem',
                color: '#fff',
              }}
            >
              TOTAL:{' '}
              <span style={{ color: '#facc15', textShadow: '0 0 15px rgba(250,204,21,0.5)' }}>{innings.totalRuns}</span>
              <span
                className="text-sm font-normal ml-2"
                style={{ color: '#ffffff', fontFamily: 'Inter, sans-serif' }}
              >
                ({innings.totalWickets} wkts, {innings.oversFormatted} ov)
              </span>
            </div>
          </div>

          {/* Fall of Wickets */}
          {innings.fallOfWickets.length > 0 && (
            <div
              className="px-5 py-4"
              style={{
                borderRadius: '12px',
                border: '1px solid rgba(250,204,21,0.25)',
                background: 'rgba(32,5,11,0.9)',
              }}
            >
              <h3
                className="text-xs font-black uppercase tracking-widest mb-3"
                style={{ color: '#facc15', letterSpacing: '0.2em' }}
              >
                Fall of Wickets
              </h3>
              <div className="flex flex-wrap gap-2">
                {innings.fallOfWickets.map((fow) => (
                  <div
                    key={fow.wicketNumber}
                    className="text-xs font-semibold px-3 py-1 rounded-full"
                    style={{
                      background: 'rgba(185,28,28,0.3)',
                      border: '1px solid rgba(250,204,21,0.3)',
                      color: '#ffffff',
                    }}
                  >
                    <strong style={{ color: '#facc15' }}>{fow.wicketNumber}-{fow.score}</strong>
                    <span style={{ color: '#ffffff' }}> ({fow.playerName}, {fow.overs})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── BOWLING CARD (Dark Red Velvet Surface with Gold/Yellow Accents) ── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2">
            <div className="w-1 h-6 rounded-full" style={{ background: 'linear-gradient(180deg, #b91c1c, #facc15)' }} />
            <h2
              className="font-black uppercase tracking-widest"
              style={{ color: '#facc15', fontSize: '0.75rem', letterSpacing: '0.2em' }}
            >
              🎯 Bowling — {bowlingTeam.name.toUpperCase()}
            </h2>
          </div>

          <div
            className="overflow-hidden"
            style={{
              borderRadius: '14px',
              border: '1px solid rgba(250,204,21,0.25)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
              background: 'linear-gradient(145deg, rgba(38,6,14,0.96) 0%, rgba(18,3,7,0.98) 100%)',
            }}
          >
            <table className="w-full text-left">
              <thead>
                <tr
                  style={{
                    background: 'rgba(0,0,0,0.6)',
                    borderBottom: '1px solid rgba(250,204,21,0.25)',
                  }}
                >
                  {['Bowler', 'O', 'M', 'R', 'W', 'Eco'].map((h, i) => (
                    <th
                      key={h}
                      className="py-3 font-bold uppercase"
                      style={{
                        fontSize: '0.65rem',
                        letterSpacing: '0.18em',
                        color: '#facc15',
                        paddingLeft: i === 0 ? '1.25rem' : '0.5rem',
                        paddingRight: i === 5 ? '1.25rem' : '0.5rem',
                        textAlign: i >= 1 ? 'right' : 'left',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bowlersList.map((bw, idx) => {
                  const isCurrentBowler = bw.playerId === innings.currentBowlerId;
                  return (
                    <tr
                      key={bw.playerId}
                      style={{
                        background: isCurrentBowler
                          ? 'rgba(250,204,21,0.12)'
                          : idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                        borderBottom: '1px solid rgba(250,204,21,0.1)',
                      }}
                    >
                      <td className="py-2.5 pl-5 pr-3">
                        <div className="flex items-center gap-2">
                          {isCurrentBowler && (
                            <div
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ background: '#facc15', boxShadow: '0 0 6px rgba(250,204,21,0.9)' }}
                            />
                          )}
                          {!isCurrentBowler && <div className="w-1.5 flex-shrink-0" />}
                          <span
                            className="font-bold text-sm"
                            style={{
                              color: isCurrentBowler ? '#fde047' : '#ffffff',
                              textShadow: isCurrentBowler ? '0 0 10px rgba(250,204,21,0.4)' : 'none',
                            }}
                          >
                            {bw.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-right text-sm" style={{ color: '#ffffff', fontFamily: "'JetBrains Mono', monospace" }}>
                        {bw.oversFormatted}
                      </td>
                      <td className="py-2.5 px-2 text-right text-sm" style={{ color: '#ffffff' }}>
                        {bw.maidens}
                      </td>
                      <td className="py-2.5 px-2 text-right font-bold text-sm" style={{ color: '#ffffff' }}>
                        {bw.runsConceded}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <span
                          className="font-black text-sm"
                          style={{
                            color: '#facc15',
                            textShadow: bw.wickets >= 3 ? '0 0 10px rgba(250,204,21,0.7)' : 'none',
                          }}
                        >
                          {bw.wickets}
                        </span>
                      </td>
                      <td
                        className="py-2.5 pl-2 pr-5 text-right font-bold text-sm"
                        style={{
                          color: bw.economyRate <= 7 ? '#facc15' : '#ffffff',
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {bw.economyRate.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Close Button Bar */}
        <div className="col-span-1 lg:col-span-3 pt-4 pb-12 flex justify-center">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="bg-gradient-to-r from-red-950 via-slate-900 to-blue-950 hover:from-red-900 hover:to-blue-900 border border-yellow-400/50 text-yellow-300 hover:text-white font-black text-sm px-8 py-3 rounded-2xl shadow-2xl transition flex items-center space-x-2 cursor-pointer hover:scale-105"
            >
              <span className="text-base text-white">✕</span>
              <span className="text-yellow-300">Close Full Scorecard</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
