"use client";

import { useEffect, useState, createContext, useContext } from "react";

type PiUser = {
  username: string;
  uid: string;
};

type PiContextType = {
  user: PiUser | null;
  ready: boolean;
};

const PiContext = createContext<PiContextType>({
  user: null,
  ready: false,
});

export function PiProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PiUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    function waitForPi() {
      if (typeof window !== "undefined" && (window as any).Pi) {
        const Pi = (window as any).Pi;

        // 1️⃣ INIT (OBBLIGATORIO)
        Pi.init({
          version: "2.0",
          sandbox: false,
        });

        // 2️⃣ AUTHENTICATE
        Pi.authenticate(
          ["username"], // ⬅️ per ora SOLO username
          (authResult: any) => {
            if (cancelled) return;

            setUser({
              username: authResult.user.username,
              uid: authResult.user.uid,
            });
            setReady(true);
          },
          (error: any) => {
            console.error("Pi auth error", error);
            setReady(true);
          }
        );
      } else {
        setTimeout(waitForPi, 100);
      }
    }

    waitForPi();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PiContext.Provider value={{ user, ready }}>
      {children}
    </PiContext.Provider>
  );
}

export function usePi() {
  return useContext(PiContext);
}
