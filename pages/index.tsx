import { useEffect } from "react";

export default function Home() {

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://sdk.minepi.com/pi-sdk.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const login = async () => {
    // @ts-ignore
    const Pi = (window as any).Pi;

    Pi.init({ version: "2.0" });

    const auth = await Pi.authenticate(
      ["username", "payments", "wallet_address"],
      onIncompletePaymentFound
    );

    await fetch("/api/pi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "engage",
        uid: auth.user.uid,
      }),
    });

    alert("Login + Engagement registrati ✔");
  };

  const onIncompletePaymentFound = (payment: any) => {
    console.log("Incomplete payment:", payment);
  };

  return (
    <div style={{ textAlign: "center", marginTop: 50 }}>
      <h1>Giulex Hub</h1>
      <p>Mainnet Utility App</p>

      <button
        onClick={login}
        style={{ padding: 12, fontSize: 16 }}
      >
        Login with Pi
      </button>

      <div style={{ marginTop: 40 }}>
        <a href="/privacy.html">Privacy Policy</a> |{" "}
        <a href="/terms.html">Terms of Service</a>
      </div>
    </div>
  );
}
