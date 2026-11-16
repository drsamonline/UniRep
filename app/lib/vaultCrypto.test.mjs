/**
 * Checks for lib/vaultCrypto.ts.
 *
 *   node --experimental-strip-types app/lib/vaultCrypto.test.mjs
 *
 * Kept dependency-free: it uses only Node's assert and the module under test, so
 * it runs without the app's toolchain.
 */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";

const {
  decryptJSON,
  encryptJSON,
  unwrapDataKey,
  wrapDataKey,
} = await import("./vaultCrypto.ts");

const key = randomBytes(32);
const iv = randomBytes(12);
const record = { cases: [{ id: "c1", patient: "A", rubrics: ["Mind > anxiety"] }] };

// 1. round-trip
const envelope = encryptJSON(record, key, iv);
assert.equal(envelope.v, 2);
assert.equal(envelope.alg, "aes-256-gcm");
assert.ok(!envelope.ct.includes("anxiety"), "ciphertext must not contain the plaintext");
assert.deepEqual(decryptJSON(envelope, key), record);

// 2. fresh IV changes the ciphertext, same plaintext
const other = encryptJSON(record, key, randomBytes(12));
assert.notEqual(other.ct, envelope.ct);

// 3. wrong key fails authentication
assert.throws(() => decryptJSON(envelope, randomBytes(32)));

// 4. PIN wrapping: correct PIN recovers the key, wrong PIN does not
const salt = randomBytes(16);
const wrapped = wrapDataKey(key, randomBytes(12), "4821", salt);
assert.equal(wrapped.kdf, "pbkdf2-sha256");
assert.equal(wrapped.iterations, 150000);
assert.deepEqual(Buffer.from(unwrapDataKey(wrapped, "4821")), Buffer.from(key));
assert.throws(() => unwrapDataKey(wrapped, "0000"));

// 5. no-PIN wrapping stores the key directly (documented trade-off)
const raw = wrapDataKey(key, randomBytes(12));
assert.equal(raw.kdf, "raw");
assert.deepEqual(Buffer.from(unwrapDataKey(raw)), Buffer.from(key));

console.log("vaultCrypto: 5 checks passed");
