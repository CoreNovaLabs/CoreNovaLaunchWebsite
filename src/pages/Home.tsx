import { useNavigate } from "react-router-dom";
import { useI18n, pick } from "../i18n";
import { useApps, useStats } from "../data/useAppData";
import { AppCardVertical, IconAvatar, ReleaseBadge, useLocalePath, VerifiedBadge } from "../components/ui";
import { HeroArt } from "../components/HeroArt";
import { timeAgo } from "../lib/format";
import { useTitle } from "../lib/hooks";
import {
  ArrowRightIcon,
  GlobeIcon,
  LockIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  ZapIcon,
} from "../components/Icons";

const FEATURES = [
  { icon: ShieldCheckIcon, titleKey: "why_verified", descKey: "why_verified_d" },
  { icon: ZapIcon, titleKey: "why_click", descKey: "why_click_d" },
  { icon: RefreshCwIcon, titleKey: "why_updated", descKey: "why_updated_d" },
  { icon: GlobeIcon, titleKey: "why_multi", descKey: "why_multi_d" },
  { icon: LockIcon, titleKey: "why_secure", descKey: "why_secure_d" },
];

const FEATURE_EN: Record<string, { title: string; desc: string }> = {
  why_verified: {
    title: "Pre-Verified",
    desc: "Every version is automatically tested for compatibility and stability on AWS.",
  },
  why_click: {
    title: "One-Click Deploy",
    desc: "Deploy production-ready software with optimized CloudFormation templates.",
  },
  why_updated: {
    title: "Always Updated",
    desc: "Continuous monitoring of upstream releases and security updates.",
  },
  why_multi: {
    title: "Multi-Region",
    desc: "Support for all AWS regions with optimized configurations and pricing.",
  },
  why_secure: {
    title: "Secure & Reliable",
    desc: "Built with security best practices and enterprise-grade reliability.",
  },
};
const FEATURE_ZH: Record<string, { title: string; desc: string }> = {
  why_verified: { title: "预验证", desc: "每个版本都在 AWS 上自动完成兼容性与稳定性测试。" },
  why_click: { title: "一键部署", desc: "使用优化的 CloudFormation 模板部署生产级软件。" },
  why_updated: { title: "持续更新", desc: "持续跟踪上游发布与安全更新。" },
  why_multi: { title: "多区域", desc: "支持全部 AWS 区域，并提供优化的配置与定价。" },
  why_secure: { title: "安全可信", desc: "遵循安全最佳实践，具备企业级可靠性。" },
};

const REGIONS = [
  { code: "us-east-1", city: "N. Virginia" },
  { code: "us-west-2", city: "Oregon" },
  { code: "eu-west-1", city: "Ireland" },
  { code: "eu-central-1", city: "Frankfurt" },
  { code: "ap-southeast-1", city: "Singapore" },
  { code: "ap-northeast-1", city: "Tokyo" },
];

