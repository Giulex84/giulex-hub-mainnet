import crypto from "crypto";
import { getServerApiKey } from "./pi";
import { recordMetric } from "./store";

const EVENTS = new Set([
  "login",
  "daily_started",
  "daily_completed",
  "daily_failed",
  "daily_replay_started",
  "daily_shared",
  "daily_viewed",
  "daily_first_flip",
  "daily_timeout",
  "daily_recovered",
  "pvp_timeout",
  "pvp_recovered",
  "pvp_started",
  "pvp_bot_started",
  "pvp_completed",
  "premium_purchased",
  "replay_purchased",
  "source_fireside",
  "source_staking",
  "source_share",
  "source_direct",
]);

// Bounded, best-effort memoization of confirmed dedupe receipts. Redis remains
// authoritative across instances; failures are never cached and can be retried.
const confirmed = new Map<string, number>();
const RECEIPT_TTL_MS = 86400000;
const MAX_RECEIPTS = 4096;

const day = () => new Date().toISOString().slice(0, 10);
const pseudonym = (value: string) => crypto.createHmac("sha256", getServerApiKey()).update(value).digest("hex");

export async function safeRecordMetric(uid: string, event: string, dedupeId = "", value = 0, eventDay = day()) {
  if (!uid || !EVENTS.has(event) || !/^\d{4}-\d{2}-\d{2}$/.test(eventDay)) return false;
  try {
    const subject = pseudonym(`user:${uid}`);
    const dedupe = dedupeId ? pseudonym(`event:${uid}:${event}:${dedupeId}`) : "";
    const receipt = dedupe ? `${eventDay}:${dedupe}` : "";
    const now = Date.now();
    if (receipt && (confirmed.get(receipt) || 0) > now) return false;
    const recorded = await recordMetric(eventDay, subject, event, dedupe, value);
    if (receipt) {
      if (confirmed.size >= MAX_RECEIPTS) confirmed.delete(confirmed.keys().next().value!);
      confirmed.set(receipt, now + RECEIPT_TTL_MS);
    }
    return recorded;
  } catch {
    return false;
  }
}

