// GuffBox Cricket Studio — Pre-Match Setup, Squads & Toss Engine

import React, { useState, useEffect } from 'react';
import { Team, Player, TossInfo, MatchMetadata, MatchState } from '../core/types';
import { Trophy, Users, Coins, Plus, Trash2, RotateCcw, Save, Database, Image as ImageIcon, Upload, Camera } from 'lucide-react';
import { TeamTypeAndFind } from './TeamTypeAndFind';
import { saveTeamToDatabase } from '../lib/teamDatabase';
import { TeamLogo, PlayerAvatar, processImageUpload } from '../utils/avatarUtils';

interface PreMatchModalProps {
  isOpen: boolean;
  currentMatch?: MatchState;
  onStartMatch: (params: {
    metadata: MatchMetadata;
    teamA: Team;
    teamB: Team;
    toss: TossInfo;
    strikerId: string;
    nonStrikerId: string;
    openingBowlerId: string;
  }) => void;
  onUpdateMatchDetails?: (params: {
    metadata: MatchMetadata;
    teamA: Team;
    teamB: Team;
  }) => void;
  onClose?: () => void;
  onResetMatch?: () => void;
}

const PRESET_TEAMS_DATA: Record<string, { name: string; short: string; color: string; squad: Player[] }> = {
  nepal: {
    name: 'Nepal',
    short: 'NEP',
    color: '#1e3a8a',
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
  india: {
    name: 'India',
    short: 'IND',
    color: '#0284c7',
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
  australia: {
    name: 'Australia',
    short: 'AUS',
    color: '#ca8a04',
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
  pakistan: {
    name: 'Pakistan',
    short: 'PAK',
    color: '#047857',
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
  england: {
    name: 'England',
    short: 'ENG',
    color: '#1e3a8a',
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
  npl_janakpur: {
    name: 'Janakpur Bolts',
    short: 'JKB',
    color: '#1e40af',
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
  npl_pokhara: {
    name: 'Pokhara Avengers',
    short: 'PKA',
    color: '#0284c7',
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
  npl_biratnagar: {
    name: 'Biratnagar Kings',
    short: 'BRK',
    color: '#6b21a8',
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
  npl_chitwan: {
    name: 'Chitwan Rhinos',
    short: 'CWR',
    color: '#15803d',
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
  npl_kathmandu: {
    name: 'Kathmandu Gurkhas',
    short: 'KTG',
    color: '#991b1b',
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
  npl_lumbini: {
    name: 'Lumbini Lions',
    short: 'LBL',
    color: '#b45309',
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
  npl_sudurpaschim: {
    name: 'Sudurpaschim Royals',
    short: 'SPR',
    color: '#0f766e',
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
  npl_karnali: {
    name: 'Karnali Yaks',
    short: 'KNY',
    color: '#c2410c',
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
  club: {
    name: 'Guff Warriors',
    short: 'GWR',
    color: '#7c3aed',
    squad: [
      { id: 'clb_1', name: 'Player One', role: 'batsman' },
      { id: 'clb_2', name: 'Player Two', role: 'wicket-keeper', isWicketKeeper: true },
      { id: 'clb_3', name: 'Player Three', role: 'batsman', isCaptain: true },
      { id: 'clb_4', name: 'Player Four', role: 'all-rounder' },
      { id: 'clb_5', name: 'Player Five', role: 'all-rounder' },
      { id: 'clb_6', name: 'Player Six', role: 'all-rounder' },
      { id: 'clb_7', name: 'Player Seven', role: 'bowler' },
      { id: 'clb_8', name: 'Player Eight', role: 'bowler' },
      { id: 'clb_9', name: 'Player Nine', role: 'bowler' },
      { id: 'clb_10', name: 'Player Ten', role: 'bowler' },
      { id: 'clb_11', name: 'Player Eleven', role: 'bowler' },
    ],
  },
};

const COLOR_PRESETS = [
  { name: 'Nepal Navy', value: '#1e3a8a' },
  { name: 'India Sky', value: '#0284c7' },
  { name: 'Aussie Gold', value: '#ca8a04' },
  { name: 'Crimson Red', value: '#dc2626' },
  { name: 'Forest Green', value: '#16a34a' },
  { name: 'Royal Purple', value: '#7c3aed' },
  { name: 'Dark Navy', value: '#0f172a' },
  { name: 'Amber Orange', value: '#ea580c' },
];

export const PreMatchModal: React.FC<PreMatchModalProps> = ({
  isOpen,
  currentMatch,
  onStartMatch,
  onUpdateMatchDetails,
  onClose,
  onResetMatch,
}) => {
  const [activeTab, setActiveTab] = useState<'match' | 'teams' | 'toss'>('match');
  const [activeTeamTab, setActiveTeamTab] = useState<'A' | 'B'>('A');

  const isMatchInProgress = (currentMatch?.innings1?.deliveries?.length || 0) > 0;

  // Match Metadata
  const [tournamentName, setTournamentName] = useState(
    currentMatch?.metadata.tournamentName || 'ICC T20 Cricket Championship'
  );
  const [matchStage, setMatchStage] = useState(
    currentMatch?.metadata.matchStage || 'Grand Final'
  );
  const [venue, setVenue] = useState(
    currentMatch?.metadata.venue || 'TU International Cricket Ground, Kirtipur'
  );
  const [scheduledOvers, setScheduledOvers] = useState<number>(
    currentMatch?.metadata.scheduledOvers || 20
  );

  // Team A
  const [teamAId, setTeamAId] = useState<string>(
    currentMatch?.teamA.id || 'team_nepal'
  );
  const [teamAName, setTeamAName] = useState(
    currentMatch?.teamA.name || PRESET_TEAMS_DATA.nepal.name
  );
  const [teamAShort, setTeamAShort] = useState(
    currentMatch?.teamA.shortName || PRESET_TEAMS_DATA.nepal.short
  );
  const [teamAColor, setTeamAColor] = useState(
    currentMatch?.teamA.color || PRESET_TEAMS_DATA.nepal.color
  );
  const [teamALogo, setTeamALogo] = useState<string>(
    currentMatch?.teamA.logoUrl || ''
  );
  const [teamASquad, setTeamASquad] = useState<Player[]>(
    currentMatch?.teamA.squad || PRESET_TEAMS_DATA.nepal.squad
  );
  const [teamAPlaying11, setTeamAPlaying11] = useState<string[]>(
    currentMatch?.teamA.playing11 || PRESET_TEAMS_DATA.nepal.squad.map((p) => p.id)
  );

  // Team B
  const [teamBId, setTeamBId] = useState<string>(
    currentMatch?.teamB.id || 'team_india'
  );
  const [teamBName, setTeamBName] = useState(
    currentMatch?.teamB.name || PRESET_TEAMS_DATA.india.name
  );
  const [teamBShort, setTeamBShort] = useState(
    currentMatch?.teamB.shortName || PRESET_TEAMS_DATA.india.short
  );
  const [teamBColor, setTeamBColor] = useState(
    currentMatch?.teamB.color || PRESET_TEAMS_DATA.india.color
  );
  const [teamBLogo, setTeamBLogo] = useState<string>(
    currentMatch?.teamB.logoUrl || ''
  );
  const [teamBSquad, setTeamBSquad] = useState<Player[]>(
    currentMatch?.teamB.squad || PRESET_TEAMS_DATA.india.squad
  );
  const [teamBPlaying11, setTeamBPlaying11] = useState<string[]>(
    currentMatch?.teamB.playing11 || PRESET_TEAMS_DATA.india.squad.map((p) => p.id)
  );

  // Database Save Feedback Banner
  const [dbSaveFeedback, setDbSaveFeedback] = useState<{ message: string; isError?: boolean } | null>(null);

  // Toss
  const [tossWinner, setTossWinner] = useState<'A' | 'B'>(
    currentMatch?.toss.winnerTeamId === currentMatch?.teamB.id ? 'B' : 'A'
  );
  const [tossDecision, setTossDecision] = useState<'bat' | 'bowl'>(
    currentMatch?.toss.electedTo || 'bat'
  );

  // Openers & Opening Bowler
  const [strikerId, setStrikerId] = useState<string>(
    currentMatch?.innings1?.strikerId || ''
  );
  const [nonStrikerId, setNonStrikerId] = useState<string>(
    currentMatch?.innings1?.nonStrikerId || ''
  );
  const [openingBowlerId, setOpeningBowlerId] = useState<string>(
    currentMatch?.innings1?.currentBowlerId || ''
  );

  // Keep openers synced when toss or playing 11 changes
  const battingTeamIsA =
    (tossWinner === 'A' && tossDecision === 'bat') ||
    (tossWinner === 'B' && tossDecision === 'bowl');

  const currentBattingSquad = battingTeamIsA ? teamASquad : teamBSquad;
  const currentBatting11Ids = battingTeamIsA ? teamAPlaying11 : teamBPlaying11;
  const currentBatting11 = currentBattingSquad.filter((p) => currentBatting11Ids.includes(p.id));

  const currentBowlingSquad = battingTeamIsA ? teamBSquad : teamASquad;
  const currentBowling11Ids = battingTeamIsA ? teamBPlaying11 : teamAPlaying11;
  const currentBowling11 = currentBowlingSquad.filter((p) => currentBowling11Ids.includes(p.id));

  useEffect(() => {
    // If striker is not in current batting 11, select first
    const hasStriker = currentBatting11.some((p) => p.id === strikerId);
    let newStrikerId = strikerId;
    if (!hasStriker && currentBatting11.length > 0) {
      newStrikerId = currentBatting11[0].id;
      setStrikerId(newStrikerId);
    }

    // If nonStriker is invalid or equal to striker, select next available
    const hasNonStriker = currentBatting11.some(
      (p) => p.id === nonStrikerId && p.id !== newStrikerId
    );
    if (!hasNonStriker) {
      const alt = currentBatting11.find((p) => p.id !== newStrikerId);
      if (alt) setNonStrikerId(alt.id);
    }

    // If opening bowler is invalid, select a bowler or default
    const hasBowler = currentBowling11.some((p) => p.id === openingBowlerId);
    if (!hasBowler && currentBowling11.length > 0) {
      const preferredBowler =
        currentBowling11.find((p) => p.role === 'bowler') || currentBowling11[0];
      setOpeningBowlerId(preferredBowler.id);
    }
  }, [
    tossWinner,
    tossDecision,
    teamAPlaying11,
    teamBPlaying11,
    teamASquad,
    teamBSquad,
  ]);

  if (!isOpen) return null;

  // Helpers for Squad Updates
  const updatePlayerName = (team: 'A' | 'B', id: string, newName: string) => {
    const updater = team === 'A' ? setTeamASquad : setTeamBSquad;
    updater((prev) => prev.map((p) => (p.id === id ? { ...p, name: newName } : p)));
  };

  const updatePlayerPhoto = (team: 'A' | 'B', id: string, photoUrl?: string) => {
    const updater = team === 'A' ? setTeamASquad : setTeamBSquad;
    updater((prev) => prev.map((p) => (p.id === id ? { ...p, photoUrl } : p)));
  };

  const updatePlayerRole = (team: 'A' | 'B', id: string, role: Player['role']) => {
    const updater = team === 'A' ? setTeamASquad : setTeamBSquad;
    updater((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            role,
            isWicketKeeper: role === 'wicket-keeper',
          };
        }
        return p;
      })
    );
  };

  const toggleCaptain = (team: 'A' | 'B', id: string) => {
    const updater = team === 'A' ? setTeamASquad : setTeamBSquad;
    updater((prev) =>
      prev.map((p) => ({
        ...p,
        isCaptain: p.id === id ? !p.isCaptain : false, // Only 1 captain
      }))
    );
  };

  const toggleKeeper = (team: 'A' | 'B', id: string) => {
    const updater = team === 'A' ? setTeamASquad : setTeamBSquad;
    updater((prev) =>
      prev.map((p) => {
        const isTarget = p.id === id;
        const newIsWk = isTarget ? !p.isWicketKeeper : false;
        return {
          ...p,
          isWicketKeeper: newIsWk,
          role: newIsWk ? 'wicket-keeper' : p.role === 'wicket-keeper' ? 'batsman' : p.role,
        };
      })
    );
  };

  const togglePlaying11 = (team: 'A' | 'B', id: string) => {
    const [p11, setP11] = team === 'A' ? [teamAPlaying11, setTeamAPlaying11] : [teamBPlaying11, setTeamBPlaying11];
    if (p11.includes(id)) {
      if (p11.length <= 2) {
        alert('Playing XI must have at least 2 players.');
        return;
      }
      setP11(p11.filter((pid) => pid !== id));
    } else {
      if (p11.length >= 11) {
        alert('Playing XI can have at most 11 players. Deselect someone first.');
        return;
      }
      setP11([...p11, id]);
    }
  };

  const addPlayer = (team: 'A' | 'B') => {
    const isA = team === 'A';
    const squad = isA ? teamASquad : teamBSquad;
    const setSquad = isA ? setTeamASquad : setTeamBSquad;
    const setP11 = isA ? setTeamAPlaying11 : setTeamBPlaying11;

    const newId = `${isA ? 'teama' : 'teamb'}_${Date.now()}`;
    const newPlayer: Player = {
      id: newId,
      name: `Player ${squad.length + 1}`,
      role: 'batsman',
    };

    setSquad([...squad, newPlayer]);
    // Auto add to playing 11 if less than 11
    const p11 = isA ? teamAPlaying11 : teamBPlaying11;
    if (p11.length < 11) {
      setP11([...p11, newId]);
    }
  };

  const removePlayer = (team: 'A' | 'B', id: string) => {
    const isA = team === 'A';
    const squad = isA ? teamASquad : teamBSquad;
    if (squad.length <= 2) {
      alert('Squad must contain at least 2 players.');
      return;
    }
    const setSquad = isA ? setTeamASquad : setTeamBSquad;
    const setP11 = isA ? setTeamAPlaying11 : setTeamBPlaying11;

    setSquad(squad.filter((p) => p.id !== id));
    setP11((prev) => prev.filter((pid) => pid !== id));
  };

  const handleSelectMasterTeam = (teamSlot: 'A' | 'B', team: Team) => {
    if (teamSlot === 'A') {
      setTeamAId(team.id);
      setTeamAName(team.name);
      setTeamAShort(team.shortName);
      setTeamAColor(team.color);
      setTeamALogo(team.logoUrl || '');
      setTeamASquad(team.squad);
      setTeamAPlaying11(
        team.playing11 && team.playing11.length > 0
          ? team.playing11
          : team.squad.slice(0, 11).map((p) => p.id)
      );
    } else {
      setTeamBId(team.id);
      setTeamBName(team.name);
      setTeamBShort(team.shortName);
      setTeamBColor(team.color);
      setTeamBLogo(team.logoUrl || '');
      setTeamBSquad(team.squad);
      setTeamBPlaying11(
        team.playing11 && team.playing11.length > 0
          ? team.playing11
          : team.squad.slice(0, 11).map((p) => p.id)
      );
    }
  };

  const handleCreateNewTeam = (teamSlot: 'A' | 'B', rawName: string) => {
    const cleanName = rawName.trim();
    const cleanShort = cleanName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'NEW';
    const newId = `team_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const defaultSquad: Player[] = [
      { id: `${newId}_1`, name: `${cleanName} Batter 1`, role: 'batsman' },
      { id: `${newId}_2`, name: `${cleanName} Batter 2`, role: 'wicket-keeper', isWicketKeeper: true },
      { id: `${newId}_3`, name: `${cleanName} Captain`, role: 'batsman', isCaptain: true },
      { id: `${newId}_4`, name: `${cleanName} All-Rounder 1`, role: 'all-rounder' },
      { id: `${newId}_5`, name: `${cleanName} All-Rounder 2`, role: 'all-rounder' },
      { id: `${newId}_6`, name: `${cleanName} All-Rounder 3`, role: 'all-rounder' },
      { id: `${newId}_7`, name: `${cleanName} Bowler 1`, role: 'bowler' },
      { id: `${newId}_8`, name: `${cleanName} Bowler 2`, role: 'bowler' },
      { id: `${newId}_9`, name: `${cleanName} Bowler 3`, role: 'bowler' },
      { id: `${newId}_10`, name: `${cleanName} Bowler 4`, role: 'bowler' },
      { id: `${newId}_11`, name: `${cleanName} Bowler 5`, role: 'bowler' },
    ];

    if (teamSlot === 'A') {
      setTeamAId(newId);
      setTeamAName(cleanName);
      setTeamAShort(cleanShort);
      setTeamAColor('#1e3a8a');
      setTeamALogo('');
      setTeamASquad(defaultSquad);
      setTeamAPlaying11(defaultSquad.map((p) => p.id));
    } else {
      setTeamBId(newId);
      setTeamBName(cleanName);
      setTeamBShort(cleanShort);
      setTeamBColor('#dc2626');
      setTeamBLogo('');
      setTeamBSquad(defaultSquad);
      setTeamBPlaying11(defaultSquad.map((p) => p.id));
    }
  };

  const handleSaveActiveTeamToDatabase = () => {
    const isA = activeTeamTab === 'A';
    const targetTeam: Team = {
      id: isA ? teamAId : teamBId,
      name: isA ? teamAName.trim() : teamBName.trim(),
      shortName: (isA ? teamAShort.trim() : teamBShort.trim()).toUpperCase(),
      color: isA ? teamAColor : teamBColor,
      logoUrl: isA ? teamALogo.trim() : teamBLogo.trim(),
      squad: isA ? teamASquad : teamBSquad,
      playing11: isA ? teamAPlaying11 : teamBPlaying11,
    };

    if (!targetTeam.name) {
      setDbSaveFeedback({ message: '⚠️ Team name cannot be empty.', isError: true });
      return;
    }

    const res = saveTeamToDatabase(targetTeam);
    if (!res.success) {
      setDbSaveFeedback({ message: `⚠️ ${res.error || 'Duplicate team detected.'}`, isError: true });
    } else {
      setDbSaveFeedback({
        message: `✓ "${targetTeam.name}" (${targetTeam.shortName}) saved to Master Database!`,
        isError: false,
      });
      setTimeout(() => setDbSaveFeedback(null), 4000);
    }
  };

  const loadPresetTeam = (team: 'A' | 'B', presetKey: string) => {
    const data = PRESET_TEAMS_DATA[presetKey];
    if (!data) return;

    if (team === 'A') {
      setTeamAName(data.name);
      setTeamAShort(data.short);
      setTeamAColor(data.color);
      setTeamALogo('');
      setTeamASquad(data.squad);
      setTeamAPlaying11(data.squad.map((p) => p.id));
    } else {
      setTeamBName(data.name);
      setTeamBShort(data.short);
      setTeamBColor(data.color);
      setTeamBLogo('');
      setTeamBSquad(data.squad);
      setTeamBPlaying11(data.squad.map((p) => p.id));
    }
  };

  const handleSaveDetailsOnly = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!tournamentName.trim()) {
      alert('Please enter Tournament Name.');
      return;
    }
    if (!teamAName.trim() || !teamBName.trim()) {
      alert('Please provide valid names for both teams.');
      return;
    }

    const teamA: Team = {
      id: teamAId || currentMatch?.teamA.id || 'team_a',
      name: teamAName.trim(),
      shortName: (teamAShort.trim() || 'TMA').toUpperCase(),
      color: teamAColor,
      logoUrl: teamALogo.trim(),
      squad: teamASquad,
      playing11: teamAPlaying11,
    };

    const teamB: Team = {
      id: teamBId || currentMatch?.teamB.id || 'team_b',
      name: teamBName.trim(),
      shortName: (teamBShort.trim() || 'TMB').toUpperCase(),
      color: teamBColor,
      logoUrl: teamBLogo.trim(),
      squad: teamBSquad,
      playing11: teamBPlaying11,
    };

    // Auto-save teams to master database
    saveTeamToDatabase(teamA);
    saveTeamToDatabase(teamB);

    const metadata: MatchMetadata = {
      id: currentMatch?.metadata.id || `match_${Date.now()}`,
      tournamentName: tournamentName.trim(),
      matchStage: matchStage.trim(),
      venue: venue.trim(),
      date: currentMatch?.metadata.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      scheduledOvers,
    };

    if (onUpdateMatchDetails) {
      onUpdateMatchDetails({ metadata, teamA, teamB });
    } else {
      // Fallback
      const toss: TossInfo = {
        winnerTeamId: tossWinner === 'A' ? teamA.id : teamB.id,
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
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isMatchInProgress) {
      const confirmFresh = confirm(
        'A live match is currently in progress!\nStarting a fresh match will clear all deliveries, scores, and wickets.\n\nClick OK to reset & start fresh match, or Cancel to keep live scores.'
      );
      if (!confirmFresh) {
        return;
      }
    }

    // Validation checks
    if (!tournamentName.trim()) {
      alert('Please enter Tournament Name.');
      return;
    }
    if (!teamAName.trim() || !teamBName.trim()) {
      alert('Please provide valid names for both teams.');
      return;
    }
    if (teamAPlaying11.length < 2 || teamBPlaying11.length < 2) {
      alert('Both teams must have at least 2 players in Playing XI.');
      return;
    }
    if (!strikerId || !nonStrikerId || strikerId === nonStrikerId) {
      alert('Please choose distinct Opening Striker and Non-Striker.');
      return;
    }
    if (!openingBowlerId) {
      alert('Please choose an Opening Bowler.');
      return;
    }

    const teamA: Team = {
      id: teamAId || currentMatch?.teamA.id || 'team_a',
      name: teamAName.trim(),
      shortName: (teamAShort.trim() || 'TMA').toUpperCase(),
      color: teamAColor,
      logoUrl: teamALogo.trim(),
      squad: teamASquad,
      playing11: teamAPlaying11,
    };

    const teamB: Team = {
      id: teamBId || currentMatch?.teamB.id || 'team_b',
      name: teamBName.trim(),
      shortName: (teamBShort.trim() || 'TMB').toUpperCase(),
      color: teamBColor,
      logoUrl: teamBLogo.trim(),
      squad: teamBSquad,
      playing11: teamBPlaying11,
    };

    // Auto-save teams to master database
    saveTeamToDatabase(teamA);
    saveTeamToDatabase(teamB);

    const metadata: MatchMetadata = {
      id: currentMatch?.metadata.id || `match_${Date.now()}`,
      tournamentName: tournamentName.trim(),
      matchStage: matchStage.trim(),
      venue: venue.trim(),
      date: currentMatch?.metadata.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      scheduledOvers,
    };

    const toss: TossInfo = {
      winnerTeamId: tossWinner === 'A' ? teamA.id : teamB.id,
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

  const currentSquad = activeTeamTab === 'A' ? teamASquad : teamBSquad;
  const currentP11 = activeTeamTab === 'A' ? teamAPlaying11 : teamBPlaying11;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 font-sans text-white overflow-y-auto">
      <div
        className="border-2 rounded-3xl w-full max-w-4xl p-5 sm:p-6 shadow-2xl space-y-4 my-auto flex flex-col max-h-[94vh]"
        style={{
          background: 'linear-gradient(145deg, #070d1e 0%, #1c050a 100%)',
          borderColor: '#facc15',
          boxShadow: '0 0 32px rgba(0,0,0,0.9), 0 0 16px rgba(250,204,21,0.2)',
        }}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-yellow-500/20 pb-4">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">🏆</span>
            <div>
              <h2 className="text-2xl font-black font-['Teko'] tracking-wider text-yellow-400">
                PRE-MATCH SETUP & TOSS ENGINE
              </h2>
              <p className="text-xs text-white/80">
                Configure teams, playing XI with Captain/Keeper badges, venue, and toss decision.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {onResetMatch && (
              <button
                type="button"
                onClick={onResetMatch}
                className="flex items-center space-x-1 bg-red-950 hover:bg-red-900 border border-yellow-500/40 text-yellow-300 text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer"
                title="Reset match completely to clean slate"
              >
                <RotateCcw className="w-3.5 h-3.5 text-yellow-400" />
                <span>Reset Match</span>
              </button>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-white hover:text-yellow-400 font-bold text-lg px-2 py-1 rounded-lg cursor-pointer transition"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Live Match in Progress Notice */}
        {isMatchInProgress && (
          <div className="bg-red-950/80 border border-yellow-500/40 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" />
              <span className="font-bold text-white">
                Live Match In Progress — Innings {currentMatch?.currentInningsNumber}: <span className="text-yellow-400">{currentMatch?.innings1.oversFormatted} ov</span> (<span className="text-yellow-300">{currentMatch?.innings1.totalRuns}/{currentMatch?.innings1.totalWickets}</span>)
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleSaveDetailsOnly()}
              className="bg-gradient-to-r from-red-800 to-blue-900 hover:from-red-700 hover:to-blue-800 text-yellow-300 font-black px-4 py-1.5 rounded-xl shadow transition flex items-center space-x-1.5 border border-yellow-500/40 cursor-pointer"
            >
              <span>💾 Update Details (Keep Live Scores)</span>
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center bg-[#050914] p-1.5 rounded-2xl border border-yellow-500/30 space-x-1">
          <button
            type="button"
            onClick={() => setActiveTab('match')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2 transition cursor-pointer ${
              activeTab === 'match'
                ? 'bg-yellow-400 text-slate-950 shadow-md'
                : 'text-white hover:text-yellow-300'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>1. Match & Overs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('teams')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2 transition cursor-pointer ${
              activeTab === 'teams'
                ? 'bg-yellow-400 text-slate-950 shadow-md'
                : 'text-white hover:text-yellow-300'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>2. Teams & Squads (Playing XI)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('toss')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2 transition cursor-pointer ${
              activeTab === 'toss'
                ? 'bg-yellow-400 text-slate-950 shadow-md'
                : 'text-white hover:text-yellow-300'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>3. Toss & Openers</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
          
          {/* TAB 1: MATCH METADATA */}
          {activeTab === 'match' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-yellow-400 uppercase tracking-wider block mb-1">
                    Tournament / Series Name
                  </label>
                  <input
                    type="text"
                    value={tournamentName}
                    onChange={(e) => setTournamentName(e.target.value)}
                    placeholder="e.g. ICC Men's T20 World Cup"
                    className="w-full bg-[#060b1c] border border-yellow-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-400"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-yellow-400 uppercase tracking-wider block mb-1">
                    Match Stage / Title
                  </label>
                  <input
                    type="text"
                    value={matchStage}
                    onChange={(e) => setMatchStage(e.target.value)}
                    placeholder="e.g. Grand Final / Match 14"
                    className="w-full bg-[#060b1c] border border-yellow-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-yellow-400 uppercase tracking-wider block mb-1">
                  Venue (Stadium & City)
                </label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="e.g. TU International Cricket Ground, Kirtipur"
                  className="w-full bg-[#060b1c] border border-yellow-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-400"
                  required
                />
              </div>

              <div className="bg-[#081026]/90 p-4 rounded-2xl border border-yellow-500/25 space-y-3">
                <label className="text-xs font-bold text-yellow-400 uppercase tracking-wider block">
                  Scheduled Overs per Innings
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {[5, 10, 15, 20, 50].map((ov) => (
                    <button
                      key={ov}
                      type="button"
                      onClick={() => setScheduledOvers(ov)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        scheduledOvers === ov
                          ? 'bg-yellow-400 border-yellow-400 text-slate-950 font-black shadow'
                          : 'bg-[#060b1c] border-yellow-500/30 text-white hover:border-yellow-400'
                      }`}
                    >
                      {ov} Overs {ov === 20 ? '(T20)' : ov === 50 ? '(ODI)' : ''}
                    </button>
                  ))}
                  <div className="flex items-center space-x-2 ml-auto">
                    <span className="text-xs text-white">Custom:</span>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={scheduledOvers}
                      onChange={(e) => setScheduledOvers(parseInt(e.target.value, 10) || 20)}
                      className="w-20 bg-[#060b1c] border border-yellow-500/40 rounded-xl px-3 py-1.5 text-xs text-yellow-300 font-bold focus:outline-none focus:border-yellow-400"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap items-center justify-between gap-2">
                {isMatchInProgress && (
                  <button
                    type="button"
                    onClick={() => handleSaveDetailsOnly()}
                    className="bg-gradient-to-r from-red-800 to-blue-900 hover:from-red-700 hover:to-blue-800 text-yellow-300 border border-yellow-500/40 font-black text-xs px-5 py-2.5 rounded-xl uppercase tracking-wider shadow transition cursor-pointer"
                  >
                    💾 Save Match Details (Keep Live Scores)
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab('teams')}
                  className="bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs px-6 py-2.5 rounded-xl uppercase tracking-wider shadow transition ml-auto cursor-pointer"
                >
                  Next: Setup Teams & Squads ➔
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: TEAMS & SQUADS */}
          {activeTab === 'teams' && (
            <div className="space-y-4">
              {/* Type & Find Combobox from Master Database */}
              <div className="bg-[#081026]/90 p-4 rounded-2xl border border-yellow-500/30 space-y-3 shadow-md">
                <div className="flex items-center justify-between border-b border-yellow-500/20 pb-2">
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4 text-yellow-400" />
                    <h3 className="text-xs font-black text-yellow-400 uppercase tracking-wider">
                      Master Team Database — Type & Find
                    </h3>
                  </div>
                  <span className="text-[10px] text-white/80 font-medium">
                    Permanent Master Records • Instant Squad Loading
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TeamTypeAndFind
                    label="Team 1 (Host) Search"
                    selectedTeam={{
                      id: teamAId,
                      name: teamAName,
                      shortName: teamAShort,
                      color: teamAColor,
                      logoUrl: teamALogo,
                      squadCount: teamASquad.length,
                    }}
                    onSelectTeam={(team) => {
                      handleSelectMasterTeam('A', team);
                      setActiveTeamTab('A');
                    }}
                    onCreateNewTeam={(name) => {
                      handleCreateNewTeam('A', name);
                      setActiveTeamTab('A');
                    }}
                    placeholder="Type to search (e.g. Nepal, Janakpur Bolts)..."
                  />

                  <TeamTypeAndFind
                    label="Team 2 (Opponent) Search"
                    selectedTeam={{
                      id: teamBId,
                      name: teamBName,
                      shortName: teamBShort,
                      color: teamBColor,
                      logoUrl: teamBLogo,
                      squadCount: teamBSquad.length,
                    }}
                    onSelectTeam={(team) => {
                      handleSelectMasterTeam('B', team);
                      setActiveTeamTab('B');
                    }}
                    onCreateNewTeam={(name) => {
                      handleCreateNewTeam('B', name);
                      setActiveTeamTab('B');
                    }}
                    placeholder="Type to search (e.g. India, Pokhara Avengers)..."
                  />
                </div>
              </div>

              {/* Team Selector, Save to DB & Presets */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTeamTab('A')}
                    className={`py-1.5 px-4 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                      activeTeamTab === 'A'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: teamAColor }} />
                    <span>Team 1 (Host): {teamAName || 'Team A'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTeamTab('B')}
                    className={`py-1.5 px-4 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                      activeTeamTab === 'B'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: teamBColor }} />
                    <span>Team 2 (Opponent): {teamBName || 'Team B'}</span>
                  </button>

                  {/* Dedicated Save to Master Database Button with Duplicate Protection */}
                  <button
                    type="button"
                    onClick={handleSaveActiveTeamToDatabase}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-3.5 py-1.5 rounded-xl uppercase tracking-wider shadow flex items-center space-x-1.5 transition ml-1"
                    title="Save active team and player squad permanently to the database"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save to Master DB</span>
                  </button>
                </div>

                {/* Preset Team Quick Load Dropdown */}
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-yellow-400 font-bold">⚡ Load Preset:</span>
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        loadPresetTeam(activeTeamTab, e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="bg-slate-800 text-yellow-300 font-bold px-3 py-1.5 rounded-xl border border-slate-700 outline-none text-xs cursor-pointer shadow"
                  >
                    <option value="" disabled>-- Select Preset Team --</option>
                    <optgroup label="🇳🇵 Nepal Premier League (NPL)">
                      <option value="npl_janakpur">Janakpur Bolts (JKB)</option>
                      <option value="npl_pokhara">Pokhara Avengers (PKA)</option>
                      <option value="npl_biratnagar">Biratnagar Kings (BRK)</option>
                      <option value="npl_chitwan">Chitwan Rhinos (CWR)</option>
                      <option value="npl_kathmandu">Kathmandu Gurkhas (KTG)</option>
                      <option value="npl_lumbini">Lumbini Lions (LBL)</option>
                      <option value="npl_sudurpaschim">Sudurpaschim Royals (SPR)</option>
                      <option value="npl_karnali">Karnali Yaks (KNY)</option>
                    </optgroup>
                    <optgroup label="🌍 International Teams">
                      <option value="nepal">Nepal (NEP)</option>
                      <option value="india">India (IND)</option>
                      <option value="pakistan">Pakistan (PAK)</option>
                      <option value="australia">Australia (AUS)</option>
                      <option value="england">England (ENG)</option>
                      <option value="club">Guff Warriors (Club)</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Status / Duplicate Feedback Banner */}
              {dbSaveFeedback && (
                <div
                  className={`text-xs px-3.5 py-2 rounded-xl font-bold border flex items-center space-x-2 transition ${
                    dbSaveFeedback.isError
                      ? 'bg-[#1c0810] border-red-500/50 text-yellow-300'
                      : 'bg-[#0a1226] border-yellow-500/50 text-yellow-300'
                  }`}
                >
                  <span>{dbSaveFeedback.message}</span>
                </div>
              )}

              {/* Team Metadata (Name, Short, Color, Logo) */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  <div className="md:col-span-5">
                    <label className="text-xs font-bold text-slate-400 block mb-1">
                      Team Name
                    </label>
                    <input
                      type="text"
                      value={activeTeamTab === 'A' ? teamAName : teamBName}
                      onChange={(e) =>
                        activeTeamTab === 'A'
                          ? setTeamAName(e.target.value)
                          : setTeamBName(e.target.value)
                      }
                      placeholder="e.g. Nepal"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-400 block mb-1">
                      Code (3-4 Chars)
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={activeTeamTab === 'A' ? teamAShort : teamBShort}
                      onChange={(e) =>
                        activeTeamTab === 'A'
                          ? setTeamAShort(e.target.value.toUpperCase())
                          : setTeamBShort(e.target.value.toUpperCase())
                      }
                      placeholder="NEP"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-yellow-300 font-mono font-black uppercase text-center"
                    />
                  </div>

                  <div className="md:col-span-5">
                    <label className="text-xs font-bold text-slate-400 block mb-1">
                      Team Broadcast Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={activeTeamTab === 'A' ? teamAColor : teamBColor}
                        onChange={(e) =>
                          activeTeamTab === 'A'
                            ? setTeamAColor(e.target.value)
                            : setTeamBColor(e.target.value)
                        }
                        className="w-9 h-9 rounded-xl bg-transparent border-0 cursor-pointer p-0"
                      />
                      <div className="flex flex-wrap gap-1">
                        {COLOR_PRESETS.map((c) => (
                          <button
                            key={c.value}
                            type="button"
                            onClick={() =>
                              activeTeamTab === 'A'
                                ? setTeamAColor(c.value)
                                : setTeamBColor(c.value)
                            }
                            title={c.name}
                            style={{ backgroundColor: c.value }}
                            className="w-6 h-6 rounded-lg border border-white/30 hover:scale-110 transition"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Team Logo / Crest Settings */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <TeamLogo
                      name={activeTeamTab === 'A' ? teamAName : teamBName}
                      shortName={activeTeamTab === 'A' ? teamAShort : teamBShort}
                      logoUrl={activeTeamTab === 'A' ? teamALogo : teamBLogo}
                      color={activeTeamTab === 'A' ? teamAColor : teamBColor}
                      size="md"
                    />
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-yellow-400" />
                        <span>Team Logo / Crest</span>
                        {(activeTeamTab === 'A' ? teamALogo : teamBLogo) ? (
                          <span className="text-[10px] text-yellow-300 bg-[#0a1226] px-2 py-0.5 rounded border border-yellow-500/40">
                            Custom Logo
                          </span>
                        ) : (
                          <span className="text-[10px] text-yellow-400 bg-[#1c0810] px-2 py-0.5 rounded border border-yellow-500/40">
                            Cartoon Crest Active
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Default cartoon franchise crest is used if no custom logo is uploaded.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={activeTeamTab === 'A' ? teamALogo : teamBLogo}
                      onChange={(e) =>
                        activeTeamTab === 'A'
                          ? setTeamALogo(e.target.value)
                          : setTeamBLogo(e.target.value)
                      }
                      placeholder="Paste Logo URL or Upload File..."
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 w-48 sm:w-64 focus:outline-none focus:border-yellow-400"
                    />

                    {/* File Upload Button */}
                    <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-yellow-300 px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-bold flex items-center space-x-1 transition shadow">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const base64 = await processImageUpload(file, 250);
                              if (activeTeamTab === 'A') setTeamALogo(base64);
                              else setTeamBLogo(base64);
                            } catch (err: any) {
                              alert(err?.message || 'Error processing image.');
                            }
                          }
                        }}
                      />
                    </label>

                    {(activeTeamTab === 'A' ? teamALogo : teamBLogo) && (
                      <button
                        type="button"
                        onClick={() => {
                          if (activeTeamTab === 'A') setTeamALogo('');
                          else setTeamBLogo('');
                        }}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-300 border border-slate-700 transition"
                        title="Remove custom logo and restore default cartoon crest"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Squad Management Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-wider">
                      Squad Roster ({currentSquad.length} Players)
                    </h3>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#0a1226] border border-yellow-500/50 text-yellow-300">
                      Playing XI: {currentP11.length} / 11 Selected
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => addPlayer(activeTeamTab)}
                    className="bg-slate-800 hover:bg-slate-700 text-yellow-300 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 flex items-center space-x-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Player</span>
                  </button>
                </div>

                <div className="bg-[#060b1c] border border-yellow-500/25 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#081026] text-yellow-400 font-bold uppercase text-[10px] border-b border-yellow-500/20 sticky top-0">
                      <tr>
                        <th className="py-2 px-2 text-center w-10">XI</th>
                        <th className="py-2 px-1 text-center w-10">Photo</th>
                        <th className="py-2 px-3">Player Name</th>
                        <th className="py-2 px-3 w-32">Role</th>
                        <th className="py-2 px-2 text-center w-14">C</th>
                        <th className="py-2 px-2 text-center w-14">WK</th>
                        <th className="py-2 px-2 text-center w-12">Del</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-yellow-500/10 font-medium">
                      {currentSquad.map((p, idx) => {
                        const isSelectedIn11 = currentP11.includes(p.id);

                        return (
                          <tr
                            key={p.id}
                            className={`hover:bg-blue-900/30 transition ${
                              isSelectedIn11 ? 'bg-blue-950/40 text-white' : 'opacity-60 text-white/70'
                            }`}
                          >
                            {/* Playing 11 Checkbox */}
                            <td className="py-1.5 px-2 text-center">
                              <input
                                type="checkbox"
                                checked={isSelectedIn11}
                                onChange={() => togglePlaying11(activeTeamTab, p.id)}
                                className="w-4 h-4 rounded text-yellow-500 focus:ring-0 bg-slate-900 border-slate-700 cursor-pointer"
                              />
                            </td>

                            {/* Player Photo Avatar with Quick Upload/Cartoon Fallback */}
                            <td className="py-1 px-1 text-center">
                              <label
                                className="cursor-pointer relative group inline-block"
                                title="Click to upload custom player photo (or default cartoon avatar is used)"
                              >
                                <PlayerAvatar
                                  name={p.name}
                                  photoUrl={p.photoUrl}
                                  role={p.role}
                                  teamColor={activeTeamTab === 'A' ? teamAColor : teamBColor}
                                  size="xs"
                                  className="group-hover:ring-2 group-hover:ring-yellow-400 transition"
                                />
                                <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                  <Camera className="w-2.5 h-2.5 text-yellow-300" />
                                </div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      try {
                                        const base64 = await processImageUpload(file, 160);
                                        updatePlayerPhoto(activeTeamTab, p.id, base64);
                                      } catch (err: any) {
                                        alert(err?.message || 'Error processing photo.');
                                      }
                                    }
                                  }}
                                />
                              </label>
                            </td>

                            {/* Name Input */}
                            <td className="py-1.5 px-3">
                              <div className="flex items-center space-x-1.5">
                                <span className="text-slate-500 text-[10px] w-4">{idx + 1}.</span>
                                <input
                                  type="text"
                                  value={p.name}
                                  onChange={(e) =>
                                    updatePlayerName(activeTeamTab, p.id, e.target.value)
                                  }
                                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1 text-xs text-white w-full focus:outline-none focus:border-yellow-400 font-semibold"
                                />
                              </div>
                            </td>

                            {/* Role Select */}
                            <td className="py-1.5 px-3">
                              <select
                                value={p.role}
                                onChange={(e) =>
                                  updatePlayerRole(
                                    activeTeamTab,
                                    p.id,
                                    e.target.value as Player['role']
                                  )
                                }
                                className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-300 w-full focus:outline-none focus:border-yellow-400"
                              >
                                <option value="batsman">Batsman</option>
                                <option value="bowler">Bowler</option>
                                <option value="all-rounder">All-Rounder</option>
                                <option value="wicket-keeper">Wicket-Keeper</option>
                              </select>
                            </td>

                            {/* Captain (C) */}
                            <td className="py-1.5 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => toggleCaptain(activeTeamTab, p.id)}
                                title={p.isCaptain ? 'Captain' : 'Make Captain'}
                                className={`px-2 py-0.5 rounded text-[10px] font-black transition ${
                                  p.isCaptain
                                    ? 'bg-yellow-500 text-slate-950 shadow'
                                    : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                                }`}
                              >
                                C
                              </button>
                            </td>

                            {/* Wicket-Keeper (WK) */}
                            <td className="py-1.5 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => toggleKeeper(activeTeamTab, p.id)}
                                title={p.isWicketKeeper ? 'Wicket-Keeper' : 'Make Wicket-Keeper'}
                                className={`px-2 py-0.5 rounded text-[10px] font-black transition ${
                                  p.isWicketKeeper
                                    ? 'bg-blue-500 text-white shadow'
                                    : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                                }`}
                              >
                                WK
                              </button>
                            </td>

                            {/* Remove */}
                            <td className="py-1.5 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => removePlayer(activeTeamTab, p.id)}
                                className="text-slate-600 hover:text-red-400 p-1 transition"
                                title="Delete Player"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('match')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-4 py-2 rounded-xl"
                >
                  ◀ Back: Match
                </button>
                <div className="flex items-center space-x-2">
                  {isMatchInProgress && (
                    <button
                      type="button"
                      onClick={() => handleSaveDetailsOnly()}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-4 py-2 rounded-xl uppercase tracking-wider shadow transition"
                    >
                      💾 Save Squad Details
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveTab('toss')}
                    className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black text-xs px-6 py-2 rounded-xl uppercase tracking-wider shadow transition"
                  >
                    Next: Toss & Openers ➔
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TOSS & OPENERS */}
          {activeTab === 'toss' && (
            <div className="space-y-5">
              {/* Toss Engine Box */}
              <div className="bg-slate-950 border border-yellow-500/40 p-5 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-2">
                  <span>🪙</span> OFFICIAL TOSS ENGINE
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Toss Winner */}
                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                      Toss Won By:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setTossWinner('A')}
                        className={`py-2.5 px-3 rounded-xl font-bold text-xs border transition flex items-center justify-center space-x-1.5 ${
                          tossWinner === 'A'
                            ? 'bg-yellow-500 border-white text-slate-950 font-black shadow-lg scale-102'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <span>{teamAName || 'Team A'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTossWinner('B')}
                        className={`py-2.5 px-3 rounded-xl font-bold text-xs border transition flex items-center justify-center space-x-1.5 ${
                          tossWinner === 'B'
                            ? 'bg-yellow-500 border-white text-slate-950 font-black shadow-lg scale-102'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <span>{teamBName || 'Team B'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Toss Decision */}
                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                      Elected To:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setTossDecision('bat')}
                        className={`py-2.5 px-3 rounded-xl font-bold text-xs border transition flex items-center justify-center space-x-1.5 ${
                          tossDecision === 'bat'
                            ? 'bg-yellow-500 border-white text-slate-950 font-black shadow-lg scale-102'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <span>🏏 Bat First</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTossDecision('bowl')}
                        className={`py-2.5 px-3 rounded-xl font-bold text-xs border transition flex items-center justify-center space-x-1.5 ${
                          tossDecision === 'bowl'
                            ? 'bg-yellow-500 border-white text-slate-950 font-black shadow-lg scale-102'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <span>🎯 Bowl First</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Toss Outcome Banner */}
                <div className="text-xs font-semibold text-white bg-gradient-to-r from-[#0a1226] to-[#1c0810] border border-yellow-500/40 p-3 rounded-xl flex items-center justify-between">
                  <div>
                    🪙 <strong>{tossWinner === 'A' ? teamAName : teamBName}</strong> won the toss and elected to{' '}
                    <strong className="uppercase text-yellow-300">{tossDecision}</strong> first.
                  </div>
                  <div className="text-[11px] text-yellow-300 font-mono font-bold">
                    Batting: {battingTeamIsA ? teamAName : teamBName}
                  </div>
                </div>
              </div>

              {/* Openers & Bowler Selection */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-black text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🏏</span>
                    <span>CHOOSE OPENING BATTERS & BOWLER</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      const temp = strikerId;
                      setStrikerId(nonStrikerId);
                      setNonStrikerId(temp);
                    }}
                    className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/40 px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1"
                  >
                    <span>⇄ Swap Striker & Non-Striker</span>
                  </button>
                </div>

                {/* 1-Tap Quick Select Batter Grid */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 block">
                    Tap to Assign Striker / Non-Striker from Batting XI ({currentBatting11.length} players):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentBatting11.map((p) => {
                      const isStriker = p.id === strikerId;
                      const isNonStriker = p.id === nonStrikerId;
                      return (
                        <div
                          key={p.id}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition ${
                            isStriker
                              ? 'bg-yellow-500 text-slate-950 border-white shadow-md font-black'
                              : isNonStriker
                              ? 'bg-slate-800 text-yellow-300 border-yellow-500/50'
                              : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <span>{p.name}</span>
                          <div className="flex items-center gap-1">
                            {!isStriker && (
                              <button
                                type="button"
                                onClick={() => setStrikerId(p.id)}
                                className="bg-slate-950/70 hover:bg-yellow-400 hover:text-slate-950 text-slate-300 text-[10px] px-1.5 py-0.5 rounded transition"
                                title="Set as Striker"
                              >
                                Set Striker
                              </button>
                            )}
                            {!isNonStriker && (
                              <button
                                type="button"
                                onClick={() => setNonStrikerId(p.id)}
                                className="bg-slate-950/70 hover:bg-slate-200 hover:text-slate-950 text-slate-300 text-[10px] px-1.5 py-0.5 rounded transition"
                                title="Set as Non-Striker"
                              >
                                Set Non-Striker
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-yellow-500/20">
                  {/* Striker */}
                  <div className="bg-[#081026] p-3 rounded-xl border border-yellow-500/40">
                    <label className="text-xs font-black text-yellow-400 uppercase tracking-wider block mb-1">
                      1. Striker (Facing 1st Ball)
                    </label>
                    <select
                      value={strikerId}
                      onChange={(e) => setStrikerId(e.target.value)}
                      className="w-full bg-[#050914] border border-yellow-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-400 font-bold"
                    >
                      {currentBatting11.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.isCaptain ? '(C)' : ''} {p.isWicketKeeper ? '(WK)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Non-Striker */}
                  <div className="bg-[#081026] p-3 rounded-xl border border-yellow-500/30">
                    <label className="text-xs font-black text-white uppercase tracking-wider block mb-1">
                      2. Non-Striker (Runner)
                    </label>
                    <select
                      value={nonStrikerId}
                      onChange={(e) => setNonStrikerId(e.target.value)}
                      className="w-full bg-[#050914] border border-yellow-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-400 font-bold"
                    >
                      {currentBatting11
                        .filter((p) => p.id !== strikerId)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.isCaptain ? '(C)' : ''} {p.isWicketKeeper ? '(WK)' : ''}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Opening Bowler */}
                  <div className="bg-[#1c050c] p-3 rounded-xl border border-yellow-500/30">
                    <label className="text-xs font-black text-yellow-400 uppercase tracking-wider block mb-1">
                      3. Opening Bowler (1st Over)
                    </label>
                    <select
                      value={openingBowlerId}
                      onChange={(e) => setOpeningBowlerId(e.target.value)}
                      className="w-full bg-[#050914] border border-yellow-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-400 font-bold"
                    >
                      {currentBowling11.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.role}) {p.isCaptain ? '(C)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 space-y-2">
                {isMatchInProgress ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSaveDetailsOnly()}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm sm:text-base py-3 sm:py-3.5 rounded-2xl shadow-xl transition uppercase tracking-wider flex items-center justify-center space-x-2"
                    >
                      <span>💾 Update Match Details (Keep Live Scores & Deliveries)</span>
                    </button>
                    <button
                      type="submit"
                      className="w-full bg-red-950/70 hover:bg-red-900 border border-red-700/80 text-red-300 font-bold text-xs py-2 rounded-xl transition uppercase tracking-wider flex items-center justify-center space-x-1.5"
                    >
                      <span>⚠️ Reset & Start Fresh Match (Erase Existing Deliveries)</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="submit"
                    className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black text-base py-3.5 rounded-2xl shadow-xl transition uppercase tracking-wider flex items-center justify-center space-x-2"
                  >
                    <span>Start Live Match & Save Setup 🚀</span>
                  </button>
                )}
              </div>
            </div>
          )}

        </form>

      </div>
    </div>
  );
};
