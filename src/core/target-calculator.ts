// GuffBox Cricket Studio — Target, Run Rates & Curtailed Overs Calculator

export interface TargetCalculationResult {
  currentRunRate: number;
  crrFormatted: string;
  requiredRunRate: number | null;
  rrrFormatted: string | null;
  runsNeeded: number | null;
  ballsRemaining: number | null;
  targetRuns: number | null;
  effectiveTarget: number | null;
  isTargetReached: boolean;
  isAllOut: boolean;
  matchResult?: string;
}

export interface CurtailedOversQuota {
  scheduledOvers: number;
  curtailedOvers: number;
  powerplayOvers: number;
  maxOversPerBowler: number;
  bowlersWithExtraOver: number; // Remainder overs distribution
  quotaDescription: string;
}

/**
 * Calculates current run rate (CRR) and required run rate (RRR)
 */
export function calculateMatchRates(params: {
  currentRuns: number;
  legalBallsBowled: number;
  maxOvers: number;
  target?: number | null;
  wickets: number;
  battingTeamName: string;
  bowlingTeamName: string;
  isFirstInnings: boolean;
}): TargetCalculationResult {
  const { currentRuns, legalBallsBowled, maxOvers, target, wickets, battingTeamName, bowlingTeamName, isFirstInnings } = params;

  // CRR calculation
  const oversCompletedFraction = legalBallsBowled / 6;
  const currentRunRate = oversCompletedFraction > 0 
    ? Number((currentRuns / oversCompletedFraction).toFixed(2)) 
    : 0;
  const crrFormatted = currentRunRate.toFixed(2);

  if (isFirstInnings || target === undefined || target === null) {
    return {
      currentRunRate,
      crrFormatted,
      requiredRunRate: null,
      rrrFormatted: null,
      runsNeeded: null,
      ballsRemaining: Math.max(0, maxOvers * 6 - legalBallsBowled),
      targetRuns: null,
      effectiveTarget: null,
      isTargetReached: false,
      isAllOut: wickets >= 10,
    };
  }

  const runsNeeded = Math.max(0, target - currentRuns);
  const totalBallsAllowed = maxOvers * 6;
  const ballsRemaining = Math.max(0, totalBallsAllowed - legalBallsBowled);
  const isTargetReached = currentRuns >= target;
  const isAllOut = wickets >= 10;

  let requiredRunRate: number | null = null;
  let rrrFormatted: string | null = null;

  if (!isTargetReached && ballsRemaining > 0) {
    const oversRemaining = ballsRemaining / 6;
    requiredRunRate = Number((runsNeeded / oversRemaining).toFixed(2));
    rrrFormatted = requiredRunRate.toFixed(2);
  } else if (!isTargetReached && ballsRemaining === 0) {
    rrrFormatted = "Required: INF";
  }

  let matchResult: string | undefined;
  if (isTargetReached) {
    const wicketsLeft = 10 - wickets;
    matchResult = `${battingTeamName} won by ${wicketsLeft} wicket${wicketsLeft === 1 ? '' : 's'}!`;
  } else if (isAllOut || ballsRemaining === 0) {
    const diff = target - 1 - currentRuns;
    if (diff === 0) {
      matchResult = "Match Tied (Super Over required)";
    } else if (diff > 0) {
      matchResult = `${bowlingTeamName} won by ${diff} run${diff === 1 ? '' : 's'}!`;
    }
  }

  return {
    currentRunRate,
    crrFormatted,
    requiredRunRate,
    rrrFormatted,
    runsNeeded,
    ballsRemaining,
    targetRuns: target,
    effectiveTarget: target,
    isTargetReached,
    isAllOut,
    matchResult,
  };
}

/**
 * Calculates bowler quota and powerplay for curtailed matches (Rain/DLS interruption)
 * Following ICC T20 / Limited Overs standard quota rule:
 * - Each bowler max = Math.floor(overs / 5)
 * - Remainder overs = overs % 5, given to `remainder` bowlers (+1 over)
 * - Powerplay: ~30% of overs (e.g. 20 -> 6, 15 -> 4.3 -> 4, 10 -> 3, 5 -> 1.3 -> 1)
 */
