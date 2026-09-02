import { useParams } from "react-router-dom";
import { useI18n, pick } from "../i18n";
import { useApps } from "../data/useAppData";
import { getCategory } from "../data/categories";
import { AppCard } from "../components/ui";
import { REQUEST_APP_URL } from "../lib/links";
import { useTitle } from "../lib/hooks";

export function Category() {
  const { cat } = useParams();
  const { locale, t } = useI18n();
  const meta = getCategory(cat ?? "");
  const apps = useApps().filter((a) => a.category === cat);

  useTitle(
    meta
      ? locale === "zh"
        ? `${meta.name.zh} 一键部署到 AWS | CoreNova Launch`
        : `Open Source ${meta.name.en} Deploy to AWS | CoreNova Launch`
      : "CoreNova Launch"
  );

  if (!meta) {
    return (
      <section className="section">
        <div className="container not-found">
          <h1>{t("not_found")}</h1>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <h1 className="page-title">{pick(locale, meta.name)}</h1>
        <p className="page-subtitle">{pick(locale, meta.description)}</p>
        {apps.length === 0 ? (
          <div className="empty">
            <p>{t("no_results")}</p>
            {/* An empty category is a demand signal, not a dead end — route it
                to the request-an-app issue form. */}
            <a
              className="btn btn--ghost btn--sm"
              href={REQUEST_APP_URL}
              target="_blank"
              rel="noreferrer"
            >
              {t("request_app")}
            </a>
          </div>
        ) : (
          <div className="grid">
            {apps.map((a) => (
              <AppCard key={a.app} app={a} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
