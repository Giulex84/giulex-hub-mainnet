import { useEffect, useState } from "react";

declare global {
  interface Window {
    Pi: any;
  }
}

export default function Home() {
  const [uid, setUid] = useState<string | null>(null);
  const [heading, setHeading] = useState<number>(0);
  const [premium, setPremium] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (window.Pi) {
      window.Pi.init({ version: "2.0" });
    }
  }, []);

  // 🔄 DEMO COMPASS ANIMATION
  useEffect(() => {
    const interval = setInterval(() => {
      setHeading((prev) => (prev + 2) % 360);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const login = async () => {
    try {
      const scopes = ["username", "payments", "wallet_address"];
      const auth = await window.Pi.authenticate(scopes, () => {});
      setUid(auth.user.uid);

      await fetch("/api/pi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "engage", uid: auth.user.uid }),
      });
    } catch {
      alert("Login failed");
    }
  };

  const pay = async () => {
    if (!window.Pi || !uid) {
      alert("Open inside Pi Browser and login first");
      return;
    }

    setLoading(true);

    try {
      await window.Pi.createPayment(
        {
          amount: 0.1,
          memo: "Giulex Compass Premium",
          metadata: { type: "premium_demo" },
        },
        {
          onReadyForServerApproval: async (paymentId: string) => {
            await fetch("/api/pi", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "approve", paymentId }),
            });
          },

          onReadyForServerCompletion: async (
            paymentId: string,
            txid: string
          ) => {
            await fetch("/api/pi", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "complete",
                paymentId,
                txid,
              }),
            });

            setPremium(true);
          },
        }
      );
    } catch {
      alert("Payment failed");
    }

    setLoading(false);
  };

  const getDirection = () => {
    const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return dirs[Math.round(heading / 45) % 8];
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Giulex Compass</h1>
      <p style={styles.subtitle}>Mainnet Utility App</p>

      {!uid ? (
        <button style={styles.button} onClick={login}>
          Login with Pi
        </button>
      ) : (
        <>
          <div
            style={{
              ...styles.compass,
              boxShadow: premium
                ? "0 0 40px rgba(255,0,0,0.8)"
                : "0 0 15px rgba(0,0,0,0.3)",
            }}
          >
            <div
              style={{
                ...styles.needle,
                transform: `rotate(${heading}deg)`,
                background: premium ? "red" : "black",
              }}
            />
            <div style={styles.centerDot} />
          </div>

          <h2>{heading}°</h2>
          <h3>{getDirection()}</h3>

          {!premium && (
            <button
              style={styles.premiumButton}
              onClick={pay}
              disabled={loading}
            >
              {loading ? "Processing..." : "Unlock Premium (0.1π)"}
            </button>
          )}

          {premium && (
            <p style={styles.badge}>
              Premium Supporter Active 🧭✨
            </p>
          )}
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
  title: {
    fontSize: 32,
  },
  subtitle: {
    marginBottom: 20,
  },
  button: {
    padding: 12,
    fontSize: 16,
    borderRadius: 8,
    cursor: "pointer",
  },
  compass: {
    width: 260,
    height: 260,
    borderRadius: "50%",
    border: "8px solid black",
    margin: "30px auto",
    position: "relative",
    transition: "box-shadow 0.3s ease",
  },
  needle: {
    width: 4,
    height: 120,
    position: "absolute",
    top: 20,
    left: "50%",
    transformOrigin: "bottom center",
    transition: "transform 0.1s linear",
  },
  centerDot: {
    width: 16,
    height: 16,
    borderRadius: "50%",
    background: "black",
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
  },
  premiumButton: {
    marginTop: 20,
    padding: 14,
    borderRadius: 8,
    background: "black",
    color: "white",
    cursor: "pointer",
  },
  badge: {
    marginTop: 20,
    fontWeight: "bold",
    color: "red",
  },
};
