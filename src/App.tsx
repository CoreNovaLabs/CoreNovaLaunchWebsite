import { Component, type ReactNode } from "react";
import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { I18nProvider } from "./i18n";
import type { Locale } from "./data/types";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Apps } from "./pages/Apps";
import { AppDetail } from "./pages/AppDetail";
import { Versions } from "./pages/Versions";
import { Updates } from "./pages/Updates";
import { Category } from "./pages/Category";
import { Solutions } from "./pages/Solutions";
import { SolutionDetail } from "./pages/SolutionDetail";
import { DocsIndex, DocDetail } from "./pages/Docs";
import { NotFound } from "./pages/NotFound";

// Remount AppDetail when the slug changes: per-page state (screenshot index,
// selected region/instance, tab) must not leak from one app to the next.
function KeyedAppDetail() {
  const { app } = useParams();
  return <AppDetail key={app} />;
}

// Last-resort net so a render error shows a message instead of a blank page.
// Deliberately dependency-free: no context, no hooks, no data access.
class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) {
      return (
        <div className="not-found" style={{ padding: "4rem 1.5rem", textAlign: "center" }}>
          <h1>500</h1>
          <p>Something went wrong. / 页面出错了。</p>
          <a className="link-blue" href="/en/">
            Home / 首页 →
          </a>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const { pathname } = useLocation();
  // Locale is derived from the URL prefix so every route — including the
  // catch-all NotFound outside the /:lang layout — renders inside a provider.
  const locale: Locale = pathname.startsWith("/zh") ? "zh" : "en";
  return (
    <ErrorBoundary>
      <I18nProvider locale={locale}>
        <Routes>
          <Route path="/" element={<Navigate to="/en" replace />} />
          <Route path="/:lang" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="apps" element={<Apps />} />
            <Route path="apps/:app" element={<KeyedAppDetail />} />
            <Route path="apps/:app/versions" element={<Versions />} />
            <Route path="categories/:cat" element={<Category />} />
            <Route path="updates" element={<Updates />} />
            <Route path="solutions" element={<Solutions />} />
            <Route path="solutions/:slug" element={<SolutionDetail />} />
            <Route path="docs" element={<DocsIndex />} />
            <Route path="docs/:slug" element={<DocDetail />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </I18nProvider>
    </ErrorBoundary>
  );
}
