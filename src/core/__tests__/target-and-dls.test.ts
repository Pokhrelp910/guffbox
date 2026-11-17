// Unit Tests for Target Calculator, Curtailed Quota & DLS Par Estimator
import { describe, it, expect } from 'vitest';
import {
  calculateMatchRates,
  calculateCurtailedOversQuota,
  calculateDLSParScore,
} from '../target-calculator';

describe('Target Calculator & Curtailed Overs', () => {
  it('calculates 1st innings CRR correctly', () => {
    const result = calculateMatchRates({
      currentRuns: 84,
      legalBallsBowled: 60, // 10.0 overs
      maxOvers: 20,
      target: null,
      wickets: 2,
      battingTeamName: 'Nepal',
      bowlingTeamName: 'India',
      isFirstInnings: true,
    });

    expect(result.currentRunRate).toBe(8.4);
    expect(result.crrFormatted).toBe('8.40');
    expect(result.requiredRunRate).toBeNull();
    expect(result.ballsRemaining).toBe(60);
    expect(result.isTargetReached).toBe(false);
  });

  it('calculates 2nd innings chase RRR and target reached', () => {
    const chasing = calculateMatchRates({
      currentRuns: 160,
      legalBallsBowled: 108, // 18.0 overs
      maxOvers: 20,
      target: 175,
      wickets: 4,
      battingTeamName: 'Nepal',
      bowlingTeamName: 'India',
      isFirstInnings: false,
    });

    expect(chasing.runsNeeded).toBe(15);
    expect(chasing.ballsRemaining).toBe(12);
    expect(chasing.requiredRunRate).toBe(7.5);
    expect(chasing.isTargetReached).toBe(false);

    // Target reached
    const won = calculateMatchRates({
      currentRuns: 176,
      legalBallsBowled: 112,
      maxOvers: 20,
      target: 175,
      wickets: 4,
      battingTeamName: 'Nepal',
      bowlingTeamName: 'India',
      isFirstInnings: false,
    });
    expect(won.isTargetReached).toBe(true);
    expect(won.matchResult).toContain('Nepal won by 6 wickets');
  });

  it('handles tied match condition', () => {
    const tied = calculateMatchRates({
      currentRuns: 174,
      legalBallsBowled: 120, // 20.0 overs
      maxOvers: 20,
      target: 175,
      wickets: 6,
      battingTeamName: 'Nepal',
      bowlingTeamName: 'India',
      isFirstInnings: false,
    });

    expect(tied.matchResult).toContain('Match Tied (Super Over required)');
  });

  it('calculates curtailed overs quota accurately for rain interruptions', () => {
    // 15 overs match (15 / 5 = 3 overs max per bowler, 0 remainder)
    const quota15 = calculateCurtailedOversQuota(20, 15);
    expect(quota15.curtailedOvers).toBe(15);
    expect(quota15.maxOversPerBowler).toBe(3);
    expect(quota15.bowlersWithExtraOver).toBe(0);
    expect(quota15.powerplayOvers).toBe(5); // 15 * 0.3 = 4.5 => round 5

    // 17 overs match (17 / 5 = 3 base, 2 remainder bowlers get 4)
    const quota17 = calculateCurtailedOversQuota(20, 17);
    expect(quota17.maxOversPerBowler).toBe(4);
    expect(quota17.bowlersWithExtraOver).toBe(2);
    expect(quota17.powerplayOvers).toBe(5);
  });
});

describe('ICC T20 DLS Par Score Estimator', () => {
  it('correctly calculates DLS Par when team is ahead', () => {
    // Target 180 (Team 1 total = 180)
    // 10 overs bowled (60 balls), 2 wickets down, team score 115 (par is ~106)
    const res = calculateDLSParScore({
      firstInningsTotal: 180,
      currentRuns: 115,
      legalBallsBowled: 60,
      wicketsLost: 2,
      totalOvers: 20,
    });

    expect(res.isAhead).toBe(true);
    expect(res.diff).toBeGreaterThan(0);
    expect(res.statusText).toContain('Ahead by');
  });

  it('correctly calculates DLS Par when wickets fall rapidly (team behind)', () => {
    // 10 overs bowled, but 6 wickets down, team score 60 against 180
    const res = calculateDLSParScore({
      firstInningsTotal: 180,
      currentRuns: 60,
      legalBallsBowled: 60,
      wicketsLost: 6,
      totalOvers: 20,
    });

    expect(res.isAhead).toBe(false);
    expect(res.diff).toBeLessThan(0);
    expect(res.statusText).toContain('Behind by');
  });

  it('handles all out scenario in DLS calculation', () => {
    const res = calculateDLSParScore({
      firstInningsTotal: 160,
      currentRuns: 120,
      legalBallsBowled: 80,
      wicketsLost: 10,
      totalOvers: 20,
    });

    expect(res.isAhead).toBe(false);
    expect(res.parScore).toBe(160);
    expect(res.statusText).toContain('All Out');
  });
});
