/**
 * The greenlight. logo: a traffic light with red and amber dimmed and the
 * green lamp lit. Drawn as an SVG so it stays sharp at any size.
 * The same drawing is used for the browser-tab icon (public/favicon.svg).
 */
export function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg width={(size * 14) / 26} height={size} viewBox="0 0 14 26" aria-hidden="true" focusable="false">
      {/* housing */}
      <rect x="0.5" y="0.5" width="13" height="25" rx="4" fill="#141a0e" stroke="#4f6a2c" />
      {/* red and amber, switched off */}
      <circle cx="7" cy="6" r="2.6" fill="#5b2a22" />
      <circle cx="7" cy="13" r="2.6" fill="#5c4a1a" />
      {/* green, lit: soft halo, lamp, small highlight */}
      <circle cx="7" cy="20" r="4" fill="#8fe07a" opacity="0.25" />
      <circle cx="7" cy="20" r="2.8" fill="#7fd46a" />
      <circle cx="6.1" cy="19.1" r="0.8" fill="#e6ffd9" opacity="0.9" />
    </svg>
  );
}
