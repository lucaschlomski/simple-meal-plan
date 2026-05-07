import { constantTimeEqual } from "./crypto";

const encoder = new TextEncoder();

type SessionPayload = {
  kind: "admin" | "board";
  boardId?: number;
  slug?: string;
  exp: number;
};

const ADMIN_COOKIE_NAME = "mp_admin";

function toBase64Url(bytes: Uint8Array): string {
  const binary = String.fromCharCode(...bytes);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function signPayload(secret: string, payload: string): Promise<string> {
  const key = await importHmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return toBase64Url(new Uint8Array(sig));
}

function cookieSafeSlug(slug: string): string {
  return slug.replace(/[^a-zA-Z0-9_-]/g, "-");
}

export function getAdminCookieName(): string {
  return ADMIN_COOKIE_NAME;
}

export function getBoardCookieName(slug: string): string {
  return `mp_board_${cookieSafeSlug(slug)}`;
}

export async function createSessionToken(secret: string, payload: SessionPayload): Promise<string> {
  const encodedPayload = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await signPayload(secret, encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export async function verifySessionToken(
  secret: string,
  token: string,
  expectedKind: SessionPayload["kind"]
): Promise<SessionPayload | null> {
  try {
    const [encodedPayload, signature] = token.split(".");
    if (!encodedPayload || !signature) return null;

    const expectedSignature = await signPayload(secret, encodedPayload);
    if (!constantTimeEqual(expectedSignature, signature)) return null;

    const payloadJson = new TextDecoder().decode(fromBase64Url(encodedPayload));
    const payload = JSON.parse(payloadJson) as SessionPayload;
    const nowSeconds = Math.floor(Date.now() / 1000);

    if (payload.kind !== expectedKind) return null;
    if (payload.exp <= nowSeconds) return null;
    return payload;
  } catch {
    return null;
  }
}
