#!/usr/bin/env node
/**
 * Syntax gate for Supabase Edge Functions.
 *
 * These files are Deno TS: `npm run typecheck` skips them (tsconfig excludes
 * supabase/), Vitest never imports them, and the CI has no Deno step. A file can
 * therefore contain a hard parse error — a duplicate `const`, an unbalanced
 * brace — and every gate stays green while the deployed function returns 500 on
 * boot. `get-dashboard-geo` and `get-dashboard-pages` both shipped with a
 * duplicated `const token` binding for exactly this reason.
 *
 * esbuild parses TS without resolving imports, so remote `https://` specifiers
 * and `Deno.*` globals are irrelevant here: this checks syntax only, not types.
 */
import { transformSync } from "esbuild";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const FUNCTIONS_DIR = join(ROOT, "supabase", "functions");

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith(".ts")) out.push(full);
  }
  return out;
}

const files = walk(FUNCTIONS_DIR).sort();
const failures = [];

for (const file of files) {
  const source = readFileSync(file, "utf8");
  try {
    transformSync(source, { loader: "ts", format: "esm" });
  } catch (err) {
    failures.push({ file, errors: err.errors ?? [{ text: err.message }] });
  }
}

for (const { file, errors } of failures) {
  for (const e of errors) {
    const loc = e.location ? `:${e.location.line}:${e.location.column}` : "";
    console.error(`${relative(ROOT, file)}${loc} — ${e.text}`);
  }
}

console.log(
  failures.length === 0
    ? `edge-syntax: ${files.length} files OK`
    : `edge-syntax: ${failures.length}/${files.length} files FAILED`,
);

process.exit(failures.length === 0 ? 0 : 1);
