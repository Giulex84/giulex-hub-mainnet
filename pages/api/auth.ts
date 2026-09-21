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
    if (storeReady) { await saveProfile(user.uid, user.username || null); await safeRecordMetric(user.uid, "login"); }
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
