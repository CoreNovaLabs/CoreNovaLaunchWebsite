// Deployment pause (hold) — "verified" and "deployable" are deliberately separate
// states (deployment-contract.md §2.5). The authoritative hold lives in the app
// registration (apps/*.yaml `deployment.hold`, app-schema.md 规则21) and is
// projected into current.json's `deploy.hold`; it is removed only after a
// production-contract re-verification, not after a version bump.
//
// The build-time fallback table was the §2.5 migration window for data published
// before `deploy.hold` existed. The window is closed (2026-09-20): every published
// current.json now carries the field, and L1.5 (deployment-contract.md §2.6) clears
// holds automatically from Repo C — a stale table entry would silently keep
// blocking an app whose pause has already been lifted.
import type { AppCurrent, Localized } from "../data/types";

const fallbackHolds: Record<string, Localized> = {};

export function deploymentHold(
  current: Pick<AppCurrent, "app" | "deploy">
): Localized | undefined {
  const reason = current.deploy?.hold?.reason;
  if (reason?.en && reason?.zh) return reason;
  return fallbackHolds[current.app];
}
