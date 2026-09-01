import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useI18n } from "../i18n";
import { useLocalePath } from "./ui";
import { MoonIcon, RocketIcon, SearchIcon, SunIcon } from "./Icons";
import type { Locale } from "../data/types";

const THEME_KEY = "cn-theme";

export function Navbar() {
  const { locale, t } = useI18n();
  const loc = useLocation();
  const navigate = useNavigate();
  const l = useLocalePath();
  const [q, setQ] = useState("");
  // SSR always renders light; after mount we adopt whatever the inline bootstrap
  // script in index.html applied (localStorage / system preference). Reading it
  // during the initial state instead would mismatch the prerendered markup.
  const [dark, setDark] = useState(false);
  const [themeReady, setThemeReady] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.getAttribute("data-theme") === "dark");
    setThemeReady(true);
  }, []);

  useEffect(() => {
    if (!themeReady) return;
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    try {
      localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
    } catch {
      // storage unavailable (private mode) — theme still applies for this page
    }
  }, [dark, themeReady]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [loc.pathname]);

  const path = loc.pathname;
  const isActive = (p: string) => path.startsWith(`/${locale}${p}`);

  const switchLang = (next: Locale) => {
    const seg = path.split("/");
    seg[1] = next;
    navigate(seg.join("/") || `/${next}`);
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    navigate(l(`/apps${query ? `?q=${encodeURIComponent(query)}` : ""}`));
  };

  const navItems = [
    { key: "browse", to: "/apps" },
    { key: "updates", to: "/updates" },
    { key: "solutions", to: "/solutions" },
    { key: "docs", to: "/docs" },
  ];

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <a
          href={l("/")}
          className="navbar__logo"
          onClick={(e) => {
            e.preventDefault();
            navigate(l("/"));
          }}
        >
          <span className="navbar__logo-mark">
            <RocketIcon size={14} />
          </span>
          CoreNova Launch
        </a>
        <nav className="navbar__links">
          {navItems.map((item) => (
            <a
              key={item.key}
              href={l(item.to)}
              className={`navbar__link ${isActive(item.to) ? "is-active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(l(item.to));
              }}
            >
              {t(item.key)}
            </a>
          ))}
        </nav>
        <div className="navbar__right">
          <form onSubmit={onSearch} className="navbar__search-wrap">
            <span className="navbar__search-icon">
              <SearchIcon size={16} />
            </span>
            <input
              className="navbar__search"
              placeholder={t("search_placeholder")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label={t("search_placeholder")}
            />
          </form>
          <div className="navbar__lang">
            <button
              className={locale === "en" ? "is-active" : ""}
              onClick={() => switchLang("en")}
              aria-label="English"
            >
              EN
            </button>
            <button
              className={locale === "zh" ? "is-active" : ""}
              onClick={() => switchLang("zh")}
              aria-label="中文"
            >
              中
            </button>
          </div>
          <button
            className="navbar__icon-btn"
            aria-label={dark ? t("theme_light") : t("theme_dark")}
            aria-pressed={dark}
            onClick={() => setDark((d) => !d)}
          >
            {dark ? <SunIcon size={18} /> : <MoonIcon size={18} />}
          </button>
          <button
            className="navbar__hamburger"
            aria-label={mobileOpen ? t("close") : t("browse")}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((o) => !o)}
          >
            <span className={`navbar__hamburger-icon ${mobileOpen ? "is-open" : ""}`}>
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>
      </div>
      {mobileOpen && (
        <nav className="navbar__mobile-menu">
          {navItems.map((item) => (
            <a
              key={item.key}
              href={l(item.to)}
              className={`navbar__mobile-link ${isActive(item.to) ? "is-active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(l(item.to));
              }}
            >
              {t(item.key)}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
