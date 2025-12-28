import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-12 border-t pt-4 text-sm text-slate-500">
      <div className="flex gap-4">
        <Link href="/privacy">Privacy Policy</Link>
        <Link href="/terms">Terms of Service</Link>
      </div>
    </footer>
  );
}
