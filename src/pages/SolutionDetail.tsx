import { useParams } from "react-router-dom";
import { useI18n, pick } from "../i18n";
import { useApps } from "../data/useAppData";
import { getSolution, prettySlug } from "../data/solutions";
import { AppCard, useLocalePath } from "../components/ui";
import { useTitle } from "../lib/hooks";
import { REQUEST_APP_URL } from "../lib/links";
import { hasVerifiedRuntimeContract } from "../lib/deploy";

export function SolutionDetail() {
  const { slug } = useParams();
  const { locale, t } = useI18n();
  const l = useLocalePath();
  const apps = useApps();
  const sol = getSolution(slug ?? "");

  useTitle(
    sol
      ? `${pick(locale, sol.title)} | CoreNova Launch`
      : "CoreNova Launch"
  );

  if (!sol) {
    return (
      <section className="section">
        <div className="container not-found">
          <h1>{t("not_found")}</h1>
        </div>
      </section>
    );
  }

  // Solutions reference the roadmap too: apps without a verified record yet render as
  // "coming soon" instead of silently vanishing (an empty included list looks broken).
  const included = sol.apps
    .map((s) => apps.find((a) => a.app === s))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));
  const planned = sol.apps.filter(
    (s) => !apps.some((a) => a.app === s)
  );
  const fullStackReady =
    included.length === sol.apps.length && included.every(hasVerifiedRuntimeContract);

  return (
    <section className="section">
      <div className="container">
        <nav className="breadcrumb">
          <a href={l("/")}>
            {t("home")}
          </a>
          <span className="sep">›</span>
          <a href={l("/solutions")}>
            {t("solutions")}
          </a>
          <span className="sep">›</span>
          <span className="cur">{pick(locale, sol.title)}</span>
        </nav>

        <div className="solution-detail__header">
          <span className="solution-detail__emoji">{sol.icon}</span>
          <h1 className="page-title page-title--flush">
            {pick(locale, sol.title)}
          </h1>
        </div>
        <p className="page-subtitle page-subtitle--narrow">
          {pick(locale, sol.description)}
        </p>
        {fullStackReady ? (
          <button
            className="btn btn--primary solution-detail__deploy"
            onClick={() => {
              document.querySelector(".stack-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            {t("deploy_full_stack")}
          </button>
        ) : (
          <a
            className="btn btn--primary solution-detail__deploy"
            href={REQUEST_APP_URL}
            target="_blank"
            rel="noreferrer"
          >
            {t("request_solution")}
          </a>
        )}

        <h2 className="solution-detail__subheading">{t("whats_included")}</h2>
        <ul className="stack-list">
          {included.map((a) => (
            <li key={a.app}>
              <span className="name">{pick(locale, a.display_name)}</span>
              <span className="update-row__ver stack-list__version">
                {a.app_version}
              </span>
              <a className="link-blue" href={l(`/apps/${a.app}/`)}>
                {t("view")} →
              </a>
            </li>
          ))}
          {planned.map((s) => (
            <li key={s}>
              <span className="name">{prettySlug(s)}</span>
              <span className="update-row__ver stack-list__version">
                {t("coming_soon")}
              </span>
            </li>
          ))}
        </ul>

        {sol.architecture && (
          <div className="arch-note">
            <b>{fullStackReady ? t("architecture_label") : (locale === "zh" ? "规划架构" : "Planned architecture")}:</b>{" "}
            {pick(locale, sol.architecture)}
          </div>
        )}

        {included.length > 0 && (
          <>
            <h2 className="solution-detail__subheading solution-detail__subheading--spaced">
              {t("included_apps")}
            </h2>
            <div className="grid">
              {included.map((a) => (
                <AppCard key={a.app} app={a} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
