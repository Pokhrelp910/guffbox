// GuffBox Cricket Studio — Supabase Cloud Sync & 6-Day TTL Purge Engine
import { createClient } from '@supabase/supabase-js';
import { MatchState } from '../core/types';

// Supabase Credentials (configure via VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mock-supabase.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'mock-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * DATABASE SCHEMA & 6-DAY TTL POLICY SCRIPT:
 * Run this SQL in your Supabase SQL Editor:
 *
 * CREATE TABLE IF NOT EXISTS matches (
 *   id TEXT PRIMARY KEY,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ DEFAULT NOW(),
 *   match_data JSONB NOT NULL
 * );
 *
 * -- Enable pg_cron for automatic 6-day TTL purging:
 * CREATE EXTENSION IF NOT EXISTS pg_cron;
 *
 * -- Schedule daily cleanup at 03:00 AM UTC
 * SELECT cron.schedule(
 *   'purge-old-cricket-matches',
 *   '0 3 * * *',
 *   $$DELETE FROM matches WHERE created_at < NOW() - INTERVAL '6 days'$$
 * );
 */
export const SUPABASE_TTL_SQL = `
-- 6-Day TTL Auto-Purge Policy
DELETE FROM matches WHERE created_at < NOW() - INTERVAL '6 days';
`;

/**
 * Saves current match state to Supabase
 */
export async function syncMatchToSupabase(match: MatchState): Promise<boolean> {
  try {
    const { error } = await supabase.from('matches').upsert({
      id: match.metadata.id,
      updated_at: new Date().toISOString(),
      match_data: match,
    });

    if (error) {
      console.warn('Supabase sync warning (offline or demo mode):', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase sync exception:', err);
    return false;
  }
}

/**
 * Retrieves match state from Supabase
 */
export async function fetchMatchFromSupabase(matchId: string): Promise<MatchState | null> {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('match_data')
      .eq('id', matchId)
      .single();

    if (error || !data) return null;
    return data.match_data as MatchState;
  } catch (err) {
    console.warn('Failed to fetch match from Supabase:', err);
    return null;
  }
}
