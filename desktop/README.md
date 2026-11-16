# UniRep desktop

A thin [Tauri](https://tauri.app) v2 shell around the exported web build. The
window loads `app/dist` from disk, so the installed app works with the network
unplugged: the repertory database (`unirep_core.db`) and the SQLite WASM engine
(`sql-wasm*.wasm`) are packaged inside the binary.

| File | Purpose |
|---|---|
| `src-tauri/tauri.conf.json` | product name, window size, bundle targets, icons |
| `src-tauri/src/main.rs`, `src-tauri/src/lib.rs` | the entry point — no native APIs |
| `src-tauri/capabilities/default.json` | Tauri v2 capability: core permissions only |
| `src-tauri/Cargo.toml` | Rust dependencies (tauri 2) |
| `src-tauri/icons/` | 32/128/256/512 PNG and a multi-size `.ico` |

## Build it

Prerequisites: Rust (stable), Node 20+, pnpm, and on Linux the WebKitGTK
development packages.

```sh
# 1. the database the app searches (~46 MB, built from the source repository)
../scripts/prepare-app-data.sh

# 2. the static build the shell loads
cd ../app && pnpm install && pnpm run export:web && cd ../desktop

# 3. the installer for this platform
npm install
npm run build
```

Output lands in `src-tauri/target/release/bundle/`: `nsis/*.exe` on Windows,
`appimage/*.AppImage` and `deb/*.deb` on Linux.

## CI

`.github/workflows/desktop.yml` builds both platforms and uploads the installers
as artifacts. It runs on demand (**Actions → Desktop → Run workflow**) and on a
push to `main` that touches `desktop/`, so the shell is compiled whenever it
changes. The repertory database is built from the source repository in the
runner, because the GPL database is never committed.

## Notes

- No local network access is used or granted; the content security policy allows
  only the app's own files.
- The Windows installer is unsigned, so SmartScreen will warn until a code-signing
  certificate is configured.
- The desktop shell has not been built in this workspace (no Rust toolchain here);
  the web payload it loads was built and tested. See `docs/AUDIT.md`.
