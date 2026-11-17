// GuffBox Cricket Studio — Live Match Player Search & Dynamic Creator Modal
// Allows scorers to "Type & Find" bowlers/batters mid-match, or create brand new players on the fly with cartoon avatars

import React, { useState } from 'react';
import { Player, Team, BowlerStats, BatterStats } from '../core/types';
import { PlayerAvatar } from '../utils/avatarUtils';
import { addPlayerToTeamInDatabase } from '../lib/teamDatabase';
import { Search, Plus, UserCheck, Shield, X, AlertCircle } from 'lucide-react';

interface LivePlayerPickerModalProps {
  isOpen: boolean;
  mode: 'bowler' | 'striker' | 'nonStriker';
  team: Team;
  currentSelectedId?: string;
  onSelectPlayer: (playerId: string) => void;
  onAddNewPlayer: (teamId: string, player: Player, selectAs: 'bowler' | 'striker' | 'nonStriker') => void;
  onClose: () => void;
  bowlerStats?: Record<string, BowlerStats>;
  batterStats?: Record<string, BatterStats>;
  maxOversPerBowler?: number;
  excludePlayerIds?: string[];
}

export const LivePlayerPickerModal: React.FC<LivePlayerPickerModalProps> = ({
  isOpen,
  mode,
  team,
  currentSelectedId,
  onSelectPlayer,
  onAddNewPlayer,
  onClose,
  bowlerStats = {},
  batterStats = {},
  maxOversPerBowler = 4,
  excludePlayerIds = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerRole, setNewPlayerRole] = useState<Player['role']>(
    mode === 'bowler' ? 'bowler' : 'batsman'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const modeLabels = {
    bowler: {
      title: 'SELECT OR ADD BOWLER',
      sub: 'बलर छान्नुहोस् वा टाइप गरी नयाँ बलर थप्नुहोस्',
      icon: '🎯',
      btnText: 'Bowl This Over',
    },
    striker: {
      title: 'SELECT OR ADD STRIKER (FACING)',
      sub: 'स्ट्राइकर ब्याटर छान्नुहोस् वा नयाँ थप्नुहोस्',
      icon: '🏏',
      btnText: 'Set as Striker',
    },
    nonStriker: {
      title: 'SELECT OR ADD NON-STRIKER (RUNNER)',
      sub: 'नन-स्ट्राइकर ब्याटर छान्नुहोस् वा नयाँ थप्नुहोस्',
      icon: '🏃',
      btnText: 'Set as Non-Striker',
    },
  };

  const meta = modeLabels[mode];

  // Separate squad into Playing XI and Squad Bench
  const playing11Ids = new Set(team.playing11 || []);
  const allSquad = team.squad || [];

  // Filter out excluded players (e.g. current partner if picking batter)
  const eligiblePlayers = allSquad.filter((p) => !excludePlayerIds.includes(p.id));

  // Search filter
  const query = searchQuery.trim().toLowerCase();
  const filteredPlayers = eligiblePlayers.filter((p) => {
    if (!query) return true;
    return (
      p.name.toLowerCase().includes(query) ||
      p.role.toLowerCase().includes(query)
    );
  });

  const exactMatchExists = allSquad.some(
    (p) => p.name.trim().toLowerCase() === (query || newPlayerName.trim().toLowerCase())
  );

  const handleCreatePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = (newPlayerName || searchQuery).trim();
    if (!trimmed) {
      setErrorMessage('Please enter a player name.');
      return;
    }

    // Save to team database with duplicate prevention
    const result = addPlayerToTeamInDatabase(team, {
      name: trimmed,
      role: newPlayerRole,
    });

    if (!result.success || !result.player) {
      setErrorMessage(result.error || 'Failed to add player to database.');
      return;
    }

    // Notify parent to add to live match state
    onAddNewPlayer(team.id, result.player, mode);
    onSelectPlayer(result.player.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 font-sans text-white"
      style={{
        background: 'radial-gradient(circle at center, rgba(14,25,56,0.92) 0%, rgba(26,4,8,0.96) 100%)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="bg-gradient-to-br from-[#081026] via-[#050a18] to-[#1c050a] border-2 border-yellow-500/50 rounded-3xl w-full max-w-xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-yellow-500/20 pb-3 mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">{meta.icon}</span>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-black font-['Teko'] tracking-wider text-yellow-400">
                  {meta.title}
                </h2>
                <span className="text-[10px] bg-red-950 text-yellow-300 font-bold px-2 py-0.5 rounded-full border border-red-700">
                  {team.name}
                </span>
              </div>
              <p className="text-[11px] text-white/80">{meta.sub}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#14224c] hover:bg-[#1f3575] text-white hover:text-yellow-300 flex items-center justify-center transition border border-yellow-500/30 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="mb-3 p-2.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Search Bar (Type & Find) */}
        <div className="relative mb-3">
          <Search className="w-4 h-4 absolute left-3 top-3 text-yellow-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setErrorMessage(null);
            }}
            placeholder={`🔍 Type ${mode} name to search squad or create new...`}
            autoFocus
            className="w-full bg-[#070e24] border border-yellow-500/40 rounded-xl pl-9 pr-8 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-yellow-400 font-semibold"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-white/50 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Create New Quick Bar (If search term entered) */}
        {searchQuery.trim().length > 0 && !exactMatchExists && !isCreatingNew && (
          <div className="mb-3 p-3 bg-gradient-to-r from-[#1c0810] to-[#0a1226] border border-yellow-500/40 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xl">✨</span>
              <div>
                <span className="text-xs font-black text-white">"{searchQuery.trim()}"</span>
                <span className="text-[11px] text-yellow-300 block">Not in current squad. Add & select now?</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setNewPlayerName(searchQuery.trim());
                setIsCreatingNew(true);
              }}
              className="bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl flex items-center space-x-1 shadow transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Player</span>
            </button>
          </div>
        )}

        {/* Inline Create Form (When activated) */}
        {isCreatingNew && (
          <form
            onSubmit={handleCreatePlayer}
            className="mb-4 p-4 bg-[#14060b] border-2 border-yellow-400/60 rounded-2xl space-y-3"
          >
            <div className="flex items-center justify-between border-b border-yellow-500/20 pb-1.5">
              <span className="text-xs font-black text-yellow-300 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Player for {team.name}</span>
              </span>
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="text-white/60 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <label className="text-[10px] uppercase font-bold text-white/80 block mb-1">
                  Player Full Name
                </label>
                <input
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="e.g. Bibek Yadav"
                  required
                  className="w-full bg-[#070e24] border border-yellow-500/40 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-yellow-400 font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-white/80 block mb-1">
                  Player Role
                </label>
                <select
                  value={newPlayerRole}
                  onChange={(e) => setNewPlayerRole(e.target.value as Player['role'])}
                  className="w-full bg-[#070e24] text-yellow-300 border border-yellow-500/40 rounded-xl px-2 py-1.5 text-xs font-bold focus:outline-none"
                >
                  <option value="bowler">Bowler (🎯)</option>
                  <option value="batsman">Batsman (🏏)</option>
                  <option value="all-rounder">All-Rounder (⚡)</option>
                  <option value="wicket-keeper">Wicket-Keeper (🧤)</option>
                </select>
              </div>
            </div>

            {/* Live Cartoon Avatar Preview */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-2">
                <PlayerAvatar
                  name={newPlayerName || 'New Player'}
                  role={newPlayerRole}
                  teamColor={team.color}
                  size="sm"
                />
                <span className="text-[10px] text-white/70">
                  Default cartoon cricketer avatar generated automatically.
                </span>
              </div>
              <button
                type="submit"
                className="bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 text-yellow-300 font-black text-xs px-4 py-2 rounded-xl border border-yellow-500/40 shadow-lg cursor-pointer"
              >
                Save & Select ➔
              </button>
            </div>
          </form>
        )}

        {/* Players List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
          {filteredPlayers.length === 0 ? (
            <div className="text-center py-8 text-white/60 space-y-3">
              <p className="text-xs">No matching player found in squad.</p>
              {!isCreatingNew && (
                <button
                  type="button"
                  onClick={() => {
                    setNewPlayerName(searchQuery.trim());
                    setIsCreatingNew(true);
                  }}
                  className="bg-gradient-to-r from-red-700 to-red-800 text-yellow-300 font-black text-xs px-4 py-2 rounded-xl border border-yellow-500/40 cursor-pointer"
                >
                  ➕ Create "{searchQuery || 'New Player'}"
                </button>
              )}
            </div>
          ) : (
            filteredPlayers.map((p) => {
              const isSelected = p.id === currentSelectedId;
              const isP11 = playing11Ids.has(p.id);
              const bStats = bowlerStats[p.id];
              const batStats = batterStats[p.id];

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectPlayer(p.id);
                    onClose();
                  }}
                  className={`p-2.5 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-yellow-400 text-slate-950 border-white font-black shadow-lg scale-[1.01]'
                      : 'bg-[#0a1226] hover:bg-[#121f42] border-yellow-500/30 text-white hover:border-yellow-400'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <PlayerAvatar
                      name={p.name}
                      role={p.role}
                      photoUrl={p.photoUrl}
                      teamColor={team.color}
                      size="sm"
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-black">{p.name}</span>
                        {p.isCaptain && <span className="text-[10px] font-bold text-yellow-400">(C)</span>}
                        {p.isWicketKeeper && <span className="text-[10px] font-bold text-yellow-400">(WK)</span>}
                        {!isP11 && (
                          <span className="text-[9px] bg-red-950 text-yellow-300 px-1.5 py-0.2 rounded border border-red-700 font-bold">
                            Squad Reserve
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[10px] capitalize ${
                          isSelected ? 'text-slate-800 font-bold' : 'text-yellow-300/90'
                        }`}
                      >
                        {p.role}
                      </span>
                    </div>
                  </div>

                  {/* Mode-Specific Stats */}
                  <div className="flex items-center space-x-3">
                    {mode === 'bowler' && bStats && (
                      <div className="text-right font-mono text-[11px]">
                        <span className="font-black text-yellow-400">
                          {bStats.wickets}-{bStats.runsConceded}
                        </span>
                        <span className="text-[10px] text-white/70 block">
                          ({bStats.oversFormatted} / {maxOversPerBowler} ov | eco {bStats.economyRate.toFixed(1)})
                        </span>
                      </div>
                    )}

                    {(mode === 'striker' || mode === 'nonStriker') && batStats && (
                      <div className="text-right font-mono text-[11px]">
                        <span className="font-black text-yellow-400">
                          {batStats.runs} <span className="text-[10px] text-white/70">({batStats.ballsFaced}b)</span>
                        </span>
                        {batStats.isOut && (
                          <span className="text-[9px] text-red-400 font-bold block uppercase">
                            [OUT]
                          </span>
                        )}
                      </div>
                    )}

                    {isSelected ? (
                      <div className="flex items-center space-x-1 text-slate-950 font-black text-xs">
                        <UserCheck className="w-4 h-4" />
                        <span>Active</span>
                      </div>
                    ) : (
                      <span className="text-[11px] font-bold text-yellow-300/80 hover:text-yellow-300">
                        Select ➔
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info & manual Add Player toggle */}
        <div className="pt-3 border-t border-yellow-500/20 mt-3 flex items-center justify-between">
          <span className="text-[11px] text-white/70 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-yellow-400" />
            <span>Players automatically persist in {team.name} Master Database.</span>
          </span>
          {!isCreatingNew && (
            <button
              type="button"
              onClick={() => {
                setNewPlayerName('');
                setIsCreatingNew(true);
              }}
              className="text-xs font-black text-yellow-400 hover:text-yellow-300 flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Player</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
