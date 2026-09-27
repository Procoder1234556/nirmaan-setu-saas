import { type App } from "@wasp.sh/spec";

export const head: App["head"] = [
  "<link rel='icon' href='/favicon.ico' />",

  "<meta name='description' content='Nirmaan Setu (निर्माण सेतु): Intelligent Data Capture & Dynamic CPM Schedule-Linking Layer for Oil India Limited capital pipeline projects.' />",
  "<meta name='author' content='Oil India Limited — Duliajan Field Operations' />",
  "<meta name='keywords' content='Oil India, Nirmaan Setu, Primavera P6, CPM Schedule, Pipeline Construction, Causal Sync, pgvector' />",

  "<meta property='og:type' content='website' />",
  "<meta property='og:title' content='Nirmaan Setu — Oil India Limited' />",
  "<meta property='og:site_name' content='Nirmaan Setu' />",
  "<meta property='og:url' content='https://nirmaan-setu.oil-india.in' />",
  "<meta property='og:description' content='Intelligent Field Data Capture & Dynamic CPM Schedule-Linking Layer for Oil India Limited' />",
  "<meta property='og:image' content='/public-banner.webp' />",
  "<meta name='twitter:image' content='/public-banner.webp' />",
  "<meta name='twitter:image:width' content='800' />",
  "<meta name='twitter:image:height' content='400' />",
  "<meta name='twitter:card' content='summary_large_image' />",
  // TODO: You can put your Plausible analytics scripts below (https://docs.opensaas.sh/guides/analytics/):
  // NOTE: Plausible does not use Cookies, so you can simply add the scripts here.
  // Google, on the other hand, does, so you must instead add the script dynamically
  // via the Cookie Consent component after the user clicks the "Accept" cookies button.
  "<script async data-domain='<your-site-id>' src='https://plausible.io/js/script.js'></script>", // for production
  "<script async data-domain='<your-site-id>' src='https://plausible.io/js/script.local.js'></script>", // for development
];
