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

  useEffect(() => {
    if (window.Pi) {
      window.Pi.init({ version: "2.0" });
    }
  }, []);

  // Compass logic
  useEffect(() => {
    const handleOrientation = (event: any) => {
      if (event.alpha !== null) {
        setHeading(Math.round(360 - event.alpha));
      }
    };

    window.addEventListener("deviceorientation", handleOrientation);

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, []);

  const login = async () => {
    try {
      const scopes = ["username", "payments", "wallet_address"];
      const auth = await window.Pi.authenticate(scopes, onIncompletePayment);

      setUid(auth.user.uid);

      await fetch("/api/pi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "engage", uid: auth.user.uid }),
      });

      alert("Welcome to Giulex Compass 🧭");
    } catch (err) {
      console.error(err);
    }
  };

  const pay = async () => {
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
      console.error(err);
    }

    setLoading(false);
  };

  const onIncompletePayment = (payment: any) => {
    console.log("Incomplete payment", payment);
  };

  return (
    <div style={{ textAlign: "center", marginTop: 50 }}>
      <h1>Giulex Compass</h1>
      <p>Mainnet Utility App</p>

      {!uid ? (
        <button onClick={login} style={{ padding: 10 }}>
          Login with Pi
        </button>
      ) : (
        <>
          <div style={{ marginTop: 40 }}>
            <div
              style={{
                width: 200,
                height: 200,
                margin: "auto",
                borderRadius: "50%",
                border: "5px solid black",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: 2,
                  height: 90,
                  background: premium ? "red" : "gray",
                  position: "absolute",
                  top: 10,
                  left: "50%",
                  transform: `rotate(${heading}deg) translateX(-50%)`,
                  transformOrigin: "bottom center",
                }}
              />
            </div>

            <h2>{heading}°</h2>

            {!premium && (
              <button
                onClick={pay}
                disabled={loading}
                style={{ marginTop: 20 }}
              >
                {loading
                  ? "Processing..."
                  : "Unlock Premium Compass (0.1π)"}
              </button>
            )}

            {premium && <p>Premium Supporter Badge 🏅</p>}
          </div>
        </>
      )}
    </div>
  );
}
