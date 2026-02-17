import { useEffect, useState } from "react";

declare global {
  interface Window {
    Pi: any;
  }
}

export default function Home() {
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (window.Pi) {
      window.Pi.init({
        version: "2.0",
      });
    }
  }, []);

  const login = async () => {
    try {
      const scopes = ["username", "payments", "wallet_address"];

      const auth = await window.Pi.authenticate(scopes, onIncompletePayment);

      setUid(auth.user.uid);

      // Engagement call
      await fetch("/api/pi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "engage",
          uid: auth.user.uid,
        }),
      });

      alert("Login + Engagement registrati ✅");
    } catch (err) {
      console.error(err);
      alert("Login error");
    }
  };

  const pay = async () => {
    if (!window.Pi) {
      alert("Open inside Pi Browser");
      return;
    }

    setLoading(true);

    try {
      await window.Pi.createPayment(
        {
          amount: 0.1,
          memo: "Mainnet Checklist Payment",
          metadata: { type: "checklist" },
        },
        {
          onReadyForServerApproval: async (paymentId: string) => {
            await fetch("/api/pi", {
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
            await fetch("/api/pi", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "complete",
                paymentId,
                txid,
              }),
            });

            alert("Pagamento completato ✅");
          },

          onCancel: () => {
            alert("Pagamento annullato");
          },

          onError: (error: any) => {
            console.error(error);
            alert("Errore pagamento");
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
    <div style={{ textAlign: "center", marginTop: 80 }}>
      <h1>Giulex Hub</h1>
      <h2>Mainnet Utility App</h2>

      {!uid ? (
        <button onClick={login} style={{ padding: 12, fontSize: 16 }}>
          Login with Pi
        </button>
      ) : (
        <>
          <p>Logged as: {uid}</p>

          <button
            onClick={pay}
            disabled={loading}
            style={{ padding: 12, fontSize: 16, marginTop: 20 }}
          >
            {loading ? "Processing..." : "Pay 0.1π (Checklist)"}
          </button>
        </>
      )}
    </div>
  );
}
