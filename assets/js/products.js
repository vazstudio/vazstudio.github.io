/* VAZ Store — Product catalog (Phases 2–3)
 * Single source of truth for the store grid. Rendered by store.html.
 *
 * Payment structure (Phase 3) — inert until you add links:
 *  - price: null = show "قريبًا" (no prices approved yet); set a SAR number to sell.
 *  - availability: "coming_soon" | "available" | "sold_out".
 *  - checkoutUrl: paste the product's hosted payment link from your Saudi
 *    provider (Moyasar or Tap payment links). Must start with https://.
 *  - paymentProvider: "moyasar" | "tap" | null (informational label only).
 *  - A product goes on sale only when availability="available" AND checkoutUrl
 *    is set; until then WhatsApp ordering behaves exactly as before.
 *  - Never put API keys or secrets in this file — links only.
 */
window.VAZ_PRODUCTS = [
  {
    id: "nex-collection",
    name: "NEX COLLECTION",
    image: "VAZ_NEX_COLLECTION_DIGITAL_FINAL_800x533.jpg",
    imageWidth: 800,
    imageHeight: 533,
    alt: { ar: "NEX Collection", en: "NEX Collection", hi: "NEX Collection", ur: "NEX Collection", bn: "NEX Collection" },
    price: null,
    availability: "coming_soon",
    checkoutUrl: null,
    paymentProvider: null,
    descKey: "product_nex"
  },
  {
    id: "lumera",
    name: "LUMERA",
    image: "VAZ_LUMERA.png",
    imageWidth: 800,
    imageHeight: 434,
    alt: { ar: "LUMERA", en: "LUMERA", hi: "LUMERA", ur: "LUMERA", bn: "LUMERA" },
    price: null,
    availability: "coming_soon",
    checkoutUrl: null,
    paymentProvider: null,
    descKey: "product_lumera"
  },
  {
    id: "mavora",
    name: "MAVORA",
    image: "VAZ_MAVORA_final_800x434.png",
    imageWidth: 800,
    imageHeight: 434,
    alt: { ar: "MAVORA", en: "MAVORA", hi: "MAVORA", ur: "MAVORA", bn: "MAVORA" },
    price: null,
    availability: "coming_soon",
    checkoutUrl: null,
    paymentProvider: null,
    descKey: "product_mavora"
  },
  {
    id: "velora",
    name: "VELORA",
    image: "VAZ_VELORA.png",
    imageWidth: 800,
    imageHeight: 434,
    alt: { ar: "VELORA", en: "VELORA", hi: "VELORA", ur: "VELORA", bn: "VELORA" },
    price: null,
    availability: "coming_soon",
    checkoutUrl: null,
    paymentProvider: null,
    descKey: "product_velora"
  },
  {
    id: "verane",
    name: "VERANE",
    image: "VAZ_VERANE_final_800x434.png",
    imageWidth: 800,
    imageHeight: 434,
    alt: { ar: "VERANE", en: "VERANE", hi: "VERANE", ur: "VERANE", bn: "VERANE" },
    price: null,
    availability: "coming_soon",
    checkoutUrl: null,
    paymentProvider: null,
    descKey: "product_verane"
  },
  {
    id: "aurea-cosmetics",
    name: "AUREA COSMETICS",
    image: "AUREA-COSMETICS.jpeg",
    imageWidth: 1503,
    imageHeight: 1047,
    alt: { ar: "AUREA Cosmetics", en: "AUREA Cosmetics", hi: "AUREA Cosmetics", ur: "AUREA Cosmetics", bn: "AUREA Cosmetics" },
    price: null,
    availability: "coming_soon",
    checkoutUrl: null,
    paymentProvider: null,
    descKey: "product_aurea"
  }
];
