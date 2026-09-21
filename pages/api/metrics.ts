import crypto from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { getMetricsReport, isStoreConfigured } from "../../lib/store";
import { bearerFromRequest, verifyPiAccessToken } from "../../lib/pi";

function authorizedBySecret(req: NextApiRequest) {
  const expected = process.env.ARENA_METRICS_KEY || "";
  const supplied = typeof req.headers["x-arena-metrics-key"] === "string" ? req.headers["x-arena-metrics-key"] : "";
  if (!expected || !supplied) return false;
  const a = Buffer.from(expected), b = Buffer.from(supplied);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function authorizedByPi(req: NextApiRequest) {
  const token = bearerFromRequest(req);
  if (!token) return false;
  const user = await verifyPiAccessToken(token);
  const expectedUsername = (process.env.ARENA_ADMIN_USERNAME || "Giulex84").trim().toLowerCase();
  return Boolean(expectedUsername) && (user.username || "").trim().toLowerCase() === expectedUsername;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  let authorized = authorizedBySecret(req);
  if (!authorized) {
    try { authorized = await authorizedByPi(req); } catch { authorized = false; }
  }
  if (!authorized) return res.status(403).json({ error: "Forbidden" });
  if (!isStoreConfigured()) return res.status(503).json({ error: "Persistent store is not configured" });
  const days = Math.max(1, Math.min(90, Number(req.query.days) || 30));
  try {
    return res.status(200).json({ generatedAt: new Date().toISOString(), retentionDays: 400, rows: await getMetricsReport(days) });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || "Metrics request failed" });
  }
}
