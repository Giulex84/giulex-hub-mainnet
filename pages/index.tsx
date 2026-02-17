import { useEffect, useState } from "react";

declare global {
  interface Window {
    Pi: any;
    DeviceOrientationEvent: any;
  }
}

export default function Home() {
  const [uid, setUid] = useState<string | null>(null);
  const [heading, setHeading] = useState<number>(0);
  const [premium, setPremium] = useState(false);
  const [loading, setLoading] = useState(false);
  const [compassActive, setCompassActive] = useState(false);

  useEffect(() => {
    if (window.Pi) {
      window.Pi.init({ version: "2.0" });
    }
  }, []);

  const requestCompassPermission = async () => {
    if (
      typeof window.DeviceOrientationEvent !== "undefined" &&
      typeof (window.DeviceOrientationEvent as any).requestPermission ===
        "function"
    ) {
      const permission = await (window.DeviceOrientationEvent as any).requestPermission();
      if (permission === "granted") startCompass();
    } else {
      startCompass();
    }
  };

  const startCompass = () => {
    setCompassActive(true);

    window.addEventListener("deviceorientation", (event: any) => {
      if (event.alpha !== null) {
        setHeading(Math.round(360 - event.alpha));
      }
    });
  };

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
    } catch (err) {
      alert("Login error");
    }
  };

  const pay = async () => {
    if (!window.Pi || !uid) {
      alert("Apri dal Pi Browser e fai login");
      return;
    }

    setLoading(true);

    try {
      await window.Pi.createPayment(
        {
          amount: 0.1,
          memo: "Unlock Giulex Compass Premium",
          metadata: { type: "premium_compass" },
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
            alert("Premium Compass Activated 🧭✨");
          },
        }
      );
    } catch (err) {
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
          {!compassActive && (
            <button style={styles.activateButton} onClick={requestCompassPermission}>
              Activate Compass
            </button>
          )}

          <div
            style={{
              ...styles.compass,
              boxShadow: premium
                ? "0 0 30px rgba(255,0,0,0.7)"
                : "0 0 10px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                ...styles.needle,
                transform: `rotate(${heading}deg)`,
                background: premium ? "red" : "gray",
              }}
            />
            <div style={styles.centerDot} />
          </div>

          <h2 style={styles.degree}>{heading}°</h2>
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

          {premium && <p style={styles.badge}>Premium Supporter 🏅</p>}
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
  activateButton: {
    padding: 10,
    marginBottom: 20,
    borderRadius: 6,
  },
  compass: {
    width: 240,
    height: 240,
    borderRadius: "50%",
    border: "6px solid black",
    margin: "20px auto",
    position: "relative",
    transition: "box-shadow 0.3s ease",
  },
  needle: {
    width: 4,
    height: 100,
    position: "absolute",
    top: 20,
    left: "50%",
    transformOrigin: "bottom center",
    transition: "transform 0.2s ease-out",
  },
  centerDot: {
    width: 14,
    height: 14,
    borderRadius: "50%",
    background: "black",
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
  },
  degree: {
    marginTop: 10,
  },
  premiumButton: {
    marginTop: 20,
    padding: 12,
    borderRadius: 8,
    background: "black",
    color: "white",
    cursor: "pointer",
  },
  badge: {
    marginTop: 20,
    fontWeight: "bold",
  },
};
