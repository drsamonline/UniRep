/**
 * Rewrites an exported web build so it can be served from a sub-path.
 *
 * `expo export` writes root-absolute references (`/_expo/…`, `/assets/…`), which
 * 404 when the build is published at `/UniRep/app/`. This makes them relative and
 * adds a `<base href>` so the app still resolves them correctly, without changing
 * the export used by the desktop shell (which serves the build from `/`).
 *
 *   node scripts/rewrite-web-paths.mjs <dist-dir> <base-path>
 *
 * Example: node scripts/rewrite-web-paths.mjs app/dist /UniRep/app/
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";

const [dirArg, baseArg] = process.argv.slice(2);
if (!dirArg || !baseArg) {
  console.error("usage: node scripts/rewrite-web-paths.mjs <dist-dir> <base-path>");
  process.exit(2);
}

const dir = resolve(dirArg);
const base = baseArg.endsWith("/") ? baseArg : `${baseArg}/`;
const prefixes = ["/_expo/", "/assets/"];
let changed = 0;

function walk(current) {
  for (const entry of readdirSync(current)) {
    const path = join(current, entry);
    if (statSync(path).isDirectory()) {
      walk(path);
      continue;
    }
    const ext = extname(path);
    if (![".html", ".js", ".json"].includes(ext)) continue;

    const before = readFileSync(path, "utf8");
    let after = before;
    for (const prefix of prefixes) {
      after = after.split(`"${prefix}`).join(`"${prefix.slice(1)}`);
      after = after.split(`'${prefix}`).join(`'${prefix.slice(1)}`);
    }
    if (ext === ".html") {
      after = after.split('"/favicon.ico"').join('"favicon.ico"');
    }
    if (ext === ".html" && !after.includes("<base ")) {
      after = after.replace("<head>", `<head>\n<base href="${base}">`);
    }
    if (after !== before) {
      writeFileSync(path, after);
      changed += 1;
    }
  }
}

walk(dir);
console.log(`rewrote ${changed} file(s) in ${dir} for base ${base}`);
