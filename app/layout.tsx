import Script from "next/script";
import "./globals.css";
import PiProvider from "./providers/PiProvider";

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Script
          src="https://sdk.minepi.com/pi-sdk.js"
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
        <PiProvider>
          {children}
        </PiProvider>
      </body>
    </html>
  );
}
