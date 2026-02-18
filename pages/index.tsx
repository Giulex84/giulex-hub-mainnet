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

  useEffect(() => {
    if (window.Pi) {
      window.Pi.init({ version: "2.0" });
      window.Pi.authenticate(["username"], onIncompletePaymentFound)
        .then((auth: any) => {
          setUid(auth.user.uid);
        });
    }
    initGame(4);
  }, []);

  function onIncompletePaymentFound(payment: any) {
    console.log("Incomplete payment found", payment);
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

    const newCards = cards.map(c =>
      c.id === card.id ? { ...c, flipped: true } : c
    );
    setCards(newCards);

    const newSelected = [...selected, { ...card, flipped: true }];
    setSelected(newSelected);

    if (newSelected.length === 2) {
      setTimeout(() => {
        checkMatch(newSelected);
      }, 500);
    }
  }

  function checkMatch(selectedCards: CardType[]) {
    const [first, second] = selectedCards;
    if (first.value === second.value) {
      setCards(prev =>
        prev.map(c =>
          c.value === first.value ? { ...c, matched: true } : c
        )
      );
      setScore(prev => prev + 10);

      const allMatched = cards.every(c => c.matched || c.value === first.value);
      if (allMatched) {
        setLevel(prev => prev + 1);
        initGame(gridSize());
      }
    } else {
      setCards(prev =>
        prev.map(c =>
          c.id === first.id || c.id === second.id
            ? { ...c, flipped: false }
            : c
        )
      );
    }
    setSelected([]);
  }

  async function unlockPremium() {
    if (!window.Pi || !uid) return;

    async function unlockPremium() {
  if (!window.Pi || !uid) return;

  try {
    await window.Pi.createPayment(
      {
        amount: 0.1,
        memo: "Arena Premium Unlock",
        metadata: { uid },
      },
      {
        onReadyForServerApproval: async (paymentId: string) => {
          await fetch("/api/pi-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "approve",
              paymentId,
            }),
          });
        },

        onReadyForServerCompletion: async (
          paymentId: string,
          txid: string
        ) => {
          await fetch("/api/pi-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "complete",
              paymentId,
              txid,
            }),
          });

          setPremium(true);
          alert("Premium unlocked!");
        },

        onCancel: (paymentId: string) => {
          console.log("Payment cancelled", paymentId);
        },

        onError: (error: any) => {
          console.error("Payment error", error);
        },
      }
    );
  } catch (e) {
    console.error(e);
    alert("Payment failed");
  }
}


  return (
    <div style={styles.container}>
      <h1 style={styles.title}>⚔ ARENA ⚔</h1>
      <p style={styles.level}>Level {level}</p>
      <p style={styles.score}>Score: {score}</p>

      <div
        style={{
          ...styles.grid,
          gridTemplateColumns: `repeat(${gridSize()}, 1fr)`,
        }}
      >
        {cards.map(card => (
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
 <div style={{ marginTop: "30px", fontSize: "12px" }}>
  <a 
    href="https://logo-five-mu.vercel.app/privacy.html"
    target="_blank"
    style={{ color: "#ffffff", marginRight: "15px" }}
  >
    Privacy Policy
  </a>

  <a 
    href="https://logo-five-mu.vercel.app/terms.html"
    target="_blank"
    style={{ color: "#ffffff" }}
  >
    Terms of Service
  </a>
</div>

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
