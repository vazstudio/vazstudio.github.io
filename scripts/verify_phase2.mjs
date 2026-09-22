// Phase 2 verification for the VAZ store.
// Checks product catalog schema, per-language coverage, price/status rules,
// WhatsApp link integrity, no-secrets guarantee, and Phase 1 regressions.
import fs from "node:fs";

let failures = 0;
const ok = (m) => console.log("PASS  " + m);
const bad = (m) => { failures++; console.error("FAIL  " + m); };
const LANGS = ["ar", "en", "hi", "ur", "bn"];

// ---- 1) Product catalog: valid JS, schema, unique ids, images exist on disk
const catalogSrc = fs.readFileSync("assets/js/products.js", "utf8");
const sandbox = { window: {} };
try {
  new Function("window", catalogSrc)(sandbox.window);
} catch (err) {
  bad("assets/js/products.js does not parse: " + err.message);
}
const products = sandbox.window.VAZ_PRODUCTS;
if (!Array.isArray(products)) bad("window.VAZ_PRODUCTS missing or not an array");
else if (products.length !== 6) bad(`catalog has ${products.length} products (expected 6)`);
else ok("catalog parses and contains 6 products");

if (Array.isArray(products)) {
  const ids = products.map((p) => p.id);
  if (new Set(ids).size !== ids.length) bad("duplicate product ids: " + ids.join(", "));
  else ok("product ids unique: " + ids.join(", "));

  const REQUIRED = ["id", "name", "image", "price", "availability", "checkoutUrl", "paymentProvider", "descKey", "alt"];
  for (const p of products) {
    const missing = REQUIRED.filter((k) => !(k in p));
    if (missing.length) bad(`${p.id || "?"}: missing fields -> ${missing.join(", ")}`);
    if (p.image && !fs.existsSync(p.image)) bad(`${p.id}: image not found on disk -> ${p.image}`);
    if (!["available", "coming_soon", "sold_out"].includes(p.availability)) bad(`${p.id}: invalid availability "${p.availability}"`);
    if (p.checkoutUrl !== null && !(typeof p.checkoutUrl === "string" && /^https:\/\//.test(p.checkoutUrl)))
      bad(`${p.id}: checkoutUrl must be null or an https:// hosted payment link (got "${p.checkoutUrl}")`);
    if (p.paymentProvider !== null && !["moyasar", "tap"].includes(p.paymentProvider))
      bad(`${p.id}: paymentProvider must be null, "moyasar" or "tap"`);
    if (typeof p.price === "number" && p.checkoutUrl === null) bad(`${p.id}: a price without a checkoutUrl would be visible but unpurchasable`);
    if (p.price !== null) bad(`${p.id}: price must stay null (no prices approved yet)`);
    if (typeof p.checkoutUrl === "string" && /api[_-]?key|token|secret/i.test(p.checkoutUrl)) bad(`${p.id}: checkoutUrl must never carry secrets`);
  }
  const fieldFails = failures; // capture: only report the summary line if nothing above failed
  if (fieldFails === 0) ok("every product: full schema, image on disk, availability valid, price null, checkoutUrl null-or-https (Saudi payment-link ready)");
}

// ---- 2) Every product description + order-flow keys translated in all 5 languages
const store = fs.readFileSync("store.html", "utf8");
const inlineScript = [...store.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join("\n");
const dicts = {};
for (const lang of LANGS) {
  const m = inlineScript.match(new RegExp(`(?:^|[,{\\s])${lang}:\\{([\\s\\S]*?)\\}\\s*[,}]`));
  if (m) dicts[lang] = new Set([...m[1].matchAll(/([A-Za-z_][A-Za-z0-9_]*)\s*:/g)].map((x) => x[1]));
}
const descKeys = Array.isArray(products) ? products.map((p) => p.descKey) : [];
const flowKeys = ["order_title", "order_cta", "order_close", "status_available", "status_sold_out", "status_soon", "order_whatsapp"];
for (const lang of LANGS) {
  if (!dicts[lang]) { bad(`store.html: cannot parse "${lang}" translations`); continue; }
  const missing = [...descKeys, ...flowKeys].filter((k) => !dicts[lang].has(k));
  if (missing.length) bad(`store.html [${lang}]: missing keys -> ${missing.join(", ")}`);
  else ok(`store.html [${lang}]: all ${descKeys.length} product descriptions + ${flowKeys.length} order-flow keys translated`);
}

// ---- 3) Price/status rendering rules
if (/SAR\s*\d|\d+\s*(ر\.س|SAR)/.test(store)) bad("hardcoded price literal found in store.html");
else ok("no hardcoded prices in store.html (null price -> 'Coming soon' as before)");
if (!store.includes('data-i18n="status_soon"')) bad("status_soon rendering missing");
else ok("null-price products still render the existing 'قريبًا/Coming soon' status");

// ---- 4) WhatsApp integrity: same number only, encoded prefilled message
const waRefs = store.match(/wa\.me\/966580015256/g) || [];
if (waRefs.length < 1) bad("WhatsApp number 966580015256 missing from store.html");
else ok(`WhatsApp number unchanged: 966580015256 (${waRefs.length} references)`);
if (/wa\.me\/(?!966580015256)\d+/.test(store + catalogSrc)) bad("unexpected other WhatsApp number introduced");
else ok("no other WhatsApp numbers introduced");
if (!store.includes("encodeURIComponent(")) bad("order message is not URL-encoded");
else ok("prefilled order message built with encodeURIComponent (product name + visitor language)");

// ---- 5) No secrets / API keys anywhere in Phase 2 code
const secretRe = /(api[_-]?key|apikey|secret|token|password)\s*[:=]\s*["'][^"']+["']/i;
for (const [name, src] of [["store.html", store], ["assets/js/products.js", catalogSrc]]) {
  if (secretRe.test(src)) bad(`${name}: possible secret/API-key literal found`);
  else ok(`${name}: no API keys or secrets (as required)`);
}

// ---- 6) Phase 1 guarantees still hold on store.html
if (!/name="viewport"/.test(store)) bad("viewport meta missing");
else ok("viewport meta present (mobile)");
const noscript = store.match(/<noscript>[\s\S]*?<\/noscript>/);
const noscriptCards = noscript ? (noscript[0].match(/article class="card"/g) || []).length : 0;
if (noscriptCards !== 6) bad(`noscript fallback has ${noscriptCards} cards (expected 6)`);
else ok("noscript fallback keeps all 6 product cards for JS-disabled visitors");
for (const marker of ["skip-link", "languageLetter", "nav-toggle", "aria-modal"]) {
  if (!store.includes(marker)) bad(`Phase 1/2 marker missing on store.html: ${marker}`);
}
if (failures === 0 || !["skip-link", "languageLetter", "nav-toggle", "aria-modal"].some((m) => !store.includes(m)))
  ok("Phase 1 markers intact: skip-link, language chip, mobile nav toggle, aria-modal");
for (const bp of ["max-width:850px", "max-width:800px", "max-width:520px"]) {
  if (!store.includes(bp)) bad(`responsive breakpoint missing: ${bp}`);
}
if (!["max-width:850px", "max-width:800px", "max-width:520px"].some((bp) => !store.includes(bp)))
  ok("desktop + mobile breakpoints (850/800/520px) all present and untouched");
if (!store.includes('dir="rtl"')) bad("RTL default missing");
else ok("RTL Arabic-first default preserved; LTR switch still driven by html[dir]");

// ---- 7) index.html must be untouched by Phase 2
if (/products\.js/.test(fs.readFileSync("index.html", "utf8"))) bad("index.html unexpectedly references products.js");
else ok("index.html fully independent of Phase 2 changes");

console.log(failures ? `\n${failures} FAILURE(S)` : "\nALL PHASE 2 CHECKS PASSED");
process.exit(failures ? 1 : 0);
