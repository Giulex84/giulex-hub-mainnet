import { useEffect, useState } from "react";

declare global {
  interface Window {
    Pi: any;
  }
}

const translations: any = {
  it: {
    title: "Giulex Memory Quest",
    login: "Accedi con Pi",
    selectLang: "Seleziona Lingua",
    start: "Inizia Gioco",
    premium: "Sblocca Premium (0.1π)",
    score: "Punteggio",
    win: "Hai vinto!",
    premiumActive: "Premium Attivo",
  },
  en: {
    title: "Giulex Memory Quest",
    login: "Login with Pi",
    selectLang: "Select Language",
    start: "Start Game",
    premium: "Unlock Premium (0.1π)",
    score: "Score",
    win: "You Win!",
    premiumActive: "Premium Active",
  },
};

export default function Home() {
  const [uid, setUid] = useState<string | null>(null);
  const [language, setLanguage] = useState<"it" | "en">("it");
  const [premium, setPremium] = useState(false);
  const [cards, setCards] = useState<number[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [score, setScore] = useState(0);
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

    await fetch("/api/pi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "engage", uid: auth.user.uid }),
    });
  };

  const startGame = () => {
    const size = premium ? 8 : 6;
    const values = Array.from({ length: size }, (_, i) => i % (size / 2));
    const shuffled = values.sort(() => Math.random() - 0.5);

    setCards(shuffled);
    setFlipped([]);
    setMatched([]);
    setScore(0);
  };

  const flipCard = (index: number) => {
    if (flipped.length === 2 || flipped.includes(index) || matched.includes(index)) return;

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      if (cards[newFlipped[0]] === cards[newFlipped[1]]) {
        setMatched([...matched, ...newFlipped]);
        setScore(score + 10);
      }
      setTimeout(() => setFlipped([]), 800);
    }
  };

  const pay = async () => {
    if (!window.Pi || !uid) return;

    setLoading(true);

    await window.Pi.createPayment(
      {
        amount: 0.1,
        memo: "Giulex Memory Premium",
        metadata: { type: "memory_premium" },
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

      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setLanguage("it")}>🇮🇹 IT</button>
        <button onClick={() => setLanguage("en")}>🇬🇧 EN</button>
      </div>

      {!uid ? (
        <button onClick={login}>{t.login}</button>
      ) : (
        <>
          <button onClick={startGame}>{t.start}</button>

          <h3>{t.score}: {score}</h3>

          <div style={{
            display: "grid",
            gridTemplateColumns: premium ? "repeat(4, 80px)" : "repeat(3, 80px)",
            gap: 10,
            justifyContent: "center",
            marginTop: 20
          }}>
            {cards.map((card, index) => (
              <div
                key={index}
                onClick={() => flipCard(index)}
                style={{
                  width: 80,
                  height: 80,
                  background:
                    flipped.includes(index) || matched.includes(index)
                      ? "#fff"
                      : "#333",
                  color: "#000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  cursor: "pointer",
                  borderRadius: 10,
                }}
              >
                {(flipped.includes(index) || matched.includes(index)) ? card : ""}
              </div>
            ))}
          </div>

          {matched.length === cards.length && cards.length > 0 && (
            <h2>{t.win}</h2>
          )}

          {!premium && (
            <button
              onClick={pay}
              disabled={loading}
              style={{ marginTop: 20 }}
            >
              {loading ? "..." : t.premium}
            </button>
          )}

          {premium && <p>{t.premiumActive} 💎</p>}
        </>
      )}
    </div>
  );
}

const styles: any = {
  container: {
    textAlign: "center",
    marginTop: 40,
    fontFamily: "Arial",
  },
};
