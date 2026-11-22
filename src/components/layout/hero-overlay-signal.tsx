"use client";

import { useLayoutEffect } from "react";

let visibleHeroes = 0;

/**
 * Tells the site header that a full-bleed hero is currently on screen, by
 * setting `data-hero` on <html> (see section 5 of globals.css).
 *
 * Why not just CSS `html:has([data-hero-overlay])`? With Cache Components,
 * Next.js keeps previously visited pages mounted but hidden (React
 * <Activity>), so a hidden homepage hero would still match and turn the header
 * transparent on pages without a hero. Layout effects are cleaned up when a
 * page is hidden, so this count only includes heroes that are really showing.
 * Before hydration the attribute is absent and the CSS falls back to `:has()`,
 * which is correct on a fresh load and avoids a flash.
 */
export function HeroOverlaySignal() {
  useLayoutEffect(() => {
    visibleHeroes += 1;
    document.documentElement.dataset.hero = "on";
    return () => {
      visibleHeroes -= 1;
      if (visibleHeroes <= 0) {
        visibleHeroes = 0;
        document.documentElement.dataset.hero = "off";
      }
    };
  }, []);
  return null;
}
