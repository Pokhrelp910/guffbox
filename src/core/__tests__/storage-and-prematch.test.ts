// The Cricket Guff Studio — Unit Tests for Media Registry, Match Storage & Pre-Match Logic

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mediaRegistry, DEFAULT_MEDIA_SLOTS } from '../../utils/mediaRegistry';
import {
  saveMatchState,
  loadSavedMatch,
  clearSavedMatch,
  getBrowserStorage,
  MatchPersistenceData,
} from '../../utils/matchStorage';
import { createInitialInningsState } from '../state-machine';
import { InningsHistoryManager } from '../history-manager';
import { MatchState, Team, MatchMetadata, TossInfo, BallDeliveryEvent } from '../types';

describe('Media Registry & Permanent Video Storing', () => {
  beforeEach(async () => {
    // Clear registry custom URLs
    for (const slot of DEFAULT_MEDIA_SLOTS) {
      await mediaRegistry.removeVideo(slot.key);
    }
  });

  it('contains at least 30 default cricket media slots', () => {
    const slots = mediaRegistry.getSlots();
    expect(slots.length).toBeGreaterThanOrEqual(30);
    expect(slots.some((s) => s.key === 'four')).toBe(true);
    expect(slots.some((s) => s.key === 'six')).toBe(true);
    expect(slots.some((s) => s.key === 'bowled')).toBe(true);
    expect(slots.some((s) => s.key === 'toss')).toBe(true);
  });

  it('resolves fallback videos when a specific dismissal has no custom video', async () => {
    // caught_behind falls back to caught, which falls back to generic_wicket
    expect(mediaRegistry.resolveVideoUrl('caught_behind')).toBeNull();

    // Register generic_wicket
    await mediaRegistry.registerVideo('generic_wicket', 'https://example.com/wicket.mp4');
    expect(mediaRegistry.resolveVideoUrl('caught_behind')).toBe('https://example.com/wicket.mp4');

    // Register caught
    await mediaRegistry.registerVideo('caught', 'https://example.com/caught.mp4');
    expect(mediaRegistry.resolveVideoUrl('caught_behind')).toBe('https://example.com/caught.mp4');

    // Register caught_behind directly
    await mediaRegistry.registerVideo('caught_behind', 'https://example.com/caught_behind.mp4');
    expect(mediaRegistry.resolveVideoUrl('caught_behind')).toBe('https://example.com/caught_behind.mp4');
  });

  it('resolves multi-level dismissal fallback chains cleanly (golden_duck -> duck_out -> generic_wicket)', async () => {
    // Register generic_wicket
    await mediaRegistry.registerVideo('generic_wicket', 'https://example.com/generic_w.mp4');
    
    // golden_duck has fallback duck_out, which has fallback generic_wicket
    expect(mediaRegistry.resolveVideoUrl('golden_duck')).toBe('https://example.com/generic_w.mp4');

    // Register duck_out directly
    await mediaRegistry.registerVideo('duck_out', 'https://example.com/duck.mp4');
    expect(mediaRegistry.resolveVideoUrl('golden_duck')).toBe('https://example.com/duck.mp4');
  });

  it('notifies subscribers when a video is registered or removed', async () => {
    const listener = vi.fn();
    const unsubscribe = mediaRegistry.subscribe(listener);

    await mediaRegistry.registerVideo('six', 'https://example.com/six.mp4');
    expect(listener).toHaveBeenCalled();

    await mediaRegistry.removeVideo('six');
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    await mediaRegistry.registerVideo('four', 'https://example.com/four.mp4');
    expect(listener).toHaveBeenCalledTimes(2); // No new notification after unsubscribe
  });
});

