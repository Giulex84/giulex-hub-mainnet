import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  console.log("DEBUG: Inizio procedura reward per UID:", req.body.uid);

  const StellarSdk = require("@stellar/stellar-sdk");
  
  const PI_API_KEY = process.env.PI_API_KEY;
  const APP_SEED = process.env.PI_APP_WALLET_SEED;

  if (!PI_API_KEY || !APP_SEED) {
    console.error("ERRORE: Variabili d'ambiente mancanti su Vercel!");
    return res.status(500).json({ error: "Server configuration missing" });
  }

  try {
    const { uid, amount } = req.body;
    const BASE_URL = "https://api.minepi.com/v2/payments";

    const createRes = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Authorization": `Key ${PI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        payment: { amount, memo: "Arena Combo Reward", metadata: { source: "ArenaGame" }, uid }
      }),
    });

    const createData: any = await createRes.json();
    if (!createRes.ok) {
      console.error("ERRORE API PI (Create):", createData);
      return res.status(400).json({ error: createData.error });
    }

    const paymentId = createData.identifier;
    const destination = createData.to_address;

    await fetch(`${BASE_URL}/${paymentId}/approve`, {
      method: "POST",
      headers: { "Authorization": `Key ${PI_API_KEY}` }
    });

    const server = new StellarSdk.Horizon.Server("https://api.mainnet.minepi.com");
    const keypair = StellarSdk.Keypair.fromSecret(APP_SEED);
    const account = await server.loadAccount(keypair.publicKey());

    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: "1000000",
      networkPassphrase: "Pi Network",
    })
      .addMemo(StellarSdk.Memo.text(paymentId))
      .addOperation(StellarSdk.Operation.payment({ 
        destination, 
        asset: StellarSdk.Asset.native(), 
        amount: Number(amount).toFixed(7) 
      }))
      .setTimeout(180)
      .build();

    tx.sign(keypair);
    const result = await server.submitTransaction(tx);

    await fetch(`${BASE_URL}/${paymentId}/complete`, {
      method: "POST",
      headers: { "Authorization": `Key ${PI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ txid: result.hash }),
    });

    return res.status(200).json({ success: true, txid: result.hash });

  } catch (err: any) {
    console.error("CRITICAL ERROR:", err);
    return res.status(500).json({ error: "Reward process failed", message: err.message });
  }
}
