# Vault encryption

The vault screen used to say "Encrypted Vault" while cases sat in AsyncStorage as
plain JSON. As of this version the label is true: every stored case, patient,
symptom set and repertorisation is an AES-256-GCM envelope.

## How it works

```
PIN (optional) ──PBKDF2-SHA256, 150 000 iters──► key-encryption key
                                                      │
random 256-bit data key ─────────────────────────────►│ wraps
                                                      ▼
                                        wrapped key in AsyncStorage
                                                      │
              every record ──AES-256-GCM(data key, random 12-byte IV)──► ciphertext
```

- `app/lib/vaultCrypto.ts` — pure functions: encrypt, decrypt, wrap, unwrap.
  No platform imports, so it can be tested in Node.
- `app/lib/secureStorage.ts` — the storage layer. `readSecure` / `writeSecure`
  replace `AsyncStorage.getItem(JSON.parse(...))` for the four vault keys.
- `app/lib/vaultCrypto.test.mjs` — five checks: round-trip, fresh IV, tamper
  rejection, PIN wrap/unwrap, wrong-PIN rejection.

Records written before encryption are still readable; the first read rewrites
them as an envelope, so the migration happens as the app is used.

## What this does and does not protect against

| Threat | Without PIN | With PIN |
|---|---|---|
| Someone scrolling the storage file / browser profile | protected | protected |
| A backup or disk image read by a curious person | protected | protected |
| Someone with full read access to the key store | **not** protected (the key is there too) | protected |
| A stolen unlocked device with the app open | not protected | not protected (key cached in memory) |

The no-PIN mode is encryption at rest, not a lock: the data key is stored next to
the data. The PIN mode is a real lock — the data key exists only wrapped, and the
wrapper is PBKDF2-SHA256 over the PIN, so guessing costs 150k iterations per try.

## Interfaces available now

```ts
import { setVaultPin, clearVaultPin, unlockVault, isLocked } from "@/lib/secureStorage";
```

These are the storage-side functions; a screen for entering the PIN has not been
built yet, so in this version the vault runs in no-PIN mode. Adding the screen is
a self-contained change to the vault pane.

## Brainstorm — where to take it next

Ordered by value for effort, all offline:

1. **PIN screen on the vault pane** — set, change and clear a PIN; a locked state
   that shows a single "Unlock" field instead of the case list.
2. **Biometric unlock** — `expo-local-authentication` on Android/iOS, wrapping the
   PIN in the keystore/secure enclave rather than in AsyncStorage.
3. **Key in the platform keystore** — `expo-secure-store` for the wrapped key on
   native, so the key never sits in a plain-text database.
4. **Panic delete** — a wipe action that removes envelopes and keys in one step,
   useful for shared devices.
5. **Export/import** — a passphrase-encrypted `.unirep` archive so a case bank can
   move between devices without a server.
6. **Per-case encryption** — encrypt the case body but keep the name and number in
   clear, so the list is searchable while the clinical detail stays sealed.
7. **Audit trail** — an append-only local log of unlock, save and export events.
8. **Argon2id** — replace PBKDF2 with Argon2id (memory-hard) when a portable
   implementation is acceptable; native builds could use a Rust module through the
   Tauri shell.
9. **Zeroise memory** on lock and app background, so an unlocked device does not
   hold a usable key.
10. **Independently reviewed format** — publish the envelope spec (`v: 2`,
    `kdf`, `iv`, `ct`) and vector tests so another implementation can interoperate.
