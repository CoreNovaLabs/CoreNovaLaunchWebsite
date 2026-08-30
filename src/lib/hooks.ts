import { useEffect } from "react";

// Set document.title for the current page (SEO, docs/website-design.md §4).
export function useTitle(title: string) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
