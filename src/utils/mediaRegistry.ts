// The Cricket Guff Studio — Granular 30+ Event Video & Media Registry with IndexedDB Permanent Storage

import { MediaEventKey } from '../core/types';

export interface MediaSlotInfo {
  key: MediaEventKey;
  label: string;
  category: 'runs' | 'dismissals' | 'extras' | 'milestones' | 'match_states';
  fallbackKey?: MediaEventKey;
  customVideoUrl?: string; // In-memory Object URL or Data URL
  fileName?: string;
  fileSize?: number; // Size in bytes
  updatedAt?: number;
}

export interface StoredMediaRecord {
  key: MediaEventKey;
  blob: Blob;
  mimeType: string;
  name: string;
  size: number;
  updatedAt: number;
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

const DB_NAME = 'guffbox_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'video_blobs';
const LEGACY_STORAGE_KEY = 'guffbox_custom_media_v1';
const SYNC_CHANNEL_NAME = 'guffbox_media_bus';
const SYNC_STORAGE_KEY = 'guffbox_media_sync_v2';

export class MediaRegistry {
  private customUrls: Record<string, string> = {};
  private metadata: Record<string, { size: number; name: string; updatedAt: number }> = {};
  private dbPromise: Promise<IDBDatabase | null> | null = null;
  private listeners: Set<() => void> = new Set();
  private isInitialized = false;
  private readyPromise: Promise<void>;
  private resolveReady!: () => void;
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    this.readyPromise = new Promise((resolve) => {
      this.resolveReady = resolve;
    });
    this.init();
    this.setupCrossTabSync();
  }

  /**
   * Promise that resolves when IndexedDB has completed initial load.
   */
  public whenReady(): Promise<void> {
    return this.readyPromise;
  }

