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

  // ✅ COMPASS FIX ANDROID
  const startCompass = () => {
    window.addEventListener("deviceorientationabsolute", handleOrientation, true);
    window.addEventListener("deviceorientation", handleOrientation, true);
  };

  const handleOrientation = (event: any) => {
    let newHeading = 0;

    if (event.webkitCompassHeading) {
      newHeading = event.webkitCompassHeading;
    } else if (event.alpha !== null) {
      newHeading = 360 - event.alpha;
    }

    setHeading(Math.round(newHeading));
  };

  const activateCompass = () => {
    startCompass();
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
    } catch {
      alert("Login failed");
    }
  };

  // ✅ PAYMENT ROBUSTO
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
          metadata: { type: "premium" },
        },
        {
          onReadyForServerApproval: async (paymentId: string) => {
            const res = await fetch("/api/pi", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "approve", paymentId }),
            });

            if (!res.ok) throw new Error("Approval failed");
          },

          onReadyForServerCompletion: async (
            paymentId: string,
            txid: string
          ) => {
            const res = await fetch("/api/pi", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "complete",
                paymentId,
                txid,
              }),
            });

            if (!res.ok) throw new Error("Completion failed");

            setPremium(true);
          },

          onCancel: () => {
            alert("Payment cancelled");
          },

          onError: (err: any) => {
            console.log("PI ERROR:", err);
            alert("Payment error");
          },
        }
      );
    } catch (err) {
      console.log("CATCH ERROR:", err);
      alert("Payment failed");
    }

    setLoading(false);
  };

  return (
    <div style={{ textAlign: "center", marginTop: 40, fontFamily: "Arial" }}>
      <h1>Giulex Compass</h1>
      <p>Mainnet Utility App</p>

      {!uid ? (
        <button onClick={login}>Login with Pi</button>
      ) : (
        <>
          <button onClick={activateCompass}>Activate Compass</button>

          <div
            style={{
              width: 250,
              height: 250,
              borderRadius: "50%",
              border: "6px solid black",
              margin: "20px auto",
              position: "relative",
              boxShadow: premium
                ? "0 0 30px red"
                : "0 0 10px rgba(0,0,0,0.3)",
            }}
          >
            <div
              style={{
                width: 4,
                height: 110,
                background: premium ? "red" : "black",
                position: "absolute",
                top: 15,
                left: "50%",
                transformOrigin: "bottom center",
                transform: `rotate(${heading}deg)`,
                transition: "transform 0.2s ease-out",
              }}
            />
          </div>

          <h2>{heading}°</h2>

          {!premium && (
            <button onClick={pay} disabled={loading}>
              {loading ? "Processing..." : "Unlock Premium (0.1π)"}
            </button>
          )}

          {premium && <p>Premium Active 🧭</p>}
        </>
      )}
    </div>
  );
}