export function Home() {
  const { locale, t } = useI18n();
  const navigate = useNavigate();
  const l = useLocalePath();
  const apps = useApps();
  const stats = useStats();
  useTitle(
    locale === "zh"
      ? "在 AWS 上一键部署开源软件 | CoreNova Launch"
      : "Open Source Software One-Click Deploy to AWS | CoreNova Launch"
  );

  const featured = apps.filter((a) => a.featured).slice(0, 5);
  const latest = [...apps]
    .sort((a, b) => +new Date(b.verified_at) - +new Date(a.verified_at))
    .slice(0, 5);

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="container hero__grid">
          <div className="hero__left">
            <h1 className="hero__title">
              {locale === "zh" ? (
                <>
                  <span>
                    在 <span className="accent">AWS</span> 上
                  </span>
                  <span>一键部署开源软件</span>
                </>
              ) : (
                <>
                  <span>One-Click Deploy</span>
                  <span>Open Source Software</span>
                  <span>
                    on <span className="accent">AWS</span>
                  </span>
                </>
              )}
            </h1>
            <p className="hero__subtitle">{t("hero_subtitle")}</p>
            <div className="hero__actions">
              <button className="btn btn--primary" onClick={() => navigate(l("/apps"))}>
                {t("browse_software")}
              </button>
              <a
                className="btn btn--ghost"
                href="https://github.com/CoreNovaLabs/CoreNovaLaunch"
                target="_blank"
                rel="noreferrer"
              >
                {t("view_documentation")}
              </a>
            </div>
          </div>
          <div className="hero__right">
            <HeroArt />
          </div>
        </div>
      </section>

      {/* Stats — every number is computed at build time (deployment-contract §5); a
          degraded stat renders "—" instead of a stale or invented value. */}
      <section className="stats">
        <div className="container">
          <div className="stats__grid">
          <div className="stat">
            <div className="stat__num">{stats.verified_app_count}</div>
            <div className="stat__label">{locale === "zh" ? "开源软件" : "Open Source Software"}</div>
          </div>
          <div className="stat">
            <div className="stat__num">{stats.verified_version_count.toLocaleString()}</div>
            <div className="stat__label">{locale === "zh" ? "已验证版本" : "Verified Versions"}</div>
          </div>
          <div className="stat">
            <div className="stat__num">
              {stats.success_rate != null ? `${stats.success_rate.value.toFixed(1)}%` : "—"}
            </div>
            <div className="stat__label">
              {(locale === "zh" ? "验证成功率" : "Success Rate") +
                (stats.success_rate
                  ? locale === "zh"
                    ? `（近 ${stats.success_rate.window_days} 天）`
                    : ` (last ${stats.success_rate.window_days} days)`
                  : "")}
            </div>
          </div>
          <div className="stat">
            <div className="stat__num">24/7</div>
            <div className="stat__label">{t("automated_testing")}</div>
          </div>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="section">
        <div className="container">
          <div className="section__head">
            <h2 className="section__title">{t("featured_software")}</h2>
            <a
              className="section__link"
              href={l("/apps")}
              onClick={(e) => {
                e.preventDefault();
                navigate(l("/apps"));
              }}
            >
              {t("view_all")} <ArrowRightIcon size={14} />
            </a>
          </div>
          <div className="feature-grid">
            {featured.map((a) => (
              <AppCardVertical key={a.app} app={a} />
            ))}
          </div>
        </div>
      </section>

      {/* Why choose */}
      <section className="section">
        <div className="container">
          <div className="section__head">
            <h2 className="section__title">{t("why_choose")}</h2>
          </div>
          <div className="feature-grid">
            {FEATURES.map((f) => {
              const m = locale === "zh" ? FEATURE_ZH[f.titleKey] : FEATURE_EN[f.titleKey];
              const Icon = f.icon;
              return (
                <div className="feature" key={f.titleKey}>
                  <div className="feature__icon">
                    <Icon size={22} />
                  </div>
                  <div className="feature__title">{m.title}</div>
                  <p className="feature__desc">{m.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Latest updates */}
      <section className="section">
        <div className="container">
          <div className="section__head">
            <h2 className="section__title">{t("latest_updates")}</h2>
            <a
              className="section__link"
              href={l("/updates")}
              onClick={(e) => {
                e.preventDefault();
                navigate(l("/updates"));
              }}
            >
              {t("view_all_updates")} <ArrowRightIcon size={14} />
            </a>
          </div>
          <div className="updates-list">
            {latest.map((a) => (
              <div className="update-row update-row--inline" key={a.app}>
                <IconAvatar name={pick(locale, a.display_name)} app={a.app} icon={a.icon} size={36} />
                <div className="update-row__main">
                  <span className="update-row__name">{pick(locale, a.display_name)}</span>
                  <span className="update-row__ver">{a.app_version}</span>
                  <VerifiedBadge />
                </div>
                <div className="update-row__summary">{pick(locale, a.description)}</div>
                <ReleaseBadge type={a.release.type} />
                <div className="update-row__time">{timeAgo(a.verified_at, locale)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Region support */}
      <section className="section region-section">
        <div className="container">
          <div className="region-section__head">
            <h2 className="region-section__title">{t("aws_region_support")}</h2>
          </div>
          <div className="region-grid">
            {REGIONS.map((r) => (
              <div className="region-card" key={r.code}>
                <div className="region-card__code">{r.code}</div>
                <div className="region-card__city">{r.city}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
