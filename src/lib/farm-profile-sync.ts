'use client';

/**
 * Farm profile sync — bridges localStorage (client) and Postgres (server).
 *
 * Why: the WhatsApp cron job reads from Postgres, not localStorage.
 * When a logged-in farmer saves their farm profile, we sync it to the
 * server so the cron can build their daily brief.
 *
 * Two sync directions:
 *   1. push: localStorage → Postgres (called after wizard save)
 *   2. pull: Postgres → localStorage (called on first load if logged in
 *      but localStorage is empty — e.g., user got a new phone)
 *
 * If the user is NOT logged in, both functions are no-ops (the profile
 * stays in localStorage only, as before).
 */

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import type { FarmProfile } from '@/components/agri/farm-profile-wizard';
import type { FarmPilotPlan } from '@/lib/farmpilot-data';

const FARM_PROFILE_KEY = 'farm_profile_v1';
const FARMPILOT_PLAN_KEY = 'farmpilot_plan_v1';
const SYNCED_KEY = 'farm_profile_synced_v1';  // marks that we've pulled from server

/**
 * Push the current localStorage farm profile + plan to Postgres.
 * Called after the wizard saves. No-op if not logged in.
 */
export async function pushFarmProfileToServer(): Promise<void> {
  if (typeof window === 'undefined') return;

  // Read profile from localStorage
  let profile: FarmProfile | null = null;
  try {
    const raw = localStorage.getItem(FARM_PROFILE_KEY);
    if (raw) profile = JSON.parse(raw);
  } catch { return; }

  if (!profile || !profile.lat || !profile.lng || !profile.crop || !profile.plantingDate) {
    // Incomplete profile — don't sync (cron would skip it anyway)
    return;
  }

  // Read FarmPilot plan from localStorage (if exists)
  let plan: FarmPilotPlan | null = null;
  try {
    const raw = localStorage.getItem(FARMPILOT_PLAN_KEY);
    if (raw) plan = JSON.parse(raw);
  } catch { /* ignore */ }

  // POST to server (will 401 if not logged in — that's fine, we just skip)
  try {
    const res = await fetch('/api/farm-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: profile.name,
        lat: parseFloat(profile.lat),
        lng: parseFloat(profile.lng),
        crop: profile.crop,
        plantingDate: profile.plantingDate,
        areaHa: profile.area,
        plan,
      }),
    });
    if (res.ok) {
      localStorage.setItem(SYNCED_KEY, Date.now().toString());
    }
  } catch {
    // Network error — silently fail (localStorage is the source of truth for the UI)
  }
}

/**
 * Pull the farm profile from Postgres into localStorage.
 * Called on mount if the user is logged in but has no local profile.
 * No-op if not logged in OR if localStorage already has a profile.
 */
export async function pullFarmProfileFromServer(): Promise<FarmProfile | null> {
  if (typeof window === 'undefined') return null;

  // If localStorage already has a profile, don't overwrite
  try {
    const existing = localStorage.getItem(FARM_PROFILE_KEY);
    if (existing) return JSON.parse(existing);
  } catch { /* ignore */ }

  // Pull from server
  try {
    const res = await fetch('/api/farm-profile');
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.profile) return null;

    const profile: FarmProfile = {
      name: data.profile.name ?? undefined,
      lat: data.profile.lat != null ? String(data.profile.lat) : undefined,
      lng: data.profile.lng != null ? String(data.profile.lng) : undefined,
      crop: data.profile.crop ?? undefined,
      plantingDate: data.profile.plantingDate ?? undefined,
      area: data.profile.areaHa ?? undefined,
      setupCompleted: true,
    };

    localStorage.setItem(FARM_PROFILE_KEY, JSON.stringify(profile));

    // Also sync the plan if present
    if (data.profile.plan) {
      localStorage.setItem(FARMPILOT_PLAN_KEY, JSON.stringify(data.profile.plan));
    }

    localStorage.setItem(SYNCED_KEY, Date.now().toString());
    return profile;
  } catch {
    return null;
  }
}

/**
 * Hook: useSyncedFarmProfile — like useFarmProfile but syncs with Postgres.
 *
 * - If logged in + localStorage empty → pulls from server
 * - If logged in + localStorage has data → uses local (server has a copy)
 * - If not logged in → localStorage only (existing behavior)
 */
export function useSyncedFarmProfile(): {
  profile: FarmProfile | null;
  loading: boolean;
} {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<FarmProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // 1. Try localStorage first (fast)
      try {
        const saved = localStorage.getItem(FARM_PROFILE_KEY);
        if (saved) {
          if (!cancelled) setProfile(JSON.parse(saved));
          setLoading(false);
          return;
        }
      } catch { /* ignore */ }

      // 2. If logged in + localStorage empty → pull from server
      if (status === 'authenticated' && session?.user) {
        const pulled = await pullFarmProfileFromServer();
        if (!cancelled) {
          setProfile(pulled);
          setLoading(false);
        }
        return;
      }

      // 3. Not logged in + no localStorage → no profile
      if (!cancelled) {
        setProfile(null);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [session, status]);

  return { profile, loading };
}
