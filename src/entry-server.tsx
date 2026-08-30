import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

export { enumerateRoutes, SITE_ORIGIN, absUrl } from "./seo";
export type { PrerenderRoute } from "./seo";

// Build-time prerender entry consumed by scripts/prerender.mjs.
export function renderRoute(path: string): string {
  return renderToString(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );
}
