/**
 * Privacy-friendly analytics events. A no-op unless VITE_ANALYTICS is configured
 * (the provider's script is injected at build time by plugins/site.ts).
 */
type Props = Record<string, string | number | boolean>;
type W = Window & {
  plausible?: (e: string, o?: { props?: Props }) => void;
  umami?: { track: (e: string, p?: Props) => void };
  goatcounter?: { count: (o: { path: string; title: string; event: boolean }) => void };
};

const provider = import.meta.env.VITE_ANALYTICS;

export function track(event: string, props?: Props) {
  if (!provider || typeof window === "undefined") return;
  try {
    const w = window as W;
    if (provider === "plausible") w.plausible?.(event, props ? { props } : undefined);
    else if (provider === "umami") w.umami?.track(event, props);
    else if (provider === "goatcounter")
      w.goatcounter?.count({ path: `event/${event}${props ? `/${Object.values(props).join("/")}` : ""}`, title: event, event: true });
  } catch {
    /* analytics must never break the page */
  }
}
