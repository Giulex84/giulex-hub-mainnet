"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

declare global {
  interface Window {
    Pi: any;
  }
}

type PiContextType = {
  ready: boolean;
  authenticated: boolean;
  username: string | null;
};

const PiContext = createContext<PiContextType>({
  ready: false,
  authenticated: false,
  username: null,
});

export function usePi() {
  return useContext(PiContext);
}

export default function PiProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const waitForPi = () => {
      if (!window.Pi) {
        setTimeout(waitForPi, 100);
        return;
      }

      try {
        window.Pi.init({
          version: "2.0",
          sandbox: false,
        });

        window.Pi.authenticate(
          ["username", "payments"],
          (auth: any) => {
            if (cancelled) return;
            setAuthenticated(true);
            setUsername(auth.user.username);
            setReady(true);
          },
          (err: any) => {
            console.error("Pi auth error", err);
            setReady(true);
          }
        );
      } catch (e) {
        console.error("Pi init error", e);
      }
    };

    waitForPi();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PiContext.Provider
      value={{
        ready,
        authenticated,
        username,
      }}
    >
      {children}
    </PiContext.Provider>
  );
}
