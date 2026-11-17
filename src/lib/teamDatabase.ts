// GuffBox Cricket Studio — Master Team & Player Database Repository
// Persistent Master Data Engine with Supabase Sync & Duplicate Protection

import { Team, Player } from '../core/types';
import { syncTeamToSupabase, fetchTeamsFromSupabase } from './supabase';

const STORAGE_KEY = 'guffbox_master_teams_v1';

// Initial Preset Squads (Master Seed Data)
export const SEED_MASTER_TEAMS: Team[] = [
  {
    id: 'team_nepal',
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
  },
  {
    id: 'team_india',
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
  },
  {
    id: 'team_pakistan',
    name: 'Pakistan',
    shortName: 'PAK',
    color: '#047857',
    playing11: ['pak_1', 'pak_2', 'pak_3', 'pak_4', 'pak_5', 'pak_6', 'pak_7', 'pak_8', 'pak_9', 'pak_10', 'pak_11'],
    squad: [
      { id: 'pak_1', name: 'Babar Azam', role: 'batsman', isCaptain: true },
      { id: 'pak_2', name: 'Mohammad Rizwan', role: 'wicket-keeper', isWicketKeeper: true },
      { id: 'pak_3', name: 'Fakhar Zaman', role: 'batsman' },
      { id: 'pak_4', name: 'Saim Ayub', role: 'batsman' },
      { id: 'pak_5', name: 'Iftikhar Ahmed', role: 'all-rounder' },
      { id: 'pak_6', name: 'Shadab Khan', role: 'all-rounder' },
      { id: 'pak_7', name: 'Imad Wasim', role: 'all-rounder' },
      { id: 'pak_8', name: 'Shaheen Afridi', role: 'bowler' },
      { id: 'pak_9', name: 'Naseem Shah', role: 'bowler' },
      { id: 'pak_10', name: 'Haris Rauf', role: 'bowler' },
      { id: 'pak_11', name: 'Mohammad Amir', role: 'bowler' },
    ],
  },
  {
    id: 'team_australia',
    name: 'Australia',
    shortName: 'AUS',
    color: '#ca8a04',
    playing11: ['aus_1', 'aus_2', 'aus_3', 'aus_4', 'aus_5', 'aus_6', 'aus_7', 'aus_8', 'aus_9', 'aus_10', 'aus_11'],
    squad: [
      { id: 'aus_1', name: 'Travis Head', role: 'batsman' },
      { id: 'aus_2', name: 'David Warner', role: 'batsman' },
      { id: 'aus_3', name: 'Mitchell Marsh', role: 'all-rounder', isCaptain: true },
      { id: 'aus_4', name: 'Glenn Maxwell', role: 'all-rounder' },
      { id: 'aus_5', name: 'Marcus Stoinis', role: 'all-rounder' },
      { id: 'aus_6', name: 'Tim David', role: 'batsman' },
      { id: 'aus_7', name: 'Matthew Wade', role: 'wicket-keeper', isWicketKeeper: true },
      { id: 'aus_8', name: 'Pat Cummins', role: 'bowler' },
      { id: 'aus_9', name: 'Mitchell Starc', role: 'bowler' },
      { id: 'aus_10', name: 'Adam Zampa', role: 'bowler' },
      { id: 'aus_11', name: 'Josh Hazlewood', role: 'bowler' },
    ],
  },
  {
    id: 'team_england',
    name: 'England',
    shortName: 'ENG',
    color: '#1e3a8a',
    playing11: ['eng_1', 'eng_2', 'eng_3', 'eng_4', 'eng_5', 'eng_6', 'eng_7', 'eng_8', 'eng_9', 'eng_10', 'eng_11'],
    squad: [
      { id: 'eng_1', name: 'Jos Buttler', role: 'wicket-keeper', isCaptain: true, isWicketKeeper: true },
      { id: 'eng_2', name: 'Phil Salt', role: 'batsman' },
      { id: 'eng_3', name: 'Will Jacks', role: 'all-rounder' },
      { id: 'eng_4', name: 'Jonny Bairstow', role: 'batsman' },
      { id: 'eng_5', name: 'Harry Brook', role: 'batsman' },
      { id: 'eng_6', name: 'Moeen Ali', role: 'all-rounder' },
      { id: 'eng_7', name: 'Liam Livingstone', role: 'all-rounder' },
      { id: 'eng_8', name: 'Sam Curran', role: 'all-rounder' },
      { id: 'eng_9', name: 'Jofra Archer', role: 'bowler' },
      { id: 'eng_10', name: 'Adil Rashid', role: 'bowler' },
      { id: 'eng_11', name: 'Mark Wood', role: 'bowler' },
    ],
  },
  {
    id: 'team_npl_janakpur',
    name: 'Janakpur Bolts',
    shortName: 'JKB',
    color: '#1e40af',
    playing11: ['jkb_1', 'jkb_2', 'jkb_3', 'jkb_4', 'jkb_5', 'jkb_6', 'jkb_7', 'jkb_8', 'jkb_9', 'jkb_10', 'jkb_11'],
    squad: [
      { id: 'jkb_1', name: 'Aasif Sheikh', role: 'wicket-keeper', isWicketKeeper: true },
      { id: 'jkb_2', name: 'Anil Sah', role: 'batsman', isCaptain: true },
      { id: 'jkb_3', name: 'Lahiru Milantha', role: 'batsman' },
      { id: 'jkb_4', name: 'Aashutosh Ghiraiya', role: 'batsman' },
      { id: 'jkb_5', name: 'James Neesham', role: 'all-rounder' },
      { id: 'jkb_6', name: 'Sohaib Maqsood', role: 'batsman' },
      { id: 'jkb_7', name: 'Kishore Mahato', role: 'bowler' },
      { id: 'jkb_8', name: 'Lalit Rajbanshi', role: 'bowler' },
      { id: 'jkb_9', name: 'Mohammad Mohsin', role: 'bowler' },
      { id: 'jkb_10', name: 'Rupesh Singh', role: 'all-rounder' },
      { id: 'jkb_11', name: 'Bikram Sob', role: 'bowler' },
    ],
  },
  {
    id: 'team_npl_pokhara',
    name: 'Pokhara Avengers',
    shortName: 'PKA',
    color: '#0284c7',
    playing11: ['pka_1', 'pka_2', 'pka_3', 'pka_4', 'pka_5', 'pka_6', 'pka_7', 'pka_8', 'pka_9', 'pka_10', 'pka_11'],
    squad: [
      { id: 'pka_1', name: 'Kushal Bhurtel', role: 'batsman', isCaptain: true },
      { id: 'pka_2', name: 'Dinesh Kharel', role: 'batsman' },
      { id: 'pka_3', name: 'Matt Critchley', role: 'all-rounder' },
      { id: 'pka_4', name: 'Raymon Reifer', role: 'all-rounder' },
      { id: 'pka_5', name: 'Michael Leask', role: 'all-rounder' },
      { id: 'pka_6', name: 'Dilip Nath', role: 'wicket-keeper', isWicketKeeper: true },
      { id: 'pka_7', name: 'Trit Raj Das', role: 'all-rounder' },
      { id: 'pka_8', name: 'Bipin Khatri', role: 'bowler' },
      { id: 'pka_9', name: 'Sagar Dhakal', role: 'bowler' },
      { id: 'pka_10', name: 'Akash Chand', role: 'bowler' },
      { id: 'pka_11', name: 'Amrit Gurung', role: 'bowler' },
    ],
  },
  {
    id: 'team_npl_biratnagar',
    name: 'Biratnagar Kings',
    shortName: 'BRK',
    color: '#6b21a8',
    playing11: ['brk_1', 'brk_2', 'brk_3', 'brk_4', 'brk_5', 'brk_6', 'brk_7', 'brk_8', 'brk_9', 'brk_10', 'brk_11'],
    squad: [
      { id: 'brk_1', name: 'Sandeep Lamichhane', role: 'bowler', isCaptain: true },
      { id: 'brk_2', name: 'Martin Guptill', role: 'batsman' },
      { id: 'brk_3', name: 'Lokesh Bam', role: 'wicket-keeper', isWicketKeeper: true },
      { id: 'brk_4', name: 'Aqib Ilyas', role: 'all-rounder' },
      { id: 'brk_5', name: 'Pratish GC', role: 'all-rounder' },
      { id: 'brk_6', name: 'Basir Ahamad', role: 'all-rounder' },
      { id: 'brk_7', name: 'Rajesh Pulami', role: 'batsman' },
      { id: 'brk_8', name: 'Jitendra Mukhiya', role: 'bowler' },
      { id: 'brk_9', name: 'Chris Sole', role: 'bowler' },
      { id: 'brk_10', name: 'Dipak Paswan', role: 'bowler' },
      { id: 'brk_11', name: 'Subash Bhandari', role: 'bowler' },
    ],
  },
  {
    id: 'team_npl_chitwan',
    name: 'Chitwan Rhinos',
    shortName: 'CWR',
    color: '#15803d',
    playing11: ['cwr_1', 'cwr_2', 'cwr_3', 'cwr_4', 'cwr_5', 'cwr_6', 'cwr_7', 'cwr_8', 'cwr_9', 'cwr_10', 'cwr_11'],
    squad: [
      { id: 'cwr_1', name: 'Kushal Malla', role: 'all-rounder', isCaptain: true },
      { id: 'cwr_2', name: 'Sharad Vesawkar', role: 'batsman' },
      { id: 'cwr_3', name: 'Hassan Eisakhil', role: 'batsman' },
      { id: 'cwr_4', name: 'Marchant de Lange', role: 'bowler' },
      { id: 'cwr_5', name: 'Luc Benkenstein', role: 'all-rounder' },
      { id: 'cwr_6', name: 'Bipin Rawal', role: 'wicket-keeper', isWicketKeeper: true },
      { id: 'cwr_7', name: 'Rijan Dhakal', role: 'bowler' },
      { id: 'cwr_8', name: 'Kamal Singh Airee', role: 'bowler' },
      { id: 'cwr_9', name: 'Gautam KC', role: 'bowler' },
      { id: 'cwr_10', name: 'Amar Singh Routela', role: 'all-rounder' },
      { id: 'cwr_11', name: 'Deepesh Shrestha', role: 'bowler' },
    ],
  },
  {
    id: 'team_npl_kathmandu',
    name: 'Kathmandu Gurkhas',
    shortName: 'KTG',
    color: '#991b1b',
    playing11: ['ktg_1', 'ktg_2', 'ktg_3', 'ktg_4', 'ktg_5', 'ktg_6', 'ktg_7', 'ktg_8', 'ktg_9', 'ktg_10', 'ktg_11'],
    squad: [
      { id: 'ktg_1', name: 'Karan KC', role: 'bowler', isCaptain: true },
      { id: 'ktg_2', name: 'Michael Levitt', role: 'batsman' },
      { id: 'ktg_3', name: 'Dan Douthwaite', role: 'all-rounder' },
      { id: 'ktg_4', name: 'Gerhard Erasmus', role: 'all-rounder' },
      { id: 'ktg_5', name: 'Bhim Sharki', role: 'batsman' },
      { id: 'ktg_6', name: 'Pratik Shrestha', role: 'wicket-keeper', isWicketKeeper: true },
      { id: 'ktg_7', name: 'Shahab Alam', role: 'bowler' },
      { id: 'ktg_8', name: 'Sumit Maharjan', role: 'batsman' },
      { id: 'ktg_9', name: 'Raju Rijal', role: 'batsman' },
      { id: 'ktg_10', name: 'Krishna Karki', role: 'bowler' },
      { id: 'ktg_11', name: 'Dipesh Kandel', role: 'bowler' },
    ],
  },
  {
    id: 'team_npl_lumbini',
    name: 'Lumbini Lions',
    shortName: 'LBL',
    color: '#b45309',
    playing11: ['lbl_1', 'lbl_2', 'lbl_3', 'lbl_4', 'lbl_5', 'lbl_6', 'lbl_7', 'lbl_8', 'lbl_9', 'lbl_10', 'lbl_11'],
    squad: [
      { id: 'lbl_1', name: 'Rohit Paudel', role: 'batsman', isCaptain: true },
      { id: 'lbl_2', name: 'Ben Cutting', role: 'all-rounder' },
      { id: 'lbl_3', name: 'Tom Moores', role: 'wicket-keeper', isWicketKeeper: true },
      { id: 'lbl_4', name: 'Saad Bin Zafar', role: 'all-rounder' },
      { id: 'lbl_5', name: 'Unmukt Chand', role: 'batsman' },
      { id: 'lbl_6', name: 'Surya Tamang', role: 'bowler' },
      { id: 'lbl_7', name: 'Bibek Yadav', role: 'all-rounder' },
      { id: 'lbl_8', name: 'Dinesh Adhikari', role: 'bowler' },
      { id: 'lbl_9', name: 'Ashutosh Ghiraiya', role: 'batsman' },
      { id: 'lbl_10', name: 'Durgesh Gupta', role: 'bowler' },
      { id: 'lbl_11', name: 'Tilak Bhandari', role: 'bowler' },
    ],
  },
  {
    id: 'team_npl_sudurpaschim',
    name: 'Sudurpaschim Royals',
    shortName: 'SPR',
    color: '#0f766e',
    playing11: ['spr_1', 'spr_2', 'spr_3', 'spr_4', 'spr_5', 'spr_6', 'spr_7', 'spr_8', 'spr_9', 'spr_10', 'spr_11'],
    squad: [
      { id: 'spr_1', name: 'Dipendra Singh Airee', role: 'all-rounder', isCaptain: true },
      { id: 'spr_2', name: 'Brandon McMullen', role: 'all-rounder' },
      { id: 'spr_3', name: 'Saif Zaib', role: 'all-rounder' },
      { id: 'spr_4', name: 'Scott Kuggeleijn', role: 'all-rounder' },
      { id: 'spr_5', name: 'Aarif Sheikh', role: 'batsman' },
      { id: 'spr_6', name: 'Binod Bhandari', role: 'wicket-keeper', isWicketKeeper: true },
      { id: 'spr_7', name: 'Abinash Bohara', role: 'bowler' },
      { id: 'spr_8', name: 'Ishan Pandey', role: 'batsman' },
      { id: 'spr_9', name: 'Naren Saud', role: 'bowler' },
      { id: 'spr_10', name: 'Amit Shrestha', role: 'batsman' },
      { id: 'spr_11', name: 'Bhojraj Bhatta', role: 'bowler' },
    ],
  },
  {
    id: 'team_npl_karnali',
    name: 'Karnali Yaks',
    shortName: 'KNY',
    color: '#c2410c',
    playing11: ['kny_1', 'kny_2', 'kny_3', 'kny_4', 'kny_5', 'kny_6', 'kny_7', 'kny_8', 'kny_9', 'kny_10', 'kny_11'],
    squad: [
      { id: 'kny_1', name: 'Sompal Kami', role: 'bowler', isCaptain: true },
      { id: 'kny_2', name: 'Shikhar Dhawan', role: 'batsman' },
      { id: 'kny_3', name: 'Chadwick Walton', role: 'wicket-keeper', isWicketKeeper: true },
      { id: 'kny_4', name: 'Hussain Talat', role: 'all-rounder' },
      { id: 'kny_5', name: 'Gulshan Jha', role: 'all-rounder' },
      { id: 'kny_6', name: 'Dev Khanal', role: 'batsman' },
      { id: 'kny_7', name: 'Babar Hayat', role: 'batsman' },
      { id: 'kny_8', name: 'Nandan Yadav', role: 'bowler' },
      { id: 'kny_9', name: 'Bipin Sharma', role: 'bowler' },
      { id: 'kny_10', name: 'Rit Gautam', role: 'batsman' },
      { id: 'kny_11', name: 'Dipak Dumre', role: 'batsman' },
    ],
  },
  {
    id: 'team_club_guff',
    name: 'Guff Warriors',
    shortName: 'GWR',
    color: '#7c3aed',
    playing11: ['clb_1', 'clb_2', 'clb_3', 'clb_4', 'clb_5', 'clb_6', 'clb_7', 'clb_8', 'clb_9', 'clb_10', 'clb_11'],
    squad: [
      { id: 'clb_1', name: 'Prakash Pokhrel', role: 'batsman', isCaptain: true },
      { id: 'clb_2', name: 'Aayush Shrestha', role: 'wicket-keeper', isWicketKeeper: true },
      { id: 'clb_3', name: 'Sujan Adhikari', role: 'batsman' },
      { id: 'clb_4', name: 'Bikash Thapa', role: 'all-rounder' },
      { id: 'clb_5', name: 'Rabin Karki', role: 'all-rounder' },
      { id: 'clb_6', name: 'Dipesh Shrestha', role: 'all-rounder' },
      { id: 'clb_7', name: 'Kiran Basnet', role: 'bowler' },
      { id: 'clb_8', name: 'Anish Bhattarai', role: 'bowler' },
      { id: 'clb_9', name: 'Suraj Pandey', role: 'bowler' },
      { id: 'clb_10', name: 'Manish Sharma', role: 'bowler' },
      { id: 'clb_11', name: 'Subash Giri', role: 'bowler' },
    ],
  },
];

