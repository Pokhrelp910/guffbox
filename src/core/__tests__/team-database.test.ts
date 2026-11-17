// GuffBox Cricket Studio — Unit Tests for Master Team & Player Database Repository

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAllTeams,
  searchTeams,
  findTeamByName,
  checkTeamDuplicate,
  saveTeamToDatabase,
  deleteTeamFromDatabase,
  resetTeamDatabase,
  addPlayerToTeamInDatabase,
  searchPlayersInTeam,
} from '../../lib/teamDatabase';
import { getDefaultPlayerAvatar, getDefaultTeamLogo } from '../../utils/avatarUtils';
import { Team } from '../types';

describe('Master Team & Player Database Engine', () => {
  beforeEach(() => {
    resetTeamDatabase();
  });

  it('initializes default master seed teams (14 teams) on clean storage', () => {
    const teams = getAllTeams();
    expect(teams.length).toBeGreaterThanOrEqual(14);

    const nepal = teams.find((t) => t.name === 'Nepal');
    expect(nepal).toBeDefined();
    expect(nepal?.shortName).toBe('NEP');
    expect(nepal?.squad.length).toBe(11);
    expect(nepal?.squad.some((p) => p.name === 'Rohit Paudel' && p.isCaptain)).toBe(true);

    const janakpur = teams.find((t) => t.name === 'Janakpur Bolts');
    expect(janakpur).toBeDefined();
    expect(janakpur?.shortName).toBe('JKB');
  });

  it('searches teams by substring, short code, and case-insensitively', () => {
    const resultsName = searchTeams('jana');
    expect(resultsName.some((t) => t.name === 'Janakpur Bolts')).toBe(true);

    const resultsCode = searchTeams('nep');
    expect(resultsCode.some((t) => t.name === 'Nepal')).toBe(true);

    const resultsLower = searchTeams('ind');
    expect(resultsLower.some((t) => t.shortName === 'IND')).toBe(true);

    const resultsAll = searchTeams('');
    expect(resultsAll.length).toBeGreaterThanOrEqual(14);
  });

  it('finds team by exact name case-insensitively', () => {
    const team = findTeamByName('nEpAl');
    expect(team).toBeDefined();
    expect(team?.name).toBe('Nepal');

    const notFound = findTeamByName('NonExistentTeam');
    expect(notFound).toBeUndefined();
  });

  it('detects duplicate team names and short codes correctly', () => {
    const dupName = checkTeamDuplicate('nepal', 'XYZ');
    expect(dupName.isDuplicate).toBe(true);
    expect(dupName.field).toBe('name');
    expect(dupName.existing?.name).toBe('Nepal');

    const dupCode = checkTeamDuplicate('New Nepal', 'NEP');
    expect(dupCode.isDuplicate).toBe(true);
    expect(dupCode.field).toBe('shortName');

    // Updating existing team with same ID should NOT trigger duplicate
    const nepal = findTeamByName('Nepal');
    const updateSelf = checkTeamDuplicate('Nepal', 'NEP', nepal?.id);
    expect(updateSelf.isDuplicate).toBe(false);

    // Completely new unique team
    const unique = checkTeamDuplicate('Butwal Blasters', 'BWB');
    expect(unique.isDuplicate).toBe(false);
  });

  it('successfully creates a new unique team with full squad', () => {
    const newTeam: Team = {
      id: 'team_butwal',
      name: 'Butwal Blasters',
      shortName: 'BWB',
      color: '#e11d48',
      playing11: ['bw_1', 'bw_2'],
      squad: [
        { id: 'bw_1', name: 'Butwal Batter', role: 'batsman' },
        { id: 'bw_2', name: 'Butwal Bowler', role: 'bowler' },
      ],
    };

    const result = saveTeamToDatabase(newTeam);
    expect(result.success).toBe(true);
    expect(result.team?.name).toBe('Butwal Blasters');

    const fetched = findTeamByName('Butwal Blasters');
    expect(fetched).toBeDefined();
    expect(fetched?.squad.length).toBe(2);
    expect(fetched?.color).toBe('#e11d48');
  });

  it('rejects saving a new team if name already exists (Duplicate Protection)', () => {
    const dupTeam: Team = {
      id: 'team_fake_nepal',
      name: 'Nepal',
      shortName: 'NPL',
      color: '#000000',
      playing11: [],
      squad: [],
    };

    const result = saveTeamToDatabase(dupTeam);
    expect(result.success).toBe(false);
    expect(result.error).toContain('already exists');
  });

  it('allows updating an existing team squad without triggering duplicate error', () => {
    const nepal = findTeamByName('Nepal');
    expect(nepal).toBeDefined();

    const updatedSquad = [
      ...nepal!.squad,
      { id: 'nep_12', name: 'Pratis GC', role: 'bowler' as const },
    ];

    const result = saveTeamToDatabase({
      ...nepal!,
      squad: updatedSquad,
    });

    expect(result.success).toBe(true);
    const updatedNepal = findTeamByName('Nepal');
    expect(updatedNepal?.squad.length).toBe(12);
  });

  it('deletes a team from the master database', () => {
    const newTeam: Team = {
      id: 'team_to_delete',
      name: 'Temporary Team',
      shortName: 'TMP',
      color: '#123456',
      playing11: [],
      squad: [],
    };

    saveTeamToDatabase(newTeam);
    expect(findTeamByName('Temporary Team')).toBeDefined();

    deleteTeamFromDatabase('team_to_delete');
    expect(findTeamByName('Temporary Team')).toBeUndefined();
  });

  it('generates valid default cartoon player avatar SVG with team colors', () => {
    const avatar = getDefaultPlayerAvatar('Kushal Bhurtel', 'batsman', '#1e3a8a');
    expect(avatar.startsWith('data:image/svg+xml;utf8,')).toBe(true);
    expect(decodeURIComponent(avatar)).toContain('svg');
    expect(decodeURIComponent(avatar)).toContain('#1e3a8a');
    expect(decodeURIComponent(avatar)).toContain('🏏');
  });

  it('generates valid default cartoon team logo crest SVG with short code and stars', () => {
    const logo = getDefaultTeamLogo('Janakpur Bolts', 'JKB', '#e11d48');
    expect(logo.startsWith('data:image/svg+xml;utf8,')).toBe(true);
    const decoded = decodeURIComponent(logo);
    expect(decoded).toContain('JKB');
    expect(decoded).toContain('#e11d48');
    expect(decoded).toContain('polygon'); // Stars
  });

  it('persists team logoUrl and player photoUrl cleanly in database', () => {
    const customTeam: Team = {
      id: 'team_custom_logos',
      name: 'Himalayan Tigers',
      shortName: 'HTG',
      color: '#059669',
      logoUrl: 'https://example.com/tiger_logo.png',
      playing11: ['ht_1'],
      squad: [
        {
          id: 'ht_1',
          name: 'Tiger Captain',
          role: 'batsman',
          isCaptain: true,
          photoUrl: 'data:image/webp;base64,mockBase64PhotoData',
        },
      ],
    };

    const res = saveTeamToDatabase(customTeam);
    expect(res.success).toBe(true);
    expect(res.team?.logoUrl).toBe('https://example.com/tiger_logo.png');
    expect(res.team?.squad[0].photoUrl).toBe('data:image/webp;base64,mockBase64PhotoData');

    const fetched = findTeamByName('Himalayan Tigers');
    expect(fetched?.logoUrl).toBe('https://example.com/tiger_logo.png');
    expect(fetched?.squad[0].photoUrl).toBe('data:image/webp;base64,mockBase64PhotoData');
  });

  it('adds a new player dynamically to a team with auto-generated ID and persists in database', () => {
    const res = addPlayerToTeamInDatabase('team_nepal', {
      name: 'Bibek Yadav',
      role: 'all-rounder',
    });

    expect(res.success).toBe(true);
    expect(res.player).toBeDefined();
    expect(res.player?.name).toBe('Bibek Yadav');
    expect(res.player?.role).toBe('all-rounder');
    expect(res.isExisting).toBe(false);

    // Verify persisted in database
    const nepal = findTeamByName('Nepal');
    expect(nepal?.squad.some((p) => p.name === 'Bibek Yadav')).toBe(true);
    expect(nepal?.playing11.includes(res.player!.id)).toBe(true);
  });

  it('prevents duplicate player creation in team and returns existing player', () => {
    // Rohit Paudel is already in Nepal squad
    const dupRes = addPlayerToTeamInDatabase('team_nepal', {
      name: 'rohit paudel', // case-insensitive
      role: 'batsman',
    });

    expect(dupRes.success).toBe(true);
    expect(dupRes.isExisting).toBe(true);
    expect(dupRes.player?.name).toBe('Rohit Paudel');
    expect(dupRes.player?.isCaptain).toBe(true);

    // Verify squad size did not increase with duplicate
    const nepal = findTeamByName('Nepal');
    const matches = nepal?.squad.filter((p) => p.name.toLowerCase() === 'rohit paudel');
    expect(matches?.length).toBe(1);
  });

  it('searches players within a team squad accurately', () => {
    const nepal = findTeamByName('Nepal');
    expect(nepal).toBeDefined();

    const results = searchPlayersInTeam(nepal!, 'kushal');
    expect(results.length).toBe(2); // Kushal Bhurtel, Kushal Malla
    expect(results.some((p) => p.name === 'Kushal Bhurtel')).toBe(true);
    expect(results.some((p) => p.name === 'Kushal Malla')).toBe(true);

    const empty = searchPlayersInTeam(nepal!, 'xyznonexistent');
    expect(empty.length).toBe(0);
  });
});