  /**
   * Sets up cross-window communication for OBS Browser Source and multi-tab live sync.
   */
  private setupCrossTabSync() {
    if (typeof window === 'undefined') return;

    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
        this.broadcastChannel.onmessage = (event) => {
          if (event.data?.type === 'MEDIA_UPDATED') {
            this.reloadFromDatabase();
          }
        };
      } catch {
        // ignore
      }
    }

    try {
      window.addEventListener('storage', (e) => {
        if (e.key === SYNC_STORAGE_KEY) {
          this.reloadFromDatabase();
        }
      });
    } catch {
      // ignore
    }
  }

  private broadcastMediaUpdate() {
    try {
      this.broadcastChannel?.postMessage({ type: 'MEDIA_UPDATED', timestamp: Date.now() });
    } catch {
      // ignore
    }

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(SYNC_STORAGE_KEY, Date.now().toString());
      }
    } catch {
      // ignore
    }
  }

  /**
   * Reloads stored videos from IndexedDB (e.g. triggered by cross-tab event).
   */
  public async reloadFromDatabase(): Promise<void> {
    try {
      const db = await this.openDatabase();
      if (db) {
        await this.loadFromIndexedDB(db);
        this.notifyListeners();
      }
    } catch (err) {
      console.warn('Failed to reload media registry from IndexedDB:', err);
    }
  }

  /**
   * Initializes IndexedDB and loads all stored videos into memory Object URLs.
   */
  public async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const db = await this.openDatabase();
      if (db) {
        await this.loadFromIndexedDB(db);
        // Also check if there's any legacy data from localStorage to migrate
        await this.migrateLegacyLocalStorage(db);
      } else {
        // Fallback for environments without IndexedDB (e.g. basic Node unit tests)
        this.loadFromLegacyStorage();
      }
    } catch (err) {
      console.warn('Failed to initialize IndexedDB media store, using memory fallback:', err);
      this.loadFromLegacyStorage();
    } finally {
      this.isInitialized = true;
      this.resolveReady();
      this.notifyListeners();
    }
  }

  private openDatabase(): Promise<IDBDatabase | null> {
    if (this.dbPromise) return this.dbPromise;

    if (typeof window === 'undefined' || !window.indexedDB) {
      return Promise.resolve(null);
    }

    this.dbPromise = new Promise((resolve) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.warn('IndexedDB open request error:', request.error);
        this.dbPromise = null; // Allow retry on failure
        resolve(null);
      };

      request.onblocked = () => {
        console.warn('IndexedDB open blocked by other connection');
      };
    });

    return this.dbPromise;
  }

  private loadFromIndexedDB(db: IDBDatabase): Promise<void> {
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();

        req.onsuccess = () => {
          const records: StoredMediaRecord[] = req.result || [];
          records.forEach((record) => {
            if (record && record.key && record.blob) {
              try {
                let blobInstance: Blob;
                if (record.blob instanceof Blob) {
                  blobInstance = record.blob;
                } else if (
                  typeof ArrayBuffer !== 'undefined' &&
                  (record.blob as unknown) instanceof ArrayBuffer
                ) {
                  blobInstance = new Blob([record.blob as unknown as BlobPart], {
                    type: record.mimeType || 'video/mp4',
                  });
                } else {
                  return;
                }

                // Revoke old URL if existing to prevent leaks
                if (this.customUrls[record.key] && this.customUrls[record.key].startsWith('blob:')) {
                  URL.revokeObjectURL(this.customUrls[record.key]);
                }
                const objectUrl = URL.createObjectURL(blobInstance);
                this.customUrls[record.key] = objectUrl;
                this.metadata[record.key] = {
                  size: record.size || blobInstance.size,
                  name: record.name || `${record.key}.mp4`,
                  updatedAt: record.updatedAt || Date.now(),
                };
              } catch (e) {
                console.warn(`Could not create ObjectURL for ${record.key}:`, e);
              }
            }
          });
          resolve();
        };

        req.onerror = () => {
          console.warn('Failed to getAll records from IndexedDB:', req.error);
          resolve();
        };
      } catch (err) {
        console.warn('Transaction error in loadFromIndexedDB:', err);
        resolve();
      }
    });
  }

  private async migrateLegacyLocalStorage(db: IDBDatabase) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const saved = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!saved) return;
      const legacyMap: Record<string, string> = JSON.parse(saved);
      const keys = Object.keys(legacyMap);
      for (const key of keys) {
        const dataUrl = legacyMap[key];
        // If not already in indexedDB
        if (!this.customUrls[key] && dataUrl && dataUrl.startsWith('data:')) {
          try {
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            await this.saveToIndexedDB(db, key as MediaEventKey, blob, `${key}.mp4`);
            const objectUrl = URL.createObjectURL(blob);
            this.customUrls[key] = objectUrl;
            this.metadata[key] = {
              size: blob.size,
              name: `${key}.mp4`,
              updatedAt: Date.now(),
            };
          } catch (e) {
            console.warn(`Legacy migration failed for ${key}:`, e);
          }
        }
      }
      // Remove legacy localStorage after migration to free up browser quota
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // Ignore legacy migration errors
    }
  }

  private loadFromLegacyStorage() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const saved = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (saved) {
        this.customUrls = JSON.parse(saved);
      }
    } catch {
      this.customUrls = {};
    }
  }

  private saveToIndexedDB(
    db: IDBDatabase,
    key: MediaEventKey,
    blob: Blob,
    name: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const record: StoredMediaRecord = {
          key,
          blob,
          mimeType: blob.type || 'video/mp4',
          name,
          size: blob.size,
          updatedAt: Date.now(),
        };
        const req = store.put(record);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  private deleteFromIndexedDB(db: IDBDatabase, key: MediaEventKey): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(key);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  private clearAllFromIndexedDB(db: IDBDatabase): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.clear();

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Registers a video File or Blob permanently in IndexedDB.
   * Generates a fast in-memory Object URL for instantaneous playback.
   */
  public async registerVideoFile(
    key: MediaEventKey,
    fileOrBlob: File | Blob,
    name?: string
  ): Promise<string> {
    const fileName = name || (fileOrBlob instanceof File ? fileOrBlob.name : `${key}.mp4`);
    
    // Revoke previous URL if any to prevent memory leaks
    if (this.customUrls[key] && this.customUrls[key].startsWith('blob:')) {
      try {
        URL.revokeObjectURL(this.customUrls[key]);
      } catch {
        // ignore
      }
    }

    // Generate fast Object URL
    let objectUrl: string;
    try {
      objectUrl = URL.createObjectURL(fileOrBlob);
    } catch {
      // In non-browser environment
      objectUrl = `blob:${key}`;
    }

    this.customUrls[key] = objectUrl;
    this.metadata[key] = {
      size: fileOrBlob.size,
      name: fileName,
      updatedAt: Date.now(),
    };

    // Save permanently to IndexedDB
    const db = await this.openDatabase();
    if (db) {
      await this.saveToIndexedDB(db, key, fileOrBlob, fileName);
    }

    this.notifyListeners();
    this.broadcastMediaUpdate();
    return objectUrl;
  }

  /**
   * Backward-compatible registration using Data URL or URL string.
   */
  public async registerVideo(key: MediaEventKey, dataUrlOrPath: string): Promise<void> {
    if (dataUrlOrPath.startsWith('data:')) {
      try {
        const res = await fetch(dataUrlOrPath);
        const blob = await res.blob();
        await this.registerVideoFile(key, blob, `${key}.mp4`);
        return;
      } catch (e) {
        console.warn('Failed to convert dataUrl to blob, saving in memory:', e);
      }
    }

    this.customUrls[key] = dataUrlOrPath;
    this.notifyListeners();
    this.broadcastMediaUpdate();
  }

  /**
   * Removes custom video for the given key permanently from IndexedDB.
   */
  public async removeVideo(key: MediaEventKey): Promise<void> {
    if (this.customUrls[key]) {
      if (this.customUrls[key].startsWith('blob:')) {
        try {
          URL.revokeObjectURL(this.customUrls[key]);
        } catch {
          // ignore
        }
      }
      delete this.customUrls[key];
    }
    delete this.metadata[key];

    const db = await this.openDatabase();
    if (db) {
      await this.deleteFromIndexedDB(db, key);
    }

    this.notifyListeners();
    this.broadcastMediaUpdate();
  }

  /**
   * Clears all custom videos from IndexedDB.
   */
  public async clearAllVideos(): Promise<void> {
    Object.keys(this.customUrls).forEach((key) => {
      if (this.customUrls[key] && this.customUrls[key].startsWith('blob:')) {
        try {
          URL.revokeObjectURL(this.customUrls[key]);
        } catch {
          // ignore
        }
      }
    });
    this.customUrls = {};
    this.metadata = {};

    const db = await this.openDatabase();
    if (db) {
      await this.clearAllFromIndexedDB(db);
    }

    this.notifyListeners();
    this.broadcastMediaUpdate();
  }

  /**
   * Returns slot information including custom URLs and metadata.
   */
  public getSlots(): MediaSlotInfo[] {
    return DEFAULT_MEDIA_SLOTS.map((slot) => {
      const meta = this.metadata[slot.key];
      return {
        ...slot,
        customVideoUrl: this.customUrls[slot.key],
        fileName: meta?.name,
        fileSize: meta?.size,
        updatedAt: meta?.updatedAt,
      };
    });
  }

  /**
   * Resolves video URL with hierarchical fallback and cycle prevention:
   * e.g., 'caught_behind' -> 'caught' -> 'generic_wicket' -> null
   */
  public resolveVideoUrl(key: MediaEventKey): string | null {
    let currentKey: MediaEventKey | undefined = key;
    const visited = new Set<MediaEventKey>();

    while (currentKey && !visited.has(currentKey)) {
      if (this.customUrls[currentKey]) {
        return this.customUrls[currentKey];
      }
      visited.add(currentKey);
      const slot = DEFAULT_MEDIA_SLOTS.find((s) => s.key === currentKey);
      currentKey = slot?.fallbackKey;
    }

    return null;
  }

  /**
   * Subscribes to registry changes (upload, deletion, initial DB load).
   */
  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('Error in MediaRegistry listener:', err);
      }
    });
  }
}

export const mediaRegistry = new MediaRegistry();
