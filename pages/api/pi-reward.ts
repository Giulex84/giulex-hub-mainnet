import type { NextApiRequest, NextApiResponse } from "next";
const StellarSdk = require("@stellar/stellar-sdk");

const { TransactionBuilder, Operation, Asset, Keypair, Memo } = StellarSdk;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { uid, amount } = req.body;
  const PI_API_KEY = process.env.PI_API_KEY;
  const APP_SEED = process.env.PI_APP_WALLET_SEED;

  if (!PI_API_KEY || !APP_SEED) return res.status(500).json({ error: "Server configuration missing" });

  const BASE_URL = "https://api.minepi.com/v2/payments";

  try {
    // 1. Crea pagamento su Pi API
    let createRes = await fetch(BASE_URL, {
      method: "POST",
      headers: { Authorization: `Key ${PI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        payment: { amount, memo: "Arena Combo Reward", metadata: { source: "ArenaGame" }, uid }
      }),
    });

    let createData = await createRes.json();

    // Gestione pagamento in sospeso
    if (createData.error === "ongoing_payment_found") {
      const ongoingId = createData.payment.identifier;
      await fetch(`${BASE_URL}/${ongoingId}/cancel`, { method: "POST", headers: { Authorization: `Key ${PI_API_KEY}` } });
      return res.status(400).json({ error: "Retry requested - cleared old payment" });
    }

    const paymentId = createData.identifier;
    const destination = createData.to_address;

    // 2. Approva
    await fetch(`${BASE_URL}/${paymentId}/approve`, { method: "POST", headers: { Authorization: `Key ${PI_API_KEY}` } });

    // 3. Firma e Sottometti su Blockchain MAINNET
    const server = new StellarSdk.Horizon.Server("https://api.mainnet.minepi.com"); // Endpoint Mainnet
    const keypair = Keypair.fromSecret(APP_SEED);
    const account = await server.loadAccount(keypair.publicKey());

    const tx = new TransactionBuilder(account, {
      fee: "1000000",
      networkPassphrase: "Pi Network", // Passphrase Mainnet
    })
      .addMemo(Memo.text(paymentId))
      .addOperation(Operation.payment({ destination, asset: Asset.native(), amount: Number(amount).toFixed(7) }))
      .setTimeout(120)
      .build();

    tx.sign(keypair);
    const result = await server.submitTransaction(tx);
    const txid = result.hash;

    // 4. Completa
    await fetch(`${BASE_URL}/${paymentId}/complete`, {
      method: "POST",
      headers: { Authorization: `Key ${PI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ txid }),
    });

    return res.status(200).json({ success: true, txid });
  } catch (err: any) {
    console.error("Reward Failure:", err);
    return res.status(500).json({ error: "Reward failed", details: err.message });
  }
}
