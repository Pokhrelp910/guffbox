// GuffBox Cricket Studio — Match State Persistence & Autosave Engine

import { MatchState, InningsState, BallDeliveryEvent } from '../core/types';

export interface MatchPersistenceData {
  match: MatchState;
  initialInnings1: InningsState;
  initialInnings2: InningsState | null;
  redoStack?: BallDeliveryEvent[];
  savedAt: number;
}

const STORAGE_KEY = 'guffbox_active_match_v2';

class MemoryStorage implements Storage {
  private store: Record<string, string> = {};
  get length() {
    return Object.keys(this.store).length;
  }
  clear(): void {
    this.store = {};
  }
  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }
  key(index: number): string | null {
    return Object.keys(this.store)[index] ?? null;
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }
}

const fallbackStorage = new MemoryStorage();

export const getBrowserStorage = (): Storage => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // ignore
  }

  try {
    if (typeof globalThis !== 'undefined' && (globalThis as unknown as { localStorage?: Storage }).localStorage) {
      return (globalThis as unknown as { localStorage: Storage }).localStorage;
    }
  } catch {
    // ignore
  }

  return fallbackStorage;
};

/**
 * Saves current live match state, initial innings baselines, and redo stack to browser storage.
 */
export function saveMatchState(data: MatchPersistenceData): boolean {
  try {
    const storage = getBrowserStorage();
    const payload = JSON.stringify({
      ...data,
      savedAt: Date.now(),
    });
    storage.setItem(STORAGE_KEY, payload);
    return true;
  } catch (err) {
    console.warn('Failed to save match state to localStorage:', err);
    return false;
  }
}

/**
 * Loads and validates any saved match state from browser storage.
 */
export function loadSavedMatch(): MatchPersistenceData | null {
  try {
    const storage = getBrowserStorage();
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as MatchPersistenceData;

    // Strict structural validation
    if (
      parsed &&
      parsed.match &&
      parsed.match.metadata &&
      parsed.match.teamA &&
      parsed.match.teamB &&
      parsed.match.toss &&
      parsed.match.innings1 &&
      parsed.initialInnings1
    ) {
      return parsed;
    }

    console.warn('Saved match data was incomplete or corrupt.');
    return null;
  } catch (err) {
    console.warn('Error reading saved match state:', err);
    return null;
  }
}

/**
 * Clears saved match state from browser storage (e.g. for a clean fresh match).
 */
export function clearSavedMatch(): void {
  try {
    const storage = getBrowserStorage();
    storage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear match storage:', err);
  }
}
