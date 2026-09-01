// Data model for CoreNova Launch website (Repo A).
//
// These types mirror, field for field:
//   - `verified/index.json`                       → VerifiedIndex / VerifiedIndexEntry  (deployment-contract §2.1)
//   - `verified/{app}/current.json`               → AppCurrent                          (deployment-contract §2)
//   - `verified/{app}/versions/{app_version}.json`→ VerificationManifest                (verification-manifest §3)
//   - `data/stats.json`                           → StatsFile                           (deployment-contract §5.1)
//   - `data/{app}/releases.json`                  → ReleaseNote[]  (upstream metadata sync, deployment-contract §1 exception)
//
// The website MUST render only what these records contain. No field is invented by the
// frontend, and nothing is derived from version strings (release.type, regions,
// architecture, status, screenshot paths all come straight from data).

export type Locale = "en" | "zh";

export type Localized = { en: string; zh: string };

export type ReleaseType = "initial" | "new_version" | "security_update" | "bug_fix";

// health = verification.application projection: passed | referenced | failed
export type Health = "passed" | "referenced" | "failed";

// verification.* tri-state values (verification-manifest §5)
export type VerificationValue = "passed" | "referenced" | "failed" | "skipped";

// ---------------------------------------------------------------------------
// Publish Gate checks — the ONLY nine items the report may render (§3.1).
// Adding, renaming or dropping one is a contract violation.
// ---------------------------------------------------------------------------
export const CHECK_NAMES = [
  "compose_started",
  "container_healthy",
  "health_check_passed",
  "tests_passed",
  "screenshots_generated",
  "screenshots_uploaded",
  "report_uploaded",
  "verification_manifest_uploaded",
  "required_platform_contract_valid",
] as const;

export type CheckName = (typeof CHECK_NAMES)[number];

export type Checks = Record<CheckName, boolean>;

// §3.1 display order + English display names (i18n copy stays with the frontend;
// the check NAMES and their COUNT come from the contract).
export const CHECK_ROWS: { key: CheckName; label: string; phase: string }[] = [
  { key: "compose_started", label: "Compose started", phase: "VERIFYING" },
  { key: "container_healthy", label: "Container healthy", phase: "VERIFYING" },
  { key: "health_check_passed", label: "Health check passed", phase: "VERIFYING" },
  { key: "tests_passed", label: "Application tests", phase: "VERIFYING" },
  { key: "screenshots_generated", label: "Screenshots captured", phase: "VERIFYING" },
  { key: "screenshots_uploaded", label: "Screenshots published", phase: "PUBLISHING" },
  { key: "report_uploaded", label: "Report published", phase: "PUBLISHING" },
  { key: "verification_manifest_uploaded", label: "Manifest published", phase: "PUBLISHING" },
  { key: "required_platform_contract_valid", label: "Platform contract valid", phase: "RESOLVED" },
];

// True only for a final-state record (all nine checks true). Placeholder records left
// by an interrupted two-phase commit must never reach the site (§2.2).
export function allChecksPassed(checks: Partial<Checks> | undefined): checks is Checks {
  if (!checks) return false;
  return CHECK_NAMES.every((k) => checks[k] === true);
}

// ---------------------------------------------------------------------------
// verified/{app}/current.json (= Manifest `website` segment, 1:1)
// ---------------------------------------------------------------------------

// scenario is the ASCII slug from `tests.scenarios[].slug`; `file`/`url` are written by
// Repo C — the frontend never builds a screenshot path itself (§6 anti-patterns).
export interface Screenshot {
  scenario: string;
  file: string;
  url: string;
  caption: Localized;
}

// Post-deployment guidance (app-schema rule 17): where the admin console lives and how
// to get access. Copy only — never credentials. Absent for apps without an admin console
// or records published before the contract existed; the frontend then renders only the
// platform-generic steps and must not invent paths or credential hints (§3.2).
export interface PostDeploy {
  admin_path?: string; // e.g. "/ghost/"; starts with "/"
  admin_setup?: Localized; // required alongside admin_path
  notes?: Localized[];
}

