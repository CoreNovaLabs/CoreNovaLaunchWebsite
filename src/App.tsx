import { Routes, Route, Navigate } from "react-router-dom";
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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/en" replace />} />
      <Route path="/:lang" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="apps" element={<Apps />} />
        <Route path="apps/:app" element={<AppDetail />} />
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
  );
}
