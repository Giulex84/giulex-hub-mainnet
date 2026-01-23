import './globals.css';

export const metadata = {
  title: 'Giulex Hub',
  description: 'Pi Network Mainnet App',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
