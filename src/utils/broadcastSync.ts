// GuffBox Cricket Studio — Real-time Broadcast Sync Engine
// Synchronizes match state, stings/animations, and director toggles across Scorer Cockpit, OBS Overlay, and YouTube Watchalong screens.

import { MatchState, MediaEventKey, InningsState } from '../core/types';

export interface StreamPollData {
  isOpen: boolean;
  question: string;
  optionA: { label: string; votes: number };
  optionB: { label: string; votes: number };
}

export type BroadcastMessageType =
  | { type: 'MATCH_STATE'; match: MatchState; initialInnings1: InningsState; initialInnings2: InningsState | null }
  | { type: 'TRIGGER_ANIMATION'; key: MediaEventKey }
  | { type: 'CLEAR_ANIMATION' }
  | { type: 'TOGGLE_STREAM_SCORECARD'; show: boolean }
  | { type: 'TOGGLE_STREAM_PARTNERSHIP'; show: boolean }
  | { type: 'TRIGGER_SOUND'; sound: 'cheer' | 'airhorn' | 'appeal' | 'clap' | 'whistle' | 'four' | 'six' | 'wicket' | 'fanfare' }
  | { type: 'TOGGLE_AMBIENT_CROWD'; active: boolean; volume?: number }
  | { type: 'SET_STREAM_PRESENTATION_CARD'; card: 'none' | 'toss' | 'playing11' | 'wagon_wheel' | 'interval' | 'victory' | 'milestone' }
  | { type: 'UPDATE_STREAM_POLL'; poll: StreamPollData };

const CHANNEL_NAME = 'guffbox_broadcast_channel_v1';
const FALLBACK_STORAGE_KEY = 'guffbox_broadcast_event_v1';

class BroadcastSyncService {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(message: BroadcastMessageType) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          this.notifyListeners(event.data);
        };
      } catch (err) {
        console.warn('BroadcastChannel initialization failed, using storage fallback:', err);
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === FALLBACK_STORAGE_KEY && e.newValue) {
          try {
            const data: BroadcastMessageType = JSON.parse(e.newValue);
            this.notifyListeners(data);
          } catch {
            // ignore malformed
          }
        }
      });
    }
  }

  public publish(message: BroadcastMessageType) {
    if (this.channel) {
      try {
        this.channel.postMessage(message);
      } catch (err) {
        console.warn('Error broadcasting message via channel:', err);
      }
    }

    // Write to localStorage for cross-browser fallback
    try {
      localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify({ ...message, _ts: Date.now() }));
    } catch {
      // ignore storage full or unavailable
    }
  }

  public subscribe(callback: (message: BroadcastMessageType) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(message: BroadcastMessageType) {
    this.listeners.forEach((listener) => {
      try {
        listener(message);
      } catch (err) {
        console.error('Error executing broadcast listener callback:', err);
      }
    });
  }
}

export const broadcastSync = new BroadcastSyncService();
