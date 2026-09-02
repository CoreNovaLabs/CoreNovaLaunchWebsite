import { Link, useParams } from "react-router-dom";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useI18n } from "../i18n";
import { useLocalePath } from "../components/ui";
import { useTitle } from "../lib/hooks";
import { ArrowRightIcon } from "../components/Icons";
import { DOCS, docVariant } from "../content/docs";

export function DocsIndex() {
  const { locale, t } = useI18n();
  const l = useLocalePath();
  useTitle(
    locale === "zh" ? "文档 | CoreNova Launch" : "Documentation | CoreNova Launch"
  );
  return (
    <section className="section">
      <div className="container">
        <h1 className="page-title">{t("docs_title")}</h1>
        <p className="page-subtitle">{t("docs_subtitle")}</p>
        <div className="doc-list">
          {DOCS.map((d) => {
            const v = docVariant(d, locale);
            return (
              <Link key={d.slug} to={l(`/docs/${d.slug}`)} className="doc-card">
                <h3>{v.title}</h3>
                <p>{v.excerpt}</p>
                <span className="section__link">
                  {t("docs_read")} <ArrowRightIcon size={14} />
                </span>
              </Link>
            );
          })}
          {DOCS.length === 0 && <p className="page-subtitle">{t("docs_empty")}</p>}
        </div>
      </div>
    </section>
  );
}

export function DocDetail() {
  const { slug } = useParams();
  const { locale, t } = useI18n();
  const l = useLocalePath();
  const doc = DOCS.find((d) => d.slug === slug);
  // zh readers get the zh variant when one exists; otherwise the English base
  // (docs are written English-first).
  const v = doc ? docVariant(doc, locale) : null;

  useTitle(
    v
      ? `${v.title} | CoreNova Launch`
      : locale === "zh"
        ? "文档未找到 | CoreNova Launch"
        : "Doc not found | CoreNova Launch"
  );

  if (!doc || !v) {
    return (
      <section className="section">
        <div className="container not-found">
          <h1>404</h1>
          <p>{t("not_found")}</p>
          <Link to={l("/docs")}>{t("docs_title")}</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container doc-detail">
        <nav className="breadcrumb">
          <Link to={l("/")}>{locale === "zh" ? "首页" : "Home"}</Link>
          <span>›</span>
          <Link to={l("/docs")}>{t("docs_title")}</Link>
          <span>›</span>
          <span>{v.title}</span>
        </nav>
        <article className="markdown doc-article">
          <Markdown remarkPlugins={[remarkGfm]}>{v.raw}</Markdown>
        </article>
      </div>
    </section>
  );
}
