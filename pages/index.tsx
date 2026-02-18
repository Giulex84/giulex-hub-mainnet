import { useEffect, useState } from "react";

declare global {
  interface Window {
    Pi: any;
  }
}

const translations: any = {
  it: {
    title: "Giulex Memory Arena",
    start: "Inizia",
    score: "Punteggio",
    level: "Livello",
    premium: "Sblocca Premium (0.1π)",
    premiumActive: "Premium Attivo",
    login: "Accedi con Pi",
  },
  en: {
    title: "Giulex Memory Arena",
    start: "Start",
    score: "Score",
    level: "Level",
    premium: "Unlock Premium (0.1π)",
    premiumActive: "Premium Active",
    login: "Login with Pi",
  },
};

export default function Home() {
  const [uid, setUid] = useState<string | null>(null);
  const [language, setLanguage] = useState<"it" | "en">("it");
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [cards, setCards] = useState<number[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [premium, setPremium] = useState(false);
  const [loading, setLoading] = useState(false);

  const t = translations[language];

  useEffect(() => {
    if (window.Pi) {
      window.Pi.init({ version: "2.0" });
    }
  }, []);

  const login = async () => {
    const scopes = ["username", "payments", "wallet_address"];
    const auth = await window.Pi.authenticate(scopes, () => {});
    setUid(auth.user.uid);
  };

  const generateLevel = () => {
    let pairs = 3 + level; // aumenta difficoltà
    if (premium) pairs += 2;

    const values = Array.from({ length: pairs }, (_, i) => i);
    const doubled = [...values, ...values];
    const shuffled = doubled.sort(() => Math.random() - 0.5);

    setCards(shuffled);
    setFlipped([]);
    setMatched([]);
  };

  const flipCard = (index: number) => {
    if (flipped.length === 2 || flipped.includes(index) || matched.includes(index)) return;

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      if (cards[newFlipped[0]] === cards[newFlipped[1]]) {
        setMatched([...matched, ...newFlipped]);
        setScore(prev => prev + 10 * level);
      }
      setTimeout(() => setFlipped([]), 700);
    }
  };

  useEffect(() => {
    if (matched.length === cards.length && cards.length > 0) {
      setTimeout(() => {
        setLevel(prev => prev + 1);
      }, 800);
    }
  }, [matched]);

  useEffect(() => {
    generateLevel();
  }, [level, premium]);

  const pay = async () => {
    if (!window.Pi || !uid) return;

    setLoading(true);

    await window.Pi.createPayment(
      {
        amount: 0.1,
        memo: "Giulex Premium Mode",
        metadata: { type: "premium_unlock" },
      },
      {
        onReadyForServerApproval: async (paymentId: string) => {
          await fetch("/api/pi", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "approve", paymentId }),
          });
        },
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          await fetch("/api/pi", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "complete", paymentId, txid }),
          });
          setPremium(true);
        },
      }
    );

    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <h1>{t.title}</h1>

      <div style={styles.lang}>
        <button onClick={() => setLanguage("it")}>🇮🇹</button>
        <button onClick={() => setLanguage("en")}>🇬🇧</button>
      </div>

      {!uid && <button style={styles.login} onClick={login}>{t.login}</button>}

      <div style={styles.stats}>
        <div>{t.level}: {level}</div>
        <div>{t.score}: {score}</div>
      </div>

      <div
        style={{
          ...styles.grid,
          gridTemplateColumns: `repeat(${Math.min(6, Math.ceil(Math.sqrt(cards.length)))}, 70px)`
        }}
      >
        {cards.map((card, index) => (
          <div
            key={index}
            onClick={() => flipCard(index)}
            style={{
              ...styles.card,
              background:
                flipped.includes(index) || matched.includes(index)
                  ? "#ffffff"
                  : "#2a2a3b",
              color: "#000",
              transform: flipped.includes(index) ? "rotateY(180deg)" : "none",
            }}
          >
            {(flipped.includes(index) || matched.includes(index)) ? card : ""}
          </div>
        ))}
      </div>

      {!premium && (
        <button style={styles.premium} onClick={pay}>
          {loading ? "..." : t.premium}
        </button>
      )}

      {premium && <div style={styles.premiumActive}>💎 {t.premiumActive}</div>}
    </div>
  );
}

const styles: any = {
  container: {
    textAlign: "center",
    minHeight: "100vh",
    background: "linear-gradient(180deg, #0f0f1a, #1a1a2e)",
    color: "#fff",
    paddingTop: 40,
    fontFamily: "Arial",
  },
  lang: {
    marginBottom: 15,
  },
  login: {
    padding: 10,
    marginBottom: 15,
  },
  stats: {
    display: "flex",
    justifyContent: "space-around",
    marginBottom: 20,
    fontSize: 18,
  },
  grid: {
    display: "grid",
    gap: 10,
    justifyContent: "center",
  },
  card: {
    width: 70,
    height: 70,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
    cursor: "pointer",
    transition: "0.3s",
  },
  premium: {
    marginTop: 25,
    padding: 12,
    borderRadius: 10,
    background: "#ffcc00",
    border: "none",
    fontWeight: "bold",
    cursor: "pointer",
  },
  premiumActive: {
    marginTop: 20,
    fontSize: 18,
    color: "#00ffcc",
  },
};
