import { useI18n, pick } from "../i18n";
import { useApps } from "../data/useAppData";
import { SOLUTIONS } from "../data/solutions";
import { useLocalePath } from "../components/ui";
import { useTitle } from "../lib/hooks";

export function Solutions() {
  const { locale, t } = useI18n();
  const l = useLocalePath();
  const apps = useApps();
  useTitle(
    locale === "zh"
      ? "解决方案 | CoreNova Launch"
      : "Solutions | CoreNova Launch"
  );

  const nameOf = (slug: string) =>
    apps.find((a) => a.app === slug)?.display_name[locale] ?? slug;

  return (
    <section className="section">
      <div className="container">
        <h1 className="page-title">{t("solutions_title")}</h1>
        <p className="page-subtitle">{t("solutions_subtitle")}</p>

        <div className="solutions-grid">
          {SOLUTIONS.map((s) => (
            <div className="solution-card" key={s.slug}>
              <div className="solution-card__icon">{s.icon}</div>
              <h3 className="solution-card__title">{pick(locale, s.title)}</h3>
              <p className="solution-card__desc">{pick(locale, s.description)}</p>
              <div className="solution-card__apps">
                {s.apps.map((a, i) => (
                  <span key={a}>
                    {i > 0 && " · "}
                    <b>{nameOf(a)}</b>
                  </span>
                ))}{" "}
                ({s.apps.length} {locale === "zh" ? "款" : "apps"})
              </div>
              <a
                className="link-blue"
                href={l(`/solutions/${s.slug}/`)}
                onClick={(e) => e.preventDefault()}
              >
                {t("view_solution")} →
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
