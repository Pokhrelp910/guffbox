// The Cricket Guff Studio — Supabase Cloud Sync & 6-Day TTL Purge Engine
import { createClient } from '@supabase/supabase-js';
import { MatchState, Team } from '../core/types';

// Supabase Credentials (auto-normalized to strip trailing /rest/v1 if provided)
const rawUrl = import.meta.env.VITE_SUPABASE_URL || 'https://izywdxvrrpjhusvhvdat.supabase.co';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_C6VURM8xjSYOb7QDiVBudw_d2QHf13-';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * DATABASE SCHEMA & 6-DAY TTL POLICY SCRIPT:
 * Run this SQL in your Supabase SQL Editor:
 *
 * 1. TEAMS & PLAYERS TABLE (PERMANENT MASTER DATA — NEVER EXPIRES):
 * CREATE TABLE IF NOT EXISTS teams (
 *   id TEXT PRIMARY KEY,
 *   name TEXT UNIQUE NOT NULL,
 *   short_name TEXT NOT NULL,
 *   color TEXT NOT NULL,
 *   squad JSONB NOT NULL DEFAULT '[]',
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * 2. MATCHES SCORECARD TABLE (SUBJECT TO 6-DAY TTL):
 * CREATE TABLE IF NOT EXISTS matches (
 *   id TEXT PRIMARY KEY,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ DEFAULT NOW(),
 *   match_data JSONB NOT NULL
 * );
 *
 * 3. 6-DAY TTL AUTO-PURGE POLICY (ONLY PURGES MATCHES, NEVER TEAMS):
 * CREATE EXTENSION IF NOT EXISTS pg_cron;
 * SELECT cron.schedule(
 *   'purge-old-cricket-matches',
 *   '0 3 * * *',
 *   $$DELETE FROM matches WHERE created_at < NOW() - INTERVAL '6 days'$$
 * );
 */
export const SUPABASE_TTL_SQL = `
-- 6-Day TTL Auto-Purge Policy (Matches scorecard only)
DELETE FROM matches WHERE created_at < NOW() - INTERVAL '6 days';
`;

/**
 * Saves current match state to Supabase (Subject to 6-day TTL)
 */
export async function syncMatchToSupabase(match: MatchState): Promise<boolean> {
  try {
    const { error } = await supabase.from('matches').upsert({
      id: match.metadata.id,
      updated_at: new Date().toISOString(),
      match_data: match,
    });

    if (error) {
      console.warn('Supabase match sync warning (offline or demo mode):', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase match sync exception:', err);
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

/**
 * Saves or updates a master team and its players in Supabase (Permanent, NEVER purged)
 */
export async function syncTeamToSupabase(team: Team): Promise<boolean> {
  try {
    const { error } = await supabase.from('teams').upsert({
      id: team.id,
      name: team.name,
      short_name: team.shortName,
      color: team.color,
      logo_url: team.logoUrl || null,
      squad: team.squad,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.warn('Supabase team sync warning (offline or demo mode):', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase team sync exception:', err);
    return false;
  }
}

/**
 * Retrieves all master teams and player rosters from Supabase
 */
export async function fetchTeamsFromSupabase(): Promise<Team[]> {
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('name', { ascending: true });

    if (error || !data) return [];
    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      shortName: row.short_name,
      color: row.color,
      logoUrl: row.logo_url || undefined,
      squad: Array.isArray(row.squad) ? row.squad : [],
      playing11: Array.isArray(row.squad) ? row.squad.slice(0, 11).map((p: any) => p.id) : [],
    }));
  } catch (err) {
    console.warn('Failed to fetch teams from Supabase:', err);
    return [];
  }
}
