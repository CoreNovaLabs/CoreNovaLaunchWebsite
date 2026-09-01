import { Link, useParams } from "react-router-dom";
import { useI18n } from "../i18n";

export function NotFound() {
  const { t } = useI18n();
  const { lang } = useParams();
  const home = `/${lang || "en"}`;
  return (
    <div className="not-found">
      <h1>404</h1>
      <p className="not-found__desc">{t("not_found")}</p>
      <Link to={home} className="link-blue">
        {t("home")} →
      </Link>
    </div>
  );
}
