// Build-time data module — the ONLY place the website reads verification data.
//
// `./generated.json` is written by scripts/fetch-verified.mjs before every build
// (`predev` / `prebuild` → `node scripts/fetch-verified.mjs`). It inlines:
//   index.json + verified/{app}/current.json + verified/{app}/versions/*.json
//   + data/{app}/releases.json + data/stats.json
// so SSR (prerender) and CSR hydrate from the exact same payload — the site stays
// purely static with zero runtime fetches (docs/website-design.md §5.1).
//
// Screenshots are NOT part of this module: they are mirrored as files under
// public/screenshots/<key path> and referenced by the site-relative path derived
// from each record's `url` (deployment-contract §2.3). `siteScreenshotUrl()` below
// only swaps the origin; it never composes an object path.
//
// IMPORTANT: this file is a derived build artifact, never a source of truth. The
// live backend (VERIFIED_BACKEND=dir|r2) always overwrites it on the next run.

import raw from "./generated.json";
import { allChecksPassed } from "./types";
import type {
  AppCurrent,
  AppVersionRecord,
  ReleaseNote,
  Stats,
  VerifiedIndex,
  VerificationManifest,
} from "./types";

const payload = raw as unknown as {
  schema_version: string;
  generated_at: string;
  backend: "dir" | "r2";
  index: VerifiedIndex;
  apps: AppCurrent[];
  versions: Record<string, VerificationManifest[]>;
  releases: Record<string, ReleaseNote[]>;
  stats: Stats;
  screenshots: string[];
};

export const DATA_GENERATED_AT = payload.generated_at;
export const DATA_BACKEND = payload.backend;

// --- currents (= verified/{app}/current.json), index order preserved -------------
export const CURRENTS: AppCurrent[] = payload.apps;

const indexOrder = new Map(payload.index.apps.map((a, i) => [a.app, i]));
export const APPS_BY_INDEX: AppCurrent[] = [...CURRENTS].sort(
  (a, b) => (indexOrder.get(a.app) ?? 0) - (indexOrder.get(b.app) ?? 0)
);

// Unfiltered lookup, so callers can tell "no such app" apart from "app exists but its
// health is not `passed`" (the render filter itself lives in useAppData).
export function findCurrent(app: string): AppCurrent | undefined {
  return APPS_BY_INDEX.find((a) => a.app === app);
}

// --- version records ------------------------------------------------------------
// Already filtered to final-state manifests by the fetch script; re-asserted here so
// a hand-edited generated.json can never smuggle a two-phase placeholder on screen (§2.2).
export function versionRecords(app: string): AppVersionRecord[] {
  const list = (payload.versions[app] ?? []).filter((m) => allChecksPassed(m.checks));
  const releases = payload.releases[app] ?? [];
  return list.map((manifest) => ({
    manifest,
    current: manifest.website,
    release_notes: releaseNotesFor(releases, manifest.app_version),
  }));
}

// GitHub release notes are matched by identical app_version — never by "closest" tag.
function releaseNotesFor(releases: ReleaseNote[], appVersion: string): string {
  const hit = releases.find((r) => r.tag_name === appVersion);
  if (hit) return hit.body ?? "";
  const v = appVersion.replace(/^v/i, "");
  const loose = releases.find((r) => (r.tag_name ?? "").replace(/^v/i, "") === v);
  return loose?.body ?? "";
}

export function releasesOf(app: string): ReleaseNote[] {
  return payload.releases[app] ?? [];
}

// --- statistics (§5.1) ----------------------------------------------------------
export const STATS: Stats = payload.stats;

// A degraded stat must render as "—" instead of a stale value.
export function isDegraded(key: string): boolean {
  return (STATS.degraded ?? []).includes(key);
}

// Sum of the per-app stars we actually have; null when the whole stat degraded or
// no app resolved to a number.
export function totalStars(): number | null {
  if (isDegraded("github_stars")) return null;
  const known = Object.values(STATS.github_stars ?? []).filter(
    (n): n is number => typeof n === "number"
  );
  if (known.length === 0) return null;
  return known.reduce((n, v) => n + v, 0);
}

export function starsOf(app: string): number | null {
  if (isDegraded("github_stars")) return null;
  const n = (STATS.github_stars ?? {})[app];
  return typeof n === "number" ? n : null;
}

export function successRate(): { value: number; window_days: number } | null {
  if (isDegraded("success_rate") || !STATS.success_rate) return null;
  return { value: STATS.success_rate.value, window_days: STATS.success_rate.window_days };
}

// --- screenshots ----------------------------------------------------------------
// Keep the key path untouched and drop only the origin, so the site serves its own
// mirrored copy: https://pub-x.r2.dev/screenshots/a/v/b.png -> /screenshots/a/v/b.png
export function siteScreenshotUrl(manifestUrl: string): string {
  try {
    return "/" + new URL(manifestUrl, "https://mirror.invalid").pathname.replace(/^\/+/, "");
  } catch {
    // Relative value already (dir backend writes "/screenshots/..."): normalise the leading slash.
    return manifestUrl.startsWith("/") ? manifestUrl : "/" + manifestUrl;
  }
}

// Deterministic accent for the letter-avatar fallback (presentational only, NOT data):
// replaces the old hardcoded per-app table so no new app list lives in the frontend.
const ACCENT_PALETTE = [
  "#2563eb", "#7c3aed", "#db2777", "#ea580c",
  "#16a34a", "#0891b2", "#4f46e5", "#b91c1c",
];

export function accentFor(app: string): string {
  let h = 0;
  for (let i = 0; i < app.length; i++) h = (h * 31 + app.charCodeAt(i)) >>> 0;
  return ACCENT_PALETTE[h % ACCENT_PALETTE.length];
}