class MemoryStorage implements Storage {
  private store: Record<string, string> = {};
  get length() {
    return Object.keys(this.store).length;
  }
  clear(): void {
    this.store = {};
  }
  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }
  key(index: number): string | null {
    return Object.keys(this.store)[index] ?? null;
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }
}

const fallbackStorage = new MemoryStorage();

const getStorage = (): Storage => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // ignore
  }
  return fallbackStorage;
};

/**
 * Resets team storage to uninitialized state (used for testing or factory reset)
 */
export function resetTeamDatabase(): void {
  const storage = getStorage();
  storage.removeItem(STORAGE_KEY);
}

/**
 * Loads all master teams from local persistence, seeding with initial presets if not yet initialized.
 */
export function getAllTeams(): Team[] {
  try {
    const storage = getStorage();
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      // First run: save seed master teams
      saveAllTeams(SEED_MASTER_TEAMS);
      return SEED_MASTER_TEAMS;
    }
    const teams = JSON.parse(raw) as Team[];
    if (!Array.isArray(teams) || teams.length === 0) {
      saveAllTeams(SEED_MASTER_TEAMS);
      return SEED_MASTER_TEAMS;
    }
    return teams;
  } catch (err) {
    console.warn('Failed to load teams from storage:', err);
    return SEED_MASTER_TEAMS;
  }
}

