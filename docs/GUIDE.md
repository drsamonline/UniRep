# UniRep — project guide

**PolyForm Noncommercial 1.0.0**

A **universal index** over the classical homoeopathic repertories: one search surface across several
books, so a rubric can be found by what it says rather than by remembering which volume printed it.

## What this repository is

It holds the application itself, under [`app/`](../app), together with the project's **policy
documents** — the privacy policy and the security policy.

The app runs on your own device. It has no server component, no account and no network calls;
the repertory database is bundled with it and built from `scripts/build_core_db.py`.

That is a deliberate split, and worth stating plainly: the code lives where it runs, and the promises
live where they can be read without running anything. A privacy policy buried in an application
bundle is one nobody reads.

## Repository layout

| Path | What it is |
|---|---|
| `app/` | The application — Expo (React Native) with Expo Router, TypeScript |
| `app/context/` | State (`AppContext`) and the SQLite core (`CoreDatabaseContext`, `.web.tsx` for web) |
| `app/constants/colors.ts` | light, dark and sepia palettes |
| `unirep_data/DATA-LICENSES.md` | Where the data comes from and which licence each build carries |
| `scripts/build_core_db.py` | Builds the core database from converted repertory JSON |
| `scripts/prepare-app-data.sh` | Builds it and installs it as the app's bundled asset |
| `app/lib/vaultCrypto.ts` | AES-256-GCM record encryption, optional PIN-wrapped key |
| `desktop/` | Tauri v2 shell that builds the `.exe` / AppImage / `.deb` |
| `docs/` | Landing page, this guide, the audit, the encryption design |
| `.github/workflows/` | Link checks, Pages publication, Android APK, desktop installers |

## Running it

```sh
cd app
pnpm install
../scripts/prepare-app-data.sh   # needs python3; clones the data repository once
pnpm start                       # device or emulator
pnpm run export:web              # static build in app/dist
```

The app bundles its database, so it works with no network at all. Nothing is
sent anywhere and no account is needed; see [../PRIVACY.md](../PRIVACY.md).

`export:web` leaves a self-contained `app/dist`: the JavaScript, the repertory
database and the SQLite WebAssembly engine, so the browser build searches the
real core just like the phone does.

## Desktop

The same export is packaged by a Tauri shell in [`desktop/`](../desktop):

```sh
cd app && pnpm run export:web && cd ../desktop
npm install && npm run build     # .exe (Windows) or .AppImage/.deb (Linux)
```

`.github/workflows/desktop.yml` does the same on both platforms on demand or on
a `v*` tag, building the database in the runner because it is not committed.

## Case encryption

Cases, patients and repertorisations are stored as AES-256-GCM envelopes; an
optional PIN wraps the data key with PBKDF2-SHA256. The design, its limits and
the hardening options are in [Vault-Encryption.md](Vault-Encryption.md).

## What it is for

Classical repertories are large and separately printed, and the same rubric appears in several of them
with different wording and different remedy sets. UniRep lets you search across them at once, so the
question "where does this rubric live" stops being a memory exercise.

## Licence

PolyForm Noncommercial 1.0.0. See [LICENSE](../LICENSE).
