import { createCn } from "cn/config";

/**
 * Class-name merger. The custom type styles from globals.css (`text-eyebrow`,
 * `text-lead`, ...) are registered as font sizes; otherwise the merger treats
 * them as text colours and drops them whenever a colour such as
 * `text-ink-muted` follows.
 */
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [{ text: ["display-xl", "display", "headline", "title", "eyebrow", "lead"] }],
    },
  },
});
