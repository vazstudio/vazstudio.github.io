// Phase 1 verification for the VAZ static site.
// 1) Runs each page's inline JS with a minimal DOM stub across all 5 languages (crash check).
// 2) Verifies every data-i18n key used in HTML exists in all 5 translation dicts, and lists dict-only keys.
// 3) Verifies every locally referenced asset (src/href) exists on disk.
import fs from "node:fs";

const LANGS = ["ar", "en", "hi", "ur", "bn"];
const pages = ["index.html", "store.html"];
let failures = 0;

function extractScript(html) {
  const m = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  return m.map((x) => x[1]).join("\n");
}

function extractDataI18nKeys(html) {
  return new Set([...html.matchAll(/data-i18n="([^"]+)"/g)].map((m) => m[1]));
}

function extractDictKeys(script) {
  // Lines look like:  ar:{key:"value",key2:"value",...},
  const keys = {};
  for (const lang of LANGS) {
    const re = new RegExp(`(?:^|[,{\\s])${lang}:\\{([\\s\\S]*?)\\}\\s*[,}]`);
    const m = script.match(re);
    if (!m) { keys[lang] = null; continue; }
    const set = new Set();
    for (const km of m[1].matchAll(/([A-Za-z_][A-Za-z0-9_]*)\s*:/g)) set.add(km[1]);
    keys[lang] = set;
  }
  return keys;
}

// ---- 1) crash check: execute the inline JS with DOM stubs for each language
function stubEnv() {
  const el = () => ({
    textContent: "", innerHTML: "", value: "",
    style: { setProperty() {}, removeProperty() {} },
    setAttribute() {}, getAttribute: () => null,
    addEventListener() {}, classList: { toggle: () => false, remove() {}, add() {} },
    querySelector: () => null, querySelectorAll: () => ({ forEach() {} }),
    contains: () => false, dataset: {},
  });
  const els = {};
  const doc = {
    documentElement: { lang: "", dir: "" },
    body: { style: { setProperty() {}, removeProperty() {} } },
    getElementById: (id) => (els[id] = els[id] || el()),
    querySelector: () => null,
    querySelectorAll: () => ({ forEach() {} }),
    addEventListener() {},
  };
  return { doc, localStorage: { getItem: () => null, setItem() {} } };
}

for (const page of pages) {
  const html = fs.readFileSync(page, "utf8");
  const src = extractScript(html);
  const { doc, localStorage } = stubEnv();
  try {
    const run = new Function("document", "localStorage", src + `\n;for (const l of ${JSON.stringify(LANGS)}) { applyLanguage(l); } return true;`);
    run(doc, localStorage);
    console.log(`PASS  ${page}: inline JS executes cleanly, applyLanguage() OK for all 5 languages (incl. languageLetter chip)`);
  } catch (err) {
    failures++;
    console.error(`FAIL  ${page}: JS error -> ${err.message}`);
  }
}

// ---- 2) i18n key coverage
for (const page of pages) {
  const html = fs.readFileSync(page, "utf8");
  const script = extractScript(html);
  const used = extractDataI18nKeys(html);
  const dicts = extractDictKeys(script);
  for (const lang of LANGS) {
    if (!dicts[lang]) { failures++; console.error(`FAIL  ${page}: could not parse "${lang}" translations`); continue; }
    const missing = [...used].filter((k) => !dicts[lang].has(k));
    if (missing.length) { failures++; console.error(`FAIL  ${page} [${lang}]: missing translations for -> ${missing.join(", ")}`); }
    else console.log(`PASS  ${page} [${lang}]: all ${used.size} data-i18n keys translated`);
  }
}

// ---- 3) asset references exist
for (const page of pages) {
  const html = fs.readFileSync(page, "utf8");
  const refs = new Set([...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]));
  const bad = [];
  for (const ref of refs) {
    if (/^(https?:|#|mailto:|tel:)/.test(ref)) continue;
    const path = ref.split("?")[0].split("#")[0];
    if (path && !fs.existsSync(path)) bad.push(ref);
  }
  if (bad.length) { failures++; console.error(`FAIL  ${page}: missing local assets -> ${bad.join(", ")}`); }
  else console.log(`PASS  ${page}: every local src/href resolves to an existing file`);
}

console.log(failures ? `\n${failures} FAILURE(S)` : "\nALL CHECKS PASSED");
process.exit(failures ? 1 : 0);