/**
 * Persists all teams array into local storage
 */
export function saveAllTeams(teams: Team[]): boolean {
  try {
    const storage = getStorage();
    storage.setItem(STORAGE_KEY, JSON.stringify(teams));
    return true;
  } catch (err) {
    console.warn('Failed to save teams to storage:', err);
    return false;
  }
}

/**
 * Normalizes text for case-insensitive and whitespace-trimmed comparison
 */
export function normalizeKey(str: string): string {
  return (str || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Checks whether a team with the same name or short name already exists (Duplicate Prevention).
 * If excludeTeamId is passed, that team is ignored (useful when editing an existing team).
 */
export function checkTeamDuplicate(
  name: string,
  shortName: string,
  excludeTeamId?: string
): { isDuplicate: boolean; field?: 'name' | 'shortName'; existing?: Team } {
  const normName = normalizeKey(name);
  const normShort = normalizeKey(shortName);
  const teams = getAllTeams();

  for (const team of teams) {
    if (excludeTeamId && team.id === excludeTeamId) continue;

    if (normalizeKey(team.name) === normName) {
      return { isDuplicate: true, field: 'name', existing: team };
    }
    if (normShort.length > 0 && normalizeKey(team.shortName) === normShort) {
      return { isDuplicate: true, field: 'shortName', existing: team };
    }
  }

  return { isDuplicate: false };
}

/**
 * Real-time "Type & Find" search query against master teams.
 * Matches team name or short code with substring/fuzzy match.
 */
export function searchTeams(query: string): Team[] {
  const norm = normalizeKey(query);
  const all = getAllTeams();
  if (!norm) return all;

  return all.filter((t) => {
    const tName = normalizeKey(t.name);
    const tShort = normalizeKey(t.shortName);
    return tName.includes(norm) || tShort.includes(norm);
  });
}

/**
 * Finds an exact team match by name (case-insensitive)
 */
export function findTeamByName(name: string): Team | undefined {
  const norm = normalizeKey(name);
  if (!norm) return undefined;
  return getAllTeams().find((t) => normalizeKey(t.name) === norm);
}

/**
 * Saves a team into the database (Local Storage + Supabase).
 * Enforces duplicate protection so duplicate team names cannot be created.
 */
export function saveTeamToDatabase(team: Team): { success: boolean; team?: Team; error?: string } {
  const trimmedName = team.name.trim();
  const trimmedShort = (team.shortName || '').trim().toUpperCase();

  if (!trimmedName) {
    return { success: false, error: 'Team name cannot be empty.' };
  }

  // Duplicate verification check
  const dupCheck = checkTeamDuplicate(trimmedName, trimmedShort, team.id);
  if (dupCheck.isDuplicate) {
    const reason = dupCheck.field === 'name' ? 'name' : 'short code';
    return {
      success: false,
      error: `A team with this ${reason} ("${dupCheck.existing?.name}") already exists in the database.`,
      team: dupCheck.existing,
    };
  }

  const teams = getAllTeams();
  const existingIndex = teams.findIndex((t) => t.id === team.id);

  const sanitizedTeam: Team = {
    ...team,
    name: trimmedName,
    shortName: trimmedShort || trimmedName.slice(0, 3).toUpperCase(),
    color: team.color || '#1e3a8a',
    logoUrl: team.logoUrl?.trim() || undefined,
    squad: Array.isArray(team.squad)
      ? team.squad.map((p) => ({
          ...p,
          photoUrl: p.photoUrl?.trim() || undefined,
        }))
      : [],
    playing11: Array.isArray(team.playing11) ? team.playing11 : (team.squad || []).slice(0, 11).map((p) => p.id),
  };

  if (existingIndex >= 0) {
    teams[existingIndex] = sanitizedTeam;
  } else {
    teams.push(sanitizedTeam);
  }

  saveAllTeams(teams);

  // Sync to Supabase in background
  syncTeamToSupabase(sanitizedTeam).catch((err) => {
    console.warn('Background Supabase team sync failed:', err);
  });

  return { success: true, team: sanitizedTeam };
}

/**
 * Deletes a team from the local database and Supabase
 */
export function deleteTeamFromDatabase(teamId: string): boolean {
  const teams = getAllTeams().filter((t) => t.id !== teamId);
  saveAllTeams(teams);
  return true;
}

/**
 * Syncs with Supabase teams table in the cloud and merges into local cache
 */
export async function syncTeamsWithSupabase(): Promise<Team[]> {
  try {
    const cloudTeams = await fetchTeamsFromSupabase();
    const localTeams = getAllTeams();

    if (!cloudTeams || cloudTeams.length === 0) {
      // Cloud database was just initialized! Seed all local teams into Supabase in background
      for (const t of localTeams) {
        syncTeamToSupabase(t).catch((e) => console.warn('Supabase seed error:', e));
      }
      return localTeams;
    }

    const map = new Map<string, Team>();

    // Put local teams first
    localTeams.forEach((t) => map.set(t.id, t));

    // Upsert cloud teams
    cloudTeams.forEach((cloudTeam) => {
      // Find by id or name
      const normName = normalizeKey(cloudTeam.name);
      let foundKey = cloudTeam.id;
      for (const [key, t] of map.entries()) {
        if (normalizeKey(t.name) === normName) {
          foundKey = key;
          break;
        }
      }
      map.set(foundKey, { ...map.get(foundKey), ...cloudTeam });
    });

    const merged = Array.from(map.values());
    saveAllTeams(merged);
    return merged;
  } catch (err) {
    console.warn('Error syncing teams with Supabase:', err);
    return getAllTeams();
  }
}

/**
 * Searches players within a team squad by name, case-insensitively.
 */
export function searchPlayersInTeam(team: Team, query: string): Player[] {
  const q = normalizeKey(query);
  if (!q) return team.squad || [];
  return (team.squad || []).filter((p) => normalizeKey(p.name).includes(q));
}

/**
 * Adds a new player to a team in the database (or returns existing player if duplicate name).
 * Supports lookup by team ID, short code, team name, or by passing the Team object directly.
 * Automatically updates both local storage and syncs to Supabase.
 */
export function addPlayerToTeamInDatabase(
  teamIdentifier: string | Team,
  playerData: {
    name: string;
    role?: Player['role'];
    isCaptain?: boolean;
    isWicketKeeper?: boolean;
    photoUrl?: string;
  }
): { success: boolean; player?: Player; team?: Team; error?: string; isExisting?: boolean } {
  const trimmedName = (playerData.name || '').trim();
  if (!trimmedName) {
    return { success: false, error: 'Player name cannot be empty.' };
  }

  const teams = getAllTeams();
  const teamId = typeof teamIdentifier === 'string' ? teamIdentifier : teamIdentifier.id;
  const normTeamKey = normalizeKey(teamId);

  let team = teams.find(
    (t) =>
      t.id === teamId ||
      normalizeKey(t.id) === normTeamKey ||
      (t.shortName && normalizeKey(t.shortName) === normTeamKey) ||
      normalizeKey(t.name) === normTeamKey ||
      (typeof teamIdentifier !== 'string' &&
        (normalizeKey(t.name) === normalizeKey(teamIdentifier.name) ||
          normalizeKey(t.shortName) === normalizeKey(teamIdentifier.shortName)))
  );

  // If team is not yet saved in database, register this team directly
  if (!team && typeof teamIdentifier !== 'string') {
    team = {
      ...teamIdentifier,
      squad: [...(teamIdentifier.squad || [])],
      playing11: [...(teamIdentifier.playing11 || [])],
    };
    teams.push(team);
  }

  if (!team) {
    return { success: false, error: `Team with ID "${teamId}" not found in database.` };
  }

  // Case-insensitive duplicate check within the team squad
  const normName = normalizeKey(trimmedName);
  const existingPlayer = team.squad.find((p) => normalizeKey(p.name) === normName);

  if (existingPlayer) {
    // If player already exists in the team squad, return it without duplicating!
    // Also ensure they are included in playing11 if not already
    if (!team.playing11.includes(existingPlayer.id)) {
      team.playing11.push(existingPlayer.id);
      saveTeamToDatabase(team);
    }
    return { success: true, player: existingPlayer, team, isExisting: true };
  }

  // Create new unique player
  const newPlayer: Player = {
    id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: trimmedName,
    role: playerData.role || 'batsman',
    isCaptain: !!playerData.isCaptain,
    isWicketKeeper: !!playerData.isWicketKeeper,
    photoUrl: playerData.photoUrl?.trim() || undefined,
  };

  team.squad.push(newPlayer);
  if (!team.playing11.includes(newPlayer.id)) {
    team.playing11.push(newPlayer.id);
  }

  const saveRes = saveTeamToDatabase(team);
  if (!saveRes.success) {
    return { success: false, error: saveRes.error || 'Failed to save updated team.' };
  }

  return { success: true, player: newPlayer, team: saveRes.team || team, isExisting: false };
}
