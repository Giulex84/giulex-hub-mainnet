import type { NextApiRequest, NextApiResponse } from "next";

const PI_API_URL = "https://api.minepi.com/v2/payments";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    return res.status(200).json({ status: "Giulex Hub API OK" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.PI_API_KEY) {
    return res.status(500).json({ error: "PI_API_KEY not configured" });
  }

  const { action, paymentId, txid, uid } = req.body;

  try {
    // -----------------------
    // ENGAGE
    // -----------------------
    if (action === "engage") {
      console.log("User engaged:", uid);
      return res.status(200).json({ success: true });
    }

    // -----------------------
    // APPROVE
    // -----------------------
    if (action === "approve") {
      const response = await fetch(
        `${PI_API_URL}/${paymentId}/approve`,
        {
          method: "POST",
          headers: {
            Authorization: `Key ${process.env.PI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      console.log("APPROVE RESPONSE:", data);

      if (!response.ok) {
        return res.status(400).json(data);
      }

      return res.status(200).json({ success: true });
    }

    // -----------------------
    // COMPLETE
    // -----------------------
    if (action === "complete") {
      const response = await fetch(
        `${PI_API_URL}/${paymentId}/complete`,
        {
          method: "POST",
          headers: {
            Authorization: `Key ${process.env.PI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ txid }),
        }
      );

      const data = await response.json();

      console.log("COMPLETE RESPONSE:", data);

      if (!response.ok) {
        return res.status(400).json(data);
      }

      return res.status(200).json({ success: true });
    }

    // -----------------------
    // CANCEL
    // -----------------------
    if (action === "cancel") {
      const response = await fetch(
        `${PI_API_URL}/${paymentId}/cancel`,
        {
          method: "POST",
          headers: {
            Authorization: `Key ${process.env.PI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      console.log("CANCEL RESPONSE:", data);

      return res.status(200).json(data);
    }

    return res.status(400).json({ error: "Invalid action" });
  } catch (error) {
    console.error("API ERROR:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
