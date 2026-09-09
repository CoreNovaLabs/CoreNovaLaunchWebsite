import { useNavigate } from "react-router-dom";
import { useI18n } from "../i18n";
import { useApps, useStats } from "../data/useAppData";
import { AppCardVertical, useLocalePath } from "../components/ui";
import { HeroArt } from "../components/HeroArt";
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
    desc: "Every listed version passes repeatable application checks and references a valid AWS platform verification record.",
  },
  why_click: {
    title: "Verified Deploy",
    desc: "CloudFormation opens with the exact image, AMI, storage path and health check from verification.",
  },
  why_updated: {
    title: "Evidence Before Listing",
    desc: "Upstream releases appear here only after the current verification gates pass.",
  },
  why_multi: {
    title: "Clear Region Scope",
    desc: "us-east-1 is the verified region today; additional regions will be listed only after verification.",
  },
  why_secure: {
    title: "Your AWS Account",
    desc: "Resources stay in your account, SSH ingress stays closed, and remote operations use AWS Systems Manager.",
  },
};
const FEATURE_ZH: Record<string, { title: string; desc: string }> = {
  why_verified: { title: "有证据的验证", desc: "每个上架版本都通过可重复的应用检查，并引用有效的 AWS 平台验证记录。" },
  why_click: { title: "按验证结果部署", desc: "CloudFormation 会预填验证时使用的镜像、AMI、数据目录和健康检查。" },
  why_updated: { title: "先验证再上架", desc: "跟踪上游版本，但只有通过当前验证门禁后才会展示。" },
  why_multi: { title: "区域范围透明", desc: "当前仅验证 us-east-1；新增区域会在完成验证后再展示。" },
  why_secure: { title: "资源归你", desc: "资源保留在你的 AWS 账号中，不开放 SSH 入站，远程运维使用 AWS Systems Manager。" },
};

const REGION_NAMES: Record<string, string> = { "us-east-1": "N. Virginia" };

export function Home() {
  const { locale, t } = useI18n();
  const navigate = useNavigate();
  const l = useLocalePath();
  const apps = useApps();
  const stats = useStats();
  useTitle(
    locale === "zh"
      ? "把已验证开源软件部署到你的 AWS | CoreNova Launch"
      : "Deploy Verified Open Source Apps to Your AWS | CoreNova Launch"
  );

  const featured = apps.filter((a) => a.featured).slice(0, 5);
  const verifiedRegions = [...new Set(apps.flatMap((a) => a.deploy.regions))].sort();

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
                    把已验证开源软件
                  </span>
                  <span>部署到你的 <span className="accent">AWS</span></span>
                </>
              ) : (
                <>
                  <span>Deploy Verified</span>
                  <span>Open Source Apps</span>
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
              <button className="btn btn--ghost" onClick={() => navigate(l("/docs"))}>
                {t("view_documentation")}
              </button>
            </div>
          </div>
          <div className="hero__right">
            <HeroArt />
          </div>
        </div>
      </section>

      {/* Stats — every number is computed from the build-time verified dataset. */}
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
            <div className="stat__num">{verifiedRegions.length}</div>
            <div className="stat__label">{locale === "zh" ? "已验证 AWS 区域" : "Verified AWS Region"}</div>
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

      {/* Region support */}
      <section className="section region-section">
        <div className="container">
          <div className="region-section__head">
            <h2 className="region-section__title">{t("aws_region_support")}</h2>
          </div>
          <div className="region-grid">
            {verifiedRegions.map((code) => (
              <div className="region-card" key={code}>
                <div className="region-card__code">{code}</div>
                <div className="region-card__city">{REGION_NAMES[code] ?? code}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
