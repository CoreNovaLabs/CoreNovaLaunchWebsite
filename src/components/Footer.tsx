import { useI18n } from "../i18n";
import { AppLink } from "./ui";
import { RocketIcon } from "./Icons";
import { REQUEST_APP_URL } from "../lib/links";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <div className="footer__logo">
            <span className="footer__logo-mark">
              <RocketIcon size={13} />
            </span>
            CoreNova Launch
          </div>
          <p className="footer__tagline">{t("footer_tagline")}</p>
        </div>
        <div className="footer__col">
          <div className="footer__col-title">{t("footer_products")}</div>
          <AppLink to="/apps">{t("browse")}</AppLink>
          <AppLink to="/updates">{t("updates")}</AppLink>
          <AppLink to="/solutions">{t("solutions")}</AppLink>
        </div>
        <div className="footer__col">
          <div className="footer__col-title">{t("footer_resources")}</div>
          <AppLink to="/docs">{t("footer_docs")}</AppLink>
          <a
            href="https://github.com/CoreNovaLabs/CoreNovaLaunchVerify"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <a href={REQUEST_APP_URL} target="_blank" rel="noreferrer">
            {t("request_app")}
          </a>
        </div>
        <div className="footer__col">
          <div className="footer__col-title">{t("footer_regions")}</div>
          <div className="footer__region">
            <span className="footer__region-dot" />
            us-east-1 · N. Virginia
          </div>
          <p className="footer__region-note">{t("region_roadmap")}</p>
        </div>
      </div>
      <div className="footer__bottom">
        <div className="footer__bottom-inner">
          <span>{t("copyright")}</span>
        </div>
      </div>
    </footer>
  );
}
