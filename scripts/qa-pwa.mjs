#!/usr/bin/env node
/**
 * QA script for the PWA build output.
 *
 * Run AFTER `vite build`. Verifies that:
 *  - dist/sw.js and dist/manifest.webmanifest exist
 *  - manifest has required fields and points to icons that exist
 *  - service worker precaches a sane number of files (parsed from workbox manifest)
 *  - service worker honors the navigateFallbackDenylist (/~oauth, /api, /functions/)
 *  - no precached asset is too large (warning above 4 MiB)
 *
 * Exits with code 0 on success, 1 on failure.
 * Prints a detailed failure report at the end with exact missing paths.
 *
 * Usage:
 *   node scripts/qa-pwa.mjs
 *   npm run qa:pwa
 */
import { readFile, stat, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, "..", "dist");

const checks = [];
const failures = []; // detailed failure records

const pass = (name, detail = "") => {
  checks.push({ status: "ok", name, detail });
  console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ""}`);
};
const fail = (name, detail, hint = "") => {
  checks.push({ status: "fail", name, detail });
  failures.push({ name, detail, hint });
  console.log(`  ✗ ${name} — ${detail}`);
};
const warn = (name, detail) => {
  checks.push({ status: "warn", name, detail });
  console.log(`  ⚠ ${name} — ${detail}`);
};
const section = (title) => console.log(`\n· ${title}`);

const safeReadJson = async (p) => {
  try {
    const raw = await readFile(p, "utf8");
    return { ok: true, data: JSON.parse(raw) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
};

console.log("\n🔎 PWA build QA\n");

// --- 1. dist exists ---
if (!existsSync(DIST)) {
  console.error(`\n✗ dist/ não encontrado em ${DIST}.`);
  console.error(`  Rode "vite build" antes de executar este script.\n`);
  process.exit(1);
}

// --- 2. SW + manifest files present ---
section("Arquivos gerados");
const SW = resolve(DIST, "sw.js");
const MANIFEST = resolve(DIST, "manifest.webmanifest");
const INDEX = resolve(DIST, "index.html");

const swExists = existsSync(SW);
const manifestExists = existsSync(MANIFEST);
const indexExists = existsSync(INDEX);

swExists
  ? pass("sw.js gerado", SW)
  : fail("sw.js gerado", `arquivo ausente: ${SW}`, "Confirme que vite-plugin-pwa está ativo no vite.config.ts e que o build terminou sem erros.");

manifestExists
  ? pass("manifest.webmanifest gerado", MANIFEST)
  : fail("manifest.webmanifest gerado", `arquivo ausente: ${MANIFEST}`, "Verifique o bloco `manifest` em VitePWA() no vite.config.ts.");

indexExists
  ? pass("index.html gerado", INDEX)
  : fail("index.html gerado", `arquivo ausente: ${INDEX}`, "Build incompleto — rode `vite build` novamente.");

// --- 3. Manifest content checks ---
section("Conteúdo do manifest");
let manifest = null;
if (manifestExists) {
  const result = await safeReadJson(MANIFEST);
  if (!result.ok) {
    fail("manifest é JSON válido", result.error, "Edite o bloco `manifest` no vite.config.ts e re-build.");
  } else {
    manifest = result.data;
    pass("manifest é JSON válido");

    const required = ["name", "short_name", "start_url", "display", "icons", "theme_color", "background_color"];
    for (const key of required) {
      const value = manifest[key];
      const present = value !== undefined && value !== null && value !== "";
      if (present) {
        const preview = JSON.stringify(value).slice(0, 60);
        pass(`manifest.${key} presente`, preview);
      } else {
        fail(
          `manifest.${key} presente`,
          "campo obrigatório ausente ou vazio",
          `Adicione "${key}" ao bloco manifest em vite.config.ts`,
        );
      }
    }

    if (manifest.display && manifest.display !== "standalone" && manifest.display !== "fullscreen") {
      warn("manifest.display", `valor "${manifest.display}" — recomendado "standalone"`);
    }

    // Icons check
    if (Array.isArray(manifest.icons) && manifest.icons.length > 0) {
      const sizes = manifest.icons.map((i) => i.sizes || "");
      const has192 = sizes.some((s) => s.includes("192"));
      const has512 = sizes.some((s) => s.includes("512"));
      has192
        ? pass("ícone 192x192 declarado")
        : fail("ícone 192x192 declarado", "não encontrado em manifest.icons", "Adicione { src, sizes: '192x192', type: 'image/png' } ao manifest.");
      has512
        ? pass("ícone 512x512 declarado")
        : fail("ícone 512x512 declarado", "não encontrado em manifest.icons", "Adicione { src, sizes: '512x512', type: 'image/png' } ao manifest.");

      const hasMaskable = manifest.icons.some((i) => i.purpose?.includes("maskable"));
      hasMaskable ? pass("ícone maskable declarado") : warn("ícone maskable declarado", "recomendado para Android");

      // Verify each icon file actually exists in dist
      for (const icon of manifest.icons) {
        if (!icon?.src) {
          fail(`ícone sem src`, JSON.stringify(icon), "Cada entry de icons precisa de `src`.");
          continue;
        }
        const relPath = icon.src.replace(/^\//, "");
        const iconPath = resolve(DIST, relPath);
        if (existsSync(iconPath)) {
          try {
            const s = await stat(iconPath);
            pass(`ícone existe: ${icon.src}`, `${(s.size / 1024).toFixed(1)} KB`);
          } catch (e) {
            fail(`ícone existe: ${icon.src}`, `stat falhou: ${e.message}`, `Verifique permissões de ${iconPath}`);
          }
        } else {
          fail(
            `ícone existe: ${icon.src}`,
            `arquivo ausente: ${iconPath}`,
            `Coloque o arquivo em public${icon.src} antes do build.`,
          );
        }
      }
    } else {
      fail("manifest.icons não vazio", "array vazio ou ausente", "Adicione pelo menos os ícones 192x192 e 512x512 ao manifest.");
    }
  }
}

// --- 4. Service worker content checks ---
section("Service worker");
if (swExists) {
  const swSource = await readFile(SW, "utf8");
  const swStat = await stat(SW);
  pass("sw.js tamanho", `${(swStat.size / 1024).toFixed(1)} KB`);

  // Parse precache manifest properly: workbox emits precacheAndRoute([{revision, url}, ...])
  // Find the array argument to precacheAndRoute / addToCacheList.
  const precacheCallMatch = swSource.match(/precacheAndRoute\s*\(\s*(\[[\s\S]*?\])\s*[,)]/);
  let precacheEntries = null;
  if (precacheCallMatch) {
    const arrSrc = precacheCallMatch[1];
    try {
      // Safe-ish eval: workbox emits literal array of {revision,url} objects.
      // Fall back to counting "url" occurrences if eval fails.
      const fn = new Function(`return ${arrSrc};`);
      const parsed = fn();
      if (Array.isArray(parsed)) precacheEntries = parsed;
    } catch {
      const count = (arrSrc.match(/url\s*:/g) || []).length;
      if (count > 0) precacheEntries = new Array(count).fill({ url: "?" });
    }
  }

  if (precacheEntries) {
    if (precacheEntries.length >= 3) {
      pass("precache não vazio", `${precacheEntries.length} entradas`);
      // Sample a few URLs for visibility
      const sample = precacheEntries.slice(0, 5).map((e) => e.url).filter(Boolean);
      if (sample.length) console.log(`     ↳ ex: ${sample.join(", ")}${precacheEntries.length > 5 ? ", …" : ""}`);
    } else {
      fail(
        "precache não vazio",
        `só ${precacheEntries.length} entradas`,
        "Verifique workbox.globPatterns no vite.config.ts.",
      );
    }
  } else {
    warn("precache detectável", "não foi possível parsear precacheAndRoute() — workbox pode ter mudado o formato");
  }

  // Check denylist patterns are honored — workbox escapes "/" as "\/" in RegExp source
  const denylistPatterns = [
    { label: "~oauth", needles: ["~oauth"] },
    { label: "/api", needles: ["\\/api", "/api"] },
    { label: "/functions/", needles: ["\\/functions\\/", "/functions/"] },
  ];
  for (const { label, needles } of denylistPatterns) {
    const found = needles.some((n) => swSource.includes(n));
    if (found) pass(`denylist contém "${label}"`);
    else
      fail(
        `denylist contém "${label}"`,
        "navigateFallbackDenylist não foi propagado",
        `Adicione /${label.replace(/^\//, "")}/ ao workbox.navigateFallbackDenylist no vite.config.ts.`,
      );
  }
}

