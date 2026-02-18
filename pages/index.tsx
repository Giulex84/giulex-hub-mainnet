import { useEffect, useState } from "react";

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

  useEffect(() => {
    initGame(4);

    const waitForPi = setInterval(() => {
      if (window.Pi) {
        clearInterval(waitForPi);

        window.Pi.init({ version: "2.0" });

        window.Pi.authenticate(
          ["username", "payments", "wallet_address"],
          onIncompletePaymentFound
        )
          .then((auth: any) => {
            setUid(auth.user.uid);
            setUsername(auth.user.username);
            setAuthReady(true);
          })
          .catch((err: any) => {
            console.error("AUTH ERROR", err);
          });
      }
    }, 300);

    return () => clearInterval(waitForPi);
  }, []);

  function onIncompletePaymentFound(payment: any) {
    console.log("Incomplete payment", payment);
  }

  function gridSize() {
    if (level <= 3) return 4;
    if (level <= 6) return 5;
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

    const updated = cards.map((c) =>
      c.id === card.id ? { ...c, flipped: true } : c
    );

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
      setCards((prev) =>
        prev.map((c) =>
          c.value === first.value ? { ...c, matched: true } : c
        )
      );

      setScore((prev) => prev + 10);

      const allMatched = cards.every(
        (c) => c.matched || c.value === first.value
      );

      if (allMatched) {
        setLevel((prev) => prev + 1);
        initGame(gridSize());
      }
    } else {
      setCards((prev) =>
        prev.map((c) =>
          c.id === first.id || c.id === second.id
            ? { ...c, flipped: false }
            : c
        )
      );
    }

    setSelected([]);
  }

  function unlockPremium() {
    if (!window.Pi || !uid || !authReady) {
      alert("Auth not ready");
      return;
    }

    window.Pi.createPayment(
      {
        amount: 0.1,
        memo: "Arena Premium Unlock",
        metadata: { uid },
      },
      async (paymentId: string) => {
        await fetch("/api/pi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "approve", paymentId, uid }),
        });
      },
      async (paymentId: string, txid: string) => {
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
      () => {},
      (error: any) => {
        console.error("Payment error", error);
      }
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>⚔ ARENA ⚔</h1>

      {authReady && (
        <div style={{ marginBottom: 15, fontSize: "0.95rem", opacity: 0.8 }}>
          👤 {username}
        </div>
      )}

      <p>Level {level}</p>
      <p>Score: {score}</p>

      <div
        style={{
          ...styles.grid,
          gridTemplateColumns: `repeat(${gridSize()}, 1fr)`,
        }}
      >
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

      {premium && <p style={{ color: "#00ff00" }}>🏆 Premium Active</p>}

      <div style={styles.footer}>
        <a href="/privacy.html" target="_blank" rel="noopener noreferrer" style={styles.footerLink}>
          Privacy
        </a>
        <span style={{ margin: "0 10px" }}>|</span>
        <a href="/terms.html" target="_blank" rel="noopener noreferrer" style={styles.footerLink}>
          Terms
        </a>
      </div>
    </div>
  );
}

const styles: any = {
  container: {
    background: "black",
    minHeight: "100vh",
    color: "white",
    textAlign: "center",
    padding: "20px",
  },
  title: {
    fontSize: "2rem",
    color: "red",
  },
  grid: {
    display: "grid",
    gap: "10px",
    maxWidth: "600px",
    margin: "20px auto",
  },
  card: {
    aspectRatio: "1",
    fontSize: "1.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid red",
    borderRadius: "8px",
    cursor: "pointer",
  },
  button: {
    padding: "10px 20px",
    fontSize: "1rem",
    background: "red",
    border: "none",
    color: "white",
    borderRadius: "6px",
    cursor: "pointer",
  },
  footer: {
    marginTop: "30px",
    fontSize: "12px",
    opacity: 0.6,
  },
  footerLink: {
    color: "#aaaaaa",
    textDecoration: "none",
  },
};
