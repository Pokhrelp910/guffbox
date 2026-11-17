// The Cricket Guff Studio — MCC Law 41 & 42 Penalty Runs Engine

import { MatchState, BallDeliveryEvent } from './types';

export interface PenaltyAdjustment {
  innings1ExtraRunsAwardedToBatting: number;
  innings1ExtraRunsAwardedToFielding: number; // Applied in Innings 2 start or reduces target
  innings2ExtraRunsAwardedToBatting: number;
  innings2ExtraRunsAwardedToFielding: number; // Added to Team 1 total / raises target
  effectiveTarget: number;
}

/**
 * Calculates effective penalty adjustments and revised targets.
 * 
 * Rules:
 * Innings 1:
 *  - Awarded to Batting team: +5 added directly to Innings 1 total score.
 *  - Awarded to Fielding team: Credited to fielding team for Innings 2 (starts 5/0 or lowers target by 5).
 * 
 * Innings 2:
 *  - Awarded to Batting team (chaser): +5 added to Innings 2 score (runs required drops by 5).
 *  - Awarded to Fielding team (defender): +5 added to Team 1's score (raises chase target by 5).
 */
export function calculatePenalties(match: MatchState): PenaltyAdjustment {
  let in1Bat = 0;
  let in1Fld = 0;
  let in2Bat = 0;
  let in2Fld = 0;

  // Process Innings 1 penalties
  match.innings1.deliveries.forEach((d) => {
    if (d.penalty) {
      if (d.penalty.teamBenefited === 'batting') {
        in1Bat += d.penalty.runs;
      } else {
        in1Fld += d.penalty.runs;
      }
    }
  });

  // Process Innings 2 penalties (if active)
  if (match.innings2) {
    match.innings2.deliveries.forEach((d) => {
      if (d.penalty) {
        if (d.penalty.teamBenefited === 'batting') {
          in2Bat += d.penalty.runs;
        } else {
          in2Fld += d.penalty.runs;
        }
      }
    });
  }

  // Base target is Team 1 total runs + 1
  // If Team 1 has in1Bat, it is already included in match.innings1.totalRuns.
  // in1Fld reduces target by in1Fld (or starts fielding team at in1Fld runs).
  // in2Fld adds to Team 1 total, raising the target by in2Fld.
  const baseTarget = match.metadata.dlsRevisedTarget ?? (match.innings1.totalRuns + 1);
  const effectiveTarget = Math.max(1, baseTarget - in1Fld + in2Fld);

  return {
    innings1ExtraRunsAwardedToBatting: in1Bat,
    innings1ExtraRunsAwardedToFielding: in1Fld,
    innings2ExtraRunsAwardedToBatting: in2Bat,
    innings2ExtraRunsAwardedToFielding: in2Fld,
    effectiveTarget,
  };
}

/**
 * Creates a BallDeliveryEvent for a 5-run penalty award.
 * Note: Penalty deliveries NEVER count as legal balls and NEVER rotate strike.
 */
export function createPenaltyEvent(params: {
  inningsNumber: 1 | 2;
  overIndex: number;
  ballInOver: number;
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  teamBenefited: 'batting' | 'fielding';
  reason: string;
  runs?: number;
}): BallDeliveryEvent {
  const runs = params.runs ?? 5;
  return {
    id: `ball_penalty_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    inningsNumber: params.inningsNumber,
    overIndex: params.overIndex,
    ballInOver: params.ballInOver,
    legalBallCounted: false,
    strikerId: params.strikerId,
    nonStrikerId: params.nonStrikerId,
    bowlerId: params.bowlerId,
    runsBat: 0,
    runsExtras: runs,
    extraType: 'penalty',
    physicalRunsRan: 0, // MCC Law: Penalties involve no physical runs, strike DOES NOT rotate
    isBoundary: false,
    isFour: false,
    isSix: false,
    isFreeHitDelivery: false,
    causesFreeHit: false,
    penalty: {
      teamBenefited: params.teamBenefited,
      runs,
      reason: params.reason,
    },
    displayBadge: `+${runs}P`,
    timestamp: Date.now(),
  };
}
