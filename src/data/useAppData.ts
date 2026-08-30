import { useMemo } from "react";
import {
  APPS_BY_INDEX,
  STATS,
  findCurrent,
  isDegraded,
  releasesOf,
  siteScreenshotUrl,
  starsOf,
  successRate,
  totalStars,
  versionRecords,
} from "./generated";
import type {
  AppCurrent,
  AppVersionRecord,
  ReleaseNote,
  Screenshot,
} from "./types";

// ---------------------------------------------------------------------------
// Data access layer.
//
// Backed by src/data/generated.json, written by scripts/fetch-verified.mjs at build
// time from the active verified backend (VERIFIED_BACKEND=dir|r2). Components keep
// depending on this module's API, so swapping backends or shapes later is contained.
//
// Nothing here is invented: every value rendered downstream originates from
// `verified/index.json`, `verified/{app}/current.json`, the full version Manifests,
// or the derived `stats.json` (deployment-contract §2 / §5.1).
// ---------------------------------------------------------------------------

export interface SiteStats {
  verified_app_count: number;
  verified_version_count: number;
  // null → the UI renders "—" (degraded per §5.1, never a stale or fake number).
  // Only value + window are exposed; source / sampled_at stay in data/stats.json.
  success_rate: { value: number; window_days: number } | null;
  github_stars: number | null;
  degraded: string[];
  generated_at: string;
}

// The website only renders health === "passed" apps (docs/website-design.md §5.1).
function loadApps(): AppCurrent[] {
  return APPS_BY_INDEX.filter((a) => a.health === "passed");
}

export function useApps(): AppCurrent[] {
  return useMemo(loadApps, []);
}

export function useApp(slug: string | undefined): AppCurrent | undefined {
  return useMemo(() => {
    if (!slug) return undefined;
    const found = findCurrent(slug);
    return found && found.health === "passed" ? found : undefined;
  }, [slug]);
}

// Final-state version records (all nine checks true) with their upstream release notes
// associated by identical app_version.
export function useVersions(app: string | undefined): AppVersionRecord[] {
  return useMemo(() => (app ? versionRecords(app) : []), [app]);
}

export function useReleases(app: string | undefined): ReleaseNote[] {
  return useMemo(() => (app ? releasesOf(app) : []), [app]);
}

export function useStats(): SiteStats {
  return useMemo<SiteStats>(
    () => ({
      verified_app_count: STATS.verified_app_count,
      verified_version_count: STATS.verified_version_count,
      success_rate: successRate(),
      github_stars: totalStars(),
      degraded: STATS.degraded ?? [],
      generated_at: STATS.generated_at,
    }),
    []
  );
}

// Per-app GitHub stars live in stats.json (§5.1), not in current.json.
export function useStars(app: string | undefined): number | null {
  return useMemo(() => (app ? starsOf(app) : null), [app]);
}

export function useDegraded(key: string): boolean {
  return useMemo(() => isDegraded(key), [key]);
}

// Screenshots in `screenshots_order` sequence, served from the build-time mirror.
export interface OrderedScreenshot extends Screenshot {
  siteUrl: string;
}

export function orderedScreenshots(app: AppCurrent): OrderedScreenshot[] {
  const byScenario = new Map(app.screenshots.map((s) => [s.scenario, s]));
  return app.screenshots_order
    .map((scenario) => byScenario.get(scenario))
    .filter((s): s is Screenshot => Boolean(s))
    .map((s) => ({ ...s, siteUrl: siteScreenshotUrl(s.url) }));
}
