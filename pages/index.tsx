import { useEffect, useState, useCallback } from "react";

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
  const [loading, setLoading] = useState(true);

  // 1. Gestione pagamenti incompleti (Obbligatorio per Mainnet)
  const onIncompletePaymentFound = useCallback(async (payment: any) => {
    console.log("Pagamento incompleto trovato:", payment.identifier);
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
    initGame(4);

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
          setAuthReady(true);
          setLoading(false);
        } catch (err) {
          console.error("Errore Auth:", err);
          setLoading(false);
        }
      }
    };

    // Aspettiamo che l'SDK sia effettivamente caricato
    if (window.Pi) {
      initPi();
    } else {
      window.addEventListener("pi_sdk_ready", initPi);
    }
  }, [onIncompletePaymentFound]);

  // --- LOGICA GIOCO ---
  function gridSize() {
    if (premium) return 4;
    return level <= 3 ? 4 : level <= 6 ? 5 : 6;
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
    const updated = cards.map((c) => (c.id === card.id ? { ...c, flipped: true } : c));
    setCards(updated);
    const newSelected = [...selected, { ...card, flipped: true }];
    setSelected(newSelected);
    if (newSelected.length === 2) {
      setTimeout(() => checkMatch(newSelected), 500);
    }
  }

  function checkMatch(pair: CardType[]) {
    const [first, second] = pair;
    if (first.value === second.value) {
      setCards((prev) => prev.map((c) => (c.value === first.value ? { ...c, matched: true } : c)));
      setScore((prev) => prev + (premium ? 20 : 10));
      const allMatched = cards.every((c) => c.matched || c.value === first.value);
      if (allMatched) {
        setLevel((prev) => prev + 1);
        initGame(gridSize());
      }
    } else {
      setCards((prev) => prev.map((c) => (c.id === first.id || c.id === second.id ? { ...c, flipped: false } : c)));
    }
    setSelected([]);
  }

  // --- LOGICA PAGAMENTO ---
  function unlockPremium() {
    if (!authReady) return;

    window.Pi.createPayment(
      {
        amount: 0.1,
        memo: "Arena Premium Unlock",
        metadata: { uid },
      },
      {
        onReadyForServerApproval: async (paymentId: string) => {
          await fetch("/api/pi", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "approve", paymentId, uid }),
          });
        },
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          const res = await fetch("/api/pi", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "complete", paymentId, txid, uid }),
          });
          if (res.ok) {
            setPremium(true);
            alert("Premium unlocked!");
          }
        },
        onCancel: (paymentId: string) => console.log("Cancelled", paymentId),
        onError: (error: any) => console.error("Error", error),
      }
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>⚔ ARENA ⚔</h1>
      
      {loading ? (
        <p>Inizializzazione SDK...</p>
      ) : (
        <>
          {authReady && <div style={{ marginBottom: 10 }}>👤 {username}</div>}
          <p>Level {level} | Score: {score}</p>
          
          <div style={{ ...styles.grid, gridTemplateColumns: `repeat(${gridSize()}, 1fr)` }}>
            {cards.map((card) => (
              <div
                key={card.id}
                style={{ ...styles.card, background: card.flipped || card.matched ? "#b30000" : "#1a1a1a" }}
                onClick={() => handleFlip(card)}
              >
                {card.flipped || card.matched ? card.value : ""}
              </div>
            ))}
          </div>

          {!premium ? (
            <button 
              style={{...styles.button, opacity: authReady ? 1 : 0.5}} 
              onClick={unlockPremium}
              disabled={!authReady}
            >
              {authReady ? "Unlock Premium (0.1 π)" : "Autenticazione in corso..."}
            </button>
          ) : (
            <p style={{ color: "#00ff00" }}>🏆 Premium Active</p>
          )}
        </>
      )}

      <div style={{ marginTop: 30, opacity: 0.6 }}>
        <a href="/privacy.html" style={styles.link}>Privacy</a> | <a href="/terms.html" style={styles.link}>Terms</a>
      </div>
    </div>
  );
}

const styles: any = {
  container: { background: "black", minHeight: "100vh", color: "white", textAlign: "center", padding: "20px" },
  title: { fontSize: "2rem", color: "red" },
  grid: { display: "grid", gap: "10px", maxWidth: "600px", margin: "20px auto" },
  card: { aspectRatio: "1", fontSize: "1.5rem", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid red", borderRadius: "8px", cursor: "pointer" },
  button: { padding: "10px 20px", fontSize: "1rem", background: "red", border: "none", color: "white", borderRadius: "6px", cursor: "pointer" },
  link: { color: "#888", textDecoration: "none", margin: "0 5px" },
};
