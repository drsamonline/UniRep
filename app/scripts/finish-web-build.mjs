/**
 * Completes the static web export.
 *
 * `expo export` bundles JavaScript and the app's own assets, but two files the
 * browser fetches at runtime live outside the bundle:
 *
 *   dist/sql-wasm.wasm   the SQLite engine compiled to WebAssembly (from sql.js)
 *   dist/unirep_core.db  the repertory database the web build searches
 *
 * Both are copied here so `dist/` is a complete, self-contained site. Run after
 * `expo export --platform web --output-dir dist` (the `export:web` script does).
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// fileURLToPath, not .pathname: on Windows the latter yields "/D:/a/…", which
// resolve() turns into an unusable path.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

const sqlDist = join(root, "node_modules", "sql.js", "dist");
// sql.js ships two WASM builds; the bundler may pick either (`sql-wasm.wasm` or
// the browser build), so every .wasm is copied and requests for both succeed.
const wasm = existsSync(sqlDist)
  ? readdirSync(sqlDist)
      .filter((file) => file.endsWith(".wasm"))
      .map((file) => [join(sqlDist, file), join(dist, file)])
  : [[join(sqlDist, "sql-wasm.wasm"), join(dist, "sql-wasm.wasm")]];

const copies = [
  ...wasm,
  [join(root, "assets", "unirep_core.db"), join(dist, "unirep_core.db")],
];

if (!existsSync(dist)) {
  console.error("dist/ not found — run `expo export --platform web --output-dir dist` first.");
  process.exit(1);
}

let failed = false;
for (const [from, to] of copies) {
  if (!existsSync(from)) {
    console.error(`missing: ${from}`);
    if (from.endsWith("unirep_core.db")) {
      console.error("  build it with: ./scripts/prepare-app-data.sh");
    }
    failed = true;
    continue;
  }
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
  console.log(`copied ${(statSync(to).size / 1048576).toFixed(1)} MB -> ${to.replace(root + "/", "")}`);
}

if (failed) process.exit(1);
console.log("web build complete: dist/ is self-contained");
