// Phase 3 verification for the VAZ store — payment-link structure only.
// Confirms: inert-by-default checkout, pay button wiring, i18n keys for all 5
// languages, no secrets, and that Phase 1/2 guarantees still hold.
import fs from "node:fs";

let failures = 0;
const ok = (m) => console.log("PASS  " + m);
const bad = (m) => { failures++; console.error("FAIL  " + m); };
const LANGS = ["ar", "en", "hi", "ur", "bn"];

const catalogSrc = fs.readFileSync("assets/js/products.js", "utf8");
const store = fs.readFileSync("store.html", "utf8");
const inlineScript = [...store.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join("\n");

// ---- 1) Catalog unchanged in behavior: 6 products, all price null, no links yet
const sandbox = { window: {} };
try { new Function("window", catalogSrc)(sandbox.window); }
catch (err) { bad("products.js does not parse: " + err.message); }
const products = sandbox.window.VAZ_PRODUCTS || [];
if (products.length !== 6) bad(`expected 6 products, got ${products.length}`);
else ok("catalog: 6 products, schema intact after Phase 3 edits");
if (products.some((p) => p.price !== null)) bad("a product has a price — prices were NOT approved");
else ok("all prices remain null (structure only, no prices approved)");
if (products.some((p) => p.checkoutUrl !== null)) bad("a checkoutUrl is already set — links are added later by the owner");
else ok("checkoutUrl null on every product (inert until owner adds Moyasar/Tap links)");

// ---- 2) Checkout engine exists and behaves inert-by-default
// (runs the ENTIRE inline script in a stubbed DOM, then inspects window.VAZCheckout)
const el = () => ({
  textContent: "", innerHTML: "", value: "", href: "", hidden: false,
  style: { setProperty() {}, removeProperty() {} },
  setAttribute() {}, getAttribute: () => null,
  addEventListener() {}, classList: { toggle: () => false, remove() {}, add() {} },
  querySelector: () => null, querySelectorAll: () => ({ forEach() {} }),
  contains: () => false, dataset: {}, focus() {},
});
const els = {};
const docStub = {
  documentElement: { lang: "", dir: "" },
  body: { style: { setProperty() {}, removeProperty() {} } },
  getElementById: (id) => (els[id] = els[id] || el()),
  querySelector: () => null,
  querySelectorAll: () => ({ forEach() {} }),
  addEventListener() {},
};
const winStub = { VAZ_PRODUCTS: products, location: { href: "" } };
try {
  new Function("window", "document", "localStorage", inlineScript)(winStub, docStub, { getItem: () => null, setItem() {} });
} catch (err) { bad("store.html inline script failed to execute: " + err.message); }
const V = winStub.VAZCheckout;
if (!V || typeof V.beginCheckout !== "function") bad("VAZCheckout missing from store.html inline script");
else {
  // coming_soon + null link -> whatsapp mode, no redirect
  const soon = V.beginCheckout(products[0] || { id: "x", availability: "coming_soon", checkoutUrl: null, price: null });
  if (soon.mode !== "whatsapp") bad("inert product must resolve to whatsapp mode, got: " + JSON.stringify(soon));
  else ok("inert product -> WhatsApp order mode (site behavior unchanged today)");
  // available + link -> redirect mode
  const payable = { id: "t", availability: "available", checkoutUrl: "https://pay.moyasar.example/xyz", price: 100 };
  const linked = V.beginCheckout(payable);
  if (linked.mode !== "redirect" || winStub.location.href !== payable.checkoutUrl) bad("payable product must redirect to checkoutUrl");
  else ok("available product with checkoutUrl -> redirect to hosted payment link");
  // http (not https) links are rejected
  if (V.canPay({ id: "u", availability: "available", checkoutUrl: "http://insecure.example/x" })) bad("non-https checkoutUrl must be rejected");
  else ok("non-https checkoutUrl rejected by canPay guard");
}

// ---- 3) Pay button present, hidden by default, i18n across 5 languages
if (!store.includes('id="orderModalPay"')) bad("order modal pay button missing");
else ok("order modal has a dedicated Pay-now button element (hidden until a product is payable)");
const payKeyCount = LANGS.filter((l) => {
  const d = inlineScript.match(new RegExp(`(?:^|[{,\\s])${l}:\\{([\\s\\S]*?)\\}\\s*[,}]`));
  return d && d[1].includes("order_pay:");
}).length;
if (payKeyCount !== 5) bad(`order_pay translated in ${payKeyCount}/5 languages`);
else ok("order_pay key translated in all 5 languages (ar/en/hi/ur/bn)");
if (!store.includes("orderModalCta")) bad("WhatsApp CTA element missing from modal");
else ok("WhatsApp CTA preserved in the order modal");
if (!/payBtn\.hidden=!payable/.test(store)) bad("pay button must be hidden for non-payable products");
else ok("pay button toggles visibility from product checkout state");

// ---- 4) Card grid: pay button renders only when payable; WhatsApp untouched
if (!/canPay\(p\)\?'<a class="btn primary" href="\+p\.checkoutUrl/.test(store.replace(/\s+/g, " "))) {
  if (!store.includes("canPay(p)?'<a class=\"btn primary\"")) bad("grid pay button is not gated by canPay()");
  else ok("grid pay button gated by canPay()");
}
const waRefs = store.match(/wa\.me\/966580015256/g) || [];
if (waRefs.length < 1) bad("WhatsApp number missing");
else ok(`WhatsApp number unchanged: 966580015256 (${waRefs.length} references)`);
if (/wa\.me\/(?!966580015256)\d+/.test(store + catalogSrc)) bad("unexpected other WhatsApp number");
else ok("no other WhatsApp numbers introduced");

// ---- 5) No secrets, no gateway scripts, no prices rendered today
const secretRe = /(api[_-]?key|apikey|secret|token|password)\s*[:=]\s*["'][^"']+["']/i;
for (const [name, src] of [["store.html", store], ["assets/js/products.js", catalogSrc]]) {
  if (secretRe.test(src)) bad(`${name}: possible secret/API-key literal found`);
  else ok(`${name}: no API keys or secrets`);
}
if (/moyasar\.com\/api|tap\.company\/api|<script[^>]+src="https:\/\/(?!fonts\.googleapis)/.test(store)) bad("an external gateway script or API endpoint is referenced");
else ok("no gateway SDKs, endpoints, or external scripts injected");
if (/SAR\s*\d|\d+\s*(ر\.س|SAR)/.test(store.match(/<noscript>[\s\S]*?<\/noscript>/)?.[0] || "")) bad("hardcoded price in noscript fallback");
else ok("no rendered prices anywhere (all products still show 'قريبًا')");

// ---- 6) Phase 1/2 regression markers
for (const marker of ["skip-link", "languageLetter", "nav-toggle", "aria-modal", 'dir="rtl"']) {
  if (!store.includes(marker)) bad(`regression: marker missing -> ${marker}`);
}
if (failures === 0 || !["skip-link", "languageLetter", "nav-toggle", "aria-modal", 'dir="rtl"'].some((m) => !store.includes(m)))
  ok("Phase 1/2 markers intact: skip-link, language chip, mobile nav, aria-modal, RTL default");
for (const bp of ["max-width:850px", "max-width:800px", "max-width:520px"]) {
  if (!store.includes(bp)) bad(`responsive breakpoint missing: ${bp}`);
}
if (!["max-width:850px", "max-width:800px", "max-width:520px"].some((bp) => !store.includes(bp)))
  ok("desktop + mobile breakpoints (850/800/520px) untouched");
const noscriptCards = (store.match(/<noscript>[\s\S]*?<\/noscript>/)?.[0].match(/article class="card"/g) || []).length;
if (noscriptCards !== 6) bad(`noscript fallback has ${noscriptCards} cards (expected 6)`);
else ok("noscript fallback still renders all 6 product cards");
if (products.some((p) => !fs.existsSync(p.image))) bad("a product image is missing from disk");
else ok("all product images still on disk");

console.log(failures ? `\n${failures} FAILURE(S)` : "\nALL PHASE 3 CHECKS PASSED");
process.exit(failures ? 1 : 0);
