import { useMemo, useState } from "react";
import { useI18n, pick } from "../i18n";
import { AppLink } from "../components/ui";
import { useApps } from "../data/useAppData";
import { versionRecords } from "../data/generated";
import { VerifiedBadge, ReleaseBadge } from "../components/ui";
import { timeAgo } from "../lib/format";
import { useTitle } from "../lib/hooks";
import type { AppCurrent, AppVersionRecord, ReleaseType } from "../data/types";

const PAGE = 20;

interface Row {
  app: AppCurrent;
  record: AppVersionRecord;
}

// First non-heading line of the upstream release notes. Pure display trimming of data
// we were given; nothing is synthesised when the notes are missing.
function summary(notes: string): string {
  const line = notes
    .split("\n")
    .map((s) => s.replace(/^#+\s*/, "").trim())
    .find((s) => s.length > 0);
  return line ?? "";
}

export function Updates() {
  const { locale, t } = useI18n();
  const apps = useApps();
  const [filterType, setFilterType] = useState<"all" | ReleaseType>("all");
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [sortDir, setSortDir] = useState<"newest" | "oldest">("newest");
  const [shown, setShown] = useState(PAGE);

  const rows = useMemo<Row[]>(() => {
    const all: Row[] = [];
    apps.forEach((a) => {
      // versionRecords() is the plain accessor behind useVersions(); it is called in a
      // loop here, so it must not be a hook.
      versionRecords(a.app).forEach((record) => all.push({ app: a, record }));
    });
    let list = all;
    if (verifiedOnly) list = list.filter((r) => r.record.current.status === "verified");
    if (filterType !== "all") list = list.filter((r) => r.record.current.release.type === filterType);
    list = [...list].sort((a, b) =>
      sortDir === "newest"
        ? +new Date(b.record.manifest.verified_at) - +new Date(a.record.manifest.verified_at)
        : +new Date(a.record.manifest.verified_at) - +new Date(b.record.manifest.verified_at)
    );
    return list;
  }, [apps, filterType, verifiedOnly, sortDir]);

  useTitle(locale === "zh" ? "更新 | CoreNova Launch" : "Updates | CoreNova Launch");

  const visible = rows.slice(0, shown);

  return (
    <section className="section">
      <div className="container">
        <h1 className="page-title">{t("updates_title")}</h1>
        <p className="page-subtitle">{t("updates_subtitle")}</p>

        <div className="filterbar">
          {(["all", "new_version", "security_update"] as const).map((ft) => (
            <button
              key={ft}
              className={`btn btn--sm ${filterType === ft ? "btn--primary" : "btn--ghost"}`}
              onClick={() => {
                setFilterType(ft);
                setShown(PAGE);
              }}
            >
              {ft === "all"
                ? t("filter_all")
                : ft === "new_version"
                  ? t("filter_new")
                  : t("filter_security")}
            </button>
          ))}
          <label className="checkbox">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => {
                setVerifiedOnly(e.target.checked);
                setShown(PAGE);
              }}
            />
            {t("filter_verified")}
          </label>
          <div className="filterbar__spacer" />
          <select
            className="select"
            value={sortDir}
            onChange={(e) => setSortDir(e.target.value as "newest" | "oldest")}
            aria-label={t("sort_by")}
          >
            <option value="newest">{t("sort_newest")}</option>
            <option value="oldest">{t("sort_oldest")}</option>
          </select>
        </div>

        <div className="updates-list">
          {visible.map(({ app, record }) => {
            const name = pick(locale, app.display_name);
            const notes = summary(record.release_notes);
            return (
              <div className="update-row" key={`${app.app}-${record.manifest.app_version}`}>
                <div className="update-row__icon">
                  {name.charAt(0)}
                </div>
                <div className="update-row__body">
                  <div className="update-row__line1">
                    <span className="update-row__name">{name}</span>
                    <span className="update-row__ver">{record.manifest.app_version}</span>
                    <VerifiedBadge />
                    <ReleaseBadge
                      type={record.current.release.type}
                      evidence={record.current.release.type_evidence}
                    />
                  </div>
                  {notes && <div className="update-row__summary">{notes}</div>}
                </div>
                <div className="update-row__time">
                  {timeAgo(record.manifest.verified_at, locale)}
                </div>
                <div className="update-row__links">
                  <AppLink className="link-blue" to={`/apps/${app.app}/`}>
                    {t("view_app", { app: name })} →
                  </AppLink>
                  <AppLink className="link-blue" to={`/apps/${app.app}/versions/`}>
                    {t("version_history_link")} →
                  </AppLink>
                </div>
              </div>
            );
          })}
        </div>

        {shown < rows.length && (
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
