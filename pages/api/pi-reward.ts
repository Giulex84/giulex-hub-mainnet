import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const StellarSdk = require("@stellar/stellar-sdk");

  // Stringa raddrizzata presa dal log di ieri (ignoriamo la variabile errata nelle impostazioni)
  const baseSeed = "SCCEKF2L3QGKYX23U2ET463VUDCR77QLRG5UEMBHQW3AIWBJEZX5R75M".split('');
  
  // Tabella delle possibili lettere storpiate dal font dei log
  const possibiliSostituzioni: { [key: string]: string[] } = {
    'L': ['L', 'J', '1', 'I'],
    'Q': ['Q', 'D', '0', 'O', 'G'],
    '6': ['6', 'G', 'B', '8'],
    'G': ['G', '6', 'C'],
    'B': ['B', '8', '3'],
    'U': ['U', 'V', '4', 'W'],
    'V': ['V', 'U', 'Y']
  };

  console.log("BRUTEFORCE: Avvio analisi matematica sul vecchio log...");

  let chiaveTrovata = "";
  
  function cerca(index: number, stringaCorrente: string[]) {
    if (chiaveTrovata) return;
    if (index === baseSeed.length) {
      const seedStr = stringaCorrente.join('');
      try {
        // Se la combinazione è valida per Stellar, passa senza dare errore
        StellarSdk.Keypair.fromSecret(seedStr);
        chiaveTrovata = seedStr;
      } catch (e) {}
      return;
    }

    const charIniziale = baseSeed[index];
    const opzioni = possibiliSostituzioni[charIniziale] || [charIniziale];

    for (const opzione of opzioni) {
      stringaCorrente[index] = opzione;
      cerca(index + 1, stringaCorrente);
    }
  }

  // Avvia la ricerca automatica
  cerca(0, [...baseSeed]);

  if (chiaveTrovata) {
    console.log("CHIAVE_CORRETTA_TROVATA:", chiaveTrovata);
  } else {
    console.log("CHIAVE_CORRETTA_TROVATA: Errore. Nessuna combinazione valida trovata.");
  }

  // --- BLOCCO API ORIGINALE DI PI (Per mantenere l'esecuzione della chiamata) ---
  const PI_API_KEY = process.env.PI_API_KEY;
  if (!PI_API_KEY) {
    console.error("ERRORE: Variabile PI_API_KEY missing!");
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
      return res.status(400).json({ error: createData.error, note: "Ignora questo se cerchi solo la chiave" });
    }

    return res.status(200).json({ success: true, message: "Test completato. Guarda i log di Vercel." });

  } catch (err: any) {
    console.error("CRITICAL ERROR:", err);
    return res.status(500).json({ error: "Process failed", message: err.message });
  }
}
