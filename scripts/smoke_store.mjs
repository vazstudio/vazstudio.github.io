// Real-DOM smoke test for store.html (jsdom — already a project devDependency).
// Strategy: jsdom builds the real DOM (runScripts: "outside-only" — nothing
// executes, no network); the page's catalog + inline scripts are then run
// against that live DOM via a Function harness, so real events fire on real
// elements while every error stays catchable in test code.
import fs from "node:fs";
import jsdomDefault from "jsdom";
const { JSDOM } = jsdomDefault;

let failures = 0;
const ok = (m) => console.log("PASS  " + m);
const bad = (m) => { failures++; console.error("FAIL  " + m); };
const check = (cond, passMsg, failMsg) => (cond ? ok(passMsg) : bad(failMsg));

const html = fs.readFileSync("store.html", "utf8");
const catalog = fs.readFileSync("assets/js/products.js", "utf8");
const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join("\n");

const dom = new JSDOM(html, {
  url: "http://localhost:8000/store.html",
  runScripts: "outside-only", // real DOM, page scripts NOT auto-executed
  pretendToBeVisual: true,
});
const { window } = dom;
const { document } = window;

// ---- 0) Execute the page's scripts against the live jsdom DOM
let execError = null;
try {
  new Function(
    "window", "document", "localStorage",
    catalog + "\n" + inline +
    "\n;window.applyLanguage=applyLanguage;"
  )(window, document, window.localStorage);
} catch (err) { execError = err; }
check(execError === null, "products.js + store.html inline script executed on a real DOM without errors",
  `page script crashed: ${execError && execError.message}`);
if (execError) { console.error(`\n${failures} FAILURE(S)`); process.exit(1); }

// ---- 1) Grid renders 6 cards from the catalog with sized images
const cards = document.querySelectorAll("#productGrid article.card");
check(cards.length === 6, `grid rendered ${cards.length}/6 product cards`, `grid rendered ${cards.length}/6 product cards`);
const sizedImgs = [...cards].filter((c) => {
  const img = c.querySelector("img");
  return img && img.getAttribute("width") && img.getAttribute("height") && img.getAttribute("loading") === "lazy";
}).length;
check(sizedImgs === 6, "all 6 card images carry width/height + lazy loading", `only ${sizedImgs}/6 card images carry width/height + lazy`);

// ---- 2) No pay buttons on the grid today (every product inert)
check(document.querySelectorAll('#productGrid [data-i18n="order_pay"]').length === 0,
  "no 'Pay now' buttons on the grid (no product is payable yet)",
  "'Pay now' button rendered although every product should be inert");

// ---- 3) Order modal flow: open from first card, inert state, WhatsApp payload
// jsdom (outside-only) throws inside its focus-update steps, so neutralize
// focus for this harness only — focus management itself is browser-correct.
document.getElementById("orderModalClose").focus = () => {};
const modal = document.getElementById("orderModal");
const payBtn = document.getElementById("orderModalPay");
const cta = document.getElementById("orderModalCta");
const firstOrderLink = document.querySelector("#productGrid [data-order]");
const firstName = window.VAZ_PRODUCTS[0].name;
firstOrderLink.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
check(modal && modal.hidden === false, "clicking a card's order button opens the order modal", "order modal did not open on card click");
check(document.getElementById("orderModalName").textContent === firstName,
  `modal shows product name "${firstName}"`, `modal shows "${document.getElementById("orderModalName").textContent}" instead of "${firstName}"`);
check(payBtn.hidden === true, "pay button stays hidden for an inert (coming-soon) product", "pay button visible for a non-payable product");
check(cta.href.startsWith("https://wa.me/966580015256?text=") && decodeURIComponent(cta.href.split("?text=")[1] || "").includes(firstName),
  "modal CTA targets the unchanged WhatsApp number with the product name encoded in the message",
  `modal CTA payload wrong: ${cta.href}`);
check(document.body.style.overflow === "hidden", "page scroll locked while the modal is open", "body scroll not locked while modal open");

// Escape closes and restores scroll
document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
check(modal.hidden === true, "Escape closes the order modal", "Escape did not close the modal");
check(document.body.style.overflow === "", "body scroll restored after closing", "body scroll not restored after close");

// ---- 4) Checkout engine guards in the live page context
const V = window.VAZCheckout;
check(!!V && V.canPay({ availability: "available", checkoutUrl: "https://x.example/p" }) === true,
  "VAZCheckout.canPay accepts an available product with an https link", "canPay rejected a valid payable product");
check(!!V && V.canPay({ availability: "coming_soon", checkoutUrl: "https://x.example/p" }) === false,
  "canPay rejects coming_soon products even with a link", "canPay accepted a coming_soon product");
check(!!V && V.beginCheckout({ id: "z", availability: "coming_soon", checkoutUrl: null, price: null }).mode === "whatsapp",
  "beginCheckout on an inert product resolves to WhatsApp mode (behavior unchanged)", "beginCheckout broke inert behavior");

// ---- 5) RTL Arabic-first default + LTR switch
check(document.documentElement.dir === "rtl" && document.documentElement.lang === "ar",
  "default language is Arabic with RTL direction", `unexpected default: lang=${document.documentElement.lang} dir=${document.documentElement.dir}`);
window.applyLanguage("en");
const nav = document.querySelector('[data-i18n="nav_home"]');
check(document.documentElement.dir === "ltr" && nav.textContent === "Home" && document.getElementById("languageLetter").textContent === "E",
  "switching to English flips to LTR and translates nav + language chip",
  `English switch incomplete: dir=${document.documentElement.dir} nav="${nav.textContent}" chip="${document.getElementById("languageLetter").textContent}"`);
window.applyLanguage("ar");
check(document.documentElement.dir === "rtl", "switching back restores Arabic RTL", "Arabic restore failed");

window.close();
console.log(failures ? `\n${failures} FAILURE(S)` : "\nALL SMOKE CHECKS PASSED");
process.exit(failures ? 1 : 0);
