import { useEffect } from "react";
import { Navigate, Outlet, useParams } from "react-router-dom";
import { useI18n } from "../i18n";
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

// I18nProvider lives in App so the catch-all NotFound route (outside this
// layout) has a provider too.
export function Layout() {
  const { lang } = useParams();
  if (lang !== "en" && lang !== "zh") {
    return <Navigate to="/en" replace />;
  }
  return <Shell />;
}