export function calculateCurtailedOversQuota(
  scheduledOvers: number,
  curtailedOvers: number
): CurtailedOversQuota {
  const overs = Math.max(1, curtailedOvers);
  const baseQuota = Math.floor(overs / 5);
  const remainder = overs % 5;
  const maxOversPerBowler = remainder > 0 ? baseQuota + 1 : baseQuota;

  // Powerplay overs: round(overs * 0.3)
  const powerplayOvers = Math.max(1, Math.round(overs * 0.3));

  let quotaDescription = `Max ${baseQuota} overs per bowler`;
  if (remainder > 0) {
    quotaDescription = `${remainder} bowler${remainder > 1 ? 's' : ''} can bowl max ${maxOversPerBowler} overs; others max ${baseQuota}`;
  }

  return {
    scheduledOvers,
    curtailedOvers: overs,
    powerplayOvers,
    maxOversPerBowler,
    bowlersWithExtraOver: remainder,
    quotaDescription,
  };
}

export interface DLSParResult {
  parScore: number;
  currentRuns: number;
  diff: number; // positive = ahead, negative = behind
  isAhead: boolean;
  isTied: boolean;
  statusText: string;
}

/**
 * Standard ICC T20 Duckworth-Lewis-Stern (DLS) Par Score Estimator
 * Models resource percentage remaining based on overs bowled and wickets lost (0-9)
 */
export function calculateDLSParScore(params: {
  firstInningsTotal: number;
  currentRuns: number;
  legalBallsBowled: number;
  wicketsLost: number;
  totalOvers?: number;
}): DLSParResult {
  const {
    firstInningsTotal,
    currentRuns,
    legalBallsBowled,
    wicketsLost,
    totalOvers = 20,
  } = params;

  if (firstInningsTotal <= 0) {
    return {
      parScore: 0,
      currentRuns,
      diff: currentRuns,
      isAhead: true,
      isTied: false,
      statusText: 'No target set',
    };
  }

  // All out = par is target
  if (wicketsLost >= 10) {
    const par = firstInningsTotal;
    return {
      parScore: par,
      currentRuns,
      diff: currentRuns - par,
      isAhead: currentRuns > par,
      isTied: currentRuns === par,
      statusText: currentRuns > par ? 'Target Reached' : `All Out (Lost by ${par - currentRuns} runs)`,
    };
  }

  const oversBowled = legalBallsBowled / 6;
  const oversRemaining = Math.max(0, totalOvers - oversBowled);

  // Standard T20 resource decay table per wickets in hand
  // Values represent resource % remaining per over remaining (approx. linear-exponential gradient)
  const resourceWeightsByWicketsLost = [
    5.0, // 0 wkts down (100% at 20 ov => 5.0% / ov)
    4.6, // 1 wkt down
    4.1, // 2 wkts down
    3.6, // 3 wkts down
    3.0, // 4 wkts down
    2.4, // 5 wkts down
    1.8, // 6 wkts down
    1.3, // 7 wkts down
    0.8, // 8 wkts down
    0.4, // 9 wkts down
  ];

  const wIndex = Math.min(Math.max(0, wicketsLost), 9);
  const weight = resourceWeightsByWicketsLost[wIndex];
  const resourceRemainingPct = Math.min(100, Math.max(0, oversRemaining * weight));
  const resourceUsedPct = 100 - resourceRemainingPct;

  // Par score at this exact moment
  const parScore = Math.max(0, Math.round((firstInningsTotal * resourceUsedPct) / 100));
  const diff = currentRuns - parScore;
  const isAhead = diff > 0;
  const isTied = diff === 0;

  let statusText = '';
  if (isAhead) {
    statusText = `Ahead by ${diff} run${diff === 1 ? '' : 's'} (DLS Par: ${parScore})`;
  } else if (isTied) {
    statusText = `Scores Level with DLS Par (${parScore})`;
  } else {
    statusText = `Behind by ${Math.abs(diff)} run${Math.abs(diff) === 1 ? '' : 's'} (DLS Par: ${parScore})`;
  }

  return {
    parScore,
    currentRuns,
    diff,
    isAhead,
    isTied,
    statusText,
  };
}
