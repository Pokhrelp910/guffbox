// GuffBox Cricket Studio — Core MCC Cricket Types & Interfaces

export type DismissalType =
  | 'bowled'
  | 'caught'
  | 'caught_behind'
  | 'caught_and_bowled'
  | 'lbw'
  | 'stumped'
  | 'run_out'
  | 'hit_wicket'
  | 'duck_out'
  | 'golden_duck'
  | 'retired_out'
  | 'retired_hurt'
  | 'obstructing_field'
  | 'hit_ball_twice'
  | 'handling_ball'
  | 'timed_out'
  | 'mankad';

export type ExtraType = 'none' | 'wide' | 'noball' | 'bye' | 'leg_bye' | 'penalty';

export interface Player {
  id: string;
  name: string;
  role: 'batsman' | 'bowler' | 'all-rounder' | 'wicket-keeper';
  isCaptain?: boolean;
  isWicketKeeper?: boolean;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  color: string;
  logoUrl?: string;
  squad: Player[];
  playing11: string[]; // Player IDs
}

export interface TossInfo {
  winnerTeamId: string;
  electedTo: 'bat' | 'bowl';
}

export interface WicketEvent {
  type: DismissalType;
  playerOutId: string;
  assistedById?: string; // Catcher / Stumper / Fielder
  runsCompletedBeforeOut: number; // For run-outs: 0, 1, 2 runs
  creditBowler: boolean;
  newBatterId?: string; // Selected batter coming in
}

export interface PenaltyEvent {
  teamBenefited: 'batting' | 'fielding';
  runs: number; // Standard is 5
  reason: string;
}

export interface BallDeliveryEvent {
  id: string;
  inningsNumber: 1 | 2;
  overIndex: number; // 0-based over index
  ballInOver: number; // 1-6 for legal balls, 0 for extra before ball 1
  legalBallCounted: boolean; // false for wide, no-ball, penalty-only
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  
  // Runs breakdown
  runsBat: number;
  runsExtras: number;
  extraType: ExtraType;
  physicalRunsRan: number; // MCC Law: Only physical runs ran rotate strike
  
  // Boundary flags
  isBoundary: boolean;
  isFour: boolean;
  isSix: boolean;
  
  // Free hit status
  isFreeHitDelivery: boolean;
  causesFreeHit: boolean;
  
  // Compound events
  wicket?: WicketEvent;
  penalty?: PenaltyEvent;
  
  // UI Display
  displayBadge: string; // e.g. "0", "1", "4", "6", "W", "Wd", "Nb", "+5P"
  timestamp: number;
}

export interface BatterStats {
  playerId: string;
  name: string;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  isOut: boolean;
  dismissalDescription?: string;
}

export interface BowlerStats {
  playerId: string;
  name: string;
  legalBallsBowled: number;
  oversFormatted: string; // e.g. "3.2"
  maidens: number;
  runsConceded: number; // Batsman runs + Wides + No-balls (Byes & Leg-byes NOT charged to bowler)
  wickets: number;
  economyRate: number;
  noBalls: number;
  wides: number;
  dotsCount: number;
}

export interface Partnership {
  runs: number;
  balls: number;
  batter1Id: string;
  batter1Runs: number;
  batter2Id: string;
  batter2Runs: number;
}

export interface FallOfWicket {
  wicketNumber: number;
  score: number;
  overs: string;
  playerOutId: string;
  playerName: string;
}

export interface InningsState {
  inningsNumber: 1 | 2;
  battingTeamId: string;
  bowlingTeamId: string;
  totalRuns: number;
  totalWickets: number;
  legalBalls: number;
  currentOverLegalBalls: number;
  oversFormatted: string; // e.g. "14.3"
  
  strikerId: string;
  nonStrikerId: string;
  currentBowlerId: string;
  
  batterStats: Record<string, BatterStats>;
  bowlerStats: Record<string, BowlerStats>;
  fallOfWickets: FallOfWicket[];
  
  deliveries: BallDeliveryEvent[];
  recentBalls: BallDeliveryEvent[]; // Deliveries in current over
  currentPartnership: Partnership;
  
  extras: {
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
    penalties: number;
    total: number;
  };
  
  isFreeHitActive: boolean;
  isCompleted: boolean;
  completedReason?: string;
}

export interface MatchMetadata {
  id: string;
  tournamentName: string;
  matchStage: string; // "League Match", "Semi Final", "Final", etc.
  venue: string;
  date: string;
  scheduledOvers: number;
  curtailedOvers?: number; // Rain interruption override
  targetRuns?: number; // Innings 2 target
  dlsRevisedTarget?: number;
}

export interface MatchState {
  metadata: MatchMetadata;
  teamA: Team;
  teamB: Team;
  toss: TossInfo;
  currentInningsNumber: 1 | 2;
  innings1: InningsState;
  innings2: InningsState | null;
  matchWinner?: {
    teamId: string;
    marginText: string;
  };
  isMatchTied?: boolean;
}

// Media Stings & Video registry slots (30+ events)
export type MediaEventKey =
  // Runs
  | 'dot'
  | 'run_1'
  | 'run_2'
  | 'run_3'
  | 'four'
  | 'six'
  // Dismissals
  | 'bowled'
  | 'caught'
  | 'caught_behind'
  | 'caught_and_bowled'
  | 'lbw'
  | 'stumped'
  | 'run_out'
  | 'hit_wicket'
  | 'duck_out'
  | 'golden_duck'
  | 'retired_out'
  | 'retired_hurt'
  | 'obstructing_field'
  | 'hit_ball_twice'
  | 'handling_ball'
  | 'timed_out'
  | 'mankad'
  | 'generic_wicket'
  // Extras
  | 'wide'
  | 'noball'
  | 'free_hit'
  | 'bye'
  | 'leg_bye'
  | 'penalty_5'
  // Milestones
  | 'half_century'
  | 'century'
  | 'haul_3w'
  | 'haul_5w'
  | 'haul_10w'
  | 'maiden_over'
  | 'partnership_50'
  | 'partnership_100'
  // Match States
  | 'toss'
  | 'innings_break'
  | 'match_won'
  | 'super_over';
