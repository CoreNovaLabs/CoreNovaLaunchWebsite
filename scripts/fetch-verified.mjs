#!/usr/bin/env node
// ---------------------------------------------------------------------------
// scripts/fetch-verified.mjs — build-time data ingest for Repo A (website).
//
// Contract references (single source of truth):
//   docs/contracts/deployment-contract.md   §2 current.json / §2.1 index.json /
//                                           §2.2 version filtering / §2.3 screenshot mirroring /
//                                           §5.1 data/stats.json
//   docs/contracts/verification-manifest.md §3 full Manifest shape
//   docs/repo-structure.md                  §4.2.1 dir vs r2 backends are mutually exclusive
//
// Fixed order (§ never "best of both"):
//   1. verified/index.json          → app list (R2 has no ListObjects; guessing is forbidden)
//   2. verified/{app}/current.json  → missing file for an indexed app = HARD FAILURE
//   3. verified/{app}/versions/*.json (key names come from current.json.app_version + index history)
//   4. upstream GitHub release notes → data/{app}/releases.json (see the exception note below)
//   5. data/stats.json              → derived statistics, NOT part of current.json
//   6. screenshots                  → mirrored to public/screenshots/<key path>; any miss = HARD FAILURE
//
// Backend selection: VERIFIED_BACKEND=dir (default) | r2. Exactly one is active; there is
// deliberately no fallback from r2 to dir (repo-structure.md §4.2.1).
//
// The website stays a pure static build: everything discovered here is inlined into
// src/data/generated.json, which src/data/verified.ts imports. No runtime fetch.
// ---------------------------------------------------------------------------

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WEBSITE_ROOT = path.resolve(HERE, "..");

// ------------------------------------------------------------------ config

// Proxy support without adding a dependency: Node >= 24 only lets global fetch honour
// `all_proxy` / `https_proxy` when NODE_USE_ENV_PROXY=1 was set at startup, so re-exec
// ourselves once with it if the caller had proxies configured.
const PROXY_VARS = ["all_proxy", "ALL_PROXY", "http_proxy", "HTTP_PROXY", "https_proxy", "HTTPS_PROXY"];
if (process.env.NODE_USE_ENV_PROXY === undefined && PROXY_VARS.some((k) => process.env[k])) {
  const { spawnSync } = await import("node:child_process");
  const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), ...process.argv.slice(2)], {
    stdio: "inherit",
    env: { ...process.env, NODE_USE_ENV_PROXY: "1" },
  });
  process.exit(r.status ?? 1);
}

// output locations inside Repo A (never inside Repo C)
const DATA_DIR = path.join(WEBSITE_ROOT, "data");
const PUBLIC_DIR = path.join(WEBSITE_ROOT, "public");
const GENERATED_FILE = path.join(WEBSITE_ROOT, "src", "data", "generated.json");

// `--allow-stale` is used by `predev` ONLY: a developer whose Repo C fixtures are not
// published yet still gets a working dev server on the last generated payload. The
// production paths (`prebuild`, `fetch-data`) never pass it and stay strict.
const ALLOW_STALE = process.argv.includes("--allow-stale");
const GENERATED_EXISTS = fs.existsSync(GENERATED_FILE);

// 公开只读端点（非密钥），作为 r2 后端的缺省值；显式 R2_PUBLIC_BASE_URL 优先。
const DEFAULT_R2_PUBLIC = "https://pub-7abe6acc470447c0a101cc20ce10ceee.r2.dev";

// 后端默认：任何 CI/云端构建（GitHub Actions 设 CI=true；Cloudflare 设 CF_PAGES*，
// 新构建系统还设 CI_NAME=cloudflare_pages）默认读 R2；本地开发默认读 Repo C 的 data/。
// 实测 Cloudflare 构建里 CF_PAGES 不一定是 "1"，故不能只认它。VERIFIED_BACKEND 显式值最优先；
// 仍不存在 r2→dir 的失败回退（§4.2.1）。
const IN_CI = Boolean(
  process.env.CI || process.env.CF_PAGES || process.env.CF_PAGES_URL ||
  process.env.CI_NAME === "cloudflare_pages"
);
const backend = (process.env.VERIFIED_BACKEND || (IN_CI ? "r2" : "dir")).trim().toLowerCase();
if (backend !== "dir" && backend !== "r2") {
  fail(`VERIFIED_BACKEND must be "dir" or "r2", got ${JSON.stringify(process.env.VERIFIED_BACKEND)}`);
}

