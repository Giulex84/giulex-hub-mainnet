import type { NextApiRequest, NextApiResponse } from "next";

const PI_API_URL = "https://api.minepi.com/v2/payments";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    return res.status(200).json({ status: "Giulex Hub API OK" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.PI_API_KEY) {
    return res.status(500).json({ error: "PI_API_KEY not configured" });
  }

  const { action, paymentId, txid, uid } = req.body || {};

  if (!action) return res.status(400).json({ error: "Missing action" });
  if (!paymentId && action !== "ping") return res.status(400).json({ error: "Missing paymentId" });

  const headers = {
    Authorization: `Key ${process.env.PI_API_KEY}`,
    "Content-Type": "application/json",
  };

  try {
    // Simple ping (per debug)
    if (action === "ping") {
      return res.status(200).json({ ok: true, uid: uid || null });
    }

    // ENGAGE (opzionale - solo log)
    if (action === "engage") {
      console.log("User engaged:", uid);
      return res.status(200).json({ success: true });
    }

    // APPROVE
    if (action === "approve") {
      const response = await fetch(`${PI_API_URL}/${paymentId}/approve`, {
        method: "POST",
        headers,
      });

      const data = await response.json();
      console.log("APPROVE RESPONSE:", data);

      // 🔥 ongoing_payment_found → cancella e fallisci (il frontend può riprovare creando nuovo payment)
      if (!response.ok) {
        const err = data?.error || "";
        if (String(err).includes("ongoing_payment_found")) {
          // prova cancel dell'on-going (se Pi risponde con paymentId in data)
          try {
            const cancelId = data?.payment?.identifier || data?.paymentId || paymentId;
            await fetch(`${PI_API_URL}/${cancelId}/cancel`, { method: "POST", headers });
          } catch (e) {
            console.warn("Auto-cancel warning:", e);
          }
        }
        return res.status(400).json(data);
      }

      return res.status(200).json({ success: true, data });
    }

    // COMPLETE (idempotente)
    if (action === "complete") {
      const response = await fetch(`${PI_API_URL}/${paymentId}/complete`, {
        method: "POST",
        headers,
        body: JSON.stringify({ txid: txid || null }),
      });

      const data = await response.json();
      console.log("COMPLETE RESPONSE:", data);

      // se già completato, Pi può rispondere con errore "already_completed" o simili
      // consideralo OK per idempotenza (dipende dalla forma risposta)
      if (!response.ok) {
        const err = String(data?.error || "");
        if (err.includes("already_completed")) {
          return res.status(200).json({ success: true, alreadyCompleted: true, data });
        }
        return res.status(400).json(data);
      }

      return res.status(200).json({ success: true, data });
    }

    // CANCEL
    if (action === "cancel") {
      const response = await fetch(`${PI_API_URL}/${paymentId}/cancel`, {
        method: "POST",
        headers,
      });

      const data = await response.json();
      console.log("CANCEL RESPONSE:", data);

      if (!response.ok) return res.status(400).json(data);
      return res.status(200).json({ success: true, data });
    }

    return res.status(400).json({ error: "Invalid action" });
  } catch (error: any) {
    console.error("API ERROR:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
