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

  const [isPreview, setIsPreview] = useState(true);
  const [canPlay, setCanPlay] = useState(false);

  useEffect(() => {
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
            console.error("Auth error", err);
          });
      }
    }, 300);

    const grid = getGridForLevel(1);
    initGame(grid.rows, grid.cols);

    return () => clearInterval(waitForPi);
  }, []);

  function onIncompletePaymentFound(payment: any) {
    console.log("Incomplete payment", payment);
  }

  function getGridForLevel(lvl: number) {
    if (lvl === 1) return { rows: 2, cols: 2 };
    if (lvl === 2) return { rows: 2, cols: 3 };
    if (lvl === 3) return { rows: 3, cols: 4 };
    if (lvl === 4) return { rows: 4, cols: 4 };
    if (lvl === 5) return { rows: 4, cols: 5 };
    return { rows: 5, cols: 6 };
  }

  function initGame(rows: number, cols: number) {
    const total = rows * cols;
    const pairCount = total / 2;

    const selectedSymbols = symbols.slice(0, pairCount);
    const doubled = [...selectedSymbols, ...selectedSymbols];

    const shuffled = doubled
      .sort(() => Math.random() - 0.5)
      .map((value, index) => ({
        id: index,
        value,
        flipped: true,
        matched: false,
      }));

    setCards(shuffled);
    setSelected([]);
    setIsPreview(true);
    setCanPlay(false);

    setTimeout(() => {
      setCards(prev =>
        prev.map(c => ({ ...c, flipped: false }))
      );
      setIsPreview(false);
      setCanPlay(true);
    }, 1500);
  }

  function handleFlip(card: CardType) {
    if (!canPlay || card.flipped || card.matched || selected.length === 2) return;

    const updated = cards.map(c =>
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
      setCards(prev =>
        prev.map(c =>
          c.value === first.value ? { ...c, matched: true } : c
        )
      );

      setScore(prev => prev + 10);

      const allMatched = cards.every(
        c => c.matched || c.value === first.value
      );

      if (allMatched) {
        const next = level + 1;
        setLevel(next);

        const grid = getGridForLevel(next);
        initGame(grid.rows, grid.cols);
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
          body: JSON.stringify({
            action: "approve",
            paymentId,
            uid,
          }),
        });
      },

      async (paymentId: string, txid: string) => {
        const res = await fetch("/api/pi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "complete",
            paymentId,
            txid,
            uid,
          }),
        });

        if (res.ok) {
          setPremium(true);
          alert("Premium unlocked!");
        }
      },

      () => {},
      () => {}
    );
  }

  const grid = getGridForLevel(level);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>ARENA</h1>

      <div style={styles.info}>
        <div>Level {level}</div>
        <div>Score {score}</div>
      </div>

      {isPreview && <div style={styles.preview}>Memorize the cards...</div>}

      <div
        style={{
          ...styles.grid,
          gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
        }}
      >
        {cards.map(card => (
          <div
            key={card.id}
            style={{
              ...styles.card,
              background: card.matched
                ? "#1f3a2f"
                : card.flipped
                ? "#2a2a2a"
                : "#222",
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

      {premium && <p style={styles.premium}>Premium Active</p>}
    </div>
  );
}

const styles: any = {
  container: {
    background: "linear-gradient(180deg, #111, #1a1a1a)",
    minHeight: "100vh",
    color: "#eee",
    textAlign: "center",
    padding: "20px",
  },
  title: {
    fontSize: "2rem",
    marginBottom: "10px",
  },
  info: {
    display: "flex",
    justifyContent: "center",
    gap: "20px",
    marginBottom: "10px",
    opacity: 0.8,
  },
  preview: {
    marginBottom: "10px",
    opacity: 0.6,
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
    border: "1px solid #333",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.25s ease",
  },
  button: {
    marginTop: "20px",
    padding: "10px 20px",
    background: "#2ecc71",
    border: "none",
    color: "#111",
    borderRadius: "6px",
    cursor: "pointer",
  },
  premium: {
    marginTop: "15px",
    color: "#2ecc71",
  },
};
