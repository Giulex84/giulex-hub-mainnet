import type { NextApiRequest, NextApiResponse } from "next";
import { bearerFromRequest, issueArenaSession, verifyPiAccessToken } from "../../lib/pi";
import { getReplayCredits, hasPremium, isStoreConfigured, saveProfile } from "../../lib/store";
import { safeRecordMetric } from "../../lib/metrics";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const token = bearerFromRequest(req);
  if (!token) return res.status(401).json({ error: "Missing Pi access token" });
  try {
    const user = await verifyPiAccessToken(token);
    const storeReady = isStoreConfigured();
    if (storeReady) {
      const requestedSource = typeof req.body?.source === "string" ? req.body.source.toLowerCase() : "direct";
      const source = ["fireside", "staking"].includes(requestedSource) ? requestedSource : "direct";
      await saveProfile(user.uid, user.username || null);
      await Promise.all([safeRecordMetric(user.uid, "login"), safeRecordMetric(user.uid, `source_${source}`, new Date().toISOString().slice(0,10))]);
    }
    return res.status(200).json({
      uid: user.uid,
      username: user.username || null,
      premium: storeReady ? await hasPremium(user.uid) : false,
      replayCredits: storeReady ? await getReplayCredits(user.uid) : 0,
      storeReady,
      arenaSession: issueArenaSession(user.uid, user.username || null),
    });
  } catch {
    return res.status(401).json({ error: "Pi authentication could not be verified" });
  }
}
