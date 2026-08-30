import { useParams } from "react-router-dom";
import { useI18n, pick } from "../i18n";
import { useApps } from "../data/useAppData";
import { getSolution } from "../data/solutions";
import { AppCard, useLocalePath } from "../components/ui";
import { useTitle } from "../lib/hooks";

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

  const included = sol.apps
    .map((s) => apps.find((a) => a.app === s))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));

  return (
    <section className="section">
      <div className="container">
        <nav className="breadcrumb">
          <a href={l("/")} onClick={(e) => e.preventDefault()}>
            {t("home")}
          </a>
          <span className="sep">›</span>
          <a href={l("/solutions")} onClick={(e) => e.preventDefault()}>
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
        <button className="btn btn--primary solution-detail__deploy">
          {t("deploy_full_stack")}
        </button>

        <h2 className="solution-detail__subheading">{t("whats_included")}</h2>
        <ul className="stack-list">
          {included.map((a) => (
            <li key={a.app}>
              <span className="name">{pick(locale, a.display_name)}</span>
              <span className="update-row__ver stack-list__version">
                {a.app_version}
              </span>
              <a className="link-blue" href={l(`/apps/${a.app}/`)} onClick={(e) => e.preventDefault()}>
                {t("deploy_now")} →
              </a>
            </li>
          ))}
        </ul>

        {sol.architecture && (
          <div className="arch-note">
            <b>{t("architecture_label")}:</b> {pick(locale, sol.architecture)}
          </div>
        )}

        <h2 className="solution-detail__subheading solution-detail__subheading--spaced">
          {locale === "zh" ? "包含应用" : "Included apps"}
        </h2>
        <div className="grid">
          {included.map((a) => (
            <AppCard key={a.app} app={a} />
          ))}
        </div>
      </div>
    </section>
  );
}
