// The Cricket Guff Studio — Unit Tests for Wagon Wheel Geometry & Broadcast Message Sync

import { describe, it, expect } from 'vitest';
import {
  CRICKET_SHOT_SECTORS,
  resolveDeliveryShotZone,
  resolveDeliveryPitchLength,
  calculateShotCoordinates,
} from '../../utils/wagonWheelHelper';
import { BallDeliveryEvent } from '../types';

describe('Wagon Wheel & Pitch Map Geometry Engine', () => {
  it('contains all 10 standard cricket shot sectors covering 360 degrees', () => {
    expect(CRICKET_SHOT_SECTORS.length).toBe(10);
    const zones = CRICKET_SHOT_SECTORS.map((s) => s.zone);
    expect(zones).toContain('straight');
    expect(zones).toContain('cover');
    expect(zones).toContain('square_leg');
    expect(zones).toContain('long_on');
    expect(zones).toContain('fine_leg');
  });

  it('correctly maps polar angle to Cartesian coordinates for boundaries', () => {
    const cx = 270;
    const cy = 270;
    const radius = 220;

    // Six shot
    const sixCoords = calculateShotCoordinates(cx, cy, radius, 'straight', 6, false, true, 0);
    expect(sixCoords.lengthFraction).toBeGreaterThan(1.0); // clears the rope
    expect(typeof sixCoords.x).toBe('number');
    expect(typeof sixCoords.y).toBe('number');
    expect(Number.isFinite(sixCoords.x)).toBe(true);
    expect(Number.isFinite(sixCoords.y)).toBe(true);

    // Four shot
    const fourCoords = calculateShotCoordinates(cx, cy, radius, 'cover', 4, true, false, 0);
    expect(fourCoords.lengthFraction).toBeGreaterThanOrEqual(0.95);
    expect(fourCoords.lengthFraction).toBeLessThan(1.05);

    // Single shot
    const singleCoords = calculateShotCoordinates(cx, cy, radius, 'mid_wicket', 1, false, false, 0);
    expect(singleCoords.lengthFraction).toBeLessThan(0.6);
  });

  it('resolves realistic shot zones for boundaries and wickets', () => {
    const sixDelivery: BallDeliveryEvent = {
      id: 'del_six_1',
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
      timestamp: Date.now(),
    };

    const resolvedZone = resolveDeliveryShotZone(sixDelivery, 0);
    expect(typeof resolvedZone).toBe('string');
    expect(['long_on', 'mid_wicket', 'straight', 'extra_cover', 'long_off', 'square_leg']).toContain(resolvedZone);

    const pitchLength = resolveDeliveryPitchLength(sixDelivery, 0);
    expect(['full', 'short']).toContain(pitchLength);
  });

  it('resolves explicit shotZone and pitchLength when provided', () => {
    const customDelivery: BallDeliveryEvent = {
      id: 'del_custom_1',
      inningsNumber: 1,
      overIndex: 1,
      ballInOver: 2,
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
      shotZone: 'point',
      pitchLength: 'yorker',
      displayBadge: '4',
      timestamp: Date.now(),
    };

    expect(resolveDeliveryShotZone(customDelivery)).toBe('point');
    expect(resolveDeliveryPitchLength(customDelivery)).toBe('yorker');
  });
});
