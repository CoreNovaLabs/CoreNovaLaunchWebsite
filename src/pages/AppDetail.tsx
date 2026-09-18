import { useEffect, useRef, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { DeployGuide } from "../components/DeployGuide";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CopyIcon,
  CpuIcon,
  ExternalLinkIcon,
  GitCommitIcon,
  HardDriveIcon,
  PackageIcon,
  RocketIcon,
  ShieldCheckIcon,
  StarIcon,
} from "../components/Icons";
import {
  IconAvatar,
  PlatformBadge,
  ReleaseBadge,
  TimeAgo,
  useLocalePath,
} from "../components/ui";
import { CATEGORIES } from "../data/categories";
import { appFaq } from "../data/faq";
import type { AppVersionRecord } from "../data/types";
import { orderedScreenshots, useApp, useStars, useVersions } from "../data/useAppData";
import { pick, useI18n } from "../i18n";
import {
  buildDeployUrl,
  selectableDataVolumes,
  selectableInstanceTypes,
  verifiedDeployOptions,
} from "../lib/deploy";
import { deploymentHold } from "../lib/deploymentSafety";
import { formatDate } from "../lib/format";
import { useTitle } from "../lib/hooks";

const TABS = ["deployment", "versions", "configuration", "faq"] as const;

export function AppDetail() {
  const { app: slug } = useParams();
  const { locale, t } = useI18n();
  const l = useLocalePath();
  const app = useApp(slug);
  const versions = useVersions(slug);
  const stars = useStars(app?.app);

  const [shot, setShot] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(TABS[0]);
  const [deployMsg, setDeployMsg] = useState("");
  const [selectedVersion, setSelectedVersion] = useState(app?.app_version ?? "");
  const [selectedRegion, setSelectedRegion] = useState(app?.deploy.regions[0] ?? app?.region ?? "");
  const [selectedInstance, setSelectedInstance] = useState(app?.deploy.instance_type ?? "");
  const [selectedDataVolume, setSelectedDataVolume] = useState(app?.deploy.data_volume_gb ?? 0);

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const navigatingRef = useRef(false);
  const zoomTriggerRef = useRef<HTMLButtonElement | null>(null);
  const lightboxCloseRef = useRef<HTMLButtonElement | null>(null);

  useTitle(
    app
      ? locale === "zh"
        ? `一键部署 ${pick(locale, app.display_name)} 到 AWS - ${
            CATEGORIES.find((category) => category.slug === app.category)?.name.zh ?? ""
          } | CoreNova Launch`
        : `Deploy ${pick(locale, app.display_name)} to AWS in One Click - ${
            CATEGORIES.find((category) => category.slug === app.category)?.name.en ?? ""
          } | CoreNova Launch`
      : "CoreNova Launch"
  );

  useEffect(() => {
    const onScroll = () => {
      if (navigatingRef.current) return;
      const offset = 124;
      let current: string = TABS[0];
      for (const id of TABS) {
        const element = sectionRefs.current[id];
        if (element && element.getBoundingClientRect().top - offset <= 0) current = id;
      }
      setActiveTab(current);
    };
    const onScrollEnd = () => { navigatingRef.current = false; };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scrollend", onScrollEnd);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scrollend", onScrollEnd);
    };
  }, [app]);

  useEffect(() => {
    if (!app) return;
    setSelectedVersion(app.app_version);
    setSelectedRegion(app.deploy.regions[0] ?? app.region);
    setSelectedInstance(app.deploy.instance_type);
    setSelectedDataVolume(app.deploy.data_volume_gb ?? 0);
    setDeployMsg("");
  }, [app?.app, app?.app_version]);

  const shots = app ? orderedScreenshots(app) : [];

  useEffect(() => {
    if (!zoom) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setZoom(false);
      else if (event.key === "ArrowRight" && shots.length > 1)
        setShot((index) => (index + 1) % shots.length);
      else if (event.key === "ArrowLeft" && shots.length > 1)
        setShot((index) => (index - 1 + shots.length) % shots.length);
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    lightboxCloseRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      zoomTriggerRef.current?.focus();
    };
  }, [zoom, shots.length]);

  if (!app) {
    return (
      <section className="section">
        <div className="container not-found">
          <h1>{t("not_found")}</h1>
        </div>
      </section>
    );
  }

  const name = pick(locale, app.display_name);
  const description = pick(locale, app.description);
  const recent = versions.slice(0, 4);
  const latestRecord =
    versions.find((record) => record.current.app_version === app.app_version) ?? versions[0];
  const deployableVersions = versions.filter((record) =>
    Boolean(verifiedDeployOptions(record.current, record.manifest.container.digest))
  );
  const selectedRecord =
    deployableVersions.find((record) => record.current.app_version === selectedVersion) ??
    latestRecord;
  const selectedCurrent = selectedRecord?.current ?? app;
  const verifiedDefault = verifiedDeployOptions(
    selectedCurrent,
    selectedRecord?.manifest.container.digest
  );
  const instanceOptions = verifiedDefault
    ? selectableInstanceTypes(verifiedDefault.instanceType)
    : [selectedCurrent.deploy.instance_type];
  const dataVolumeOptions = verifiedDefault
    ? selectableDataVolumes(verifiedDefault.dataVolumeGb)
    : selectedCurrent.deploy.data_volume_gb
      ? [selectedCurrent.deploy.data_volume_gb]
      : [];
  const isVerifiedDefault = Boolean(
    verifiedDefault &&
      selectedRegion === verifiedDefault.region &&
      selectedInstance === verifiedDefault.instanceType &&
      selectedDataVolume === verifiedDefault.dataVolumeGb
  );
  const deployOptions = verifiedDefault
    ? {
        ...verifiedDefault,
        region: selectedRegion,
        instanceType: selectedInstance,
        dataVolumeGb: selectedDataVolume,
      }
    : null;
  const cost = isVerifiedDefault ? selectedCurrent.deploy.cost_estimate : undefined;
  const sourceRepo = latestRecord?.manifest.release.source_repo;
  const sourceRepoUrl = sourceRepo ? `https://github.com/${sourceRepo}` : "";
  const faqItems = appFaq(selectedCurrent);

  const scrollTo = (id: string) => {
    const element = sectionRefs.current[id];
    if (!element) return;
    const offset = parseFloat(getComputedStyle(element).scrollMarginTop);
    const top = Math.max(0, Math.min(
      window.scrollY + element.getBoundingClientRect().top - offset,
      document.documentElement.scrollHeight - window.innerHeight
    ));
    // Short pages cannot align every section with the sticky navigation.
    navigatingRef.current = Math.abs(window.scrollY - top) > 1;
    setActiveTab(id);
    window.scrollTo({ top, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };

  const selectVersion = (version: string) => {
    const record = deployableVersions.find((item) => item.current.app_version === version);
    const next = record
      ? verifiedDeployOptions(record.current, record.manifest.container.digest)
      : null;
    setSelectedVersion(version);
    setDeployMsg("");
    if (next) {
      setSelectedRegion(next.region);
      setSelectedInstance(next.instanceType);
      setSelectedDataVolume(next.dataVolumeGb);
    }
  };

  const generateDeploy = () => {
    if (!deployOptions) {
      setDeployMsg(t("deploy_contract_missing"));
      return;
    }
    window.open(buildDeployUrl(deployOptions), "_blank", "noopener");
    setDeployMsg(t("template_console_hint"));
  };

  return (
    <section className="section section--compact-top app-detail-page">
      <div className="container">
        <nav className="breadcrumb" aria-label={t("breadcrumb_label")}>
          <a href={l("/")}>{t("home")}</a>
          <span className="sep">›</span>
          <a href={l("/apps")}>{t("software")}</a>
          <span className="sep">›</span>
          <span className="cur">{name}</span>
        </nav>

        <header className="detail-header">
          <div className="detail-main">
            <div className="detail-title-wrap">
              <IconAvatar name={name} app={app.app} icon={app.icon} size={72} />
              <div>
                <h1 className="detail-title">{name}</h1>
                <p className="detail-desc detail-desc--flush">{description}</p>
              </div>
            </div>

            <div className="prop-tags">
              {app.tags.map((tag) => (
                <span key={tag} className="prop-tag prop-tag--light">{tag}</span>
              ))}
            </div>

            <div className="detail-project-links">
              <span><StarIcon size={15} /> {stars != null ? stars.toLocaleString() : "—"} GitHub Stars</span>
              <a href={app.deploy.documentation_url} target="_blank" rel="noreferrer">
                {t("official_documentation")} <ExternalLinkIcon size={14} />
              </a>
              {sourceRepoUrl && (
                <a href={sourceRepoUrl} target="_blank" rel="noreferrer">
                  <GitCommitIcon size={15} /> {t("source_repository")}
                </a>
              )}
            </div>

            <div className="detail-actions">
              <button className="btn btn--primary" onClick={() => scrollTo("deployment")}>
                <RocketIcon size={16} /> {deployOptions ? t("configure_deployment") : t("view_deployment")}
                <ArrowRightIcon size={16} />
              </button>
            </div>

            <p className="detail-deploy-meta">
              {cost && (
                <>
                  {t("est_cost_value", { usd: cost.monthly_usd })}
                  <span aria-hidden>·</span>
                </>
              )}
              {t("about_ten_minutes")} <span aria-hidden>·</span> {t("resources_in_your_account")}
            </p>
          </div>

          <div className="detail-side">
            <div className="device-mockup">
              <div className="device-mockup__screen">
                {shots[shot] ? (
                  <button
                    ref={zoomTriggerRef}
                    type="button"
                    className="shot-zoom"
                    onClick={() => setZoom(true)}
                    title={t("zoom_hint")}
                    aria-label={t("zoom_hint")}
                  >
                    <img
                      src={shots[shot].siteUrl}
                      alt={pick(locale, shots[shot].caption)}
                      loading={shot === 0 ? "eager" : "lazy"}
                    />
                  </button>
                ) : (
                  <div className="mock-ui">
                    <div className="mock-ui__side"><span /><span /><span /><span /></div>
                    <div className="mock-ui__main">
                      <div className="mock-ui__row" />
                      <div className="mock-ui__row mock-ui__row--short" />
                      <div className="mock-ui__chat" />
                    </div>
                  </div>
                )}
              </div>
            </div>
            {shots.length > 0 && (
              <p className="detail-screenshot-caption">
                {t("verification_screenshot")} <span>· {t("zoom_hint")}</span>
              </p>
            )}
            {shots.length > 1 && (
              <div className="shot-dots">
                {shots.map((screenshot, index) => (
                  <button
                    key={screenshot.scenario}
                    className={`shot-dot ${index === shot ? "is-active" : ""}`}
                    onClick={() => setShot(index)}
                    aria-label={pick(locale, screenshot.caption)}
                  />
                ))}
              </div>
            )}
          </div>
        </header>

        <div className="detail-verification">
          <ShieldCheckIcon size={20} />
          <div className="detail-verification__body">
            <span>
              <strong>{app.app_version}</strong> · {t("verification_completed")} <TimeAgo iso={app.verified_at} />
            </span>
            {latestRecord?.manifest.verification.platform === "referenced" && (
              <p>{t("verification_scope_referenced")}</p>
            )}
          </div>
          {app.report_url && (
            <a href={app.report_url} target="_blank" rel="noreferrer">
              {t("view_report")} <ArrowRightIcon size={14} />
            </a>
          )}
        </div>

        <nav className="tabs" aria-label={t("detail_sections")}>
          {TABS.map((id) => (
            <a
              key={id}
              className={`tabs__item ${activeTab === id ? "is-active" : ""}`}
              aria-current={activeTab === id ? "location" : undefined}
              href={`#${id}`}
              onClick={(event) => {
                event.preventDefault();
                scrollTo(id);
              }}
            >
              {t(id === "configuration" ? "technical_information" : id)}
            </a>
          ))}
        </nav>

        <div className="detail-flow">
          <section
            className="detail-section detail-section--deployment"
            id="deployment"
            ref={(element) => { sectionRefs.current.deployment = element; }}
            aria-label={t("quick_deploy")}
          >
            <div className="section__head detail-section__heading">
              <h2 className="heading--flush">{t("quick_deploy")}</h2>
              {deployOptions && <p>{t("choose_deployment_configuration")}</p>}
            </div>

            <div className="deploy-configurator deploy-configurator--inline">
              <div className="deploy-configurator__head">
                <div className="deploy-configurator__title">
                  <h3>{t(
                                    !deployOptions
                                      ? deploymentHold(selectedCurrent) ? "deployment_paused" : "needs_reverification"
                                      : isVerifiedDefault ? "recommended_configuration" : "custom_configuration"
                                  )}</h3>
                </div>
                <div className="deploy-configurator__cost">
                  <span>{deployOptions ? t("estimated_cost") : t("latest_version")}</span>
                  <strong>{deployOptions ? (cost ? t("est_cost_value", { usd: cost.monthly_usd }) : t("cost_shown_in_aws")) : selectedCurrent.app_version}</strong>
                </div>
              </div>

              {deployOptions && (
                <>
                  <dl className="deployment-summary">
                    <div><dt>{t("deployment_version")}</dt><dd>{selectedCurrent.app_version}</dd></div>
                    <div><dt>{t("aws_regions")}</dt><dd>{selectedRegion}</dd></div>
                    <div><dt>{t("instance_label")}</dt><dd>{selectedInstance}</dd></div>
                    <div><dt>{t("data_volume_label")}</dt><dd>{selectedDataVolume} GB</dd></div>
                  </dl>

                  <details className="deployment-customize">
                    <summary>
                      <span>{t("customize_configuration")}</span>
                      <ChevronRightIcon size={16} />
                    </summary>
                    <p className="deployment-customize__hint">{t("customize_configuration_hint")}</p>
                    <div className="deploy-configurator__fields">
                      <label className="config-select">
                        <span>{t("deployment_version")}</span>
                        <span className="config-select__control">
                          <select
                            value={selectedCurrent.app_version}
                            onChange={(event) => selectVersion(event.target.value)}
                            disabled={deployableVersions.length <= 1}
                          >
                            {deployableVersions.map((record) => (
                              <option key={record.current.app_version} value={record.current.app_version}>
                                {record.current.app_version}
                              </option>
                            ))}
                          </select>
                          <ChevronDownIcon size={15} />
                        </span>
                      </label>

                      <label className="config-select">
                        <span>{t("aws_regions")}</span>
                        <span className="config-select__control">
                          <select value={selectedRegion} onChange={(event) => { setSelectedRegion(event.target.value); setDeployMsg(""); }} disabled={selectedCurrent.deploy.regions.length <= 1}>
                            {selectedCurrent.deploy.regions.map((region) => (
                              <option key={region} value={region}>{region}</option>
                            ))}
                          </select>
                          <ChevronDownIcon size={15} />
                        </span>
                      </label>

                      <label className="config-select">
                        <span>{t("instance_label")}</span>
                        <span className="config-select__control">
                          <select value={selectedInstance} onChange={(event) => { setSelectedInstance(event.target.value); setDeployMsg(""); }} disabled={instanceOptions.length <= 1}>
                            {instanceOptions.map((instance) => (
                              <option key={instance} value={instance}>
                                {instance}{instance === verifiedDefault?.instanceType ? ` · ${t("recommended")}` : ""}
                              </option>
                            ))}
                          </select>
                          <ChevronDownIcon size={15} />
                        </span>
                      </label>

                      <label className="config-select">
                        <span>{t("data_volume_label")}</span>
                        <span className="config-select__control">
                          <select value={selectedDataVolume} onChange={(event) => { setSelectedDataVolume(Number(event.target.value)); setDeployMsg(""); }} disabled={dataVolumeOptions.length <= 1}>
                            {dataVolumeOptions.map((size) => (
                              <option key={size} value={size}>{size} GB</option>
                            ))}
                          </select>
                          <ChevronDownIcon size={15} />
                        </span>
                      </label>
                    </div>
                    {!isVerifiedDefault && (
                      <button className="btn btn--ghost btn--sm deployment-reset" onClick={() => selectVersion(selectedCurrent.app_version)}>
                        {t("restore_recommended_configuration")}
                      </button>
                    )}
                  </details>
                </>
              )}

              <div className="deploy-configurator__footer">
                <div className={`deploy-configurator__status ${!deployOptions ? "is-unavailable" : isVerifiedDefault ? "is-verified" : "is-custom"}`}>
                  <span>
                    {isVerifiedDefault ? <CheckCircleIcon size={17} /> : <ShieldCheckIcon size={17} />}
                    {!deployOptions
                      ? t("deploy_contract_missing")
                      : isVerifiedDefault
                        ? t("verified_configuration_status")
                        : t("custom_configuration_status")}
                  </span>
                  <a href="#configuration" onClick={(event) => { event.preventDefault(); scrollTo("configuration"); }}>
                    {t("technical_details")} <ArrowRightIcon size={13} />
                  </a>
                </div>

                <div className="deploy-configurator__action">
                  <button className="btn btn--primary" disabled={!deployOptions} onClick={generateDeploy}>
                    <RocketIcon size={16} /> {t("deploy_to_aws")} <ArrowRightIcon size={15} />
                  </button>
                  <small>{t("opens_cloudformation_in_your_account")}</small>
                </div>
              </div>

              {deployMsg && <p className="deploy-configurator__message">{deployMsg}</p>}

              {deployOptions && (
                <details className="deployment-disclosure">
                  <summary>
                    <span><PackageIcon size={17} /> {t("deployment_and_post_deploy")}</span>
                    <ChevronRightIcon size={17} />
                  </summary>
                  <DeployGuide app={selectedCurrent} />
                </details>
              )}
            </div>
          </section>

          <section
            className="detail-section"
            id="versions"
            ref={(element) => { sectionRefs.current.versions = element; }}
          >
            <div className="section__head">
              <h2 className="heading--flush">{t("versions")}</h2>
              <a className="section__link" href={l(`/apps/${app.app}/versions/`)}>
                {t("view_full_history")} <ArrowRightIcon size={14} />
              </a>
            </div>
            <VersionTable versions={recent} locale={locale} />
          </section>

          <section
            className="detail-section"
            id="configuration"
            ref={(element) => { sectionRefs.current.configuration = element; }}
          >
            <h2>{t("technical_information")}</h2>
            <div className="technical-grid">
              <TechnicalCell icon={<PackageIcon size={20} />} label={t("container_port")} value={String(selectedCurrent.deploy.container_port)} copyLabel={t("copy_value")} copiedLabel={t("copied")} />
              <TechnicalCell icon={<CpuIcon size={20} />} label={t("supported_architectures")} value={selectedCurrent.architecture} copyLabel={t("copy_value")} copiedLabel={t("copied")} />
              <TechnicalCell icon={<HardDriveIcon size={20} />} label="AMI" value={selectedCurrent.ami_id} copyLabel={t("copy_value")} copiedLabel={t("copied")} mono />
              <TechnicalCell icon={<PackageIcon size={20} />} label={t("docker_image")} value={selectedCurrent.deploy.docker_image} copyLabel={t("copy_value")} copiedLabel={t("copied")} mono />
            </div>
          </section>

          <section
            className="detail-section detail-section--faq"
            id="faq"
            ref={(element) => { sectionRefs.current.faq = element; }}
          >
            <h2>{t("faq")}</h2>
            <div className="faq-list">
              {faqItems.map((item) => (
                <details className="faq-item" key={item.question.en}>
                  <summary>
                    <span>{pick(locale, item.question)}</span>
                    <ChevronRightIcon size={17} />
                  </summary>
                  <p>{pick(locale, item.answer)}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </div>

      {zoom && shots[shot] && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={pick(locale, shots[shot].caption)} onClick={() => setZoom(false)}>
          <button ref={lightboxCloseRef} type="button" className="lightbox__close" onClick={() => setZoom(false)} aria-label={t("close")}>×</button>
          {shots.length > 1 && (
            <button type="button" className="lightbox__nav lightbox__nav--prev" aria-label={t("prev_screenshot")} onClick={(event) => { event.stopPropagation(); setShot((index) => (index - 1 + shots.length) % shots.length); }}>‹</button>
          )}
          <figure className="lightbox__figure" onClick={(event) => event.stopPropagation()}>
            <img src={shots[shot].siteUrl} alt={pick(locale, shots[shot].caption)} onClick={() => shots.length > 1 && setShot((index) => (index + 1) % shots.length)} />
            <figcaption>
              {pick(locale, shots[shot].caption)}
              {shots.length > 1 && <span className="lightbox__count">{shot + 1} / {shots.length}</span>}
            </figcaption>
          </figure>
          {shots.length > 1 && (
            <button type="button" className="lightbox__nav lightbox__nav--next" aria-label={t("next_screenshot")} onClick={(event) => { event.stopPropagation(); setShot((index) => (index + 1) % shots.length); }}>›</button>
          )}
        </div>
      )}
    </section>
  );
}

function TechnicalCell({ icon, label, value, copyLabel, copiedLabel, mono }: {
  icon: ReactNode;
  label: string;
  value: string;
  copyLabel: string;
  copiedLabel: string;
  mono?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="technical-cell">
      <span className="technical-cell__icon">{icon}</span>
      <span className="technical-cell__body">
        <span className="technical-cell__label">{label}</span>
        <span className={`technical-cell__value ${mono ? "mono" : ""}`} title={value}>{value}</span>
      </span>
      <button type="button" className="technical-cell__copy" onClick={copy} aria-label={`${copyLabel}: ${label}`} title={copied ? copiedLabel : copyLabel}>
        {copied ? <CheckCircleIcon size={16} /> : <CopyIcon size={16} />}
      </button>
    </div>
  );
}

function VersionTable({ versions, locale }: { versions: AppVersionRecord[]; locale: "en" | "zh" }) {
  const { t } = useI18n();
  return (
    <div className="table-scroll" tabIndex={0}>
      <table className="vtable">
        <thead>
          <tr>
            <th>{t("versions")}</th>
            <th>{t("verified_date")}</th>
            <th>{t("verified")}</th>
            <th>{t("status")}</th>
            <th>{t("aws_tested")}</th>
          </tr>
        </thead>
        <tbody>
          {versions.map(({ manifest, current }) => (
            <tr key={manifest.app_version}>
              <td className="mono">{manifest.app_version}</td>
              <td>{formatDate(manifest.verified_at, locale)}</td>
              <td>
                {deploymentHold(current) ? (
                  <span className="badge badge--paused">{t("deployment_paused")}</span>
                ) : (
                  <span className="badge badge--verified"><CheckCircleIcon size={12} /> {t("verified")}</span>
                )}
              </td>
              <td><ReleaseBadge type={current.release.type} evidence={current.release.type_evidence} /></td>
              <td><PlatformBadge platform={manifest.verification.platform} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
