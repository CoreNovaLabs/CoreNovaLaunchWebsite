import { memo, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n, pick } from "../i18n";
import { accentFor } from "../data/generated";
import { useStars } from "../data/useAppData";
import { useTimeAgo } from "../lib/hooks";
import { CheckCircleIcon, GitCommitIcon, StarIcon } from "./Icons";
import type { AppCurrent, ReleaseType, VerificationValue } from "../data/types";

// Relative-time label safe for prerendered pages (see useTimeAgo).
export function TimeAgo({ iso }: { iso: string }) {
  const { locale } = useI18n();
  return <>{useTimeAgo(iso, locale)}</>;
}

// Locale-prefixed link. `to` is a path WITHOUT the locale prefix, e.g. "/apps".
export function useLocalePath() {
  const { locale } = useI18n();
  return (to: string) => `/${locale}${to}`;
}

export function AppLink({
  to,
  children,
  className,
}: {
  to: string;
  children: React.ReactNode;
  className?: string;
}) {
  const l = useLocalePath();
  return (
    <Link to={l(to)} className={className}>
      {children}
    </Link>
  );
}

// App icon: prefers the real SVG bundled at /icons/{app}.svg, falls back to a
// letter avatar if the image fails to load.
export function IconAvatar({
  name,
  app,
  icon,
  size = 48,
}: {
  name: string;
  app: string;
  icon?: string;
  size?: number;
}) {
  // Presentational only: deterministic colour derived from the app slug, so no per-app
  // table lives in the frontend. Contract data never depends on it.
  const accent = accentFor(app);
  const [failed, setFailed] = useState(false);
  const src = icon ?? `/icons/${app}.svg`;
  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        className="app-card__icon"
        style={{ width: size, height: size }}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div
      className="app-card__icon"
      style={{
        width: size,
        height: size,
        background: accent,
        fontSize: size * 0.42,
      }}
      aria-hidden
    >
      {name.trim().charAt(0).toUpperCase()}
    </div>
  );
}

export function VerifiedBadge() {
  const { t } = useI18n();
  return (
    <span className="badge badge--verified">
      <CheckCircleIcon size={12} />
      {t("verified")}
    </span>
  );
}

const RELEASE_CLASS: Record<ReleaseType, string> = {
  new_version: "badge--new",
  security_update: "badge--security",
  bug_fix: "badge--bug",
  initial: "badge--initial",
};

export function ReleaseBadge({
  type,
  evidence,
}: {
  type: ReleaseType;
  evidence?: string;
}) {
  const { t } = useI18n();
  const key =
    type === "new_version"
      ? "new_version"
      : type === "security_update"
      ? "security_update"
      : type === "bug_fix"
      ? "bug_fix"
      : "initial";
  return (
    <span className={`badge ${RELEASE_CLASS[type]}`} title={evidence || undefined}>
      {t(key)}
    </span>
  );
}

export function PlatformBadge({ platform }: { platform: VerificationValue }) {
  const { t } = useI18n();
  // Label is the Manifest value itself (§3.1: verification.* is rendered as-is).
  const label =
    platform === "passed" ? t("passed") : platform === "referenced" ? t("referenced") : platform;
  return (
    <span className="badge badge--platform" title={t("platform_tooltip")}>
      AWS · {label}
    </span>
  );
}

// Horizontal app card used on list, category, solutions.
export const AppCard = memo(function AppCard({ app }: { app: AppCurrent }) {
  const { locale, t } = useI18n();
  const l = useLocalePath();
  // stars come from data/stats.json (§5.1), never from current.json.
  const stars = useStars(app.app);
  const name = pick(locale, app.display_name);
  return (
    <Link to={l(`/apps/${app.app}/`)} className="app-card">
      <IconAvatar name={name} app={app.app} icon={app.icon} size={48} />
      <div className="app-card__body">
        <div className="app-card__headline">
          <h3 className="app-card__name">{name}</h3>
          <VerifiedBadge />
        </div>
        <p className="app-card__desc">{pick(locale, app.description)}</p>
        <div className="app-card__meta">
          <span className="app-card__version">{app.app_version}</span>
          <span className="app-card__stars">
            <StarIcon size={12} />
            {stars != null ? stars.toLocaleString() : "—"}
          </span>
        </div>
      </div>
      <div className="app-card__deploy">
        <span className="btn btn--primary btn--xs">{t("deploy")}</span>
      </div>
    </Link>
  );
});

// Vertical app card used on home featured grid.
export const AppCardVertical = memo(function AppCardVertical({ app }: { app: AppCurrent }) {
  const { locale, t } = useI18n();
  const l = useLocalePath();
  const name = pick(locale, app.display_name);
  return (
    <Link to={l(`/apps/${app.app}/`)} className="app-card app-card--vertical">
      <IconAvatar name={name} app={app.app} icon={app.icon} size={52} />
      <div className="app-card__body">
        <div className="app-card__headline">
          <h3 className="app-card__name">{name}</h3>
          <VerifiedBadge />
        </div>
        <p className="app-card__desc">{pick(locale, app.description)}</p>
        <div className="app-card__footer">
          <span className="app-card__version app-card__version--plain">{app.app_version}</span>
          <span className="btn btn--outline btn--xs app-card__deploy-btn">{t("deploy")}</span>
        </div>
      </div>
    </Link>
  );
});

export const AppCardCompact = memo(function AppCardCompact({ app }: { app: AppCurrent }) {
  const { locale, t } = useI18n();
  const l = useLocalePath();
  const name = pick(locale, app.display_name);
  return (
    <Link to={l(`/apps/${app.app}/`)} className="app-card">
      <IconAvatar name={name} app={app.app} icon={app.icon} size={44} />
      <div className="app-card__body">
        <div className="app-card__headline">
          <h3 className="app-card__name">{name}</h3>
          <span className="badge badge--verified">
            <GitCommitIcon size={10} /> {app.app_version}
          </span>
        </div>
        <p className="app-card__desc">{pick(locale, app.description)}</p>
      </div>
      <span className="link-blue">{t("view")}</span>
    </Link>
  );
});
