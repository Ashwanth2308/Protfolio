/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public URL of the deployed site, e.g. https://ashwanth.dev (enables canonical/OG URLs, sitemap, RSS, CNAME). */
  readonly VITE_SITE_URL?: string;
  /** "plausible" | "umami" | "goatcounter" (analytics is off when unset). */
  readonly VITE_ANALYTICS?: string;
  /** Plausible domain, Umami website id, or GoatCounter code. */
  readonly VITE_ANALYTICS_ID?: string;
  /** Optional self-hosted analytics script URL. */
  readonly VITE_ANALYTICS_SRC?: string;
  /** Overrides the Formspree endpoint set in src/data/portfolio.ts. */
  readonly VITE_FORM_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "virtual:blog-posts" {
  export const posts: {
    slug: string;
    title: string;
    date: string;
    summary: string;
    tags: string[];
    draft: boolean;
    readingTime: number;
  }[];
}
