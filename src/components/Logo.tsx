import type { CSSProperties } from "react";
import { logos, type Logo } from "../data/logos";

const byName = new Map(logos.map((l) => [l.name, l]));

/** Very dark brand colours are invisible on the dark theme; fall back to the text colour. */
function brandColor(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const lum = (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  return lum < 0.22 ? "var(--fg)" : hex;
}

export function BrandLogo({ logo, className = "size-5" }: { logo: Logo; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" role="img" aria-label={logo.name}>
      <title>{logo.name}</title>
      <path d={logo.path} />
    </svg>
  );
}

/** Monochrome logo that lights up in its brand colour on hover. */
export function LogoChip({ name, showLabel = false }: { name: string; showLabel?: boolean }) {
  const logo = byName.get(name);
  if (!logo) return null;
  return (
    <span
      className="group/logo inline-flex items-center gap-2 text-subtle transition-colors duration-300 hover:text-[var(--brand)]"
      style={{ "--brand": brandColor(logo.hex) } as CSSProperties}
      title={logo.name}
    >
      <BrandLogo logo={logo} className="size-[22px] transition-transform duration-300 group-hover/logo:scale-110" />
      {showLabel && <span className="font-mono text-xs text-muted group-hover/logo:text-fg">{logo.name}</span>}
    </span>
  );
}

export { logos };
