#!/usr/bin/env node
/**
 * QA script for the PWA build output.
 *
 * Run AFTER `vite build`. Verifies that:
 *  - dist/sw.js and dist/manifest.webmanifest exist
 *  - manifest has required fields and points to icons that exist
 *  - service worker precaches a sane number of files
 *  - service worker honors the navigateFallbackDenylist (/~oauth, /api, /functions/)
 *  - no precached asset is too large (warning above 4 MiB)
 *
 * Exits with code 0 on success, 1 on failure.
 *
 * Usage:
 *   node scripts/qa-pwa.mjs
 *   npm run qa:pwa
 */
import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, "..", "dist");

const checks = [];
let failed = 0;

const pass = (name, detail = "") => {
  checks.push({ status: "ok", name, detail });
  console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ""}`);
};
const fail = (name, detail) => {
  failed++;
  checks.push({ status: "fail", name, detail });
  console.log(`  ✗ ${name} — ${detail}`);
};
const warn = (name, detail) => {
  checks.push({ status: "warn", name, detail });
  console.log(`  ⚠ ${name} — ${detail}`);
};

const readJson = async (p) => JSON.parse(await readFile(p, "utf8"));

console.log("\n🔎 PWA build QA\n");

// --- 1. dist exists ---
if (!existsSync(DIST)) {
  console.error(`✗ dist/ not found at ${DIST}. Run "vite build" first.`);
  process.exit(1);
}

// --- 2. SW + manifest files present ---
const SW = resolve(DIST, "sw.js");
const MANIFEST = resolve(DIST, "manifest.webmanifest");
const INDEX = resolve(DIST, "index.html");

if (existsSync(SW)) pass("sw.js gerado");
else fail("sw.js gerado", `arquivo não encontrado em ${SW}`);

if (existsSync(MANIFEST)) pass("manifest.webmanifest gerado");
else fail("manifest.webmanifest gerado", `arquivo não encontrado em ${MANIFEST}`);

if (existsSync(INDEX)) pass("index.html gerado");
else fail("index.html gerado", `arquivo não encontrado em ${INDEX}`);

// --- 3. Manifest content checks ---
let manifest = null;
if (existsSync(MANIFEST)) {
  try {
    manifest = await readJson(MANIFEST);
  } catch (e) {
    fail("manifest é JSON válido", String(e));
  }
}

if (manifest) {
  pass("manifest é JSON válido");

  const required = ["name", "short_name", "start_url", "display", "icons", "theme_color", "background_color"];
  for (const key of required) {
    if (manifest[key] !== undefined && manifest[key] !== null && manifest[key] !== "")
      pass(`manifest.${key} presente`, JSON.stringify(manifest[key]).slice(0, 60));
    else fail(`manifest.${key} presente`, "campo obrigatório ausente");
  }

  if (manifest.display !== "standalone" && manifest.display !== "fullscreen") {
    warn("manifest.display", `valor "${manifest.display}" — recomendado "standalone"`);
  }

  // Icons check
  if (Array.isArray(manifest.icons)) {
    const sizes = manifest.icons.map((i) => i.sizes);
    const has192 = sizes.some((s) => s?.includes("192"));
    const has512 = sizes.some((s) => s?.includes("512"));
    has192 ? pass("ícone 192x192 declarado") : fail("ícone 192x192 declarado", "não encontrado em manifest.icons");
    has512 ? pass("ícone 512x512 declarado") : fail("ícone 512x512 declarado", "não encontrado em manifest.icons");

    const hasMaskable = manifest.icons.some((i) => i.purpose?.includes("maskable"));
    hasMaskable ? pass("ícone maskable declarado") : warn("ícone maskable declarado", "recomendado para Android");

    // Verify each icon file actually exists in dist
    for (const icon of manifest.icons) {
      const iconPath = resolve(DIST, icon.src.replace(/^\//, ""));
      if (existsSync(iconPath)) {
        const s = await stat(iconPath);
        pass(`ícone existe: ${icon.src}`, `${(s.size / 1024).toFixed(1)} KB`);
      } else {
        fail(`ícone existe: ${icon.src}`, "arquivo não encontrado em dist/");
      }
    }
  }
}

// --- 4. Service worker content checks ---
if (existsSync(SW)) {
  const swSource = await readFile(SW, "utf8");
  const swStat = await stat(SW);
  pass("sw.js tamanho", `${(swStat.size / 1024).toFixed(1)} KB`);

  // Check precache manifest is non-empty (workbox injects __WB_MANIFEST array)
  const precacheMatch = swSource.match(/\[\s*(\{[^}]*"url"[^}]*\}\s*,?\s*)+\]/);
  if (precacheMatch) {
    const entries = (precacheMatch[0].match(/"url"/g) || []).length;
    if (entries >= 3) pass("precache não vazio", `${entries} entradas`);
    else fail("precache não vazio", `só ${entries} entradas`);
  } else {
    warn("precache detectável", "não foi possível extrair o manifesto via regex");
  }

  // Check denylist patterns are honored — workbox stringifies them as RegExp source
  const denylistPatterns = ["~oauth", "/api", "/functions/"];
  for (const p of denylistPatterns) {
    if (swSource.includes(p)) pass(`denylist contém "${p}"`);
    else fail(`denylist contém "${p}"`, "navigateFallbackDenylist não foi propagado");
  }
}

// --- 5. Asset size sanity ---
const assetsDir = resolve(DIST, "assets");
if (existsSync(assetsDir)) {
  const { readdir } = await import("node:fs/promises");
  const files = await readdir(assetsDir);
  let largest = { name: "", size: 0 };
  for (const f of files) {
    const s = await stat(resolve(assetsDir, f));
    if (s.size > largest.size) largest = { name: f, size: s.size };
  }
  const mb = largest.size / 1024 / 1024;
  if (mb > 4) warn("maior asset", `${largest.name} = ${mb.toFixed(2)} MB (acima de 4 MiB)`);
  else pass("maior asset", `${largest.name} = ${mb.toFixed(2)} MB`);
}

// --- Summary ---
console.log("\n" + "─".repeat(50));
const okCount = checks.filter((c) => c.status === "ok").length;
const warnCount = checks.filter((c) => c.status === "warn").length;
console.log(`${okCount} ok · ${warnCount} avisos · ${failed} falhas`);

if (failed > 0) {
  console.error(`\n❌ QA falhou com ${failed} erro(s).\n`);
  process.exit(1);
}
console.log("\n✅ PWA build OK.\n");
