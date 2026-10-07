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

const day = () => new Date().toISOString().slice(0, 10);
const pseudonym = (value: string) => crypto.createHmac("sha256", getServerApiKey()).update(value).digest("hex");

export async function safeRecordMetric(uid: string, event: string, dedupeId = "", value = 0, eventDay = day()) {
  if (!uid || !EVENTS.has(event) || !/^\d{4}-\d{2}-\d{2}$/.test(eventDay)) return false;
  try {
    const subject = pseudonym(`user:${uid}`);
    const dedupe = dedupeId ? pseudonym(`event:${uid}:${event}:${dedupeId}`) : "";
    return await recordMetric(eventDay, subject, event, dedupe, value);
  } catch {
    return false;
  }
}
