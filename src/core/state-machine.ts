// The Cricket Guff Studio — MCC Cricket State Reducer & Core Engine

import {
  InningsState,
  BallDeliveryEvent,
  BatterStats,
  BowlerStats,
  Player,
  DismissalType,
} from './types';

/**
 * Creates an empty/initial innings state
 */
export function createInitialInningsState(params: {
  inningsNumber: 1 | 2;
  battingTeamId: string;
  bowlingTeamId: string;
  striker: Player;
  nonStriker: Player;
  openingBowler: Player;
  allBatters: Player[];
}): InningsState {
  const batterStats: Record<string, BatterStats> = {};
  params.allBatters.forEach((p) => {
    batterStats[p.id] = {
      playerId: p.id,
      name: p.name,
      runs: 0,
      ballsFaced: 0,
      fours: 0,
      sixes: 0,
      strikeRate: 0,
      isOut: false,
    };
  });

  const bowlerStats: Record<string, BowlerStats> = {
    [params.openingBowler.id]: {
      playerId: params.openingBowler.id,
      name: params.openingBowler.name,
      legalBallsBowled: 0,
      oversFormatted: '0.0',
      maidens: 0,
      runsConceded: 0,
      wickets: 0,
      economyRate: 0,
      noBalls: 0,
      wides: 0,
      dotsCount: 0,
    },
  };

  return {
    inningsNumber: params.inningsNumber,
    battingTeamId: params.battingTeamId,
    bowlingTeamId: params.bowlingTeamId,
    totalRuns: 0,
    totalWickets: 0,
    legalBalls: 0,
    currentOverLegalBalls: 0,
    oversFormatted: '0.0',
    strikerId: params.striker.id,
    nonStrikerId: params.nonStriker.id,
    currentBowlerId: params.openingBowler.id,
    batterStats,
    bowlerStats,
    fallOfWickets: [],
    deliveries: [],
    recentBalls: [],
    currentPartnership: {
      runs: 0,
      balls: 0,
      batter1Id: params.striker.id,
      batter1Runs: 0,
      batter2Id: params.nonStriker.id,
      batter2Runs: 0,
    },
    extras: {
      wides: 0,
      noBalls: 0,
      byes: 0,
      legByes: 0,
      penalties: 0,
      total: 0,
    },
    isFreeHitActive: false,
    isCompleted: false,
  };
}

/**
 * Format balls into cricket overs format "3.2"
 */
export function formatOvers(legalBalls: number): string {
  const overs = Math.floor(legalBalls / 6);
  const balls = legalBalls % 6;
  return `${overs}.${balls}`;
}

/**
 * Helper to generate human-readable dismissal text
 */
export function formatDismissalText(
  type: DismissalType,
  bowlerName: string,
  assistantName?: string
): string {
  switch (type) {
    case 'bowled':
      return `b ${bowlerName}`;
    case 'caught':
      return `c ${assistantName || 'sub'} b ${bowlerName}`;
    case 'caught_behind':
      return `c †${assistantName || 'wk'} b ${bowlerName}`;
    case 'caught_and_bowled':
      return `c & b ${bowlerName}`;
    case 'lbw':
      return `lbw b ${bowlerName}`;
    case 'stumped':
      return `st †${assistantName || 'wk'} b ${bowlerName}`;
    case 'run_out':
      return `run out (${assistantName || 'fielder'})`;
    case 'hit_wicket':
      return `hit wicket b ${bowlerName}`;
    case 'duck_out':
    case 'golden_duck':
      return `b ${bowlerName}`;
    case 'retired_out':
      return `retired out`;
    case 'retired_hurt':
      return `retired hurt`;
    case 'obstructing_field':
      return `obstructing the field`;
    case 'hit_ball_twice':
      return `hit the ball twice`;
    case 'handling_ball':
      return `handled the ball`;
    case 'timed_out':
      return `timed out`;
    case 'mankad':
      return `run out (mankaded)`;
    default:
      return `out`;
  }
}

