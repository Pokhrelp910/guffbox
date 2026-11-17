// GuffBox Cricket Studio — Wagon Wheel & Pitch Map Geometry Engine

import { BallDeliveryEvent, CricketShotZone, CricketPitchLength } from '../core/types';

export interface ShotSectorInfo {
  zone: CricketShotZone;
  label: string;
  angleDeg: number; // 0 deg is Straight (Up), 90 deg is Cover (Right), 270 deg is Mid Wicket (Left)
  side: 'off' | 'leg' | 'straight';
}

export const CRICKET_SHOT_SECTORS: ShotSectorInfo[] = [
  { zone: 'straight', label: 'Straight', angleDeg: 0, side: 'straight' },
  { zone: 'long_off', label: 'Long Off', angleDeg: 35, side: 'off' },
  { zone: 'extra_cover', label: 'Extra Cover', angleDeg: 65, side: 'off' },
  { zone: 'cover', label: 'Cover', angleDeg: 95, side: 'off' },
  { zone: 'point', label: 'Point', angleDeg: 125, side: 'off' },
  { zone: 'third_man', label: 'Third Man', angleDeg: 155, side: 'off' },
  { zone: 'fine_leg', label: 'Fine Leg', angleDeg: 205, side: 'leg' },
  { zone: 'square_leg', label: 'Square Leg', angleDeg: 235, side: 'leg' },
  { zone: 'mid_wicket', label: 'Mid Wicket', angleDeg: 275, side: 'leg' },
  { zone: 'long_on', label: 'Long On', angleDeg: 325, side: 'leg' },
];

const SIX_ZONES: CricketShotZone[] = ['long_on', 'mid_wicket', 'straight', 'extra_cover', 'long_off', 'square_leg'];
const FOUR_ZONES: CricketShotZone[] = ['cover', 'extra_cover', 'point', 'square_leg', 'mid_wicket', 'third_man', 'fine_leg'];
const RUNS_ZONES: CricketShotZone[] = ['fine_leg', 'third_man', 'mid_wicket', 'square_leg', 'cover', 'point', 'long_on'];

/**
 * Assigns realistic shot zone if operator did not manually select one
 */
export function resolveDeliveryShotZone(del: BallDeliveryEvent, index: number = 0): CricketShotZone {
  if (del.shotZone) return del.shotZone;

  // Simple deterministic seed
  const hash = Math.abs((del.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) + index * 13) % 100);

  if (del.isSix) {
    return SIX_ZONES[hash % SIX_ZONES.length];
  }
  if (del.isFour) {
    return FOUR_ZONES[hash % FOUR_ZONES.length];
  }
  if (del.runsBat > 0) {
    return RUNS_ZONES[hash % RUNS_ZONES.length];
  }
  if (del.wicket) {
    return (['point', 'cover', 'mid_wicket', 'straight'] as CricketShotZone[])[hash % 4];
  }
  return (['cover', 'mid_wicket', 'point', 'square_leg'] as CricketShotZone[])[hash % 4];
}

/**
 * Assigns realistic pitch length if not manually set
 */
export function resolveDeliveryPitchLength(del: BallDeliveryEvent, index: number = 0): CricketPitchLength {
  if (del.pitchLength) return del.pitchLength;
  const hash = Math.abs((del.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) + index * 7) % 100);

  if (del.wicket?.type === 'bowled' || del.wicket?.type === 'lbw') {
    return hash % 2 === 0 ? 'yorker' : 'full';
  }
  if (del.isSix) {
    return hash % 2 === 0 ? 'full' : 'short';
  }
  if (del.isFour) {
    return hash % 2 === 0 ? 'full' : 'good_length';
  }
  if (del.runsBat === 0) {
    return hash % 3 === 0 ? 'good_length' : hash % 3 === 1 ? 'back_of_length' : 'yorker';
  }
  return 'good_length';
}

/**
 * Converts polar angle + distance into Cartesian SVG coordinates
 * Center is (cx, cy), 0 deg is UP (Straight)
 */
export function calculateShotCoordinates(
  cx: number,
  cy: number,
  boundaryRadius: number,
  zone: CricketShotZone,
  runs: number,
  isFour: boolean,
  isSix: boolean,
  seed: number = 0
): { x: number; y: number; lengthFraction: number } {
  const sector = CRICKET_SHOT_SECTORS.find((s) => s.zone === zone) || CRICKET_SHOT_SECTORS[0];
  
  // Add slight natural angular jitter (+- 10 degrees)
  const jitterAngle = ((seed % 17) - 8);
  const finalAngleDeg = sector.angleDeg + jitterAngle;
  const rad = ((finalAngleDeg - 90) * Math.PI) / 180; // Standard trig offset so 0 deg is UP

  // Distance fraction based on runs
  let lengthFraction = 0.55;
  if (isSix) {
    lengthFraction = 1.05 + ((seed % 7) * 0.02); // Clears the rope
  } else if (isFour) {
    lengthFraction = 0.98 + ((seed % 5) * 0.008); // Right at the rope
  } else if (runs === 3) {
    lengthFraction = 0.82;
  } else if (runs === 2) {
    lengthFraction = 0.68;
  } else if (runs === 1) {
    lengthFraction = 0.48;
  } else {
    lengthFraction = 0.28;
  }

  const distance = boundaryRadius * lengthFraction;
  const x = cx + distance * Math.cos(rad);
  const y = cy + distance * Math.sin(rad);

  return { x, y, lengthFraction };
}
