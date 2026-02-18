import { useEffect, useMemo, useState } from "react";

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

const symbols = ["⚔", "🔥", "🛡", "🏹", "👑", "💎", "⚡", "🩸", "🧠", "🐉", "🌑", "☠"];

export default function Arena() {
  const [cards, setCards] = useState<CardType[]>([]);
  const [selected, setSelected] = useState<CardType[]>([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [premium, setPremium] = useState(false);

  const [uid, setUid] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const isSandbox = useMemo(() => {
    return (process.env.NEXT_PUBLIC_PI_SANDBOX || "").toLowerCase() === "true";
  }, []);

  // Scopes "review-safe" per pagamenti + wallet assignment
  const scopes = useMemo(() => ["username", "payments", "wallet_address"], []);

  useEffect(() => {
    initGame(4);

    // Aspetta che Pi SDK sia realmente caricato
    const t = setInterval(() => {
      if (window.Pi) {
        clearInterval(t);

        try {
          window.Pi.init({ version: "2.0", sandbox: isSandbox });
        } catch (e: any) {
          // init può lanciare errori se chiamato più volte: non bloccare
          console.warn("Pi.init warning:", e?.message || e);
        }

        window.Pi.authenticate(scopes, onIncompletePaymentFound)
          .then((auth: any) => {
            setUid(auth?.user?.uid || null);
            setUsername(auth?.user?.username || null);
            setAuthReady(true);
            setAuthError(null);
            console.log("AUTH OK:", auth);
          })
          .catch((err: any) => {
            console.error("AUTH ERROR:", err);
            setAuthError(err?.message || "Auth failed");
            setAuthReady(false);
          });
      }
    }, 250);

    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSandbox]);

  function onIncompletePaymentFound(payment: any) {
    // Pi SDK richiede callback per evitare freeze
    console.log("Incomplete payment found:", payment);
  }

  function gridSize() {
    if (level <= 3) return 4;
    if (level <= 6) return 5;
    if (level <= 9) return 6;
    return 6;
  }

  function initGame(size: number) {
    const pairCount = (size * size) / 2;
    const selectedSymbols = symbols.slice(0, pairCount);
    const doubled = [...selectedSymbols, ...selectedSymbols];
    const shuffled = doubled
      .sort(() => Math.random() - 0.5)
      .map((value, index) => ({
        id: index,
        value,
        flipped: false,
        matched: false,
      }));
    setCards(shuffled);
    setSelected([]);
  }

  function handleFlip(card: CardType) {
    if (card.flipped || card.matched || selected.length === 2) return;

    const newCards = cards.map((c) => (c.id === card.id ? { ...c, flipped: true } : c));
    setCards(newCards);

    const newSelected = [...selected, { ...card, flipped: true }];
    setSelected(newSelected);

    if (newSelected.length === 2) {
      setTimeout(() => checkMatch(newSelected), 450);
    }
  }

  function checkMatch(selectedCards: CardType[]) {
    const [first, second] = selectedCards;

    if (first.value === second.value) {
      setCards((prev) => prev.map((c) => (c.value === first.value ? { ...c, matched: true } : c)));
      setScore((prev) => prev + 10);

      // Calcola "allMatched" in modo corretto (usando prev nello stesso update sarebbe meglio,
      // ma qui è ok perché facciamo check includendo la coppia appena matchata)
      const allMatched = cards.every((c) => c.matched || c.value === first.value);
      if (allMatched) {
        setLevel((prev) => prev + 1);
        initGame(gridSize());
      }
    } else {
      setCards((prev) =>
        prev.map((c) =>
          c.id === first.id || c.id === second.id ? { ...c, flipped: false } : c
        )
      );
    }

    setSelected([]);
  }

  async function unlockPremium() {
  if (!window.Pi || !uid) {
    alert("Auth not ready");
    return;
  }

  try {
    await window.Pi.createPayment(
      {
        amount: 0.1,
        memo: "Arena Premium Unlock",
        metadata: { uid },
      },

      // 1️⃣ READY FOR SERVER APPROVAL
      async (paymentId: string) => {
        console.log("Ready for approval:", paymentId);

        const approveRes = await fetch("/api/pi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "approve",
            paymentId,
            uid,
          }),
        });

        const approveData = await approveRes.json();
        console.log("APPROVE:", approveData);

        if (!approveRes.ok) {
          throw new Error(approveData?.error || "Approve failed");
        }
      },

      // 2️⃣ READY FOR SERVER COMPLETION
      async (paymentId: string, txid: string) => {
        console.log("Ready for completion:", paymentId, txid);

        const completeRes = await fetch("/api/pi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({


      const approveData = await approveRes.json();
      console.log("APPROVE:", approveData);

      if (!approveRes.ok) {
        // gestione ongoing_payment_found: backend può già auto-cancellare
        throw new Error(approveData?.error || "Approve failed");
      }

      // 3) COMPLETE via backend (idempotente)
      const completeRes = await fetch("/api/pi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete",
          paymentId: payment.identifier,
          txid: payment.transaction?.txid || null, // se presente
          uid,
        }),
      });

      const completeData = await completeRes.json();
      console.log("COMPLETE:", completeData);

      if (!completeRes.ok) {
        throw new Error(completeData?.error || "Complete failed");
      }

      // ✅ SOLO ORA consegni premium (review-safe)
      setPremium(true);
      alert("Premium unlocked!");
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Payment failed");
    }
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>⚔ ARENA ⚔</h1>

      <div style={{ marginBottom: 10, opacity: 0.9 }}>
        <div>
          <b>Auth:</b> {authReady ? "OK" : "NOT READY"}
          {isSandbox ? " (SANDBOX)" : " (PROD)"}
        </div>
        {username && <div><b>User:</b> {username}</div>}
        {uid && <div><b>UID:</b> {uid}</div>}
        {authError && <div style={{ color: "#ffb3b3" }}><b>Error:</b> {authError}</div>}
      </div>

      <p style={styles.level}>Level {level}</p>
      <p style={styles.score}>Score: {score}</p>

      <div style={{ ...styles.grid, gridTemplateColumns: `repeat(${gridSize()}, 1fr)` }}>
        {cards.map((card) => (
          <div
            key={card.id}
            style={{
              ...styles.card,
              background: card.flipped || card.matched ? "#b30000" : "#1a1a1a",
            }}
            onClick={() => handleFlip(card)}
          >
            {card.flipped || card.matched ? card.value : ""}
          </div>
        ))}
      </div>

      {!premium && (
        <button style={styles.button} onClick={unlockPremium}>
          Unlock Premium (0.1 π)
        </button>
      )}

      {premium && <p style={styles.premium}>🏆 Premium Active</p>}
    </div>
  );
}

const styles: any = {
  container: {
    background: "linear-gradient(180deg, #000000, #1a0000)",
    minHeight: "100vh",
    color: "white",
    textAlign: "center",
    padding: "20px",
  },
  title: {
    fontSize: "2.5rem",
    color: "#ff0000",
  },
  level: {
    fontSize: "1.2rem",
  },
  score: {
    fontSize: "1.2rem",
    marginBottom: "20px",
  },
  grid: {
    display: "grid",
    gap: "10px",
    maxWidth: "600px",
    margin: "0 auto",
  },
  card: {
    aspectRatio: "1",
    fontSize: "1.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid #ff0000",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "0.3s",
    userSelect: "none",
  },
  button: {
    marginTop: "20px",
    padding: "10px 20px",
    fontSize: "1rem",
    background: "#ff0000",
    border: "none",
    color: "white",
    borderRadius: "6px",
    cursor: "pointer",
  },
  premium: {
    marginTop: "20px",
    color: "#00ff00",
  },
};
