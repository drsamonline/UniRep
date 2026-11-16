# UniRep — repository audit

Snapshot: 16 November 2026 · `main` · every result below was produced by running
the command, not by reading the code.

## What this repository contains

| Path | Purpose |
|---|---|
| `app/` | The application: Expo (React Native) + Expo Router, TypeScript, ~4,000 lines |
| `app/context/CoreDatabaseContext.tsx` | Native SQLite access to the bundled core (`.web.tsx` queries the same file with sql.js) |
| `app/context/AppContext.tsx` | Cases, patients and repertorisations, stored encrypted |
| `app/lib/vaultCrypto.ts`, `app/lib/secureStorage.ts` | AES-256-GCM envelopes, optional PIN wrapping |
| `desktop/` | Tauri v2 shell that packages the web build as `.exe` / AppImage / `.deb` |
| `app/constants/colors.ts` | light / dark / sepia palettes |
| `docs/` | Landing page (`index.html`), guide, audit, UPI QR, screenshot |
| `scripts/build_core_db.py` | Builds the core database from converted repertory JSON |
| `scripts/prepare-app-data.sh` | Builds that database and installs it as the app's bundled asset |
| `scripts/build-offline.sh` | Offline documentation pack (`dist/`) |
| `scripts/check-links.py` | Local link/asset checker used by CI |
| `unirep_data/DATA-LICENSES.md` | Two-licence data split and the naming table |
| `.github/workflows/` | `links`, `pages`, `android`, `desktop` |
| `PRIVACY.md`, `SECURITY.md`, `LICENSE` | Policy documents, PolyForm Noncommercial 1.0.0 |

## Verification matrix

| Check | Command | Result |
|---|---|---|
| Install (app) | `cd app && pnpm install` | ok, 14.5 s, 488 MB `node_modules` |
| Typecheck | `cd app && tsc -p tsconfig.json --noEmit` | **clean** |
| Web export | `cd app && pnpm run export:web` | ok, `app/dist` 58 MB (includes the 44 MB database and the WASM engine) |
| Rendered in a browser | static serve + cloud browser | loads, no console errors |
| **Web search** | browser, query `anxiety` | **25 rubrics from the real core** ("Chest > Chest > anxiety", "Stomach > Stomach > anxiety", …), header shows `669 CORE` |
| Vault encryption | `node --experimental-strip-types app/lib/vaultCrypto.test.mjs` | 5/5 — round-trip, fresh IV, tamper rejection, PIN wrap, wrong PIN rejected |
| Wide layout | viewport 1600 × 1000 | content centred at max 1180 px, no phone column |
| Themes | clicked Sepia in the browser | palette switches and persists |
| Branding | page render | header reads **UniRep** |
| Local links | `python3 scripts/check-links.py` | 16 links, **0 broken** |
| Workflow YAML | parsed with PyYAML | 3 workflows, valid |
| Core build (full) | `build_core_db.py --source-dir <json>` | 4 books · 266,602 rubrics · 1,330,435 links · 105 MB · `ok: true` |
| Core build (shipped) | `--books repertorium-publicum-2008` | 74,480 rubrics · 735,460 links · 46 MB · all graded · `ok: true` |
| Core in WASM SQLite | sql.js on the generated file | opens 167 ms, 0 FTS objects, 0 placeholder rubrics |
| APK build | — | **not run** (workflow added, first run outstanding) |
| Desktop build | — | **not run** (no Rust toolchain in this workspace; scaffold and workflow added) |
| Native app | — | **not run** (no emulator/device here) |

## Data

- Source: `drsamonline/homoeopathic-materia-medica-repertory-json` (CC0, except
  `repertorium-publicum-2008/`, which is **GPL v3**).
- The shipped core is built from Repertorium Publicum only, so the generated
  database is **GPL v3** and is never committed — see `unirep_data/DATA-LICENSES.md`.
- The earlier uploaded database had 51,268 of 55,768 rubrics as the placeholder
  string `"<Book> extracted rubric N"` and 36,646 generated remedy links; it is
  superseded and its archive has been removed from the repository.
- Kent 1897 and Knerr 1896 are available in the source repository but are poor
  OCR (≈78% and ≈48% debris by a heuristic measure) and Kent is entirely
  ungraded, so they are excluded from the default build.

## Fixed during this work

| Was | Now |
|---|---|
| Dead policy links in the landing page footer | relative/GitHub links; checker in CI |
| Missing UPI QR asset | real QR generated and verified decodable |
| PRIVACY claimed the app ran only on the device while it was hosted | v1.1 then v1.2: the app is local, no host |
| No CI | `links` (local + remote), `pages`, `android` |
| App only on Replit, with a Replit-specific build pipeline | app in `app/`, built by `expo export` |
| Web build could not search (`wa-sqlite.wasm` missing) | sql.js queries the bundled core; verified 25 hits |
| Vault was plain JSON under an "Encrypted" label | AES-256-GCM envelopes, optional PIN-wrapped key |
| Three names (`MateriaAI`, `materia_ai_*`, `UniRep`) | one name: **UniRep** |
| Single phone-width column on desktop | responsive shell with breakpoints |
| Light/dark only, no control | four themes, persisted |
| ~70 MB of upload archives in the tree | removed from `main` (still in history) |

## Known gaps

| Gap | Severity | Detail |
|---|---|---|
| GitHub Pages not enabled | high | `/repos/…/pages` → 404. Workflow is ready; needs *Settings → Pages → Source: GitHub Actions* |
| Web build loads 44 MB first | low | The browser fetches the whole core before searching (measured: 25 hits, ~9 s from cold on this VM). A page-level index would cut that; the data is cached after the first load |
| No desktop binaries yet | medium | Tauri v2 scaffold, icons and a two-platform workflow are in `desktop/`; no Rust toolchain here, so nothing was compiled |
| APK workflow never run | medium | Debug-signed; a release APK needs a signing key or EAS with `EXPO_TOKEN` |
| History still holds the removed archives | low | ~70 MB of blobs remain in past commits; removing them needs a history rewrite (`git filter-repo`), which was not done |
| Remedy names differ across books | low | All-books build has 10,365 tokens vs 669 when only Repertorium Publicum is included |
| PIN unlock has no screen | medium | Encryption and `setVaultPin`/`unlockVault` exist; the vault pane does not yet offer a PIN field, so it runs in no-PIN mode (see `docs/Vault-Encryption.md`) |
| Save on the analysis result | low | In the version inspected on the dev server, saving produced no stored case; not re-tested against this import |

## Reproduce everything

```sh
git clone https://github.com/drsamonline/UniRep && cd UniRep
python3 scripts/check-links.py                  # local links
cd app && pnpm install && pnpm run typecheck    # app
pnpm run export:web                             # static web build
cd .. && ./scripts/prepare-app-data.sh          # bundled core database
python3 scripts/build_core_db.py --source-dir .cache/hmr-json --cc0-only
```