/**
 * Pure reducer function that applies a single BallDeliveryEvent to an InningsState.
 * Returns a new immutable InningsState.
 */
export function reduceBallDelivery(
  state: InningsState,
  delivery: BallDeliveryEvent,
  playerNames: Record<string, string> = {}
): InningsState {
  // Clone current state deep enough for immutability
  const nextBatterStats: Record<string, BatterStats> = {};
  Object.keys(state.batterStats).forEach((key) => {
    nextBatterStats[key] = { ...state.batterStats[key] };
  });

  const nextBowlerStats: Record<string, BowlerStats> = {};
  Object.keys(state.bowlerStats).forEach((key) => {
    nextBowlerStats[key] = { ...state.bowlerStats[key] };
  });

  const nextExtras = { ...state.extras };
  const nextPartnership = { ...state.currentPartnership };
  const nextFOW = [...state.fallOfWickets];
  const nextDeliveries = [...state.deliveries, delivery];

  let nextStrikerId = state.strikerId;
  let nextNonStrikerId = state.nonStrikerId;
  let nextCurrentBowlerId = delivery.bowlerId;

  // Ensure current bowler stats entry exists
  if (!nextBowlerStats[delivery.bowlerId]) {
    nextBowlerStats[delivery.bowlerId] = {
      playerId: delivery.bowlerId,
      name: playerNames[delivery.bowlerId] || 'Bowler',
      legalBallsBowled: 0,
      oversFormatted: '0.0',
      maidens: 0,
      runsConceded: 0,
      wickets: 0,
      economyRate: 0,
      noBalls: 0,
      wides: 0,
      dotsCount: 0,
    };
  }
  const bowler = nextBowlerStats[delivery.bowlerId];

  // Ensure striker and non-striker exist in batter stats
  if (!nextBatterStats[delivery.strikerId]) {
    nextBatterStats[delivery.strikerId] = {
      playerId: delivery.strikerId,
      name: playerNames[delivery.strikerId] || 'Striker',
      runs: 0,
      ballsFaced: 0,
      fours: 0,
      sixes: 0,
      strikeRate: 0,
      isOut: false,
    };
  }
  if (!nextBatterStats[delivery.nonStrikerId]) {
    nextBatterStats[delivery.nonStrikerId] = {
      playerId: delivery.nonStrikerId,
      name: playerNames[delivery.nonStrikerId] || 'Non-Striker',
      runs: 0,
      ballsFaced: 0,
      fours: 0,
      sixes: 0,
      strikeRate: 0,
      isOut: false,
    };
  }
  const striker = nextBatterStats[delivery.strikerId];

  // 1. Process Extras
  if (delivery.extraType === 'wide') {
    nextExtras.wides += delivery.runsExtras;
    nextExtras.total += delivery.runsExtras;
    bowler.wides += 1;
    bowler.runsConceded += delivery.runsExtras; // Wides charged to bowler
  } else if (delivery.extraType === 'noball') {
    nextExtras.noBalls += 1; // standard 1 nb penalty
    nextExtras.total += 1;
    bowler.noBalls += 1;
    bowler.runsConceded += 1; // NB charged to bowler
    
    // If runs off bat on no-ball
    if (delivery.runsBat > 0) {
      bowler.runsConceded += delivery.runsBat;
    }
    // If byes or legbyes occurred on no-ball
    const extraByesOnNb = delivery.runsExtras - 1;
    if (extraByesOnNb > 0) {
      if (delivery.extraSubType === 'leg_bye') {
        nextExtras.legByes += extraByesOnNb;
      } else {
        nextExtras.byes += extraByesOnNb;
      }
      nextExtras.total += extraByesOnNb;
    }
  } else if (delivery.extraType === 'bye') {
    nextExtras.byes += delivery.runsExtras;
    nextExtras.total += delivery.runsExtras;
    // Byes are NOT charged to bowler!
  } else if (delivery.extraType === 'leg_bye') {
    nextExtras.legByes += delivery.runsExtras;
    nextExtras.total += delivery.runsExtras;
    // Leg-byes are NOT charged to bowler!
  } else if (delivery.extraType === 'penalty') {
    // MCC Law 41 & 42: Only batting penalties are added to batting team's extras
    if (delivery.penalty?.teamBenefited === 'batting') {
      nextExtras.penalties += delivery.runsExtras;
      nextExtras.total += delivery.runsExtras;
    }
    // Penalty runs are NEVER charged to bowler!
  } else {
    // Normal ball off bat
    bowler.runsConceded += delivery.runsBat;
  }

  // 2. Batter stats calculation
  // Batsman faces ball if legal ball OR no-ball (wide is not faced by batter)
  if (delivery.legalBallCounted || delivery.extraType === 'noball') {
    striker.ballsFaced += 1;
  }
  if (delivery.runsBat > 0) {
    striker.runs += delivery.runsBat;
    if (delivery.isFour) striker.fours += 1;
    if (delivery.isSix) striker.sixes += 1;
  }
  striker.strikeRate = striker.ballsFaced > 0
    ? Number(((striker.runs / striker.ballsFaced) * 100).toFixed(2))
    : 0;

  // 3. Bowler stats calculation for legal delivery
  // If the previous over just completed (6 legal balls), reset recent balls for the new over
  let nextRecentBalls = (state.currentOverLegalBalls === 0 && state.legalBalls > 0 && state.deliveries.length > 0)
    ? []
    : [...state.recentBalls];

  let nextLegalBalls = state.legalBalls;
  let nextCurrentOverLegalBalls = state.currentOverLegalBalls;

  if (delivery.legalBallCounted) {
    nextLegalBalls += 1;
    nextCurrentOverLegalBalls += 1;
    bowler.legalBallsBowled += 1;
    bowler.oversFormatted = formatOvers(bowler.legalBallsBowled);

    // Check for dot ball (0 runs conceded by bowler on a legal ball)
    if (delivery.runsBat === 0 && delivery.extraType !== 'wide' && delivery.extraType !== 'noball') {
      bowler.dotsCount += 1;
    }
  }
  // Calculate Bowler Economy
  const bowlerOvers = bowler.legalBallsBowled / 6;
  bowler.economyRate = bowlerOvers > 0
    ? Number((bowler.runsConceded / bowlerOvers).toFixed(2))
    : 0;

  // Add delivery to recent balls
  nextRecentBalls.push(delivery);

  // 4. Team total runs calculation
  // MCC Law 41 & 42: Fielding penalties do NOT add to batting innings total!
  let deliveryBattingRuns = delivery.runsBat || 0;
  if (delivery.extraType === 'penalty') {
    if (delivery.penalty?.teamBenefited === 'batting') {
      deliveryBattingRuns += (delivery.runsExtras || 0);
    }
  } else {
    deliveryBattingRuns += (delivery.runsExtras || 0);
  }
  const nextTotalRuns = state.totalRuns + deliveryBattingRuns;

  // 5. Partnership update (only batting runs add to partnership)
  nextPartnership.runs += deliveryBattingRuns;
  if (delivery.legalBallCounted || delivery.extraType === 'noball') {
    nextPartnership.balls += 1;
  }
  if (delivery.strikerId === nextPartnership.batter1Id) {
    nextPartnership.batter1Runs += delivery.runsBat;
  } else if (delivery.strikerId === nextPartnership.batter2Id) {
    nextPartnership.batter2Runs += delivery.runsBat;
  }

  // 6. Free Hit & Wicket handling (ICC Law 21.19)
  // On a Free Hit, only run_out, obstructing_field, hit_ball_twice, handling_ball, timed_out are legal dismissals
  const isFreeHit = delivery.isFreeHitDelivery || state.isFreeHitActive;
  const isIllegalFreeHitDismissal = isFreeHit && delivery.wicket && ![
    'run_out',
    'obstructing_field',
    'hit_ball_twice',
    'handling_ball',
    'timed_out',
  ].includes(delivery.wicket.type);

  const effectiveWicket = isIllegalFreeHitDismissal ? undefined : delivery.wicket;

  let nextTotalWickets = state.totalWickets;
  if (effectiveWicket) {
    const w = effectiveWicket;
    const dismissedBatter = nextBatterStats[w.playerOutId];
    if (dismissedBatter) {
      // MCC Law: Retired hurt is NOT out (retired not out)
      if (w.type === 'retired_hurt') {
        dismissedBatter.isOut = false;
        dismissedBatter.dismissalDescription = 'retired hurt';
      } else {
        dismissedBatter.isOut = true;
        dismissedBatter.dismissalDescription = formatDismissalText(
          w.type,
          bowler.name,
          w.assistedById ? (playerNames[w.assistedById] || w.assistedById) : undefined
        );
      }
    }

    // Bowler credit
    if (w.creditBowler) {
      bowler.wickets += 1;
    }

    // Team wickets (retired hurt does not count against total wickets)
    if (w.type !== 'retired_hurt') {
      nextTotalWickets += 1;
      nextFOW.push({
        wicketNumber: nextTotalWickets,
        score: nextTotalRuns,
        overs: formatOvers(nextLegalBalls),
        playerOutId: w.playerOutId,
        playerName: dismissedBatter?.name || 'Batsman',
      });
    }

    // Reset partnership on wicket
    const survivingBatterId = w.playerOutId === nextStrikerId ? nextNonStrikerId : nextStrikerId;
    const newBatterId = w.newBatterId || '';
    nextPartnership.runs = 0;
    nextPartnership.balls = 0;
    nextPartnership.batter1Id = survivingBatterId;
    nextPartnership.batter1Runs = 0;
    nextPartnership.batter2Id = newBatterId;
    nextPartnership.batter2Runs = 0;
  }

  // 7. MCC Physical Runs Strike Rotation
  // Strike rotates if and only if physical runs completed is ODD
  const physicalRuns = delivery.physicalRunsRan || 0;
  const shouldRotatePhysical = physicalRuns % 2 !== 0;

  if (effectiveWicket) {
    // If wicket fell, determine who is at striker end
    const playerOutId = effectiveWicket.playerOutId;
    const newBatterId = effectiveWicket.newBatterId;

    if (playerOutId === nextStrikerId) {
      // Striker was dismissed
      // If batsmen crossed (odd physical runs before out)
      if (shouldRotatePhysical) {
        nextStrikerId = nextNonStrikerId;
        nextNonStrikerId = newBatterId || '';
      } else {
        nextStrikerId = newBatterId || '';
      }
    } else {
      // Non-striker was dismissed
      // If batsmen crossed
      if (shouldRotatePhysical) {
        const survivor = nextStrikerId;
        nextStrikerId = newBatterId || '';
        nextNonStrikerId = survivor;
      } else {
        nextNonStrikerId = newBatterId || '';
      }
    }
  } else {
    // No wicket: rotate strike if odd physical runs ran
    if (shouldRotatePhysical) {
      const temp = nextStrikerId;
      nextStrikerId = nextNonStrikerId;
      nextNonStrikerId = temp;
    }
  }

  // 8. End of Over Handling
  // When 6 legal balls have completed the over:
  if (nextCurrentOverLegalBalls >= 6) {
    // Check if over was a maiden (0 runs conceded by bowler in this over)
    const overDeliveries = nextRecentBalls;
    const runsConcededInOver = overDeliveries.reduce((sum, d) => {
      let runs = d.runsBat;
      if (d.extraType === 'wide') {
        runs += d.runsExtras;
      } else if (d.extraType === 'noball') {
        runs += 1; // Bowler concedes 1 NB penalty + runsBat (already in d.runsBat)
      }
      return sum + runs;
    }, 0);
    if (runsConcededInOver === 0 && overDeliveries.length >= 6) {
      bowler.maidens += 1;
    }

    // Reset current over legal balls to 0 for next over.
    // NOTE: We KEEP nextRecentBalls populated with this completed over so that
    // the 6th delivery remains docked in the broadcast ticker until the first ball
    // of the next over is bowled!
    nextCurrentOverLegalBalls = 0;

    // Switch ends for the new over: striker and non-striker swap!
    const temp = nextStrikerId;
    nextStrikerId = nextNonStrikerId;
    nextNonStrikerId = temp;
  }

  // 9. Free Hit Handling
  // A no-ball causes next ball to be a free hit
  let nextIsFreeHitActive = false;
  if (delivery.causesFreeHit) {
    nextIsFreeHitActive = true;
  } else if (state.isFreeHitActive) {
    // If currently free hit, and ball is wide or no-ball, free hit continues!
    if (!delivery.legalBallCounted) {
      nextIsFreeHitActive = true;
    } else {
      nextIsFreeHitActive = false;
    }
  }

  // Check if all out (10 wickets)
  const isCompleted = nextTotalWickets >= 10;

  return {
    ...state,
    totalRuns: nextTotalRuns,
    totalWickets: nextTotalWickets,
    legalBalls: nextLegalBalls,
    currentOverLegalBalls: nextCurrentOverLegalBalls,
    oversFormatted: formatOvers(nextLegalBalls),
    strikerId: nextStrikerId,
    nonStrikerId: nextNonStrikerId,
    currentBowlerId: nextCurrentBowlerId,
    batterStats: nextBatterStats,
    bowlerStats: nextBowlerStats,
    fallOfWickets: nextFOW,
    deliveries: nextDeliveries,
    recentBalls: nextRecentBalls,
    currentPartnership: nextPartnership,
    extras: nextExtras,
    isFreeHitActive: nextIsFreeHitActive,
    isCompleted,
    completedReason: isCompleted ? 'All Out' : undefined,
  };
}

