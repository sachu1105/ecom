const HEX = /^#([0-9a-f]{6})$/i;

export function sanitizeHex(value: string | null | undefined, fallback = "#A47B4F") {
  return value && HEX.test(value) ? value.toUpperCase() : fallback;
}

/** WCAG relative luminance → pick black or white text for best contrast. */
export function readableForeground(hex: string) {
  const match = HEX.exec(hex);
  if (!match) return "#FFFFFF";
  const int = parseInt(match[1], 16);
  const channels = [(int >> 16) & 255, (int >> 8) & 255, int & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  const contrastWithWhite = 1.05 / (luminance + 0.05);
  const contrastWithBlack = (luminance + 0.05) / 0.05;
  return contrastWithWhite >= contrastWithBlack ? "#FFFFFF" : "#111111";
}