export interface Deploy {
  launch_url: string;
  documentation_url: string;
  regions: string[];
  instance_type: string;
  container_port: number;
  docker_image: string;
  extra_environment?: string[];
  post_deploy?: PostDeploy;
}

export interface ReleaseInfo {
  type: ReleaseType;
  previous_version?: string;
  // Why Repo C classified this release this way (§3.2 / §4.1) — audit tooltip only.
  type_evidence?: string;
}

export interface AppCurrent {
  app: string;
  app_version: string;
  verification_id: string;
  verification_run_id: string;
  platform_verification_id: string;
  ami_id: string;
  architecture: string; // v1: "x86_64"
  region: string; // v1: "us-east-1"
  display_name: Localized;
  description: Localized;
  category: string;
  icon: string;
  featured: boolean;
  tags: string[];
  features: Localized[];
  health: Health;
  status: string;
  verified_at: string; // ISO8601 UTC
  report_url: string;
  workflow_run_url: string;
  screenshots_order: string[];
  deploy: Deploy;
  release: ReleaseInfo;
  screenshots: Screenshot[];
}

// verified/index.json (§2.1) — the only entry point to enumerate apps.
export interface VerifiedIndexEntry {
  app: string;
  app_version: string;
  verification_id: string;
  status: string;
  health: Health;
  verified_at: string;
}

export interface VerifiedIndex {
  schema_version: string;
  generated_at: string;
  apps: VerifiedIndexEntry[];
}

// ---------------------------------------------------------------------------
// verified/{app}/versions/{app_version}.json = full Verification Manifest
// ---------------------------------------------------------------------------

export interface ManifestRelease {
  source_repo?: string;
  source_revision?: string;
  release_tag?: string;
  upstream_tag?: string;
  image_reference?: string;
}

export interface ManifestContainer {
  image: string;
  digest: string;
  manifest_digest?: string;
  platform?: string;
}

export interface ManifestPlatform {
  platform_verification_id: string;
  ami_id: string;
  base_ami_source?: string;
  source_ami_name?: string;
  region: string;
  architecture: string;
}

export interface ManifestArtifacts {
  screenshots: Screenshot[];
  report_url: string;
  workflow_run_url: string;
}

export interface VerificationManifest {
  schema_version: string;
  verification_id: string;
  app: string;
  app_version: string;
  release: ManifestRelease;
  container: ManifestContainer;
  platform: ManifestPlatform;
  config: { app_config_revision: string; compose_revision: string };
  verification: {
    application: VerificationValue;
    platform: VerificationValue;
    tests: VerificationValue;
  };
  checks: Checks;
  artifacts: ManifestArtifacts;
  website: AppCurrent;
  verification_run_id: string;
  verified_at: string;
}

// View used by the versions page: the final-state Manifest plus the GitHub release
// notes associated by identical `app_version`. `release_notes` is NOT part of the
// Manifest any more — it lives in `data/{app}/releases.json` (§1 exception clause).
export interface AppVersionRecord {
  manifest: VerificationManifest;
  current: AppCurrent;
  release_notes: string;
}

// ---------------------------------------------------------------------------
// data/stats.json (§5.1) — build-time derived statistics, never in current.json
// ---------------------------------------------------------------------------

export interface SuccessRate {
  value: number;
  window_days: number;
  source: string;
  sampled_at: string;
}

export interface Stats {
  schema_version: string;
  generated_at: string;
  verified_app_count: number;
  verified_version_count: number;
  success_rate: SuccessRate | null;
  github_stars: Record<string, number | null>;
  degraded: string[];
}

// data/{app}/releases.json — upstream GitHub release notes cache.
export interface ReleaseNote {
  tag_name: string;
  name: string;
  published_at: string;
  html_url: string;
  body: string;
}

// ---------------------------------------------------------------------------
// Static editorial content (not verification data)
// ---------------------------------------------------------------------------

export interface CategoryMeta {
  slug: string;
  name: Localized;
  description: Localized;
}

export interface Solution {
  slug: string;
  title: Localized;
  description: Localized;
  icon: string; // emoji
  apps: string[]; // ordered app slugs
  architecture?: Localized;
}
