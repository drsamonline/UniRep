/**
 * Encryption for the local case vault.
 *
 * The vault screen has always said "Encrypted Vault" while the data sat in
 * AsyncStorage as plain JSON. This module makes the label true.
 *
 * Shape: one random 256-bit **data key** encrypts every record with AES-256-GCM.
 * The data key is stored wrapped:
 *
 *   - no PIN set   → wrapped with itself (i.e. stored), which protects against
 *                    casual inspection of the storage file but not against
 *                    someone who can read the key store;
 *   - PIN set      → wrapped with PBKDF2-SHA256(PIN, salt, 150k) as the key
 *                    encryption key, so the records cannot be read without it.
 *
 * Pure functions only (no platform imports), so this file is testable in Node.
 * Randomness is passed in by the caller: expo-crypto on device, WebCrypto on web.
 */
import { gcm } from "@noble/ciphers/aes";
import { pbkdf2 } from "@noble/hashes/pbkdf2";
import { sha256 } from "@noble/hashes/sha256";
import { bytesToUtf8, utf8ToBytes } from "@noble/hashes/utils";

export const PBKDF2_ITERATIONS = 150_000;
export const KEY_BYTES = 32;
export const IV_BYTES = 12;

export interface Envelope {
  v: 2;
  alg: "aes-256-gcm";
  kdf: "pbkdf2-sha256" | "raw";
  iterations?: number;
  salt?: string;
  iv: string;
  ct: string;
}

export interface WrappedKey {
  kdf: "pbkdf2-sha256" | "raw";
  iterations?: number;
  salt?: string;
  iv: string;
  ct: string;
}

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

// Implemented here rather than with atob/btoa or Buffer so the module runs
// unchanged in Hermes, the browser and Node, with no platform types needed.
function toBase64(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const [a, b, c] = [bytes[i], bytes[i + 1], bytes[i + 2]];
    const triple = (a << 16) | ((b ?? 0) << 8) | (c ?? 0);
    out += B64[(triple >> 18) & 63] + B64[(triple >> 12) & 63];
    out += b === undefined ? "=" : B64[(triple >> 6) & 63];
    out += c === undefined ? "=" : B64[triple & 63];
  }
  return out;
}

function fromBase64(value: string): Uint8Array {
  const clean = value.replace(/[^A-Za-z0-9+/]/g, "");
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let written = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const chunk = [0, 1, 2, 3].map((k) => B64.indexOf(clean[i + k] ?? "A"));
    const triple = (chunk[0] << 18) | (chunk[1] << 12) | (chunk[2] << 6) | chunk[3];
    if (written < out.length) out[written++] = (triple >> 16) & 255;
    if (written < out.length) out[written++] = (triple >> 8) & 255;
    if (written < out.length) out[written++] = triple & 255;
  }
  return out;
}

/** PBKDF2-SHA256 over a passphrase, used only to wrap the data key. */
export function deriveKey(passphrase: string, salt: Uint8Array, iterations = PBKDF2_ITERATIONS): Uint8Array {
  return pbkdf2(sha256, utf8ToBytes(passphrase), salt, { c: iterations, dkLen: KEY_BYTES });
}

export function encryptBytes(plaintext: Uint8Array, key: Uint8Array, iv: Uint8Array): string {
  return toBase64(gcm(key, iv).encrypt(plaintext));
}

export function decryptBytes(ciphertext: string, key: Uint8Array, iv: Uint8Array): Uint8Array {
  return gcm(key, iv).decrypt(fromBase64(ciphertext));
}

/** Encrypt a JSON-serialisable value with the data key. */
export function encryptJSON(value: unknown, key: Uint8Array, iv: Uint8Array): Envelope {
  const plaintext = utf8ToBytes(JSON.stringify(value));
  return { v: 2, alg: "aes-256-gcm", kdf: "raw", iv: toBase64(iv), ct: encryptBytes(plaintext, key, iv) };
}

/** Decrypt an envelope produced by {@link encryptJSON}. Throws if the key is wrong. */
export function decryptJSON<T>(envelope: Envelope, key: Uint8Array): T {
  const plaintext = decryptBytes(envelope.ct, key, fromBase64(envelope.iv));
  return JSON.parse(bytesToUtf8(plaintext)) as T;
}

/** Wrap the data key so it can be stored. With a PIN the PIN encrypts it. */
export function wrapDataKey(dataKey: Uint8Array, iv: Uint8Array, pin?: string, salt?: Uint8Array): WrappedKey {
  if (pin) {
    if (!salt) throw new Error("a salt is required to wrap a key with a PIN");
    const kek = deriveKey(pin, salt);
    return {
      kdf: "pbkdf2-sha256",
      iterations: PBKDF2_ITERATIONS,
      salt: toBase64(salt),
      iv: toBase64(iv),
      ct: encryptBytes(dataKey, kek, iv),
    };
  }
  return { kdf: "raw", iv: toBase64(iv), ct: toBase64(dataKey) };
}

/** Recover the data key from storage. Throws if the PIN is wrong. */
export function unwrapDataKey(wrapped: WrappedKey, pin?: string): Uint8Array {
  if (wrapped.kdf === "raw") return fromBase64(wrapped.ct);
  if (!pin) throw new Error("this vault is PIN-protected");
  const salt = fromBase64(wrapped.salt ?? "");
  const kek = deriveKey(pin, salt, wrapped.iterations ?? PBKDF2_ITERATIONS);
  return decryptBytes(wrapped.ct, kek, fromBase64(wrapped.iv));
}

export function isEnvelope(value: unknown): value is Envelope {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as Envelope).v === 2 &&
    typeof (value as Envelope).ct === "string"
  );
}
