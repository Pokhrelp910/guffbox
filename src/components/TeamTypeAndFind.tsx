// GuffBox Cricket Studio — Type & Find Team Autocomplete & Combobox
// Seamless lookup from Master Database with Instant "Create New Team" & Duplicate Detection

import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Check, AlertCircle, X, ChevronDown, ShieldCheck } from 'lucide-react';
import { Team } from '../core/types';
import { searchTeams, getAllTeams, checkTeamDuplicate } from '../lib/teamDatabase';
import { TeamLogo } from '../utils/avatarUtils';

interface TeamTypeAndFindProps {
  label: string;
  selectedTeam?: {
    id: string;
    name: string;
    shortName: string;
    color: string;
    logoUrl?: string;
    squadCount: number;
  };
  onSelectTeam: (team: Team) => void;
  onCreateNewTeam: (teamName: string) => void;
  placeholder?: string;
  className?: string;
}

export const TeamTypeAndFind: React.FC<TeamTypeAndFindProps> = ({
  label,
  selectedTeam,
  onSelectTeam,
  onCreateNewTeam,
  placeholder = 'Type team name (e.g. Nepal, Janakpur Bolts)...',
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync query when selectedTeam changes from external selection
  useEffect(() => {
    if (selectedTeam?.name && !isOpen) {
      setQuery(selectedTeam.name);
    }
  }, [selectedTeam?.name, isOpen]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTeams = searchTeams(query);
  const exactMatch = getAllTeams().find(
    (t) => t.name.trim().toLowerCase() === query.trim().toLowerCase()
  );
  const hasQuery = query.trim().length > 0;
  const showCreateOption = hasQuery && !exactMatch;

  // Total items in dropdown for keyboard navigation
  const totalOptions = filteredTeams.length + (showCreateOption ? 1 : 0);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev + 1) % Math.max(totalOptions, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev - 1 + Math.max(totalOptions, 1)) % Math.max(totalOptions, 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIndex < filteredTeams.length) {
        const team = filteredTeams[highlightIndex];
        if (team) {
          handleSelect(team);
        }
      } else if (showCreateOption) {
        handleCreateNew(query.trim());
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (team: Team) => {
    setQuery(team.name);
    setIsOpen(false);
    onSelectTeam(team);
  };

  const handleCreateNew = (name: string) => {
    if (!name.trim()) return;
    setQuery(name.trim());
    setIsOpen(false);
    onCreateNewTeam(name.trim());
  };

  const clearInput = () => {
    setQuery('');
    setIsOpen(true);
    inputRef.current?.focus();
  };

  // Check if current selection or query has duplicate status
  const dupCheck = hasQuery
    ? checkTeamDuplicate(query.trim(), '', selectedTeam?.id)
    : { isDuplicate: false };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5 text-yellow-400" />
          <span>{label}</span>
        </label>
        {selectedTeam && (
          <span className="text-[10px] font-bold text-yellow-300 flex items-center gap-1 bg-blue-950/90 px-2 py-0.5 rounded-full border border-yellow-500/40">
            <ShieldCheck className="w-3 h-3 text-yellow-400" />
            <span>Master DB Active</span>
          </span>
        )}
      </div>

      {/* Input Field with Color swatch / Logo and controls */}
      <div className="relative flex items-center">
        {selectedTeam && (
          <div className="absolute left-2.5 z-10 flex items-center">
            <TeamLogo
              name={selectedTeam.name}
              shortName={selectedTeam.shortName}
              logoUrl={selectedTeam.logoUrl}
              color={selectedTeam.color}
              size="xs"
            />
          </div>
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => {
            setIsOpen(true);
            setHighlightIndex(0);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setHighlightIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full bg-[#060b1c] border border-yellow-500/30 rounded-xl py-2.5 text-sm text-white placeholder-white/40 font-semibold focus:outline-none focus:border-yellow-400 shadow-inner transition ${
            selectedTeam ? 'pl-10 pr-16' : 'pl-4 pr-16'
          }`}
        />

        <div className="absolute right-2 flex items-center space-x-1">
          {query && (
            <button
              type="button"
              onClick={clearInput}
              className="p-1 rounded-lg text-white/70 hover:text-yellow-400 hover:bg-blue-900/40 transition cursor-pointer"
              title="Clear Search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="p-1 rounded-lg text-yellow-400 hover:text-yellow-300 hover:bg-blue-900/40 transition cursor-pointer"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dropdown Floating Popover */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-[#070d1e] border border-yellow-500/30 rounded-2xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto">
          {/* Section Header */}
          <div className="bg-[#050914] px-3 py-1.5 border-b border-yellow-500/20 flex items-center justify-between text-[11px] font-bold text-yellow-400">
            <span>{hasQuery ? `Search Results (${filteredTeams.length})` : 'All Master Teams (Database)'}</span>
            <span className="text-[10px] text-white/80">Permanent Squads</span>
          </div>

          {/* Matching Teams List */}
          <div className="divide-y divide-yellow-500/10">
            {filteredTeams.map((team, index) => {
              const isHighlighted = highlightIndex === index;
              const isCurrent = selectedTeam?.id === team.id || selectedTeam?.name === team.name;

              return (
                <div
                  key={team.id}
                  onClick={() => handleSelect(team)}
                  onMouseEnter={() => setHighlightIndex(index)}
                  className={`px-3 py-2.5 flex items-center justify-between cursor-pointer transition ${
                    isHighlighted ? 'bg-blue-900/50 text-yellow-300' : 'hover:bg-blue-950/60 text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <TeamLogo
                      name={team.name}
                      shortName={team.shortName}
                      logoUrl={team.logoUrl}
                      color={team.color}
                      size="sm"
                    />
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <span className="text-white">{team.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-950 text-yellow-300 font-mono font-bold border border-yellow-500/30">
                          {team.shortName}
                        </span>
                      </div>
                      <div className="text-[10px] text-white/70">
                        {team.squad?.length || 0} Squad Players • Playing XI ready
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {isCurrent && (
                      <span className="text-yellow-300 text-[10px] font-bold flex items-center gap-1 bg-red-950/80 px-2 py-0.5 rounded border border-yellow-500/40">
                        <Check className="w-3 h-3 text-yellow-400" /> Selected
                      </span>
                    )}
                    <span className="text-[10px] text-yellow-400 font-semibold group-hover:text-yellow-300">
                      Load ➔
                    </span>
                  </div>
                </div>
              );
            })}

            {/* "Create New Team" option when no exact match */}
            {showCreateOption && (
              <div
                onClick={() => handleCreateNew(query.trim())}
                onMouseEnter={() => setHighlightIndex(filteredTeams.length)}
                className={`px-3 py-3 flex items-center justify-between cursor-pointer border-t border-yellow-500/30 transition ${
                  highlightIndex === filteredTeams.length
                    ? 'bg-red-950/60 text-yellow-300'
                    : 'bg-red-950/30 text-yellow-400 hover:bg-red-950/50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-lg bg-yellow-400/20 border border-yellow-400/50 flex items-center justify-center">
                    <Plus className="w-3.5 h-3.5 text-yellow-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-yellow-300">
                      ✨ Create New Team: "{query.trim()}"
                    </div>
                    <div className="text-[10px] text-white/70">
                      Add to Master Database permanently with custom squad
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-yellow-400 text-slate-950 uppercase">
                  + Create
                </span>
              </div>
            )}

            {filteredTeams.length === 0 && !showCreateOption && (
              <div className="p-4 text-center text-xs text-white/60">
                No matching teams found in database.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Duplicate warning notification if user typed a name matching another team */}
      {hasQuery && dupCheck.isDuplicate && !isOpen && (
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-yellow-300 bg-red-950/80 px-2.5 py-1 rounded-lg border border-yellow-500/40">
          <AlertCircle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
          <span>
            A team with this {dupCheck.field === 'name' ? 'name' : 'code'} ("{dupCheck.existing?.name}") is already in the database.
          </span>
        </div>
      )}
    </div>
  );
};
