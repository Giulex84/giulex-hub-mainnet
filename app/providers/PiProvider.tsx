'use client';

import { useEffect, useState } from 'react';

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
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const waitForPi = () => {
      if (window.Pi) {
        try {
          window.Pi.init({ version: '2.0' });

          window.Pi.authenticate(
            ['username'],
            (auth: any) => {
              console.log('Pi user authenticated:', auth);
              localStorage.setItem('pi_user', JSON.stringify(auth));
              setInitialized(true);
            },
            (err: any) => {
              console.error('Pi auth error', err);
              setInitialized(true); // 🔑 NON bloccare l’app
            }
          );
        } catch (e) {
          console.error(e);
          setInitialized(true);
        }
      } else {
        setTimeout(waitForPi, 100);
      }
    };

    waitForPi();
  }, []);

  if (!initialized) {
    return (
      <div className="p-6 text-slate-400">
        Authenticating with Pi…
      </div>
    );
  }

  return <>{children}</>;
}
