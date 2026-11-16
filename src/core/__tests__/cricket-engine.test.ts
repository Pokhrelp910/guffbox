// GuffBox Cricket Studio — Comprehensive Unit Test Suite
import { describe, it, expect } from 'vitest';
import {
  createInitialInningsState,
  reduceBallDelivery,
  recalculateInnings,
} from '../state-machine';
import { calculatePenalties, createPenaltyEvent } from '../penalty-rules';
import {
  calculateMatchRates,
  calculateCurtailedOversQuota,
} from '../target-calculator';
import { InningsHistoryManager } from '../history-manager';
import { Player, BallDeliveryEvent, MatchState, Team } from '../types';

describe('MCC Cricket Engine & State Machine', () => {
  const striker: Player = { id: 'p1', name: 'Rohit Paudel', role: 'batsman' };
  const nonStriker: Player = { id: 'p2', name: 'Aasif Sheikh', role: 'batsman' };
  const bowler: Player = { id: 'b1', name: 'Jasprit Bumrah', role: 'bowler' };
  const allBatters: Player[] = [striker, nonStriker, { id: 'p3', name: 'Kushal Bhurtel', role: 'batsman' }];
  const playerNames = { p1: 'Rohit Paudel', p2: 'Aasif Sheikh', p3: 'Kushal Bhurtel', b1: 'Jasprit Bumrah' };

  const getInitialState = () =>
    createInitialInningsState({
      inningsNumber: 1,
      battingTeamId: 'team_nep',
      bowlingTeamId: 'team_ind',
      striker,
      nonStriker,
      openingBowler: bowler,
      allBatters,
    });

  // TEST SUITE 1: PHYSICAL RUNS STRIKE ROTATION
  describe('Physical Runs Strike Rotation Engine (MCC Law 18)', () => {
    it('rotates strike on odd physical runs (1 run single)', () => {
      const state = getInitialState();
      const ball: BallDeliveryEvent = {
        id: 'ball_1',
        inningsNumber: 1,
        overIndex: 0,
        ballInOver: 1,
        legalBallCounted: true,
        strikerId: 'p1',
        nonStrikerId: 'p2',
        bowlerId: 'b1',
        runsBat: 1,
        runsExtras: 0,
        extraType: 'none',
        physicalRunsRan: 1, // 1 physical run
        isBoundary: false,
        isFour: false,
        isSix: false,
        isFreeHitDelivery: false,
        causesFreeHit: false,
        displayBadge: '1',
        timestamp: Date.now(),
      };

      const next = reduceBallDelivery(state, ball, playerNames);
      expect(next.totalRuns).toBe(1);
      expect(next.legalBalls).toBe(1);
      expect(next.strikerId).toBe('p2'); // Strike rotated!
      expect(next.nonStrikerId).toBe('p1');
      expect(next.batterStats['p1'].runs).toBe(1);
      expect(next.batterStats['p1'].ballsFaced).toBe(1);
    });

    it('does NOT rotate strike on 2 runs (even physical runs)', () => {
      const state = getInitialState();
      const ball: BallDeliveryEvent = {
        id: 'ball_2',
        inningsNumber: 1,
        overIndex: 0,
        ballInOver: 1,
        legalBallCounted: true,
        strikerId: 'p1',
        nonStrikerId: 'p2',
        bowlerId: 'b1',
        runsBat: 2,
        runsExtras: 0,
        extraType: 'none',
        physicalRunsRan: 2, // Even runs ran
        isBoundary: false,
        isFour: false,
        isSix: false,
        isFreeHitDelivery: false,
        causesFreeHit: false,
        displayBadge: '2',
        timestamp: Date.now(),
      };

      const next = reduceBallDelivery(state, ball, playerNames);
      expect(next.totalRuns).toBe(2);
      expect(next.strikerId).toBe('p1'); // Remains on strike
      expect(next.nonStrikerId).toBe('p2');
    });

    it('does NOT rotate strike on Boundary Four or Six (0 physical runs)', () => {
      const state = getInitialState();
      const fourBall: BallDeliveryEvent = {
        id: 'ball_four',
        inningsNumber: 1,
        overIndex: 0,
        ballInOver: 1,
        legalBallCounted: true,
        strikerId: 'p1',
        nonStrikerId: 'p2',
        bowlerId: 'b1',
        runsBat: 4,
        runsExtras: 0,
        extraType: 'none',
        physicalRunsRan: 0, // Boundaries have 0 physical runs
        isBoundary: true,
        isFour: true,
        isSix: false,
        isFreeHitDelivery: false,
        causesFreeHit: false,
        displayBadge: '4',
        timestamp: Date.now(),
      };

      const next = reduceBallDelivery(state, fourBall, playerNames);
      expect(next.totalRuns).toBe(4);
      expect(next.strikerId).toBe('p1'); // Striker keeps strike
      expect(next.batterStats['p1'].fours).toBe(1);
    });

    it('rotates strike at end of 6 legal deliveries (over completion)', () => {
      let state = getInitialState();
      // Bowl 6 dot balls (0 runs)
      for (let i = 1; i <= 6; i++) {
        state = reduceBallDelivery(
          state,
          {
            id: `dot_${i}`,
            inningsNumber: 1,
            overIndex: 0,
            ballInOver: i,
            legalBallCounted: true,
            strikerId: state.strikerId,
            nonStrikerId: state.nonStrikerId,
            bowlerId: 'b1',
            runsBat: 0,
            runsExtras: 0,
            extraType: 'none',
            physicalRunsRan: 0,
            isBoundary: false,
            isFour: false,
            isSix: false,
            isFreeHitDelivery: false,
            causesFreeHit: false,
            displayBadge: '0',
            timestamp: Date.now(),
          },
          playerNames
        );
      }

      expect(state.legalBalls).toBe(6);
      expect(state.oversFormatted).toBe('1.0');
      expect(state.currentOverLegalBalls).toBe(0);
      expect(state.strikerId).toBe('p2'); // Swapped at end of over!
      expect(state.nonStrikerId).toBe('p1');
      expect(state.bowlerStats['b1'].maidens).toBe(1); // 0 runs in 6 balls = 1 maiden!
    });
  });

  // TEST SUITE 2: COMPOUND DELIVERIES & EXTRAS
  describe('Compound Deliveries & Extras Matrix', () => {
    it('handles Wide + 1 Bye ran (2 runs, strike rotates, ball not counted, bowler charged 2)', () => {
      const state = getInitialState();
      const ball: BallDeliveryEvent = {
        id: 'wide_plus_1',
        inningsNumber: 1,
        overIndex: 0,
        ballInOver: 0,
        legalBallCounted: false, // Wide does not count as legal ball
        strikerId: 'p1',
        nonStrikerId: 'p2',
        bowlerId: 'b1',
        runsBat: 0,
        runsExtras: 2, // 1 wide + 1 bye
        extraType: 'wide',
        physicalRunsRan: 1, // 1 bye was physically run!
        isBoundary: false,
        isFour: false,
        isSix: false,
        isFreeHitDelivery: false,
        causesFreeHit: false,
        displayBadge: 'Wd+1',
        timestamp: Date.now(),
      };

      const next = reduceBallDelivery(state, ball, playerNames);
      expect(next.totalRuns).toBe(2);
      expect(next.legalBalls).toBe(0);
      expect(next.extras.wides).toBe(2);
      expect(next.strikerId).toBe('p2'); // Strike ROTATES because 1 run was physically ran
      expect(next.bowlerStats['b1'].wides).toBe(1);
      expect(next.bowlerStats['b1'].runsConceded).toBe(2);
      expect(next.batterStats['p1'].ballsFaced).toBe(0); // Wides not faced by batter
    });

    it('handles No-Ball + 4 Boundary (5 runs total, Free Hit granted, ball not counted)', () => {
      const state = getInitialState();
      const ball: BallDeliveryEvent = {
        id: 'nb_plus_4',
        inningsNumber: 1,
        overIndex: 0,
        ballInOver: 0,
        legalBallCounted: false,
        strikerId: 'p1',
        nonStrikerId: 'p2',
        bowlerId: 'b1',
        runsBat: 4,
        runsExtras: 1, // 1 no-ball extra
        extraType: 'noball',
        physicalRunsRan: 0, // Boundary
        isBoundary: true,
        isFour: true,
        isSix: false,
        isFreeHitDelivery: false,
        causesFreeHit: true,
        displayBadge: 'Nb+4',
        timestamp: Date.now(),
      };

      const next = reduceBallDelivery(state, ball, playerNames);
      expect(next.totalRuns).toBe(5);
      expect(next.legalBalls).toBe(0);
      expect(next.extras.noBalls).toBe(1);
      expect(next.batterStats['p1'].runs).toBe(4);
      expect(next.batterStats['p1'].fours).toBe(1);
      expect(next.batterStats['p1'].ballsFaced).toBe(1); // Batsman faces no-balls
      expect(next.bowlerStats['b1'].runsConceded).toBe(5);
      expect(next.isFreeHitActive).toBe(true); // Free Hit active for next delivery!
      expect(next.strikerId).toBe('p1'); // Boundary does not rotate strike
    });

    it('handles Wicket on a Wide (Stumped)', () => {
      const state = getInitialState();
      const ball: BallDeliveryEvent = {
        id: 'wide_stumped',
        inningsNumber: 1,
        overIndex: 0,
        ballInOver: 0,
        legalBallCounted: false,
        strikerId: 'p1',
        nonStrikerId: 'p2',
        bowlerId: 'b1',
        runsBat: 0,
        runsExtras: 1,
        extraType: 'wide',
        physicalRunsRan: 0,
        isBoundary: false,
        isFour: false,
        isSix: false,
        isFreeHitDelivery: false,
        causesFreeHit: false,
        wicket: {
          type: 'stumped',
          playerOutId: 'p1',
          assistedById: 'wk',
          runsCompletedBeforeOut: 0,
          creditBowler: true,
          newBatterId: 'p3',
        },
        displayBadge: 'Wd+W',
        timestamp: Date.now(),
      };

      const next = reduceBallDelivery(state, ball, playerNames);
      expect(next.totalRuns).toBe(1);
      expect(next.totalWickets).toBe(1);
      expect(next.legalBalls).toBe(0);
      expect(next.bowlerStats['b1'].wickets).toBe(1); // Stumped on wide credits bowler!
      expect(next.batterStats['p1'].isOut).toBe(true);
      expect(next.strikerId).toBe('p3'); // New batter enters at striker end
    });

    it('handles Run Out with 1 completed physical run (Batsmen crossed, strike rotates)', () => {
      const state = getInitialState();
      const ball: BallDeliveryEvent = {
        id: 'run_out_1',
        inningsNumber: 1,
        overIndex: 0,
        ballInOver: 1,
        legalBallCounted: true,
        strikerId: 'p1',
        nonStrikerId: 'p2',
        bowlerId: 'b1',
        runsBat: 1,
        runsExtras: 0,
        extraType: 'none',
        physicalRunsRan: 1, // 1 run completed before run out
        isBoundary: false,
        isFour: false,
        isSix: false,
        isFreeHitDelivery: false,
        causesFreeHit: false,
        wicket: {
          type: 'run_out',
          playerOutId: 'p1', // Striker was run out
          runsCompletedBeforeOut: 1,
          creditBowler: false, // Run out does NOT credit bowler
          newBatterId: 'p3',
        },
        displayBadge: 'W+1',
        timestamp: Date.now(),
      };

      const next = reduceBallDelivery(state, ball, playerNames);
      expect(next.totalRuns).toBe(1);
      expect(next.totalWickets).toBe(1);
      expect(next.legalBalls).toBe(1);
      expect(next.bowlerStats['b1'].wickets).toBe(0); // Bowler not credited
      expect(next.batterStats['p1'].runs).toBe(1);
      expect(next.strikerId).toBe('p2'); // Because batsmen crossed on 1 run, non-striker takes strike!
      expect(next.nonStrikerId).toBe('p3'); // New batter takes non-striker end
    });
  });

  // TEST SUITE 3: PENALTY RUNS (MCC LAW 41 & 42)
  describe('Innings-Aware Penalty Runs Engine', () => {
    it('Innings 1: Batting team penalty adds +5 directly to Innings 1 score', () => {
      const state = getInitialState();
      const penaltyBall = createPenaltyEvent({
        inningsNumber: 1,
        overIndex: 0,
        ballInOver: 0,
        strikerId: 'p1',
        nonStrikerId: 'p2',
        bowlerId: 'b1',
        teamBenefited: 'batting',
        reason: 'Helmet struck',
        runs: 5,
      });

      const next = reduceBallDelivery(state, penaltyBall, playerNames);
      expect(next.totalRuns).toBe(5);
      expect(next.extras.penalties).toBe(5);
      expect(next.legalBalls).toBe(0); // Penalty does NOT count as legal ball
      expect(next.strikerId).toBe('p1'); // Penalty NEVER rotates strike!
      expect(next.bowlerStats['b1'].runsConceded).toBe(0); // Bowler NOT charged
    });

    it('Innings 1: Fielding team penalty lowers Innings 2 chase target by 5', () => {
      const mockTeamA: Team = { id: 'team_a', name: 'Team A', shortName: 'TMA', color: '#000', squad: allBatters, playing11: ['p1', 'p2'] };
      const mockTeamB: Team = { id: 'team_b', name: 'Team B', shortName: 'TMB', color: '#111', squad: [bowler], playing11: ['b1'] };

      const state1 = getInitialState();
      state1.totalRuns = 150; // Team 1 scored 150
      // Add fielding penalty event to deliveries
      state1.deliveries.push(
        createPenaltyEvent({
          inningsNumber: 1,
          overIndex: 5,
          ballInOver: 3,
          strikerId: 'p1',
          nonStrikerId: 'p2',
          bowlerId: 'b1',
          teamBenefited: 'fielding', // Awarded to fielding team!
          reason: 'Ball tampering',
          runs: 5,
        })
      );

      const mockMatch: MatchState = {
        metadata: {
          id: 'm1',
          tournamentName: 'T20',
          matchStage: 'Final',
          venue: 'Ground',
          date: '2026',
          scheduledOvers: 20,
        },
        teamA: mockTeamA,
        teamB: mockTeamB,
        toss: { winnerTeamId: 'team_a', electedTo: 'bat' },
        currentInningsNumber: 1,
        innings1: state1,
        innings2: null,
      };

      const penaltyAdjustment = calculatePenalties(mockMatch);
      // Standard target = 150 + 1 = 151
      // Minus 5 fielding penalty = 146!
      expect(penaltyAdjustment.innings1ExtraRunsAwardedToFielding).toBe(5);
      expect(penaltyAdjustment.effectiveTarget).toBe(146);
    });

    it('Innings 2: Fielding team penalty raises target by 5', () => {
      const mockTeamA: Team = { id: 'team_a', name: 'Team A', shortName: 'TMA', color: '#000', squad: allBatters, playing11: ['p1', 'p2'] };
      const mockTeamB: Team = { id: 'team_b', name: 'Team B', shortName: 'TMB', color: '#111', squad: [bowler], playing11: ['b1'] };

      const state1 = getInitialState();
      state1.totalRuns = 160;

      const state2 = getInitialState();
      state2.inningsNumber = 2;
      // In innings 2, defending fielding team (Team A) commits penalty -> awarded to fielding team
      state2.deliveries.push(
        createPenaltyEvent({
          inningsNumber: 2,
          overIndex: 2,
          ballInOver: 1,
          strikerId: 'p1',
          nonStrikerId: 'p2',
          bowlerId: 'b1',
          teamBenefited: 'fielding',
          reason: 'Time wasting',
          runs: 5,
        })
      );

      const mockMatch: MatchState = {
        metadata: {
          id: 'm1',
          tournamentName: 'T20',
          matchStage: 'Final',
          venue: 'Ground',
          date: '2026',
          scheduledOvers: 20,
        },
        teamA: mockTeamA,
        teamB: mockTeamB,
        toss: { winnerTeamId: 'team_a', electedTo: 'bat' },
        currentInningsNumber: 2,
        innings1: state1,
        innings2: state2,
      };

      const penaltyAdjustment = calculatePenalties(mockMatch);
      // Base target = 161. Fielding penalty in innings 2 adds 5 -> 166!
      expect(penaltyAdjustment.innings2ExtraRunsAwardedToFielding).toBe(5);
      expect(penaltyAdjustment.effectiveTarget).toBe(166);
    });
  });

  // TEST SUITE 4: CURTAILED OVERS & BOWLER QUOTAS
  describe('Target & Curtailed Overs Calculator', () => {
    it('calculates bowler quota on curtailed 14 overs correctly', () => {
      // 14 overs / 5 = 2.8 -> 4 bowlers can bowl max 3 overs, 1 can bowl 2 overs
      const quota = calculateCurtailedOversQuota(20, 14);
      expect(quota.curtailedOvers).toBe(14);
      expect(quota.maxOversPerBowler).toBe(3);
      expect(quota.bowlersWithExtraOver).toBe(4);
      expect(quota.powerplayOvers).toBe(4); // round(14 * 0.3) = 4
    });

    it('calculates CRR and RRR with runs needed and balls remaining', () => {
      const result = calculateMatchRates({
        currentRuns: 120,
        legalBallsBowled: 90, // 15.0 overs
        maxOvers: 20,
        target: 160,
        wickets: 3,
        battingTeamName: 'Nepal',
        bowlingTeamName: 'India',
        isFirstInnings: false,
      });

      expect(result.currentRunRate).toBe(8.0);
      expect(result.runsNeeded).toBe(40);
      expect(result.ballsRemaining).toBe(30); // 5 overs = 30 balls
      expect(result.requiredRunRate).toBe(8.0); // 40 runs in 5 overs = 8.00 RRR
      expect(result.isTargetReached).toBe(false);
    });
  });

  // TEST SUITE 5: UNDO, REDO & RECALCULATION ACCURACY
  describe('Innings History Manager & Recalculation', () => {
    it('undoes deliveries cleanly and restores exact stats without drift', () => {
      const initialState = getInitialState();
      const history = new InningsHistoryManager(initialState, playerNames);

      // Ball 1: 4 runs off bat
      const ball1: BallDeliveryEvent = {
        id: 'b1',
        inningsNumber: 1,
        overIndex: 0,
        ballInOver: 1,
        legalBallCounted: true,
        strikerId: 'p1',
        nonStrikerId: 'p2',
        bowlerId: 'b1',
        runsBat: 4,
        runsExtras: 0,
        extraType: 'none',
        physicalRunsRan: 0,
        isBoundary: true,
        isFour: true,
        isSix: false,
        isFreeHitDelivery: false,
        causesFreeHit: false,
        displayBadge: '4',
        timestamp: Date.now(),
      };
      history.pushDelivery(ball1);

      // Ball 2: 1 single
      const ball2: BallDeliveryEvent = {
        id: 'b2',
        inningsNumber: 1,
        overIndex: 0,
        ballInOver: 2,
        legalBallCounted: true,
        strikerId: 'p1',
        nonStrikerId: 'p2',
        bowlerId: 'b1',
        runsBat: 1,
        runsExtras: 0,
        extraType: 'none',
        physicalRunsRan: 1,
        isBoundary: false,
        isFour: false,
        isSix: false,
        isFreeHitDelivery: false,
        causesFreeHit: false,
        displayBadge: '1',
        timestamp: Date.now(),
      };
      history.pushDelivery(ball2);

      const stateAfter2 = history.getCurrentState();
      expect(stateAfter2.totalRuns).toBe(5);
      expect(stateAfter2.legalBalls).toBe(2);
      expect(stateAfter2.strikerId).toBe('p2');

      // Undo Ball 2
      const afterUndo = history.undo();
      expect(afterUndo).not.toBeNull();
      expect(afterUndo!.totalRuns).toBe(4);
      expect(afterUndo!.legalBalls).toBe(1);
      expect(afterUndo!.strikerId).toBe('p1');
      expect(afterUndo!.batterStats['p1'].runs).toBe(4);

      // Redo Ball 2
      const afterRedo = history.redo();
      expect(afterRedo).not.toBeNull();
      expect(afterRedo!.totalRuns).toBe(5);
      expect(afterRedo!.legalBalls).toBe(2);
      expect(afterRedo!.strikerId).toBe('p2');
    });

    it('full recalculation produces identical deterministic state from delivery list', () => {
      const initialState = getInitialState();
      const deliveries: BallDeliveryEvent[] = [
        {
          id: 'd1',
          inningsNumber: 1,
          overIndex: 0,
          ballInOver: 1,
          legalBallCounted: true,
          strikerId: 'p1',
          nonStrikerId: 'p2',
          bowlerId: 'b1',
          runsBat: 6,
          runsExtras: 0,
          extraType: 'none',
          physicalRunsRan: 0,
          isBoundary: true,
          isFour: false,
          isSix: true,
          isFreeHitDelivery: false,
          causesFreeHit: false,
          displayBadge: '6',
          timestamp: 1,
        },
        {
          id: 'd2',
          inningsNumber: 1,
          overIndex: 0,
          ballInOver: 2,
          legalBallCounted: true,
          strikerId: 'p1',
          nonStrikerId: 'p2',
          bowlerId: 'b1',
          runsBat: 1,
          runsExtras: 0,
          extraType: 'none',
          physicalRunsRan: 1,
          isBoundary: false,
          isFour: false,
          isSix: false,
          isFreeHitDelivery: false,
          causesFreeHit: false,
          displayBadge: '1',
          timestamp: 2,
        },
      ];

      const recalculated = recalculateInnings(initialState, deliveries, playerNames);
      expect(recalculated.totalRuns).toBe(7);
      expect(recalculated.legalBalls).toBe(2);
      expect(recalculated.strikerId).toBe('p2');
      expect(recalculated.batterStats['p1'].runs).toBe(7);
      expect(recalculated.batterStats['p1'].sixes).toBe(1);
      expect(recalculated.bowlerStats['b1'].runsConceded).toBe(7);
    });
  });
});