// dir backend: Repo C publishes identical shapes into its workspace data/ directory.
const DIR_SOURCE = path.resolve(
  process.env.VERIFIED_DIR || path.join(WEBSITE_ROOT, "..", "CoreNovaLaunchVerify", "data")
);

// r2 backend: HTTP against the public endpoint (same key layout as the dir backend).
const R2_BASE = (process.env.R2_PUBLIC_BASE_URL || DEFAULT_R2_PUBLIC).replace(/\/+$/, "");
if (backend === "r2" && !R2_BASE) {
  fail('VERIFIED_BACKEND=r2 requires R2_PUBLIC_BASE_URL (e.g. https://pub-xxxx.r2.dev)');
}

const GITHUB_API = "https://api.github.com";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
const RELEASES_PER_APP = Number(process.env.RELEASES_PER_APP || 30);
const SUCCESS_WINDOW_DAYS = 30;

// ------------------------------------------------------------------ helpers

function fail(msg) {
  if (ALLOW_STALE && GENERATED_EXISTS) {
    console.warn(
      `\n[fetch-verified] (--allow-stale) keeping the previously generated payload because: ${msg}\n` +
        `[fetch-verified] src/data/generated.json may be STALE — run \`npm run fetch-data\` (or the strict build) before shipping.\n`
    );
    process.exit(0);
  }
  console.error(`\n[fetch-verified] FAILED: ${msg}\n`);
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function writeFileIfChanged(file, contents) {
  await fsp.mkdir(path.dirname(file), { recursive: true });
  const prev = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  if (prev === contents) return false;
  await fsp.writeFile(file, contents);
  return true;
}

// --- backend: exactly one implementation active per run -------------------

async function fetchKey(key) {
  if (backend === "dir") {
    const p = path.join(DIR_SOURCE, key);
    try {
      return await fsp.readFile(p);
    } catch (e) {
      if (e.code === "ENOENT") return null;
      fail(`read ${p}: ${e.message}`);
    }
  }
  // r2 backend: plain HTTPS GET against the public endpoint; 404 means "absent".
  const url = `${R2_BASE}/${key}`;
  const attempts = 3;
  for (let i = 1; i <= attempts; i++) {
    try {
      const res = await httpGet(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.body;
    } catch (e) {
      if (i === attempts) fail(`GET ${url} failed after ${attempts} attempts: ${e.message}`);
      await sleep(500 * i);
    }
  }
  return null;
}

// HTTP GET through Node's global fetch. `all_proxy` / `https_proxy` are honoured by
// re-executing this script once with NODE_USE_ENV_PROXY=1 (supported by Node >= 24):
// plain `fetch` ignores those variables otherwise, and we must not add a dependency.
async function httpGet(rawUrl, headers = {}) {
  const res = await fetch(rawUrl, { headers });
  return { status: res.status, ok: res.ok, body: Buffer.from(await res.arrayBuffer()) };
}

async function requestJson(url, headers = {}, attempts = 3) {
  for (let i = 1; i <= attempts; i++) {
    try {
      const res = await httpGet(url, headers);
      if (res.status === 404) return { notFound: true };
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { data: JSON.parse(res.body.toString("utf8")) };
    } catch (e) {
      if (i === attempts) throw e;
      await sleep(500 * i);
    }
  }
  return { notFound: true };
}

async function fetchJsonKey(key) {
  const buf = await fetchKey(key);
  if (buf === null) return null;
  try {
    return JSON.parse(buf.toString("utf8"));
  } catch (e) {
    fail(`${key} is not valid JSON: ${e.message}`);
  }
}

// --- contract validation --------------------------------------------------

const CHECK_NAMES = [
  "compose_started",
  "container_healthy",
  "health_check_passed",
  "tests_passed",
  "screenshots_generated",
  "screenshots_uploaded",
  "report_uploaded",
  "verification_manifest_uploaded",
  "required_platform_contract_valid",
];

// Key path is decided by Repo C; we only ever mirror the URL that the Manifest carries.
// Deriving `screenshots/{app}/{version}/{file}` ourselves would be a §6 anti-pattern.
function screenshotRelativePath(rawUrl) {
  if (typeof rawUrl !== "string" || rawUrl.length === 0) {
    fail("screenshot entry has no `url`; cannot mirror it");
  }
  let u;
  try {
    u = new URL(rawUrl, R2_BASE || "https://source.invalid");
  } catch {
    fail(`screenshot url is not parseable: ${rawUrl}`);
  }
  const key = decodeURIComponent(u.pathname.replace(/^\/+/, ""));
  if (!key) fail(`screenshot url has no key path: ${rawUrl}`);
  return key;
}

function validateCurrent(app, current) {
  const where = `verified/${app}/current.json`;
  if (!current || typeof current !== "object") fail(`${where} missing or not an object`);
  for (const f of ["app", "app_version", "verification_id", "health", "status", "verified_at"]) {
    if (current[f] == null || current[f] === "") fail(`${where} lacks required field "${f}"`);
  }
  if (current.app !== app) fail(`${where} has app="${current.app}" which mismatches the index key`);
  if (!current.deploy || typeof current.deploy !== "object") fail(`${where} lacks deploy{}`);
  if (!current.release || !current.release.type) fail(`${where} lacks release.type (§4: never inferred by the frontend)`);
  if (!Array.isArray(current.screenshots) || !Array.isArray(current.screenshots_order)) {
    fail(`${where} lacks screenshots[] / screenshots_order`);
  }
  for (const s of current.screenshots) {
    if (!s.scenario || !s.file || !s.url) fail(`${where}: screenshot needs scenario/file/url`);
    if (!/^[a-z0-9][a-z0-9-]*$/.test(s.scenario)) {
      fail(`${where}: screenshot scenario "${s.scenario}" is not an ASCII slug (verification-manifest §8)`);
    }
  }
  for (const scenario of current.screenshots_order) {
    if (!current.screenshots.some((s) => s.scenario === scenario)) {
      fail(`${where}: screenshots_order lists "${scenario}" but no such screenshot exists`);
    }
  }
}

function validateManifest(app, m) {
  const where = `verified/${app}/versions/${m?.app_version}.json`;
  if (!m || typeof m !== "object") fail(`${where} not an object`);
  if (!m.checks || typeof m.checks !== "object") fail(`${where} lacks checks{}`);
  for (const c of CHECK_NAMES) {
    if (typeof m.checks[c] !== "boolean") fail(`${where} checks.${c} must be boolean (got ${typeof m.checks[c]})`);
  }
  if (!m.website) fail(`${where} lacks the website projection section`);
  if (!m.verification) fail(`${where} lacks verification{}`);
}

function allNineTrue(m) {
  return CHECK_NAMES.every((c) => m.checks?.[c] === true);
}

// ------------------------------------------------------------------ 1. index

console.log(`[fetch-verified] backend=${backend} source=${backend === "dir" ? DIR_SOURCE : R2_BASE}`);

const index = await fetchJsonKey("verified/index.json");
if (!index) {
  fail(
    backend === "dir"
      ? `verified/index.json not found under ${DIR_SOURCE}. Run Repo C publish first, or point VERIFIED_DIR at the fixtures root.`
      : `verified/index.json not found at ${R2_BASE}. R2 has no ListObjects, so the app list cannot be guessed (deployment-contract §2.1).`
  );
}
if (!Array.isArray(index.apps) || index.apps.length === 0) {
  fail("verified/index.json has an empty apps[] — refusing to build a site with zero apps silently");
}
for (const entry of index.apps) {
  if (!entry.app) fail("verified/index.json contains an entry without `app`");
}

// ------------------------------------------------------------------ 2. currents

const currents = new Map(); // app -> current.json
for (const entry of index.apps) {
  const current = await fetchJsonKey(`verified/${entry.app}/current.json`);
  if (!current) {
    // §2.1: listed but absent => hard failure, otherwise apps silently disappear from the site.
    fail(`verified/index.json lists "${entry.app}" but verified/${entry.app}/current.json is missing — refusing to skip it`);
  }
  validateCurrent(entry.app, current);
  if (entry.verification_id && current.verification_id !== entry.verification_id) {
    fail(
      `verified/index.json says ${entry.app} is at verification_id "${entry.verification_id}" but current.json has "${current.verification_id}" — index and current are out of sync (§2.1)`
    );
  }
  if (entry.app_version && current.app_version !== entry.app_version) {
    fail(
      `verified/index.json says ${entry.app} is at "${entry.app_version}" but current.json has "${current.app_version}" (§2.1)`
    );
  }
  currents.set(entry.app, current);
}
console.log(`[fetch-verified] currents ok: ${[...currents.keys()].join(", ")}`);

// ------------------------------------------------------------------ 3. versions

// Version files are keyed by app_version, and R2/dir expose no listing. We therefore
// discover keys from data we are allowed to read: the current version plus every
// `release.previous_version` chain carried by already-fetched records. Unknown extra
// historical keys simply stay off the site until Repo C ships a version index.
const historyCache = new Map(); // `${app}/${app_version}` -> manifest | null
async function loadManifest(app, appVersion) {
  const cacheKey = `${app}/${appVersion}`;
  if (historyCache.has(cacheKey)) return historyCache.get(cacheKey);
  const m = await fetchJsonKey(`verified/${app}/versions/${appVersion}.json`);
  if (m) validateManifest(app, m);
  historyCache.set(cacheKey, m);
  return m;
}

const finalByApp = new Map(); // app -> manifest[] (nine checks all true, deduped, newest first)

async function collectVersions(app, current) {
  const seen = new Set();
  const out = [];
  const queue = [current.app_version];
  while (queue.length) {
    const v = queue.shift();
    if (!v || seen.has(v)) continue;
    seen.add(v);
    const m = await loadManifest(app, v);
    if (!m) continue; // history shorter than the previous_version pointer claims
    if (allNineTrue(m)) out.push(m);
    const prev = m.website?.release?.previous_version || m.release?.previous_version;
    if (prev) queue.push(prev);
  }
  out.sort((a, b) => String(b.verified_at).localeCompare(String(a.verified_at)));
  return out;
}

for (const [app, current] of currents) {
  const list = await collectVersions(app, current);
  if (!list.some((m) => m.app_version === current.app_version)) {
    // verification-manifest §6.3 P4 precedes the §P5 commit point, so this record must exist.
    fail(
      `verified/${app}/versions/${current.app_version}.json is missing or not a final-state record (nine checks all true) although current.json exists — refusing to publish an app with an empty version page`
    );
  }
  finalByApp.set(app, list);
}

// ------------------------------------------------------------------ write data/

const written = [];

async function dumpJson(file, value) {
  const changed = await writeFileIfChanged(file, JSON.stringify(value, null, 2) + "\n");
  if (changed) written.push(path.relative(WEBSITE_ROOT, file));
}

for (const [app, current] of currents) {
  await dumpJson(path.join(DATA_DIR, "verified", app, "current.json"), current);
  for (const m of finalByApp.get(app) ?? []) {
    await dumpJson(path.join(DATA_DIR, "verified", app, "versions", `${m.app_version}.json`), m);
  }
}

// ------------------------------------------------------------------ 4. release notes
//
// UPSTREAM METADATA SYNC EXCEPTION (deployment-contract §1):
// `current.json` deliberately carries no `source.repo`, and inventing one on the frontend
// would create a second source of truth. So the owner/repo used ONLY to fetch GitHub release
// notes is read from Repo C's apps/{app}.yaml. That file is upstream *catalogue* metadata
// (like documentation_url), never verification evidence: it is not copied into data/verified/**,
// not rendered as a verification fact, and a failure to read it degrades the page instead of
// failing the build.

const REPO_C_APPS_DIR = path.resolve(
  process.env.REPO_C_APPS_DIR || path.join(WEBSITE_ROOT, "..", "CoreNovaLaunchVerify", "apps")
);

function sourceRepoFromAppSpec(app) {
  const p = path.join(REPO_C_APPS_DIR, `${app}.yaml`);
  if (!fs.existsSync(p)) return null;
  // Minimal YAML scrape: the schema always writes `source: / repo: "owner/name"`.
  const text = fs.readFileSync(p, "utf8");
  const block = text.split(/\n(?=\S)/).find((b) => /^source:\s*$/m.test(b));
  const m = (block ?? "").match(/^\s*repo:\s*["']?([^"'\s#]+)/m);
  const repo = m?.[1];
  return repo && /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/.test(repo) ? repo : null;
}

async function githubJson(url) {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "corenovalaunch-website-build",
    ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
  };
  try {
    return await requestJson(url, headers);
  } catch (e) {
    const err = new Error(e.message);
    if (/HTTP 403|HTTP 429/.test(err.message)) err.rateLimited = true;
    throw err;
  }
}

const degraded = new Set();
const starsByApp = {};
const releasesByApp = {};

for (const [app, current] of currents) {
  const repo = sourceRepoFromAppSpec(app);
  if (!repo) {
    console.warn(`[fetch-verified] no source.repo for ${app} — skipping upstream metadata sync`);
    degraded.add(`releases:${app}`);
    degraded.add("github_stars");
    releasesByApp[app] = [];
    starsByApp[app] = null;
    await dumpJson(path.join(DATA_DIR, app, "releases.json"), []);
    continue;
  }
  // release notes
  let releases = [];
  try {
    const r = await githubJson(`${GITHUB_API}/repos/${repo}/releases?per_page=${RELEASES_PER_APP}`);
    if (r.notFound) {
      console.warn(`[fetch-verified] ${repo} releases: 404`);
      degraded.add(`releases:${app}`);
    } else {
      releases = (r.data ?? [])
        .filter((x) => x && x.tag_name)
        .map((x) => ({
          tag_name: x.tag_name,
          name: x.name ?? x.tag_name,
          published_at: x.published_at ?? "",
          html_url: x.html_url ?? "",
          body: x.body ?? "",
        }));
    }
  } catch (e) {
    console.warn(`[fetch-verified] ${repo} releases unavailable (${e.message}) — degrading to empty list`);
    degraded.add(`releases:${app}`);
  }
  releasesByApp[app] = releases;
  await dumpJson(path.join(DATA_DIR, app, "releases.json"), releases);

  // stars
  try {
    const s = await githubJson(`${GITHUB_API}/repos/${repo}`);
    if (s.notFound || typeof s.data?.stargazers_count !== "number") {
      starsByApp[app] = null;
      degraded.add("github_stars");
    } else {
      starsByApp[app] = s.data.stargazers_count;
    }
  } catch (e) {
    console.warn(`[fetch-verified] ${repo} stargazers unavailable (${e.message}) — recording null`);
    starsByApp[app] = null;
    degraded.add("github_stars");
  }
}

// ------------------------------------------------------------------ 5. stats.json (§5.1)

// success_rate = Repo C application-verify conclusions over the last window. Cross-repo
// reads need a token; without one (or on failure) we degrade rather than reuse stale numbers.
let successRate = null;
{
  const repoSlug = process.env.VERIFY_REPO_SLUG || "";
  if (!GITHUB_TOKEN || !repoSlug) {
    console.warn("[fetch-verified] success_rate skipped (needs GITHUB_TOKEN + VERIFY_REPO_SLUG)");
    degraded.add("success_rate");
  } else {
    try {
      const since = new Date(Date.now() - SUCCESS_WINDOW_DAYS * 86400000).toISOString();
      const url = `${GITHUB_API}/repos/${repoSlug}/actions/runs?workflow=application-verify.yml&per_page=100&created=>${since.slice(0, 10)}`;
      const r = await githubJson(url);
      const runs = (r.data?.workflow_runs ?? []).filter(
        (x) => x.run_started_at == null || x.run_started_at >= since
      );
      const completed = runs.filter((x) => x.status === "completed");
      if (completed.length === 0) {
        degraded.add("success_rate");
      } else {
        const okCount = completed.filter((x) => x.conclusion === "success").length;
        successRate = {
          value: Math.round((okCount / completed.length) * 1000) / 10,
          window_days: SUCCESS_WINDOW_DAYS,
          source: "actions_runs",
          sampled_at: new Date().toISOString().replace(/\.\d+Z$/, "Z"),
        };
      }
    } catch (e) {
      console.warn(`[fetch-verified] success_rate unavailable (${e.message})`);
      degraded.add("success_rate");
    }
  }
}

const verifiedAppCount = index.apps.filter((a) => a.status === "verified").length;
const verifiedVersionCount = [...finalByApp.values()].reduce((n, l) => n + l.length, 0);

const stats = {
  schema_version: "1.0",
  generated_at: new Date().toISOString().replace(/\.\d+Z$/, "Z"),
  verified_app_count: verifiedAppCount,
  verified_version_count: verifiedVersionCount,
  success_rate: successRate,
  github_stars: starsByApp,
  degraded: [...degraded].sort(),
};
await dumpJson(path.join(DATA_DIR, "stats.json"), stats);

// ------------------------------------------------------------------ 6. screenshot mirror (§2.3)

const mirroredShots = []; // relative site paths actually present on disk
for (const [app, current] of currents) {
  for (const s of current.screenshots) {
    const key = screenshotRelativePath(s.url);
    const dest = path.join(PUBLIC_DIR, key);
    const bytes = await fetchKey(key);
    if (bytes === null) {
      // §2.3: a mirrored miss must break the build, never ship a broken image.
      fail(
        `screenshot "${key}" (from ${s.url}) is not readable in the ${backend} backend — refusing to publish a page with a broken image`
      );
    }
    if (bytes.byteLength === 0) fail(`screenshot "${key}" is empty in the ${backend} backend`);
    await fsp.mkdir(path.dirname(dest), { recursive: true });
    await fsp.writeFile(dest, bytes);
    mirroredShots.push({ app, scenario: s.scenario, sitePath: "/" + key, bytes: bytes.byteLength });
  }
}
console.log(`[fetch-verified] mirrored ${mirroredShots.length} screenshot(s)`);

// ------------------------------------------------------------------ 7. inline for SSR + CSR

// One module consumed by both builds keeps the "pure static, no runtime fetch" architecture:
// the browser bundle carries the same payload the prerender saw.
const generated = {
  schema_version: "1.0",
  generated_at: stats.generated_at,
  backend,
  index,
  apps: [...currents.values()],
  versions: Object.fromEntries(
    [...finalByApp.entries()].map(([app, list]) => [app, list])
  ),
  releases: releasesByApp,
  stats,
  screenshots: mirroredShots.map((s) => s.sitePath),
};
await dumpJson(GENERATED_FILE, generated);

// A screenshot referenced by data but missing from public/ is fatal — double-check on disk
// so a stale public/ tree can never masquerade as fresh data.
for (const shot of mirroredShots) {
  if (!fs.existsSync(path.join(PUBLIC_DIR, shot.sitePath.slice(1)))) {
    fail(`mirror check failed: public${shot.sitePath} not on disk`);
  }
}

console.log(
  `[fetch-verified] ok: ${verifiedAppCount} verified app(s), ${verifiedVersionCount} verified version record(s), ` +
    `${stats.degraded.length ? "degraded=" + stats.degraded.join(",") : "no degradations"}`
);
if (written.length) console.log(`[fetch-verified] wrote ${written.length} file(s) under data/ + src/data/generated.json`);
