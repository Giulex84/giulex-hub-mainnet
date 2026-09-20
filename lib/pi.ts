import type { NextApiRequest } from "next";
import crypto from "crypto";

export const PI_API_BASE = "https://api.minepi.com/v2";
export const PREMIUM_PRODUCT = "arena_premium_v1";
export const PREMIUM_AMOUNT = 1;
export const PREMIUM_MEMO = "Arena Premium Unlock";
export const REPLAY_PRODUCT = "arena_daily_replay_v1";
export const REPLAY_AMOUNT = 0.1;
export const REPLAY_MEMO = "Arena Daily Replay Ticket";

export type PiUser = {
  uid: string;
  username?: string;
  credentials?: {
    scopes?: string[];
    valid_until?: { timestamp?: number; iso8601?: string };
  };
};

export type PiPayment = {
  identifier: string;
  user_uid: string;
  amount: number;
  memo?: string;
  metadata?: Record<string, unknown>;
  direction?: string;
  network?: string;
  status?: {
    developer_approved?: boolean;
    transaction_verified?: boolean;
    developer_completed?: boolean;
    cancelled?: boolean;
    user_cancelled?: boolean;
  };
  transaction?: null | {
    txid: string;
    verified?: boolean;
  };
};

export function getServerApiKey(): string {
  const key = process.env.PI_API_KEY;
  if (!key) throw new Error("PI_API_KEY not configured");
  return key;
}

export function bearerFromRequest(req: NextApiRequest): string | null {
  const value = req.headers.authorization;
  if (!value || !value.startsWith("Bearer ")) return null;
  const token = value.slice(7).trim();
  return token || null;
}

export function arenaSessionFromRequest(req: NextApiRequest): string | null {
  const value = req.headers["x-arena-session"];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function sessionKey(): Buffer {
  return crypto.createHash("sha256").update(`arena-mainnet-session-v1:${getServerApiKey()}`).digest();
}

export function issueArenaSession(uid: string, username?: string | null): string {
  const payload = Buffer.from(JSON.stringify({ uid, username: typeof username === "string" ? username.slice(0, 64) : null, exp: Date.now() + 21_600_000 })).toString("base64url");
  const signature = crypto.createHmac("sha256", sessionKey()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyArenaSession(token: string): PiUser {
  const [payload, signature, extra] = String(token || "").split(".");
  if (!payload || !signature || extra) throw new Error("Invalid Arena session");
  const expected = crypto.createHmac("sha256", sessionKey()).update(payload).digest();
  let supplied: Buffer;
  try { supplied = Buffer.from(signature, "base64url"); } catch { throw new Error("Invalid Arena session"); }
  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) throw new Error("Invalid Arena session");
  let data: any;
  try { data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")); } catch { throw new Error("Invalid Arena session"); }
  if (!data?.uid || !Number.isFinite(data.exp) || data.exp < Date.now()) throw new Error("Arena session expired");
  return { uid: data.uid, username: typeof data.username === "string" ? data.username : undefined };
}

export async function verifyPiAccessToken(accessToken: string): Promise<PiUser> {
  const response = await fetch(`${PI_API_BASE}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Unauthorized");
  const user = (await response.json()) as PiUser;
  if (!user?.uid) throw new Error("Invalid Pi user response");
  return user;
}

export const verifyAccessToken = verifyPiAccessToken;

export async function getPayment(paymentId: string): Promise<PiPayment> {
  const response = await fetch(`${PI_API_BASE}/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Key ${getServerApiKey()}` },
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof data?.error === "string" ? data.error : "Could not fetch payment";
    throw new Error(message);
  }
  return data as PiPayment;
}

export function validatePremiumPayment(payment: PiPayment, expectedUid?: string): string | null {
  if (!payment?.identifier || !payment.user_uid) return "Malformed payment";
  if (expectedUid && payment.user_uid !== expectedUid) return "Payment does not belong to authenticated user";
  if (payment.direction !== "user_to_app") return "Unexpected payment direction";
  if (payment.network !== "Pi Network") return "Unexpected payment network";
  if (Number(payment.amount) !== PREMIUM_AMOUNT) return "Unexpected payment amount";
  if (payment.memo !== PREMIUM_MEMO) return "Unexpected payment memo";
  if (payment.metadata?.product !== PREMIUM_PRODUCT) return "Unexpected payment product";
  if (payment.status?.cancelled || payment.status?.user_cancelled) return "Payment is cancelled";
  return null;
}

export function productForPayment(payment: PiPayment) {
  const product = payment?.metadata?.product;
  if (product === PREMIUM_PRODUCT) return { product, amount: PREMIUM_AMOUNT, memo: PREMIUM_MEMO, type: "premium" as const };
  if (product === REPLAY_PRODUCT) return { product, amount: REPLAY_AMOUNT, memo: REPLAY_MEMO, type: "replay" as const };
  return null;
}

export function validateStorePayment(payment: PiPayment, expectedUid?: string): string | null {
  if (!payment?.identifier || !payment.user_uid) return "Malformed payment";
  if (expectedUid && payment.user_uid !== expectedUid) return "Payment does not belong to authenticated user";
  if (payment.direction !== "user_to_app") return "Unexpected payment direction";
  if (payment.network !== "Pi Network") return "Unexpected payment network";
  const item = productForPayment(payment);
  if (!item) return "Unexpected payment product";
  if (Number(payment.amount) !== item.amount) return "Unexpected payment amount";
  if (payment.memo !== item.memo) return "Unexpected payment memo";
  if (payment.status?.cancelled || payment.status?.user_cancelled) return "Payment is cancelled";
  return null;
}

export async function piPost(path: string, body?: unknown) {
  const response = await fetch(`${PI_API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${getServerApiKey()}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}
