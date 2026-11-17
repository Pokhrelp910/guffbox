// The Cricket Guff Studio — Wicket Dismissal & Incoming Batter Selector Modal
// Enhanced with mid-match Type & Find and dynamic new batter creation with cartoon avatars

import React, { useState, useMemo, useEffect } from 'react';
import { Player, DismissalType, Team } from '../core/types';
import { PlayerAvatar } from '../utils/avatarUtils';
import { addPlayerToTeamInDatabase } from '../lib/teamDatabase';
import { UserCheck, ShieldAlert, X, Search, Plus, Sparkles } from 'lucide-react';

interface WicketModalProps {
  isOpen: boolean;
  dismissalType: DismissalType;
  striker: Player;
  nonStriker: Player;
  availableBatters: Player[];
  bowlerName: string;
  battingTeam?: Team;
  fieldingTeam?: Team;
  onAddNewBatter?: (teamId: string, player: Player) => void;
  onConfirm: (params: {
    dismissalType: DismissalType;
    playerOutId: string;
    newBatterId: string;
    assistedByName?: string;
  }) => void;
  onClose: () => void;
}

export const WicketModal: React.FC<WicketModalProps> = ({
  isOpen,
  dismissalType,
  striker,
  nonStriker,
  availableBatters,
  bowlerName,
  battingTeam,
  fieldingTeam,
  onAddNewBatter,
  onConfirm,
  onClose,
}) => {
  const [playerOutId, setPlayerOutId] = useState<string>(striker.id);
  const [selectedNewBatterId, setSelectedNewBatterId] = useState<string>(
    availableBatters[0]?.id || ''
  );
  const [fielderName, setFielderName] = useState<string>('');
  
  // Type & Find state
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newBatterName, setNewBatterName] = useState('');
  const [newBatterRole, setNewBatterRole] = useState<Player['role']>('batsman');

  // Combined candidates: availableBatters + other squad members of batting team
  const candidates: (Player & { isReserve?: boolean })[] = useMemo(() => {
    const list: (Player & { isReserve?: boolean })[] = availableBatters.map((p) => ({
      ...p,
      isReserve: false,
    }));

    if (battingTeam?.squad) {
      const existingIds = new Set([
        ...availableBatters.map((p) => p.id),
        striker.id,
        nonStriker.id,
      ]);
      battingTeam.squad.forEach((p) => {
        if (!existingIds.has(p.id)) {
          list.push({ ...p, isReserve: true });
        }
      });
    }

    return list;
  }, [availableBatters, battingTeam, striker.id, nonStriker.id]);

  // Filter candidates by search query
  const q = searchQuery.trim().toLowerCase();
  const filteredCandidates = useMemo(() => {
    if (!q) return candidates;
    return candidates.filter((p) => p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q));
  }, [candidates, q]);

  const exactMatchExists = candidates.some(
    (p) => p.name.trim().toLowerCase() === (q || newBatterName.trim().toLowerCase())
  );

  // Fielding team players (for one-click catcher / keeper / run-out assistant selection)
  const fieldingPlayers = useMemo(() => {
    if (!fieldingTeam?.squad) return [];
    if (fieldingTeam.playing11 && fieldingTeam.playing11.length > 0) {
      return fieldingTeam.squad.filter((p) => fieldingTeam.playing11.includes(p.id));
    }
    return fieldingTeam.squad;
  }, [fieldingTeam]);

  const wicketKeeper = useMemo(() => {
    return (
      fieldingPlayers.find((p) => p.isWicketKeeper || p.role === 'wicket-keeper') ||
      fieldingPlayers[1]
    );
  }, [fieldingPlayers]);

  // Pre-fill keeper for caught_behind & stumped, or bowler for caught_and_bowled
  useEffect(() => {
    if ((dismissalType === 'caught_behind' || dismissalType === 'stumped') && wicketKeeper && !fielderName) {
      setFielderName(wicketKeeper.name);
    } else if (dismissalType === 'caught_and_bowled' && !fielderName) {
      setFielderName(bowlerName);
    }
  }, [dismissalType, wicketKeeper, bowlerName, fielderName]);

  if (!isOpen) return null;

  const dismissalLabels: Record<DismissalType, string> = {
    bowled: 'Clean Bowled',
    caught: 'Caught Out',
    caught_behind: 'Caught Behind (Wicket-Keeper)',
    caught_and_bowled: 'Caught & Bowled',
    lbw: 'Leg Before Wicket (LBW)',
    stumped: 'Stumped (Wicket-Keeper)',
    run_out: 'Run Out',
    hit_wicket: 'Hit Wicket',
    duck_out: 'Duck Out (0 Runs)',
    golden_duck: 'Golden Duck (First Ball)',
    retired_out: 'Retired Out',
    retired_hurt: 'Retired Hurt',
    obstructing_field: 'Obstructing The Field',
    hit_ball_twice: 'Hit Ball Twice',
    handling_ball: 'Handled The Ball',
    timed_out: 'Timed Out',
    mankad: 'Mankad (Non-Striker Run Out)',
  };

  const isFielderNeeded = ['caught', 'caught_behind', 'stumped', 'caught_and_bowled'].includes(dismissalType);
  const isAllOut = candidates.length === 0 && dismissalType !== 'retired_hurt';

  const handleCreateNewBatter = (e: React.FormEvent) => {
    e.preventDefault();
    const name = (newBatterName || searchQuery).trim();
    if (!name) return;

    if (battingTeam) {
      const res = addPlayerToTeamInDatabase(battingTeam, {
        name,
        role: newBatterRole,
      });

      if (res.success && res.player) {
        if (onAddNewBatter) {
          onAddNewBatter(battingTeam.id, res.player);
        }
        setSelectedNewBatterId(res.player.id);
        setIsCreatingNew(false);
        setSearchQuery('');
        return;
      }
    }

    // Fallback if battingTeam not passed
    const fallbackPlayer: Player = {
      id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      role: newBatterRole,
    };
    if (onAddNewBatter && battingTeam) {
      onAddNewBatter(battingTeam.id, fallbackPlayer);
    }
    setSelectedNewBatterId(fallbackPlayer.id);
    setIsCreatingNew(false);
    setSearchQuery('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      dismissalType,
      playerOutId,
      newBatterId: selectedNewBatterId,
      assistedByName: fielderName.trim() || undefined,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 font-sans text-white"
      style={{
        background: 'radial-gradient(circle at center, rgba(14,25,56,0.92) 0%, rgba(26,4,8,0.96) 100%)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="bg-gradient-to-br from-[#081026] via-[#050a18] to-[#1c050a] border-2 border-yellow-500/50 rounded-3xl w-full max-w-xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-yellow-500/20 pb-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">☝️</span>
            <div>
              <h2 className="text-xl font-black font-['Teko'] tracking-wider text-yellow-400">
                WICKET: {dismissalLabels[dismissalType] || dismissalType.toUpperCase()}
              </h2>
              <p className="text-[11px] text-white/80">
                Bowler: <strong className="text-yellow-300">{bowlerName}</strong>
              </p>
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

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
          
          {/* Who Got Out? */}
          <div>
            <label className="text-xs font-bold text-yellow-400 uppercase tracking-wider block mb-1.5">
              1. Who Got Out? (आउट भएको ब्याटर)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPlayerOutId(striker.id)}
                className={`py-2 px-3 rounded-xl border font-bold text-xs flex flex-col items-center justify-center transition ${
                  playerOutId === striker.id
                    ? 'bg-red-700 border-yellow-400 text-white shadow-lg ring-2 ring-yellow-400/50'
                    : 'bg-[#0e1938] border-yellow-500/30 text-white hover:bg-[#152554]'
                }`}
              >
                <span className="text-[10px] uppercase text-yellow-300 font-semibold">On Strike</span>
                <span className="text-sm font-black text-white">{striker.name}</span>
              </button>

              <button
                type="button"
                onClick={() => setPlayerOutId(nonStriker.id)}
                className={`py-2 px-3 rounded-xl border font-bold text-xs flex flex-col items-center justify-center transition ${
                  playerOutId === nonStriker.id
                    ? 'bg-red-700 border-yellow-400 text-white shadow-lg ring-2 ring-yellow-400/50'
                    : 'bg-[#0e1938] border-yellow-500/30 text-white hover:bg-[#152554]'
                }`}
              >
                <span className="text-[10px] uppercase text-yellow-300 font-semibold">Non-Striker</span>
                <span className="text-sm font-black text-white">{nonStriker.name}</span>
              </button>
            </div>
          </div>

          {/* Fielder Selection (Caught, Caught Behind, Stumped, Caught & Bowled) */}
          {isFielderNeeded && (
            <div className="space-y-2 p-3 bg-[#070e24] border border-yellow-500/30 rounded-2xl">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🧤</span>
                  <span>
                    {dismissalType === 'caught_behind'
                      ? 'Wicket-Keeper Catch (विकेट-कीपर क्याच)'
                      : dismissalType === 'stumped'
                      ? 'Stumped by Keeper (स्टम्पिङ गर्ने कीपर)'
                      : dismissalType === 'caught_and_bowled'
                      ? 'Caught & Bowled (बलर क्याच)'
                      : 'Catcher / Fielder (क्याच लिने फिल्डर)'}
                  </span>
                </label>
                {fielderName && (
                  <span className="text-[11px] font-bold text-yellow-300 bg-red-950/80 px-2 py-0.5 rounded-lg border border-red-700">
                    Selected: <strong>{fielderName}</strong>
                  </span>
                )}
              </div>

              {/* Special for caught_and_bowled */}
              {dismissalType === 'caught_and_bowled' ? (
                <div className="p-2.5 bg-[#0e1938] rounded-xl border border-yellow-500/40 text-xs font-bold text-white flex items-center justify-between">
                  <span>🎯 Bowler return catch: <strong className="text-yellow-300">{bowlerName}</strong></span>
                  <span className="text-[10px] text-yellow-400 font-mono font-black">c & b</span>
                </div>
              ) : (
                <>
                  {/* One-Click Quick Fielder Pills */}
                  {fieldingPlayers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                      {fieldingPlayers.map((fp) => {
                        const isSelected = fielderName === fp.name;
                        const isWK = fp.isWicketKeeper || fp.role === 'wicket-keeper';
                        return (
                          <button
                            key={fp.id}
                            type="button"
                            onClick={() => setFielderName(fp.name)}
                            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
                              isSelected
                                ? 'bg-yellow-400 text-slate-950 border-white shadow-md font-black scale-105'
                                : 'bg-[#0e1938] hover:bg-[#162758] text-white border-yellow-500/30'
                            }`}
                          >
                            <PlayerAvatar
                              name={fp.name}
                              role={fp.role}
                              teamColor={fieldingTeam?.color}
                              size="xs"
                            />
                            <span>{fp.name}</span>
                            {isWK && <span className="text-[9px] text-yellow-300 font-black ml-0.5">(WK)</span>}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setFielderName('Substitute')}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition border cursor-pointer ${
                          fielderName === 'Substitute'
                            ? 'bg-yellow-400 text-slate-950 border-white font-black'
                            : 'bg-[#1c0810] text-yellow-300 border-red-800 hover:border-yellow-500/40'
                        }`}
                      >
                        🏃 Sub Fielder
                      </button>
                    </div>
                  )}

                  {/* Manual Type / Edit Input */}
                  <div className="pt-1">
                    <input
                      type="text"
                      value={fielderName}
                      onChange={(e) => setFielderName(e.target.value)}
                      placeholder="Or type custom fielder / keeper name..."
                      className="w-full bg-[#050a18] border border-yellow-500/40 rounded-xl px-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-yellow-400 font-semibold"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Select New Batter Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center space-x-1.5">
                <span>2. Select Next Batter (आउने नयाँ ब्याटर छान्नुहोस्)</span>
              </label>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-white/80 font-normal">
                  {candidates.length} Available in Squad
                </span>
                {!isCreatingNew && (
                  <button
                    type="button"
                    onClick={() => {
                      setNewBatterName(searchQuery.trim());
                      setIsCreatingNew(true);
                    }}
                    className="text-[10px] bg-yellow-400 text-slate-950 font-black px-2 py-0.5 rounded-lg flex items-center space-x-1 hover:bg-yellow-300 transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Create Batter</span>
                  </button>
                )}
              </div>
            </div>

            {/* Type & Find Search Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-yellow-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Type batter name or search squad..."
                className="w-full bg-[#070e24] border border-yellow-500/40 rounded-xl pl-8 pr-7 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-yellow-400 font-semibold"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-white/50 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Create Prompt if typed name doesn't match */}
            {searchQuery.trim().length > 0 && !exactMatchExists && !isCreatingNew && (
              <div className="p-2.5 bg-gradient-to-r from-[#1c0810] to-[#0a1226] border border-yellow-500/40 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-yellow-400 shrink-0" />
                  <span className="text-xs font-bold text-white">
                    Create & Select: <strong className="text-yellow-300">"{searchQuery.trim()}"</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNewBatterName(searchQuery.trim());
                    setIsCreatingNew(true);
                  }}
                  className="bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-[11px] px-2.5 py-1 rounded-lg flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Now</span>
                </button>
              </div>
            )}

            {/* Inline Creation Form */}
            {isCreatingNew && (
              <div className="p-3 bg-[#14060b] border border-yellow-400/60 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-yellow-300 uppercase tracking-wide">
                    Add New Batter on the Fly
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCreatingNew(false)}
                    className="text-white/60 hover:text-white text-xs"
                  >
                    Cancel
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newBatterName}
                    onChange={(e) => setNewBatterName(e.target.value)}
                    placeholder="Player Name"
                    className="bg-[#070e24] border border-yellow-500/40 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none font-bold"
                  />
                  <select
                    value={newBatterRole}
                    onChange={(e) => setNewBatterRole(e.target.value as Player['role'])}
                    className="bg-[#070e24] text-yellow-300 border border-yellow-500/40 rounded-lg px-2 py-1.5 text-xs font-bold focus:outline-none"
                  >
                    <option value="batsman">Batsman (🏏)</option>
                    <option value="all-rounder">All-Rounder (⚡)</option>
                    <option value="wicket-keeper">Wicket-Keeper (🧤)</option>
                  </select>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center space-x-2">
                    <PlayerAvatar
                      name={newBatterName || 'New Batter'}
                      role={newBatterRole}
                      teamColor={battingTeam?.color}
                      size="sm"
                    />
                    <span className="text-[10px] text-white/70">Cartoon avatar auto-assigned</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateNewBatter}
                    className="bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 text-yellow-300 font-black text-xs px-3 py-1.5 rounded-lg border border-yellow-500/40 shadow cursor-pointer"
                  >
                    Create & Select ➔
                  </button>
                </div>
              </div>
            )}

            {/* Batters Grid */}
            {isAllOut ? (
              <div className="bg-[#24060e] border border-red-700/80 p-3 rounded-xl text-center text-yellow-300 text-xs font-bold flex items-center justify-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-yellow-400" />
                <span>No more batters remaining in Playing XI. Team is ALL OUT!</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {filteredCandidates.map((p) => {
                  const isSelected = selectedNewBatterId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedNewBatterId(p.id)}
                      className={`p-2 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-yellow-400 border-white text-[#050a18] font-black shadow-lg scale-[1.02]'
                          : 'bg-[#0e1938] border-yellow-500/30 text-white hover:border-yellow-400'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <PlayerAvatar
                          name={p.name}
                          role={p.role}
                          photoUrl={p.photoUrl}
                          teamColor={battingTeam?.color}
                          size="sm"
                        />
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-1">
                            <span className="text-xs font-extrabold">{p.name}</span>
                            {p.isReserve && (
                              <span className="text-[8px] bg-red-950 text-yellow-300 px-1 rounded border border-red-700">
                                Squad
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-[10px] uppercase capitalize ${
                              isSelected ? 'text-[#050a18]' : 'text-yellow-300'
                            }`}
                          >
                            {p.role} {p.isCaptain ? '(C)' : ''} {p.isWicketKeeper ? '(WK)' : ''}
                          </span>
                        </div>
                      </div>
                      {isSelected && <UserCheck className="w-4 h-4 text-[#050a18]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Confirm Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!isAllOut && !selectedNewBatterId && dismissalType !== 'retired_hurt'}
              className="w-full h-11 bg-gradient-to-r from-red-800 via-red-700 to-red-800 hover:from-red-700 hover:to-red-600 disabled:bg-[#0e1938] disabled:text-white/40 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition flex items-center justify-center space-x-2 border border-yellow-500/40 cursor-pointer"
            >
              <span>Confirm Wicket & Set Batter ➔</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
