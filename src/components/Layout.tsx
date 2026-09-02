import { useEffect } from "react";
import { Navigate, Outlet, useParams } from "react-router-dom";
import { useI18n } from "../i18n";
import { DATA_BACKEND } from "../data/generated";
import { CF_WEB_ANALYTICS_TOKEN } from "../lib/analytics";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

function Shell() {
  const { t, locale } = useI18n();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  // Cloudflare Web Analytics beacon — injected on hydration only when the token
  // is configured (see lib/analytics.ts). No token → no third-party script.
  useEffect(() => {
    if (!CF_WEB_ANALYTICS_TOKEN) return;
    const s = document.createElement("script");
    s.defer = true;
    s.src = "https://static.cloudflareinsights.com/beacon.min.js";
    s.dataset.cfBeacon = JSON.stringify({ token: CF_WEB_ANALYTICS_TOKEN });
    document.head.appendChild(s);
    return () => {
      s.remove();
    };
  }, []);
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
