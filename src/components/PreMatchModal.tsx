// GuffBox Cricket Studio — Pre-Match Setup, Playing 11 & Toss Engine

import React, { useState } from 'react';
import { Team, Player, TossInfo, MatchMetadata } from '../core/types';

interface PreMatchModalProps {
  isOpen: boolean;
  onStartMatch: (params: {
    metadata: MatchMetadata;
    teamA: Team;
    teamB: Team;
    toss: TossInfo;
    strikerId: string;
    nonStrikerId: string;
    openingBowlerId: string;
  }) => void;
  onClose?: () => void;
}

const DEFAULT_TEAM_A_SQUAD: Player[] = [
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
];

const DEFAULT_TEAM_B_SQUAD: Player[] = [
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
];

export const PreMatchModal: React.FC<PreMatchModalProps> = ({
  isOpen,
  onStartMatch,
  onClose,
}) => {
  const [tournamentName, setTournamentName] = useState('ICC T20 Cricket Championship');
  const [matchStage, setMatchStage] = useState('League Match #14');
  const [venue, setVenue] = useState('TU International Cricket Ground, Kirtipur');
  const [scheduledOvers, setScheduledOvers] = useState(20);

  const [teamAName, setTeamAName] = useState('Nepal');
  const [teamAShort, setTeamAShort] = useState('NEP');
  const [teamAColor] = useState('#1e3a8a');
  const [teamASquad] = useState<Player[]>(DEFAULT_TEAM_A_SQUAD);

  const [teamBName, setTeamBName] = useState('India');
  const [teamBShort, setTeamBShort] = useState('IND');
  const [teamBColor] = useState('#0284c7');
  const [teamBSquad] = useState<Player[]>(DEFAULT_TEAM_B_SQUAD);

  const [tossWinner, setTossWinner] = useState<'A' | 'B'>('A');
  const [tossDecision, setTossDecision] = useState<'bat' | 'bowl'>('bat');

  const [strikerId, setStrikerId] = useState(DEFAULT_TEAM_A_SQUAD[0].id);
  const [nonStrikerId, setNonStrikerId] = useState(DEFAULT_TEAM_A_SQUAD[1].id);
  const [openingBowlerId, setOpeningBowlerId] = useState(DEFAULT_TEAM_B_SQUAD[8].id);

  if (!isOpen) return null;

  // Determine which team bats first based on toss
  const battingTeamIsA = (tossWinner === 'A' && tossDecision === 'bat') || (tossWinner === 'B' && tossDecision === 'bowl');
  const battingSquad = battingTeamIsA ? teamASquad : teamBSquad;
  const bowlingSquad = battingTeamIsA ? teamBSquad : teamASquad;

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();

    const teamA: Team = {
      id: 'team_a',
      name: teamAName,
      shortName: teamAShort,
      color: teamAColor,
      squad: teamASquad,
      playing11: teamASquad.map((p) => p.id),
    };

    const teamB: Team = {
      id: 'team_b',
      name: teamBName,
      shortName: teamBShort,
      color: teamBColor,
      squad: teamBSquad,
      playing11: teamBSquad.map((p) => p.id),
    };

    const metadata: MatchMetadata = {
      id: `match_${Date.now()}`,
      tournamentName,
      matchStage,
      venue,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      scheduledOvers,
    };

    const toss: TossInfo = {
      winnerTeamId: tossWinner === 'A' ? 'team_a' : 'team_b',
      electedTo: tossDecision,
    };

    onStartMatch({
      metadata,
      teamA,
      teamB,
      toss,
      strikerId,
      nonStrikerId,
      openingBowlerId,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-6 font-sans text-white overflow-y-auto">
      <div className="bg-slate-900 border-2 border-yellow-500 rounded-3xl w-full max-w-4xl p-8 shadow-2xl space-y-6 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">🏆</span>
            <div>
              <h2 className="text-2xl font-black font-['Teko'] tracking-wider text-yellow-400">
                PRE-MATCH SETUP & TOSS ENGINE
              </h2>
              <p className="text-xs text-slate-400">
                Configure tournament, playing XI with Captain/Keeper badges, and toss decision.
              </p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-slate-400 hover:text-white font-bold text-lg">
              ✕
            </button>
          )}
        </div>

        <form onSubmit={handleStart} className="space-y-6">
          {/* Metadata Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Tournament Name
              </label>
              <input
                type="text"
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-yellow-400"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Stage / Match No
              </label>
              <input
                type="text"
                value={matchStage}
                onChange={(e) => setMatchStage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-yellow-400"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Scheduled Overs
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={scheduledOvers}
                onChange={(e) => setScheduledOvers(parseInt(e.target.value, 10) || 20)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-yellow-300 font-bold focus:outline-none focus:border-yellow-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Venue (Stadium & City)
            </label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-yellow-400"
            />
          </div>

          {/* Teams Setup Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Team A */}
            <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl space-y-3">
              <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-wider flex items-center justify-between">
                <span>Team 1 (Host / Team A)</span>
                <span className="text-xs text-slate-400 font-normal">11 Players</span>
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={teamAName}
                  onChange={(e) => setTeamAName(e.target.value)}
                  placeholder="Team Name"
                  className="col-span-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                />
                <input
                  type="text"
                  value={teamAShort}
                  onChange={(e) => setTeamAShort(e.target.value.toUpperCase())}
                  placeholder="Code"
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-yellow-300 font-bold uppercase"
                />
              </div>

              {/* Roster preview */}
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1 text-xs">
                {teamASquad.map((p, idx) => (
                  <div key={p.id} className="flex items-center justify-between bg-slate-900/60 px-2 py-1 rounded">
                    <span>
                      {idx + 1}. {p.name}
                      {p.isCaptain && <span className="ml-1 text-yellow-400 font-bold">(C)</span>}
                      {p.isWicketKeeper && <span className="ml-1 text-blue-400 font-bold">(WK)</span>}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase">{p.role}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Team B */}
            <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl space-y-3">
              <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-wider flex items-center justify-between">
                <span>Team 2 (Opponent / Team B)</span>
                <span className="text-xs text-slate-400 font-normal">11 Players</span>
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={teamBName}
                  onChange={(e) => setTeamBName(e.target.value)}
                  placeholder="Team Name"
                  className="col-span-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                />
                <input
                  type="text"
                  value={teamBShort}
                  onChange={(e) => setTeamBShort(e.target.value.toUpperCase())}
                  placeholder="Code"
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-yellow-300 font-bold uppercase"
                />
              </div>

              {/* Roster preview */}
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1 text-xs">
                {teamBSquad.map((p, idx) => (
                  <div key={p.id} className="flex items-center justify-between bg-slate-900/60 px-2 py-1 rounded">
                    <span>
                      {idx + 1}. {p.name}
                      {p.isCaptain && <span className="ml-1 text-yellow-400 font-bold">(C)</span>}
                      {p.isWicketKeeper && <span className="ml-1 text-blue-400 font-bold">(WK)</span>}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase">{p.role}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Toss Engine */}
          <div className="bg-slate-950 border border-yellow-500/40 p-5 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-2">
              <span>🪙</span> OFFICIAL TOSS ENGINE
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  Toss Won By:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTossWinner('A')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs border transition ${
                      tossWinner === 'A'
                        ? 'bg-yellow-500 border-white text-slate-950 font-black shadow-md'
                        : 'bg-slate-900 border-slate-700 text-slate-300'
                    }`}
                  >
                    {teamAName || 'Team A'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTossWinner('B')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs border transition ${
                      tossWinner === 'B'
                        ? 'bg-yellow-500 border-white text-slate-950 font-black shadow-md'
                        : 'bg-slate-900 border-slate-700 text-slate-300'
                    }`}
                  >
                    {teamBName || 'Team B'}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  Elected To:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTossDecision('bat')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs border transition ${
                      tossDecision === 'bat'
                        ? 'bg-yellow-500 border-white text-slate-950 font-black shadow-md'
                        : 'bg-slate-900 border-slate-700 text-slate-300'
                    }`}
                  >
                    🏏 Bat First
                  </button>
                  <button
                    type="button"
                    onClick={() => setTossDecision('bowl')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs border transition ${
                      tossDecision === 'bowl'
                        ? 'bg-yellow-500 border-white text-slate-950 font-black shadow-md'
                        : 'bg-slate-900 border-slate-700 text-slate-300'
                    }`}
                  >
                    🎯 Bowl First
                  </button>
                </div>
              </div>
            </div>

            <div className="text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 p-2.5 rounded-xl">
              Toss Summary: <strong>{tossWinner === 'A' ? teamAName : teamBName}</strong> won the toss and elected to <strong>{tossDecision.toUpperCase()}</strong> first.
            </div>
          </div>

          {/* Opening Batters & Bowler Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/80 p-5 rounded-2xl border border-slate-800">
            <div>
              <label className="text-xs font-bold text-yellow-400 uppercase tracking-wider block mb-1">
                Opening Striker (Batting)
              </label>
              <select
                value={strikerId}
                onChange={(e) => setStrikerId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-400"
              >
                {battingSquad.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-yellow-400 uppercase tracking-wider block mb-1">
                Non-Striker (Batting)
              </label>
              <select
                value={nonStrikerId}
                onChange={(e) => setNonStrikerId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-400"
              >
                {battingSquad
                  .filter((p) => p.id !== strikerId)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-yellow-400 uppercase tracking-wider block mb-1">
                Opening Bowler
              </label>
              <select
                value={openingBowlerId}
                onChange={(e) => setOpeningBowlerId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-400"
              >
                {bowlingSquad.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black text-base py-3.5 rounded-2xl shadow-xl transition uppercase tracking-wider"
            >
              Start Live Match & Initialize Overlays 🚀
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
