import { useEffect, useState, useCallback } from "react";
import Head from "next/head";

declare global {
  interface Window {
    Pi: any;
  }
}

type CardType = {
  id: number;
  value: string;
  flipped: boolean;
  matched: boolean;
};

const symbols = ["⚔", "🔥", "🛡", "🏹", "👑", "💎", "⚡", "🩸", "🧠", "🐉", "🌑", "☠", "🍄", "⭐", "🌪", "🧊", "🌋", "🧿"];

export default function ArenaMainnet() {
  const [cards, setCards] = useState<CardType[]>([]);
  const [selected, setSelected] = useState<CardType[]>([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(5);
  const [combo, setCombo] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [status, setStatus] = useState("Waiting for login...");
  const [isHeal, setIsHeal] = useState(false);
  const [isShake, setIsShake] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. PERSISTENZA: Recupera stato Premium e Progressi al caricamento
  useEffect(() => {
    const savedPremium = localStorage.getItem("arena_premium");
    if (savedPremium === "true") setIsPremium(true);

    const savedLevel = localStorage.getItem("arena_level");
    if (savedLevel) setLevel(parseInt(savedLevel));
  }, []);

  // 2. LOGICA LIVELLI PROGRESSIVI (Come Testnet)
  const initGame = useCallback(() => {
    // Definizione griglia: Lvl 1 (2x2), Lvl 2-3 (4x4), Lvl 4+ (6x6)
    const size = level === 1 ? 2 : (level <= 3 ? 4 : 6);
    const pairCount = (size * size) / 2;
    
    // Gestione Vite: Premium = Infinite, Standard = Max 10
    if (!isPremium) {
      setLives(Math.min(5 + (level - 1), 10));
    } else {
      setLives(999); 
    }

    const selectedSymbols = symbols.slice(0, pairCount);
    const doubled = [...selectedSymbols, ...selectedSymbols]
      .sort(() => Math.random() - 0.5)
      .map((value, index) => ({
        id: index,
        value,
        flipped: false,
        matched: false,
      }));
    
    setCards(doubled);
    setSelected([]);
    setCombo(0);
  }, [level, isPremium]);

  // Inizializzazione Pi SDK
  const onIncompletePaymentFound = useCallback(async (payment: any) => {
    await fetch("/api/pi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "complete",
        paymentId: payment.identifier,
        txid: payment.transaction.txid,
        uid: payment.metadata.uid,
      }),
    });
  }, []);

  useEffect(() => {
    const initPi = async () => {
      if (typeof window !== "undefined" && window.Pi) {
        try {
          await window.Pi.init({ version: "2.0" });
          const auth = await window.Pi.authenticate(
            ["username", "payments", "wallet_address"],
            onIncompletePaymentFound
          );
          setUid(auth.user.uid);
          setUsername(auth.user.username);
          setStatus("Online");
          setLoading(false);
          initGame();
        } catch (err: any) {
          setStatus("Auth Error: " + err.message);
          setLoading(false);
        }
      }
    };

    if (window.Pi) initPi();
    else window.addEventListener("pi_sdk_ready", initPi);
  }, [onIncompletePaymentFound, initGame]);

  // 3. REWARD A2U (0.3 Pi)
  const claimReward = async () => {
    if (!uid) return;
    setStatus("Status: Claiming 0.3 Pi Reward...");
    try {
      const res = await fetch("/api/pi-reward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, amount: 0.3 })
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("Status: 0.3 Pi Reward Sent! ✅");
      } else {
        // Se il wallet è in spending review, mostriamo l'errore tecnico
        setStatus(`Status: Wallet Reviewing (${data.error || 'Retry later'})`);
      }
    } catch (e) {
      setStatus("Status: Reward Service Unavailable");
    }
  };

  const handleFlip = (card: CardType) => {
    if (card.flipped || card.matched || selected.length === 2 || (!isPremium && lives <= 0)) return;
    
    const updatedCards = cards.map(c => c.id === card.id ? { ...c, flipped: true } : c);
    setCards(updatedCards);
    
    const newSelected = [...selected, card];
    setSelected(newSelected);

    if (newSelected.length === 2) {
      setTimeout(() => checkMatch(newSelected, updatedCards), 500);
    }
  };

  const checkMatch = (pair: CardType[], currentCards: CardType[]) => {
    const [a, b] = pair;
    if (a.value === b.value) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      
      if (!isPremium && lives < 10) {
        setLives(prev => prev + 1);
        setIsHeal(true);
        setTimeout(() => setIsHeal(false), 500);
      }

      if (newCombo === 3) claimReward();

      const updatedMatched = currentCards.map(c => 
        c.value === a.value ? { ...c, matched: true } : c
      );
      setCards(updatedMatched);
      setScore(prev => prev + (isPremium ? 20 : 10) * newCombo);

      if (updatedMatched.every(c => c.matched)) {
        const nextLevel = level + 1;
        setLevel(nextLevel);
        localStorage.setItem("arena_level", nextLevel.toString()); // Salva livello
        setTimeout(initGame, 1000);
      }
    } else {
      setCombo(0);
      if (!isPremium) {
        setLives(prev => prev - 1);
        setIsShake(true);
        setTimeout(() => setIsShake(false), 400);
      }
      setCards(currentCards.map(c => 
        (c.id === a.id || c.id === b.id) ? { ...c, flipped: false } : c
      ));
    }
    setSelected([]);
  };

  // 4. PAGAMENTO PREMIUM CON SALVATAGGIO PERSISTENTE
  const unlockPremium = () => {
    if (!uid) return;
    setStatus("Status: Opening Wallet...");
    window.Pi.createPayment({
      amount: 1.0,
      memo: "Arena Premium Lifetime Unlock",
      metadata: { uid },
    }, {
      onReadyForServerApproval: async (pId: string) => {
        await fetch("/api/pi", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "approve", paymentId: pId }) });
      },
      onReadyForServerCompletion: async (pId: string, txid: string) => {
        await fetch("/api/pi", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "complete", paymentId: pId, txid }) });
        
        // Salva permanentemente sul dispositivo
        setIsPremium(true);
        localStorage.setItem("arena_premium", "true");
        setStatus("Status: Premium Active Forever!");
      },
      onCancel: () => setStatus("Status: Payment Cancelled"),
      onError: (err: any) => setStatus("Status: Payment Error")
    });
  };

  return (
    <div className="container">
      <Head>
        <title>Arena Mainnet</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      <main className="app">
        <h2 className="title">⚔ ARENA ⚔</h2>
        
        {uid && (
          <div className="game-stats">
            <div className="stat-item">LVL <span>{level}</span></div>
            <div className={`stat-item ${isHeal ? 'heal' : ''}`}>
               HP <span>{isPremium ? "∞" : lives}</span>
            </div>
            <div className="stat-item">PTS <span>{score}</span></div>
          </div>
        )}

        <div className="combo-zone">
          {combo >= 3 ? "🔥 TRIPLE COMBO! PI REWARD" : combo > 0 ? `COMBO X${combo}!` : ""}
        </div>

        {loading ? (
          <div className="loader">Loading Hero...</div>
        ) : (
          <div className={`grid-container ${isShake ? 'shake' : ''}`} 
               style={{ gridTemplateColumns: `repeat(${level === 1 ? 2 : (level <= 3 ? 4 : 6)}, 1fr)` }}>
            {cards.map(card => (
              <div key={card.id} 
                   className={`card ${card.flipped || card.matched ? 'flipped' : ''}`}
                   onClick={() => handleFlip(card)}>
                <span className="card-content">{card.flipped || card.matched ? card.value : ""}</span>
              </div>
            ))}
          </div>
        )}

        {!isPremium && uid && (
          <button className="premium-btn" onClick={unlockPremium}>
            UNLOCK PREMIUM LIVES (1.0 π)
          </button>
        )}

        <div className="status-console">{status}</div>
      </main>

      <footer className="footer">
        <a href="/privacy.html">Privacy</a>
        <span className="divider">|</span>
        <a href="/terms.html">Terms</a>
      </footer>

      <style jsx>{`
        .container { background: #05050a; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: 'Segoe UI', sans-serif; color: #fff; }
        .app { width: 90%; max-width: 400px; background: #111122; padding: 20px; border-radius: 30px; border: 2px solid #222244; box-shadow: 0 20px 50px rgba(0,0,0,0.5); text-align: center; }
        .title { color: #ff3e3e; letter-spacing: 4px; text-shadow: 0 0 15px rgba(255, 62, 62, 0.4); margin-bottom: 20px; }
        .game-stats { display: flex; justify-content: space-between; margin-bottom: 15px; background: #000; padding: 10px 15px; border-radius: 15px; border: 1px solid #333; }
        .stat-item { font-weight: bold; font-size: 0.8rem; color: #aaa; }
        .stat-item span { display: block; color: #fff; font-size: 1.1rem; }
        .heal { animation: pulse-green 0.5s; }
        .combo-zone { height: 25px; color: #ffb300; font-weight: bold; font-size: 0.9rem; margin-bottom: 10px; }
        .grid-container { display: grid; gap: 8px; margin: 0 auto 20px auto; }
        .card { aspect-ratio: 1; background: #1a1a35; border: 1px solid #333366; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; transition: 0.3s; cursor: pointer; }
        .card.flipped { background: #ff3e3e; border-color: #ff7676; transform: rotateY(180deg); }
        .card-content { transform: rotateY(180deg); }
        .premium-btn { width: 100%; background: linear-gradient(45deg, #ffb300, #ff8c00); color: #000; border: none; padding: 15px; border-radius: 15px; font-weight: bold; font-size: 0.9rem; cursor: pointer; box-shadow: 0 4px 15px rgba(255, 179, 0, 0.3); }
        .status-console { margin-top: 15px; font-family: monospace; font-size: 0.7rem; color: #00ff00; background: #000; padding: 8px; border-radius: 8px; }
        .footer { margin-top: 20px; font-size: 0.8rem; }
        .footer a { color: #666; text-decoration: none; }
        .divider { margin: 0 10px; color: #333; }
        .shake { animation: shake 0.4s; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        @keyframes pulse-green { 0% { transform: scale(1); color: #fff; } 50% { transform: scale(1.2); color: #00ff00; } 100% { transform: scale(1); color: #fff; } }
      `}</style>
    </div>
  );
}
