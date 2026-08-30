import { useEffect } from "react";
import { Navigate, Outlet, useParams } from "react-router-dom";
import { I18nProvider, useI18n } from "../i18n";
import type { Locale } from "../data/types";
import { DATA_BACKEND } from "../data/generated";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

function Shell() {
  const { t, locale } = useI18n();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return (
    <>
      {/* Bootstrap-stage notice: only while the build reads Repo C's local fixtures.
          It disappears by itself once VERIFIED_BACKEND=r2. */}
      {DATA_BACKEND === "dir" && <div className="mock-banner">{t("bootstrap_notice")}</div>}
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export function Layout() {
  const { lang } = useParams();
  if (lang !== "en" && lang !== "zh") {
    return <Navigate to="/en" replace />;
  }
  return (
    // key forces a clean remount when the locale changes
    <I18nProvider locale={lang as Locale} key={lang}>
      <Shell />
    </I18nProvider>
  );
}
