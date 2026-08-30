import { Fragment, useState } from "react";
import { useParams } from "react-router-dom";
import Markdown from "react-markdown";
import { useI18n, pick } from "../i18n";
import { useApp, useVersions } from "../data/useAppData";
import { VerifiedBadge, ReleaseBadge, PlatformBadge, useLocalePath } from "../components/ui";
import { CheckCircleIcon } from "../components/Icons";
import { formatDate } from "../lib/format";
import { useTitle } from "../lib/hooks";
import { CHECK_ROWS } from "../data/types";
import type { AppVersionRecord } from "../data/types";

export function Versions() {
  const { app: slug } = useParams();
  const { locale, t } = useI18n();
  const l = useLocalePath();
  const app = useApp(slug);
  // Only final-state records (nine checks all true) reach this page — see §2.2 filtering.
  const versions = useVersions(slug);
  const [expanded, setExpanded] = useState<string | null>(null);

  useTitle(
    app
      ? `${pick(locale, app.display_name)} Versions - Verified Release History | CoreNova Launch`
      : "Versions | CoreNova Launch"
  );

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

  return (
    <section className="section">
      <div className="container">
        <nav className="breadcrumb">
          <a href={l("/")} onClick={(e) => e.preventDefault()}>
            {t("home")}
          </a>
          <span className="sep">›</span>
          <a href={l("/apps")} onClick={(e) => e.preventDefault()}>
            {t("software")}
          </a>
          <span className="sep">›</span>
          <a href={l(`/apps/${app.app}/`)} onClick={(e) => e.preventDefault()}>
            {name}
          </a>
          <span className="sep">›</span>
          <span className="cur">{t("versions")}</span>
        </nav>

        <h1 className="page-title">{t("versions_title", { app: name })}</h1>
        <p className="page-subtitle">{t("versions_subtitle")}</p>

        <a className="section__link" href={l(`/apps/${app.app}/`)} onClick={(e) => e.preventDefault()}>
          {t("back_to_app", { app: name })}
        </a>

        <table className="vtable vtable--spaced">
          <thead>
            <tr>
              <th>{t("versions")}</th>
              <th>{locale === "zh" ? "发布日期" : "Release Date"}</th>
              <th>{t("verified")}</th>
              <th>{locale === "zh" ? "状态" : "Status"}</th>
              <th>{locale === "zh" ? "AWS 测试" : "AWS Tested"}</th>
              <th>{locale === "zh" ? "操作" : "Actions"}</th>
            </tr>
          </thead>
          <tbody>
            {versions.map((rec) => {
              const m = rec.manifest;
              return (
                <Fragment key={m.app_version}>
                  <tr>
                    <td className="mono">{m.app_version}</td>
                    <td>{formatDate(m.verified_at, locale)}</td>
                    <td>
                      <VerifiedBadge />
                    </td>
                    <td>
                      <ReleaseBadge type={m.website.release.type} />
                    </td>
                    <td>
                      <PlatformBadge platform={m.verification.platform} />
                    </td>
                    <td>
                      <div className="vrow-actions">
                        <button className="btn btn--primary btn--sm">
                          {locale === "zh" ? "Deploy" : "Deploy"}
                        </button>
                        <button
                          className="btn btn--ghost btn--sm"
                          onClick={() =>
                            setExpanded(expanded === m.app_version ? null : m.app_version)
                          }
                        >
                          {locale === "zh" ? "Details" : "Details"}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expanded === m.app_version && (
                    <tr>
                      <td colSpan={6} style={{ padding: 0 }}>
                        <VersionDetail rec={rec} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const DETAIL_TABS = ["overview", "test_results", "release_notes", "deployment_guide"] as const;

function phaseLabel(phase: string, locale: "en" | "zh") {
  return locale === "zh" ? `${phase} 阶段` : phase;
}

// One row per Publish Gate check. The nine names are fixed by deployment-contract §3.1.
function CheckRow({
  label,
  ok,
  phase,
  locale,
}: {
  label: string;
  ok: boolean;
  phase: string;
  locale: "en" | "zh";
}) {
  return (
    <div className="test-card">
      <span className="test-card__icon" style={ok ? undefined : { color: "var(--error)" }}>
        <CheckCircleIcon size={18} />
      </span>
      <div>
        <div className="test-card__name">{label}</div>
        <div className="test-card__status" style={ok ? undefined : { color: "var(--error)" }}>
          {ok ? (locale === "zh" ? "通过" : "Passed") : locale === "zh" ? "失败" : "Failed"}
        </div>
        <div className="test-card__time">{phaseLabel(phase, locale)}</div>
      </div>
    </div>
  );
}

function VerificationSummary({ rec }: { rec: AppVersionRecord }) {
  const { locale } = useI18n();
  const v = rec.manifest.verification;
  // verification.* and checks.* are reported side by side and never derived from each
  // other (deployment-contract §3.1 last rule).
  const rows: { key: string; label: string; value: string }[] = [
    { key: "application", label: locale === "zh" ? "应用验证" : "Application", value: v.application },
    { key: "platform", label: locale === "zh" ? "平台验证" : "Platform", value: v.platform },
    { key: "tests", label: locale === "zh" ? "测试" : "Tests", value: v.tests },
  ];
  return (
    <ul className="checklist">
      {rows.map((r) => (
        <li key={r.key}>
          <span>{r.label}</span>
          <span
            className={r.value === "failed" ? undefined : "check-ok"}
            style={r.value === "failed" ? { color: "var(--error)" } : undefined}
          >
            {r.value}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ReleaseNotesPanel({ rec }: { rec: AppVersionRecord }) {
  const { locale } = useI18n();
  if (!rec.release_notes.trim()) {
    // Upstream release notes are an optional metadata sync; degraded = empty, not fake.
    return (
      <p className="info-card__label">
        {locale === "zh" ? "暂无上游 Release Notes（构建期未取到）。" : "No upstream release notes (not fetched at build time)."}
      </p>
    );
  }
  return (
    <div className="markdown">
      <Markdown>{rec.release_notes}</Markdown>
    </div>
  );
}

function VersionDetail({ rec }: { rec: AppVersionRecord }) {
  const { locale, t } = useI18n();
  const [tab, setTab] = useState<(typeof DETAIL_TABS)[number]>("overview");
  const m = rec.manifest;

  return (
    <div className="vdetail">
      <div className="vdetail__head">
        <span className="vdetail__title">
          {locale === "zh" ? "版本详情" : "Version Details"}: {m.app_version}
        </span>
        <div className="vdetail__tabs">
          {DETAIL_TABS.map((id) => (
            <button
              key={id}
              className={`vdetail__tab ${tab === id ? "is-active" : ""}`}
              onClick={() => setTab(id)}
            >
              {t(id)}
            </button>
          ))}
        </div>
      </div>
      {tab === "overview" && (
        <div className="vdetail__cols">
          <div className="vdetail__panel">
            <h4>{t("test_results")}</h4>
            <div className="test-grid">
              {CHECK_ROWS.map((row) => (
                <CheckRow
                  key={row.key}
                  label={row.label}
                  ok={m.checks[row.key]}
                  phase={row.phase}
                  locale={locale}
                />
              ))}
            </div>
            <h4 style={{ marginTop: "var(--space-6)" }}>{t("platform")}</h4>
            <VerificationSummary rec={rec} />
          </div>
          <div className="vdetail__panel">
            <h4>{t("release_notes")}</h4>
            <ReleaseNotesPanel rec={rec} />
          </div>
        </div>
      )}
      {tab === "test_results" && (
        <div className="vdetail__panel">
          <h4>{t("corenova_test_report")}</h4>
          <ul className="checklist">
            {CHECK_ROWS.map((row) => (
              <li key={row.key}>
                <span>{row.label}</span>
                <span className={m.checks[row.key] ? "check-ok" : "check-fail"}>
                  {m.checks[row.key] ? "Passed" : "Failed"}
                </span>
              </li>
            ))}
          </ul>
          <h4 style={{ marginTop: "var(--space-6)" }}>{t("platform")}</h4>
          <VerificationSummary rec={rec} />
        </div>
      )}
      {tab === "release_notes" && (
        <div className="vdetail__panel">
          <h4>{t("github_release_notes")}</h4>
          <ReleaseNotesPanel rec={rec} />
        </div>
      )}
      {tab === "deployment_guide" && (
        <div className="vdetail__panel">
          <h4>{locale === "zh" ? "部署指南" : "Deployment Guide"}</h4>
          <div className="markdown">
            <p>
              {locale === "zh"
                ? "该版本经 CoreNova 验证的可部署事实如下（均来自 Verification Manifest，非页面推断）："
                : "Deployable facts verified for this version (all from the Verification Manifest, not inferred by this page):"}
            </p>
            <ul>
              <li>
                {locale === "zh" ? "镜像（精确 tag@digest）：" : "Image (exact tag@digest): "}
                <code>{m.container.image}@{m.container.digest.slice(0, 24)}…</code>
              </li>
              <li>
                {locale === "zh" ? "容器端口：" : "Container port: "}
                <code>{rec.current.deploy.container_port}</code>
                {" · "}
                {locale === "zh" ? "实例档：" : "instance: "}
                <code>{rec.current.deploy.instance_type}</code>
                {" · "}
                {locale === "zh" ? "区域：" : "region: "}
                <code>{rec.current.deploy.regions.join(", ")}</code>
              </li>
            </ul>
            <p>
              {locale === "zh"
                ? "在应用页点击 Generate Template，即用官方 one-click 模板把该 digest 钉住的版本部署到你自己的 AWS 账号（端点由你掌控，非 CoreNova 托管）。"
                : "Use Generate Template on the app page — it deploys this digest-pinned version into your own AWS account via the official one-click template (the endpoint is yours, not CoreNova-hosted)."}
            </p>
            <p>
              <a href={rec.current.deploy.documentation_url} target="_blank" rel="noreferrer">
                {locale === "zh" ? "上游官方文档 ↗" : "Upstream documentation ↗"}
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