// --- 5. Asset size sanity ---
section("Tamanho dos assets");
const assetsDir = resolve(DIST, "assets");
if (existsSync(assetsDir)) {
  try {
    const files = await readdir(assetsDir);
    const sized = [];
    for (const f of files) {
      try {
        const s = await stat(resolve(assetsDir, f));
        sized.push({ name: f, size: s.size });
      } catch (e) {
        warn(`stat falhou em assets/${f}`, e.message);
      }
    }
    sized.sort((a, b) => b.size - a.size);
    const top = sized.slice(0, 3);
    for (const t of top) {
      const mb = t.size / 1024 / 1024;
      const label = `assets/${t.name}`;
      if (mb > 4) warn(label, `${mb.toFixed(2)} MB (acima de 4 MiB — workbox pode pular)`);
      else pass(label, `${mb.toFixed(2)} MB`);
    }
  } catch (e) {
    warn("listagem de assets/", e.message);
  }
} else {
  warn("dist/assets ausente", "nada para medir");
}

// --- Summary ---
console.log("\n" + "─".repeat(60));
const okCount = checks.filter((c) => c.status === "ok").length;
const warnCount = checks.filter((c) => c.status === "warn").length;
const failCount = failures.length;
console.log(`${okCount} ok · ${warnCount} avisos · ${failCount} falhas`);

if (failCount > 0) {
  console.error(`\n❌ Relatório detalhado de falhas (${failCount}):\n`);
  failures.forEach((f, i) => {
    console.error(`  ${i + 1}. ${f.name}`);
    console.error(`     motivo: ${f.detail}`);
    if (f.hint) console.error(`     sugestão: ${f.hint}`);
    console.error("");
  });
  console.error(`QA falhou. Corrija os itens acima e rode novamente.\n`);
  process.exit(1);
}

console.log("\n✅ PWA build OK.\n");
