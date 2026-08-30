import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useI18n, pick } from "../i18n";
import { useApps } from "../data/useAppData";
import { starsOf } from "../data/generated";
import { CATEGORIES } from "../data/categories";
import { AppCard } from "../components/ui";
import { useTitle } from "../lib/hooks";
import type { AppCurrent } from "../data/types";

const PAGE = 24;

export function Apps() {
  const { locale, t } = useI18n();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const [searchInput, setSearchInput] = useState(q);

  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("name");
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [shown, setShown] = useState(PAGE);

  const apps = useApps();
  useTitle(
    locale === "zh"
      ? "浏览可一键部署的开源软件 | CoreNova Launch"
      : "Browse Open Source Software to Deploy on AWS | CoreNova Launch"
  );

  const filtered = useMemo(() => {
    let list: AppCurrent[] = apps;
    if (verifiedOnly) list = list.filter((a) => a.status === "verified");
    if (category !== "all") list = list.filter((a) => a.category === category);
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      list = list.filter((a) => {
        const hay = [
          pick(locale, a.display_name),
          pick(locale, a.description),
          a.app,
          ...a.tags,
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(needle);
      });
    }
    const sorted = [...list];
    if (sort === "name") {
      sorted.sort((a, b) =>
        pick(locale, a.display_name).localeCompare(pick(locale, b.display_name))
      );
    } else if (sort === "newest") {
      sorted.sort((a, b) => +new Date(b.verified_at) - +new Date(a.verified_at));
    } else if (sort === "most_stars") {
      // Stars come from data/stats.json (§5.1). Unresolved (degraded) apps sort last.
      sorted.sort((a, b) => {
        const sa = starsOf(a.app);
        const sb = starsOf(b.app);
        if (sa == null && sb == null) return 0;
        if (sa == null) return 1;
        if (sb == null) return -1;
        return sb - sa;
      });
    }
    return sorted;
  }, [apps, category, sort, verifiedOnly, q, locale]);

  const visible = filtered.slice(0, shown);
  const clearFilters = () => {
    setCategory("all");
    setSort("name");
    setVerifiedOnly(true);
    setShown(PAGE);
  };

  return (
    <section className="section">
      <div className="container">
        <h1 className="page-title">{t("browse_title")}</h1>
        <p className="page-subtitle">{t("browse_subtitle")}</p>

        <div className="filterbar">
          <input
            className="input filterbar__search"
            placeholder={t("search_placeholder")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const v = (e.target as HTMLInputElement).value.trim();
                setParams(v ? { q: v } : {});
                setShown(PAGE);
              }
            }}
          />
          <select
            className="select"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setShown(PAGE);
            }}
            aria-label={t("all_categories")}
          >
            <option value="all">{t("all_categories")}</option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {pick(locale, c.name)}
              </option>
            ))}
          </select>
          <select
            className="select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label={t("sort_by")}
          >
            <option value="name">{t("name_az")}</option>
            <option value="newest">{t("newest")}</option>
            <option value="most_stars">{t("most_stars")}</option>
          </select>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => {
                setVerifiedOnly(e.target.checked);
                setShown(PAGE);
              }}
            />
            {t("verified_only")}
          </label>
        </div>

        <div className="result-count">
          {t("showing_of", {
            from: filtered.length ? 1 : 0,
            to: Math.min(shown, filtered.length),
            total: filtered.length,
          })}
        </div>

        {visible.length === 0 ? (
          <div className="empty">
            <p>{t("no_results")}</p>
            <button className="btn btn--ghost btn--sm" onClick={clearFilters}>
              {t("clear_filters")}
            </button>
          </div>
        ) : (
          <div className="grid">
            {visible.map((a) => (
              <AppCard key={a.app} app={a} />
            ))}
          </div>
        )}

        {shown < filtered.length && (
          <div className="load-more-wrap">
            <button className="btn btn--ghost" onClick={() => setShown((s) => s + PAGE)}>
              {t("load_more")}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
