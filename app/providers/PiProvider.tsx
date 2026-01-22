"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    Pi: any;
  }
}

export default function PiProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const waitForPi = () => {
      if (window.Pi) {
        window.Pi.init({
          version: "2.0",
          sandbox: false,
          onIncompletePaymentFound: (payment: any) => {
            console.log("Incomplete payment", payment);
          },
        });

        if (!cancelled) setReady(true);
      } else {
        setTimeout(waitForPi, 100);
      }
    };

    waitForPi();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return <div className="p-6">Authenticating with Pi…</div>;
  }

  return <>{children}</>;
}