describe('Match Storage & Autosave Engine', () => {
  const dummyMetadata: MatchMetadata = {
    id: 'test_match_123',
    tournamentName: 'Nepal Premier League',
    matchStage: 'Qualifier 1',
    venue: 'Kirtipur Ground',
    date: 'Nov 16, 2026',
    scheduledOvers: 20,
  };

  const dummyTeamA: Team = {
    id: 'ktm',
    name: 'Kathmandu Knights',
    shortName: 'KK',
    color: '#1e3a8a',
    playing11: ['k1', 'k2'],
    squad: [
      { id: 'k1', name: 'Player 1', role: 'batsman', isCaptain: true },
      { id: 'k2', name: 'Player 2', role: 'wicket-keeper', isWicketKeeper: true },
    ],
  };

  const dummyTeamB: Team = {
    id: 'pkr',
    name: 'Pokhara Avengers',
    shortName: 'PA',
    color: '#0284c7',
    playing11: ['p1', 'p2'],
    squad: [
      { id: 'p1', name: 'Player 3', role: 'bowler' },
      { id: 'p2', name: 'Player 4', role: 'all-rounder' },
    ],
  };

  const dummyToss: TossInfo = {
    winnerTeamId: 'ktm',
    electedTo: 'bat',
  };

  const initialInnings = createInitialInningsState({
    inningsNumber: 1,
    battingTeamId: 'ktm',
    bowlingTeamId: 'pkr',
    striker: dummyTeamA.squad[0],
    nonStriker: dummyTeamA.squad[1],
    openingBowler: dummyTeamB.squad[0],
    allBatters: dummyTeamA.squad,
  });

  const dummyMatch: MatchState = {
    metadata: dummyMetadata,
    teamA: dummyTeamA,
    teamB: dummyTeamB,
    toss: dummyToss,
    currentInningsNumber: 1,
    innings1: initialInnings,
    innings2: null,
  };

  beforeEach(() => {
    clearSavedMatch();
  });

  it('saves and loads match state reliably without loss', () => {
    const data: MatchPersistenceData = {
      match: dummyMatch,
      initialInnings1: initialInnings,
      initialInnings2: null,
      savedAt: Date.now(),
    };

    const saved = saveMatchState(data);
    expect(saved).toBe(true);

    const loaded = loadSavedMatch();
    expect(loaded).not.toBeNull();
    expect(loaded?.match.metadata.tournamentName).toBe('Nepal Premier League');
    expect(loaded?.match.teamA.name).toBe('Kathmandu Knights');
    expect(loaded?.match.teamB.name).toBe('Pokhara Avengers');
    expect(loaded?.match.toss.winnerTeamId).toBe('ktm');
  });

  it('reconstructs InningsHistoryManager from saved deliveries and redo stack', () => {
    const delivery: BallDeliveryEvent = {
      id: 'ball_1',
      inningsNumber: 1,
      overIndex: 0,
      ballInOver: 1,
      legalBallCounted: true,
      strikerId: 'k1',
      nonStrikerId: 'k2',
      bowlerId: 'p1',
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

    const historyMgr = new InningsHistoryManager(
      initialInnings,
      { k1: 'Player 1', k2: 'Player 2', p1: 'Player 3' },
      [delivery]
    );

    expect(historyMgr.canUndo()).toBe(true);
    expect(historyMgr.getDeliveries().length).toBe(1);

    const undoneState = historyMgr.undo();
    expect(undoneState?.totalRuns).toBe(0);
    expect(historyMgr.canRedo()).toBe(true);
    expect(historyMgr.getRedoStack().length).toBe(1);

    const redoneState = historyMgr.redo();
    expect(redoneState?.totalRuns).toBe(4);
  });

  it('handles invalid or corrupted storage data gracefully', () => {
    const storage = getBrowserStorage();
    storage.setItem('guffbox_active_match_v2', '{"invalid": true}');
    const loaded = loadSavedMatch();
    expect(loaded).toBeNull();
  });

  it('preserves existing deliveries and runs when updating match metadata and player names mid-match', () => {
    // Simulate a match with 2 deliveries
    const ball1: BallDeliveryEvent = {
      id: 'ball_1',
      inningsNumber: 1,
      overIndex: 0,
      ballInOver: 1,
      legalBallCounted: true,
      strikerId: 'k1',
      nonStrikerId: 'k2',
      bowlerId: 'p1',
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

    const ball2: BallDeliveryEvent = {
      id: 'ball_2',
      inningsNumber: 1,
      overIndex: 0,
      ballInOver: 2,
      legalBallCounted: true,
      strikerId: 'k1',
      nonStrikerId: 'k2',
      bowlerId: 'p1',
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
      timestamp: Date.now(),
    };

    const historyMgr = new InningsHistoryManager(
      initialInnings,
      { k1: 'Player 1', k2: 'Player 2', p1: 'Player 3' },
      [ball1, ball2]
    );

    const liveInnings = historyMgr.getCurrentState();
    expect(liveInnings.totalRuns).toBe(10);
    expect(liveInnings.deliveries.length).toBe(2);

    // Save live match state
    saveMatchState({
      match: {
        ...dummyMatch,
        innings1: liveInnings,
      },
      initialInnings1: initialInnings,
      initialInnings2: null,
      savedAt: Date.now(),
    });

    // Reload from storage
    const loaded = loadSavedMatch();
    expect(loaded?.match.innings1.totalRuns).toBe(10);
    expect(loaded?.match.innings1.deliveries.length).toBe(2);

    // Update player name mid-match without resetting deliveries
    const updatedTeamA: Team = {
      ...dummyTeamA,
      name: 'Kathmandu Kings Updated',
      squad: [
        { id: 'k1', name: 'Kushal Bhurtel (Updated)', role: 'batsman' },
        { id: 'k2', name: 'Aasif Sheikh (Updated)', role: 'wicket-keeper', isWicketKeeper: true },
      ],
    };

    // Re-verify that deliveries and total runs are completely preserved
    const updatedMatch: MatchState = {
      ...loaded!.match,
      teamA: updatedTeamA,
      metadata: {
        ...loaded!.match.metadata,
        venue: 'Tribhuvan University Cricket Ground',
      },
    };

    saveMatchState({
      match: updatedMatch,
      initialInnings1: initialInnings,
      initialInnings2: null,
      savedAt: Date.now(),
    });

    const reloaded = loadSavedMatch();
    expect(reloaded?.match.teamA.name).toBe('Kathmandu Kings Updated');
    expect(reloaded?.match.metadata.venue).toBe('Tribhuvan University Cricket Ground');
    expect(reloaded?.match.innings1.totalRuns).toBe(10);
    expect(reloaded?.match.innings1.deliveries.length).toBe(2);
  });

  it('filters available batters to only playing XI, excluding squad bench players', () => {
    const squadWithBench = [
      { id: 'p1', name: 'Active 1', role: 'batsman' as const },
      { id: 'p2', name: 'Active 2', role: 'batsman' as const },
      { id: 'p3', name: 'Active 3', role: 'all-rounder' as const },
      { id: 'bench_1', name: 'Bench Reserve', role: 'batsman' as const },
    ];
    const playing11Ids = ['p1', 'p2', 'p3'];

    const playingSquad = squadWithBench.filter((p) => playing11Ids.includes(p.id));
    expect(playingSquad.length).toBe(3);
    expect(playingSquad.some((p) => p.id === 'bench_1')).toBe(false);

    // Active batters on crease: p1 (striker), p2 (nonStriker)
    const strikerId = 'p1';
    const nonStrikerId = 'p2';
    const available = playingSquad.filter(
      (p) => p.id !== strikerId && p.id !== nonStrikerId
    );

    expect(available.length).toBe(1);
    expect(available[0].id).toBe('p3');
  });
});
