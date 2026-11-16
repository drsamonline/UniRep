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

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return typeof btoa === "function" ? btoa(binary) : Buffer.from(bytes).toString("base64");
}

function fromBase64(value: string): Uint8Array {
  if (typeof atob === "function") {
    const binary = atob(value);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
    return out;
  }
  return new Uint8Array(Buffer.from(value, "base64"));
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
