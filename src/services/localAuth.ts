export interface PasswordCredential {
  accountId: string;
  salt: string;
  hash: string;
}

const iterations = 310_000;
const encoder = new TextEncoder();

function encodeBase64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}

function decodeBase64(value: string) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

async function deriveHash(password: string, salt: Uint8Array) {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Secure password hashing is unavailable in this browser context.");
  }

  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const saltBuffer = new ArrayBuffer(salt.byteLength);
  new Uint8Array(saltBuffer).set(salt);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBuffer, iterations, hash: "SHA-256" },
    key,
    256,
  );
  return encodeBase64(new Uint8Array(bits));
}

export async function createPasswordCredential(accountId: string, password: string): Promise<PasswordCredential> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { accountId, salt: encodeBase64(salt), hash: await deriveHash(password, salt) };
}

export async function verifyPassword(password: string, credential: PasswordCredential) {
  const candidate = await deriveHash(password, decodeBase64(credential.salt));
  if (candidate.length !== credential.hash.length) return false;

  let difference = 0;
  for (let index = 0; index < candidate.length; index += 1) {
    difference |= candidate.charCodeAt(index) ^ credential.hash.charCodeAt(index);
  }
  return difference === 0;
}