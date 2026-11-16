/**
 * Encrypted storage for the vault.
 *
 * Wraps AsyncStorage so every record is stored as an AES-256-GCM envelope from
 * `lib/vaultCrypto`. Records written before encryption existed are plain JSON;
 * they are still readable and are re-written encrypted on first save.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

import {
  decryptJSON,
  encryptJSON,
  isEnvelope,
  unwrapDataKey,
  wrapDataKey,
  IV_BYTES,
  KEY_BYTES,
  type Envelope,
  type WrappedKey,
} from "@/lib/vaultCrypto";

const KEY_STORAGE = "unirep:vault:key";
const PIN_STORAGE = "unirep:vault:pin-wrapped";

function randomBytes(length: number): Uint8Array {
  return Crypto.getRandomBytes(length);
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  /* global btoa */
  return typeof btoa === "function" ? btoa(binary) : "";
}

let cachedKey: Uint8Array | null = null;

/** Load the data key, creating it (and its unwrapped envelope) on first run. */
async function dataKey(): Promise<Uint8Array | null> {
  if (cachedKey) return cachedKey;
  try {
    const pinWrapped = await AsyncStorage.getItem(PIN_STORAGE);
    if (pinWrapped) return null; // locked until unlockVault(pin) is called
    const stored = await AsyncStorage.getItem(KEY_STORAGE);
    if (stored) {
      cachedKey = unwrapDataKey(JSON.parse(stored) as WrappedKey);
      return cachedKey;
    }
    const key = randomBytes(KEY_BYTES);
    const wrapped = wrapDataKey(key, randomBytes(IV_BYTES));
    await AsyncStorage.setItem(KEY_STORAGE, JSON.stringify(wrapped));
    cachedKey = key;
    return key;
  } catch {
    return null;
  }
}

/** True when a PIN is set and the vault has not been unlocked in this session. */
export async function isLocked(): Promise<boolean> {
  if (cachedKey) return false;
  const pinWrapped = await AsyncStorage.getItem(PIN_STORAGE);
  return Boolean(pinWrapped);
}

/**
 * Protect the vault with a PIN.
 *
 * The data key is re-wrapped with PBKDF2(PIN); from then on the stored records
 * are unreadable without that PIN.
 */
export async function setVaultPin(pin: string): Promise<void> {
  const key = (await dataKey()) ?? randomBytes(KEY_BYTES);
  const salt = randomBytes(16);
  const wrapped = wrapDataKey(key, randomBytes(IV_BYTES), pin, salt);
  await AsyncStorage.setItem(PIN_STORAGE, JSON.stringify(wrapped));
  await AsyncStorage.removeItem(KEY_STORAGE);
  cachedKey = key;
}

/** Remove the PIN and store the data key unwrapped again. */
export async function clearVaultPin(pin: string): Promise<void> {
  const stored = await AsyncStorage.getItem(PIN_STORAGE);
  if (!stored) return;
  const key = unwrapDataKey(JSON.parse(stored) as WrappedKey, pin);
  await AsyncStorage.setItem(KEY_STORAGE, JSON.stringify(wrapDataKey(key, randomBytes(IV_BYTES))));
  await AsyncStorage.removeItem(PIN_STORAGE);
  cachedKey = key;
}

/** Unlock a PIN-protected vault for this session. Throws on a wrong PIN. */
export async function unlockVault(pin: string): Promise<void> {
  const stored = await AsyncStorage.getItem(PIN_STORAGE);
  if (!stored) return;
  cachedKey = unwrapDataKey(JSON.parse(stored) as WrappedKey, pin);
}

export async function writeSecure(key: string, value: unknown): Promise<void> {
  const dataKeyValue = await dataKey();
  if (!dataKeyValue) throw new Error("vault is locked");
  const envelope = encryptJSON(value, dataKeyValue, randomBytes(IV_BYTES));
  await AsyncStorage.setItem(key, JSON.stringify(envelope));
}

export async function readSecure<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (raw === null) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (isEnvelope(parsed)) {
    const dataKeyValue = await dataKey();
    if (!dataKeyValue) return null;
    try {
      return decryptJSON<T>(parsed as Envelope, dataKeyValue);
    } catch {
      return null; // wrong key or corrupted record
    }
  }
  // Legacy plaintext: keep the data and re-write it encrypted when possible.
  void dataKey()
    .then((value) => (value ? writeSecure(key, parsed) : undefined))
    .catch(() => undefined);
  return parsed as T;
}
