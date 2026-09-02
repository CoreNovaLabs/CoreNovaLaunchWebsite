// Cloudflare Web Analytics wiring (no-cookie, beacon-based).
//
// Token source: the VITE_CF_WEB_ANALYTICS_TOKEN build env var (set it in
// Cloudflare Pages → Settings → Environment variables after creating the site
// in CF dashboard → Web Analytics). Empty = disabled: nothing is injected and
// the site stays script-free. The token is a public site identifier, not a
// secret, but keeping it in build config (not committed) lets each deployment
// environment opt in independently.
export const CF_WEB_ANALYTICS_TOKEN: string =
  (import.meta.env.VITE_CF_WEB_ANALYTICS_TOKEN as string | undefined) ?? "";
