import crypto from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { getMetricsReport, isStoreConfigured } from "../../lib/store";

function authorized(req: NextApiRequest) {
  const expected = process.env.ARENA_METRICS_KEY || "";
  const supplied = typeof req.headers["x-arena-metrics-key"] === "string" ? req.headers["x-arena-metrics-key"] : "";
  if (!expected || !supplied) return false;
  const a = Buffer.from(expected), b = Buffer.from(supplied);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.ARENA_METRICS_KEY) return res.status(503).json({ error: "Metrics access is not configured" });
  if (!authorized(req)) return res.status(401).json({ error: "Unauthorized" });
  if (!isStoreConfigured()) return res.status(503).json({ error: "Persistent store is not configured" });
  const days = Math.max(1, Math.min(90, Number(req.query.days) || 30));
  try {
    return res.status(200).json({ generatedAt: new Date().toISOString(), retentionDays: 400, rows: await getMetricsReport(days) });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || "Metrics request failed" });
  }
}