/**
 * Full recalculation function:
 * Rebuilds the entire innings from deliveries array.
 * Guaranteed to keep state pure and prevent any statistical drift on Undo / Edit!
 */
export function recalculateInnings(
  initialState: InningsState,
  deliveries: BallDeliveryEvent[],
  playerNames: Record<string, string> = {}
): InningsState {
  let state: InningsState = {
    ...initialState,
    totalRuns: 0,
    totalWickets: 0,
    legalBalls: 0,
    currentOverLegalBalls: 0,
    oversFormatted: '0.0',
    strikerId: initialState.strikerId,
    nonStrikerId: initialState.nonStrikerId,
    currentBowlerId: initialState.currentBowlerId,
    deliveries: [],
    recentBalls: [],
    fallOfWickets: [],
    currentPartnership: {
      runs: 0,
      balls: 0,
      batter1Id: initialState.strikerId,
      batter1Runs: 0,
      batter2Id: initialState.nonStrikerId,
      batter2Runs: 0,
    },
    extras: {
      wides: 0,
      noBalls: 0,
      byes: 0,
      legByes: 0,
      penalties: 0,
      total: 0,
    },
    isFreeHitActive: false,
    isCompleted: false,
    completedReason: undefined,
  };

  // Reset batter and bowler stats
  const resetBatterStats: Record<string, BatterStats> = {};
  Object.keys(initialState.batterStats).forEach((pId) => {
    resetBatterStats[pId] = {
      ...initialState.batterStats[pId],
      runs: 0,
      ballsFaced: 0,
      fours: 0,
      sixes: 0,
      strikeRate: 0,
      isOut: false,
      dismissalDescription: undefined,
    };
  });
  state.batterStats = resetBatterStats;

  const resetBowlerStats: Record<string, BowlerStats> = {};
  Object.keys(initialState.bowlerStats).forEach((pId) => {
    resetBowlerStats[pId] = {
      ...initialState.bowlerStats[pId],
      legalBallsBowled: 0,
      oversFormatted: '0.0',
      maidens: 0,
      runsConceded: 0,
      wickets: 0,
      economyRate: 0,
      noBalls: 0,
      wides: 0,
      dotsCount: 0,
    };
  });
  state.bowlerStats = resetBowlerStats;

  for (const delivery of deliveries) {
    state = reduceBallDelivery(state, delivery, playerNames);
  }

  return state;
}
