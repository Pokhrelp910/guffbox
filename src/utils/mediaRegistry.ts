// GuffBox Cricket Studio — Granular 30+ Event Video & Media Registry

import { MediaEventKey } from '../core/types';

export interface MediaSlotInfo {
  key: MediaEventKey;
  label: string;
  category: 'runs' | 'dismissals' | 'extras' | 'milestones' | 'match_states';
  fallbackKey?: MediaEventKey;
  customVideoUrl?: string; // Data URL or external link
}

export const DEFAULT_MEDIA_SLOTS: MediaSlotInfo[] = [
  // 1. Runs & Boundaries
  { key: 'dot', label: 'Dot Ball (0)', category: 'runs' },
  { key: 'run_1', label: '1 Run (Single)', category: 'runs' },
  { key: 'run_2', label: '2 Runs', category: 'runs' },
  { key: 'run_3', label: '3 Runs', category: 'runs' },
  { key: 'four', label: 'Boundary Four (4)', category: 'runs' },
  { key: 'six', label: 'Maximum Six (6)', category: 'runs' },

  // 2. Specific Dismissals
  { key: 'bowled', label: 'Clean Bowled', category: 'dismissals', fallbackKey: 'generic_wicket' },
  { key: 'caught', label: 'Caught Out', category: 'dismissals', fallbackKey: 'generic_wicket' },
  { key: 'caught_behind', label: 'Caught Behind (WK)', category: 'dismissals', fallbackKey: 'caught' },
  { key: 'caught_and_bowled', label: 'Caught & Bowled', category: 'dismissals', fallbackKey: 'caught' },
  { key: 'lbw', label: 'LBW', category: 'dismissals', fallbackKey: 'generic_wicket' },
  { key: 'stumped', label: 'Stumped (WK)', category: 'dismissals', fallbackKey: 'generic_wicket' },
  { key: 'run_out', label: 'Run Out', category: 'dismissals', fallbackKey: 'generic_wicket' },
  { key: 'hit_wicket', label: 'Hit Wicket', category: 'dismissals', fallbackKey: 'generic_wicket' },
  { key: 'duck_out', label: 'Duck Out (0)', category: 'dismissals', fallbackKey: 'generic_wicket' },
  { key: 'golden_duck', label: 'Golden Duck (First Ball)', category: 'dismissals', fallbackKey: 'duck_out' },
  { key: 'retired_out', label: 'Retired Out', category: 'dismissals', fallbackKey: 'generic_wicket' },
  { key: 'retired_hurt', label: 'Retired Hurt', category: 'dismissals' },
  { key: 'obstructing_field', label: 'Obstructing The Field', category: 'dismissals', fallbackKey: 'generic_wicket' },
  { key: 'hit_ball_twice', label: 'Hit Ball Twice', category: 'dismissals', fallbackKey: 'generic_wicket' },
  { key: 'handling_ball', label: 'Handled The Ball', category: 'dismissals', fallbackKey: 'generic_wicket' },
  { key: 'timed_out', label: 'Timed Out', category: 'dismissals', fallbackKey: 'generic_wicket' },
  { key: 'mankad', label: 'Mankad (Non-Striker Run Out)', category: 'dismissals', fallbackKey: 'run_out' },
  { key: 'generic_wicket', label: 'Generic Wicket', category: 'dismissals' },

  // 3. Extras & Penalties
  { key: 'wide', label: 'Wide Ball', category: 'extras' },
  { key: 'noball', label: 'No-Ball', category: 'extras' },
  { key: 'free_hit', label: 'Free Hit Delivery', category: 'extras' },
  { key: 'bye', label: 'Bye Runs', category: 'extras' },
  { key: 'leg_bye', label: 'Leg-Bye Runs', category: 'extras' },
  { key: 'penalty_5', label: '+5 Penalty Runs', category: 'extras' },

  // 4. Milestones
  { key: 'half_century', label: 'Batter 50 Runs', category: 'milestones' },
  { key: 'century', label: 'Batter 100 Runs', category: 'milestones' },
  { key: 'haul_3w', label: 'Bowler 3 Wickets Haul', category: 'milestones' },
  { key: 'haul_5w', label: 'Bowler 5 Wickets Fifer', category: 'milestones' },
  { key: 'haul_10w', label: 'Bowler 10 Wickets / All-Out', category: 'milestones' },
  { key: 'maiden_over', label: 'Maiden Over', category: 'milestones' },
  { key: 'partnership_50', label: '50 Runs Partnership', category: 'milestones' },
  { key: 'partnership_100', label: '100 Runs Partnership', category: 'milestones' },

  // 5. Match States
  { key: 'toss', label: 'Toss Result', category: 'match_states' },
  { key: 'innings_break', label: 'Innings Break', category: 'match_states' },
  { key: 'match_won', label: 'Match Won Celebration', category: 'match_states' },
  { key: 'super_over', label: 'Super Over', category: 'match_states' },
];

const STORAGE_KEY = 'guffbox_custom_media_v1';

export class MediaRegistry {
  private customUrls: Record<string, string> = {};

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.customUrls = JSON.parse(saved);
      }
    } catch {
      this.customUrls = {};
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.customUrls));
    } catch (e) {
      console.warn('Could not save media registry to localStorage:', e);
    }
  }

  public registerVideo(key: MediaEventKey, dataUrlOrPath: string) {
    this.customUrls[key] = dataUrlOrPath;
    this.saveToStorage();
  }

  public removeVideo(key: MediaEventKey) {
    delete this.customUrls[key];
    this.saveToStorage();
  }

  public getSlots(): MediaSlotInfo[] {
    return DEFAULT_MEDIA_SLOTS.map((slot) => ({
      ...slot,
      customVideoUrl: this.customUrls[slot.key],
    }));
  }

  /**
   * Resolves video URL with hierarchical fallback:
   * e.g., 'caught_behind' -> 'caught' -> 'generic_wicket' -> null
   */
  public resolveVideoUrl(key: MediaEventKey): string | null {
    if (this.customUrls[key]) {
      return this.customUrls[key];
    }
    const slot = DEFAULT_MEDIA_SLOTS.find((s) => s.key === key);
    if (slot && slot.fallbackKey) {
      return this.resolveVideoUrl(slot.fallbackKey);
    }
    return null;
  }
}

export const mediaRegistry = new MediaRegistry();
