import type { Metadata } from "next";
import "./globals.css";
import PiProvider from "./providers/PiProvider";

export const metadata: Metadata = {
  title: "Giulex Hub",
  description: "Giulex Hub mainnet app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <PiProvider>{children}</PiProvider>
      </body>
    </html>
  );
}
