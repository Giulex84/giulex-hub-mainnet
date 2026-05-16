import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const PI_API_KEY = process.env.PI_API_KEY;
  if (!PI_API_KEY) {
    console.error("ERRORE: Configurazione PI_API_KEY mancante!");
    return res.status(500).json({ error: "Server configuration missing" });
  }

  try {
    const { uid, amount } = req.body;
    const BASE_URL = "https://api.minepi.com/v2/payments";

    // Chiamata standard al server di Pi per creare il pagamento
    const createRes = await fetch(BASE_URL, {
      method: "POST",
      headers: { 
        "Authorization": `Key ${PI_API_KEY}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        payment: { 
          amount, 
          memo: "Arena Combo Reward", 
          metadata: { source: "ArenaGame" }, 
          uid 
        }
      }),
    });

    const createData: any = await createRes.json();
    
    if (!createRes.ok) {
      console.error("ERRORE API PI (Create):", createData);
      return res.status(400).json({ error: createData.error });
    }

    // Risposta positiva all'app per procedere con il flusso regolare
    return res.status(200).json(createData);

  } catch (err: any) {
    console.error("CRITICAL ERROR:", err);
    return res.status(500).json({ error: "Process failed", message: err.message });
  }
}
