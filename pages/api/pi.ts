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

  try {
    const { action, paymentId, txid, uid } = req.body;

    if (!process.env.PI_API_KEY) {
      return res.status(500).json({ error: "PI_API_KEY not configured" });
    }

    if (action === "engage") {
      console.log("User engaged:", uid);
      return res.status(200).json({ success: true });
    }

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
      return res.status(response.status).json(data);
    }

    if (action === "complete") {
      const response = await fetch(
        `${PI_API_URL}/${paymentId}/complete`,
        {
          method: "POST",
          headers: {
            Authorization: `Key ${process.env.PI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ txid: txid || null }),
        }
      );

      const data = await response.json();
      return res.status(response.status).json(data);
    }

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
      return res.status(response.status).json(data);
    }

    return res.status(400).json({ error: "Invalid action" });

  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

