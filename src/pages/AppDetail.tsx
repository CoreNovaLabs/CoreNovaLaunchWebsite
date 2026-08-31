import { useEffect, useRef, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { useI18n, pick } from "../i18n";
import { useApp, useVersions, useStars, orderedScreenshots } from "../data/useAppData";
import { VerifiedBadge, ReleaseBadge, useLocalePath, PlatformBadge, IconAvatar } from "../components/ui";
import { formatDate, timeAgo } from "../lib/format";
import { ONE_CLICK_TEMPLATE_URL } from "../lib/deploy";
import { useTitle } from "../lib/hooks";
import { CATEGORIES } from "../data/categories";
import { APP_FAQ } from "../data/faq";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  DownloadIcon,
  ExternalLinkIcon,
} from "../components/Icons";
import type { AppVersionRecord } from "../data/types";

const TABS = [
  "overview",
  "versions",
  "deployment",
  "configuration",
  "updates",
  "faq",
] as const;

export function AppDetail() {
  const { app: slug } = useParams();
  const { locale, t } = useI18n();
  const l = useLocalePath();
  const app = useApp(slug);
  const versions = useVersions(slug);
  const [shot, setShot] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [deployMsg, setDeployMsg] = useState("");
  const [selectedInstanceType, setSelectedInstanceType] = useState("");
  const [selectedDiskGb, setSelectedDiskGb] = useState(30);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useTitle(
    app
      ? locale === "zh"
        ? `一键部署 ${pick(locale, app.display_name)} 到 AWS - ${
            CATEGORIES.find((c) => c.slug === app.category)?.name.zh ?? ""
          } | CoreNova Launch`
        : `Deploy ${pick(locale, app.display_name)} to AWS in One Click - ${
            CATEGORIES.find((c) => c.slug === app.category)?.name.en ?? ""
          } | CoreNova Launch`
      : "CoreNova Launch"
  );

  useEffect(() => {
    const onScroll = () => {
      const offset = 120;
      let current: string = TABS[0];
      for (const id of TABS) {
        const el = sectionRefs.current[id];
        if (el && el.getBoundingClientRect().top - offset <= 0) current = id;
      }
      setActiveTab(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [app]);

  if (!app) {
    return (
      <section className="section">
        <div className="container not-found">
          <h1>{t("not_found")}</h1>
        </div>
      </section>
    );
  }

  // 初始化部署选项：verified 的实例档和磁盘大小作为默认值
  useEffect(() => {
    if (app && !selectedInstanceType) {
      setSelectedInstanceType(app.deploy.instance_type);
    }
  }, [app, selectedInstanceType]);

  const name = pick(locale, app.display_name);
  const desc = pick(locale, app.description);
  const recent = versions.slice(0, 4);
  const shots = orderedScreenshots(app);
  const stars = useStars(app.app);

  // Deploy on AWS：深链 templateURL 直接指向 Repo C 发布的公开 S3 模板
  // （CFN 控制台原生支持该直链，一点即进创建向导），版本参数拼在深链上。
  // 镜像按最新已验证记录的 digest 钉住（tag@digest），部署内容与验证内容字节一致。
  const generateDeploy = () => {
    const region = app.deploy.regions[0] || "us-east-1";
    const verified =
      versions.find((v) => v.current.app_version === app.app_version) ?? versions[0];
    const digest = verified?.manifest.container.digest;
    const image = digest
      ? `${app.deploy.docker_image}@${digest}`
      : app.deploy.docker_image || app.app;
    const templateUrl = ONE_CLICK_TEMPLATE_URL;
    const instanceType = selectedInstanceType || app.deploy.instance_type;
    let url =
      `https://${region}.console.aws.amazon.com/cloudformation/home?region=${region}` +
      `#/stacks/create/review?stackName=corenova-${app.app}` +
      `&templateURL=${encodeURIComponent(templateUrl)}` +
      `&param_AppName=${encodeURIComponent(app.app)}` +
      `&param_ImageReference=${encodeURIComponent(image)}` +
      `&param_ContainerPort=${app.deploy.container_port}` +
      `&param_InstanceType=${encodeURIComponent(instanceType)}` +
      `&param_DiskGb=${selectedDiskGb}`;
    const extra = app.deploy.extra_environment ?? [];
    if (extra.length > 0) {
      url += `&param_ExtraEnvironment=${encodeURIComponent(extra.join("\n"))}`;
    }
    window.open(url, "_blank", "noopener");
    return url;
  };

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(false);
      else if (e.key === "ArrowRight" && shots.length > 1)
        setShot((i) => (i + 1) % shots.length);
      else if (e.key === "ArrowLeft" && shots.length > 1)
        setShot((i) => (i - 1 + shots.length) % shots.length);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [zoom, shots.length]);

  const scrollTo = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Every row below is a Manifest field verbatim (deployment-contract §3 / §3.2).
  const infoRows: { label: string; value: ReactNode; mono?: boolean; highlight?: boolean }[] = [
    { label: t("latest_version"), value: app.app_version },
    { label: t("verified"), value: timeAgo(app.verified_at, locale), highlight: true },
    { label: "Docker Image", value: app.deploy.docker_image, mono: true },
    { label: t("supported_architectures"), value: app.architecture },
    { label: t("aws_regions"), value: app.deploy.regions.join(", ") },
    { label: "Instance", value: app.deploy.instance_type },
    {
      label: t("stars"),
      value: stars != null ? stars.toLocaleString() : "—",
    },
  ];

  return (
    <section className="section section--compact-top">
      <div className="container">
        {/* breadcrumb */}
        <nav className="breadcrumb">
          <a href={l("/")} onClick={(e) => e.preventDefault()}>
            {t("home")}
          </a>
          <span className="sep">›</span>
          <a href={l("/apps")} onClick={(e) => e.preventDefault()}>
            {t("software")}
          </a>
          <span className="sep">›</span>
          <span className="cur">{name}</span>
        </nav>

        {/* header */}
        <div className="detail-header">
          <div className="detail-main">
            <div className="detail-title-wrap">
              <IconAvatar
                name={name}
                app={app.app}
                icon={app.icon}
                size={72}
              />
              <div>
                <h1 className="detail-title">
                  {name} <VerifiedBadge />
                </h1>
                <p className="detail-desc detail-desc--flush">
                  {desc}
                </p>
              </div>
            </div>
            <div className="prop-tags">
              {app.tags.map((tag) => (
                <span key={tag} className="prop-tag prop-tag--light">
                  {tag}
                </span>
              ))}
            </div>
            <div className="detail-actions">
              <button
                className="btn btn--primary"
                onClick={() => {
                  scrollTo("deployment");
                  setDeployMsg(t("deploy_hint"));
                }}
              >
                {t("deploy_now")} <ArrowRightIcon size={16} />
              </button>
              <a className="btn btn--ghost" href={app.deploy.documentation_url} target="_blank" rel="noreferrer">
                {t("view_documentation")} <ExternalLinkIcon size={16} />
              </a>
            </div>
            {deployMsg && (
              <p className="deploy-msg">{deployMsg}</p>
            )}
          </div>

          {/* screenshot: mirrored at build time, ordered by screenshots_order */}
          <div className="detail-side">
            <div className="device-mockup">
              <div className="device-mockup__screen">
                {shots[shot] ? (
                  <button
                    type="button"
                    className="shot-zoom"
                    onClick={() => setZoom(true)}
                    title={t("zoom_hint")}
                    aria-label={t("zoom_hint")}
                  >
                    <img
                      src={shots[shot].siteUrl}
                      alt={pick(locale, shots[shot].caption)}
                      loading="lazy"
                    />
                  </button>
                ) : (
                  <div className="mock-ui">
                    <div className="mock-ui__side">
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                    <div className="mock-ui__main">
                      <div className="mock-ui__row" />
                      <div className="mock-ui__row mock-ui__row--short" />
                      <div className="mock-ui__chat" />
                    </div>
                  </div>
                )}
              </div>
            </div>
            {shots.length > 1 && (
              <div className="shot-dots">
                {shots.map((s, i) => (
                  <button
                    key={s.scenario}
                    className={`shot-dot ${i === shot ? "is-active" : ""}`}
                    onClick={() => setShot(i)}
                    aria-label={pick(locale, s.caption)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* tabs */}
        <div className="tabs">
          {TABS.map((id) => (
            <a
              key={id}
              className={`tabs__item ${activeTab === id ? "is-active" : ""}`}
              href={`#${id}`}
              onClick={(e) => {
                e.preventDefault();
                scrollTo(id);
              }}
            >
              {t(id)}
            </a>
          ))}
        </div>

        <div className="detail-layout">
          {/* overview */}
          <div
            className="detail-section detail-section--plain"
            id="overview"
            ref={(el) => (sectionRefs.current["overview"] = el)}
          >
            <p>{desc}</p>
              {app.features.length > 0 && (
                <ul className="feature-list">
                  {app.features.map((f, i) => (
                    <li key={i}>
                      <CheckCircleIcon size={18} />
                      {pick(locale, f)}
                    </li>
                  ))}
                </ul>
              )}
          </div>

          {/* right sidebar */}
          <aside className="side-panel">
            <div className="info-card-list">
              {infoRows.map((row) => (
                <div className="info-card info-card--row" key={row.label}>
                  <span className="info-card__label">{row.label}</span>
                  <span
                    className={`info-card__value ${row.highlight ? "info-card__value--highlight" : ""} ${row.mono ? "mono" : ""}`}
                  >
                    {row.highlight && <CheckCircleIcon size={14} />}
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
            {/* Provenance links: values come verbatim from current.json. An empty field
                means Repo C never published it, so no anchor is rendered at all. */}
            <h3 className="side-panel__title" style={{ marginTop: "var(--space-6)" }}>
              {t("verification_provenance")}
            </h3>
            <div className="info-card-list">
              {app.deploy.launch_url && (
                <div className="info-card info-card--row">
                  <span className="info-card__label">{t("launch_url")}</span>
                  <a
                    className="link-blue"
                    href={app.deploy.launch_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {app.deploy.launch_url.replace(/^https?:\/\//, "")}{" "}
                    <ExternalLinkIcon size={12} />
                  </a>
                </div>
              )}
              <div className="info-card info-card--row">
                <span className="info-card__label">{t("verification_id")}</span>
                <span className="info-card__value mono">{app.verification_id}</span>
              </div>
              {app.report_url && (
                <div className="info-card info-card--row">
                  <span className="info-card__label">{t("report")}</span>
                  <a className="link-blue" href={app.report_url} target="_blank" rel="noreferrer">
                    {t("view_report")} <ExternalLinkIcon size={12} />
                  </a>
                </div>
              )}
              {app.workflow_run_url && (
                <div className="info-card info-card--row">
                  <span className="info-card__label">{t("actions_run")}</span>
                  <a
                    className="link-blue"
                    href={app.workflow_run_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    #{app.verification_run_id} <ExternalLinkIcon size={12} />
                  </a>
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* deployment */}
        <div
          className="detail-section"
          id="deployment"
          ref={(el) => (sectionRefs.current["deployment"] = el)}
        >
          <div className="quick-deploy">
                <h3 className="quick-deploy__title">
                  {locale === "zh" ? "快速部署" : "Quick Deploy"}
                </h3>
                <div className="quick-deploy__row">
                  <div className="quick-deploy__field">
                    <label>{t("aws_regions")}</label>
                    <select className="select">
                      {app.deploy.regions.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div className="quick-deploy__field">
                    <label>{locale === "zh" ? "规格" : "Instance"}</label>
                    <select
                      className="select"
                      value={selectedInstanceType}
                      onChange={(e) => setSelectedInstanceType(e.target.value)}
                    >
                      {["t3.micro", "t3.small", "t3.medium", "t3.large", "t3.xlarge"].map((type) => (
                        <option key={type} value={type}>
                          {type}{type === app.deploy.instance_type ? " ✓" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="quick-deploy__field">
                    <label>{locale === "zh" ? "磁盘 (GB)" : "Disk (GB)"}</label>
                    <select
                      className="select"
                      value={selectedDiskGb}
                      onChange={(e) => setSelectedDiskGb(Number(e.target.value))}
                    >
                      {[30, 50, 100, 200, 500].map((gb) => (
                        <option key={gb} value={gb}>{gb} GB</option>
                      ))}
                    </select>
                  </div>
                  <div className="quick-deploy__field quick-deploy__btn">
                    <button
                      className="btn btn--primary"
                      onClick={() => {
                        generateDeploy();
                        setDeployMsg(t("template_console_hint"));
                      }}
                    >
                      <DownloadIcon size={16} /> {t("generate_template")}
                    </button>
                    <a
                      className="btn btn--outline"
                      href={ONE_CLICK_TEMPLATE_URL}
                      download
                    >
                      <DownloadIcon size={16} /> {t("download_template")}
                    </a>
                  </div>
                </div>
          </div>
        </div>

        {/* versions */}
        <div
          className="detail-section"
          id="versions"
          ref={(el) => (sectionRefs.current["versions"] = el)}
        >
          <div className="section__head">
            <h2 className="heading--flush">{t("versions")}</h2>
            <a className="section__link" href={l(`/apps/${app.app}/versions/`)} onClick={(e) => e.preventDefault()}>
              {t("view_full_history")} <ArrowRightIcon size={14} />
            </a>
          </div>
          <VersionTable versions={recent} locale={locale} />
        </div>

        {/* configuration */}
            <div
              className="detail-section"
              id="configuration"
              ref={(el) => (sectionRefs.current["configuration"] = el)}
            >
              <h2>{t("configuration")}</h2>
              <div className="info-cards">
                <div className="info-card">
                  <p className="info-card__label">Container Port</p>
                  <p className="info-card__value">{app.deploy.container_port}</p>
                </div>
                <div className="info-card">
                  <p className="info-card__label">{t("aws_regions")}</p>
                  <p className="info-card__value">{app.deploy.regions.join(", ")}</p>
                </div>
                <div className="info-card">
                  <p className="info-card__label">{t("supported_architectures")}</p>
                  <p className="info-card__value">{app.architecture}</p>
                </div>
                <div className="info-card">
                  <p className="info-card__label">AMI</p>
                  <p className="info-card__value mono">{app.ami_id}</p>
                </div>
              </div>
            </div>

            {/* updates */}
            <div
              className="detail-section"
              id="updates"
              ref={(el) => (sectionRefs.current["updates"] = el)}
            >
              <h2>{t("updates_tab")}</h2>
              <VersionTable versions={recent} locale={locale} compact />
            </div>

            {/* faq */}
            <div
              className="detail-section"
              id="faq"
              ref={(el) => (sectionRefs.current["faq"] = el)}
            >
              <h2>{t("faq")}</h2>
              <ul>
                {APP_FAQ.map((item) => (
                  <li key={item.en}>{pick(locale, item)}</li>
                ))}
              </ul>
            </div>
      </div>

      {zoom && shots[shot] && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={pick(locale, shots[shot].caption)}
          onClick={() => setZoom(false)}
        >
          <button
            type="button"
            className="lightbox__close"
            onClick={() => setZoom(false)}
            aria-label={t("close")}
          >
            ×
          </button>
          {shots.length > 1 && (
            <button
              type="button"
              className="lightbox__nav lightbox__nav--prev"
              aria-label={t("prev_screenshot")}
              onClick={(e) => {
                e.stopPropagation();
                setShot((i) => (i - 1 + shots.length) % shots.length);
              }}
            >
              ‹
            </button>
          )}
          <figure className="lightbox__figure" onClick={(e) => e.stopPropagation()}>
            <img
              src={shots[shot].siteUrl}
              alt={pick(locale, shots[shot].caption)}
              onClick={() =>
                shots.length > 1 && setShot((i) => (i + 1) % shots.length)
              }
            />
            <figcaption>
              {pick(locale, shots[shot].caption)}
              {shots.length > 1 && (
                <span className="lightbox__count">
                  {shot + 1} / {shots.length}
                </span>
              )}
            </figcaption>
          </figure>
          {shots.length > 1 && (
            <button
              type="button"
              className="lightbox__nav lightbox__nav--next"
              aria-label={t("next_screenshot")}
              onClick={(e) => {
                e.stopPropagation();
                setShot((i) => (i + 1) % shots.length);
              }}
            >
              ›
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function VersionTable({
  versions,
  locale,
  compact,
}: {
  versions: AppVersionRecord[];
  locale: "en" | "zh";
  compact?: boolean;
}) {
  const t = useI18n().t;
  if (compact) {
    return (
      <div className="updates-list">
        {versions.map(({ manifest, current }) => (
          <div className="update-row" key={manifest.app_version}>
            <div className="update-row__body">
              <div className="update-row__line1">
                <span className="update-row__ver">{manifest.app_version}</span>
                <span className="mono">{formatDate(manifest.verified_at, locale)}</span>
                <span className="badge badge--verified">
                  <CheckCircleIcon size={12} /> {t("verified")}
                </span>
                <ReleaseBadge type={current.release.type} evidence={current.release.type_evidence} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <table className="vtable">
      <thead>
        <tr>
          <th>{t("versions")}</th>
          <th>{locale === "zh" ? "发布日期" : "Release Date"}</th>
          <th>{t("verified")}</th>
          <th>{locale === "zh" ? "状态" : "Status"}</th>
          <th>{locale === "zh" ? "AWS 测试" : "AWS Tested"}</th>
        </tr>
      </thead>
      <tbody>
        {versions.map(({ manifest, current }) => (
          <tr key={manifest.app_version}>
            <td className="mono">{manifest.app_version}</td>
            <td>{formatDate(manifest.verified_at, locale)}</td>
            <td>
              <span className="badge badge--verified">
                <CheckCircleIcon size={12} /> {t("verified")}
              </span>
            </td>
            <td>
              <ReleaseBadge type={current.release.type} evidence={current.release.type_evidence} />
            </td>
            <td>
              <PlatformBadge platform={manifest.verification.platform} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
