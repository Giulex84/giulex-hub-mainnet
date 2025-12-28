"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Commitment = {
  id: string;
  author: string;
  counterparty: string;
  description: string;
  status: "Pending" | "Completed" | "Cancelled";
};

function StatusBadge({ status }: { status: Commitment["status"] }) {
  const color =
    status === "Completed"
      ? "bg-green-100 text-green-700"
      : status === "Cancelled"
      ? "bg-red-100 text-red-700"
      : "bg-yellow-100 text-yellow-700";

  return (
    <span className={`rounded px-2 py-1 text-xs font-medium ${color}`}>
      {status}
    </span>
  );
}

export default function CommitmentsPage() {
  const [items, setItems] = useState<Commitment[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("commitments");
    if (raw) setItems(JSON.parse(raw));
  }, []);

  return (
    <main className="mx-auto max-w-4xl p-6 text-white">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Public commitments</h1>

        <Link
          href="/commitments/create"
          className="rounded bg-indigo-600 px-4 py-2 text-white"
        >
          New commitment
        </Link>
      </div>

      <p className="mb-6 text-slate-300">
        Commitments are public, non-financial records for transparency purposes.
        No payments or settlements occur on this platform.
      </p>

      <div className="space-y-4">
        {items.length === 0 && (
          <div className="text-slate-400 text-sm">
            No commitments yet.
          </div>
        )}

        {items.map((c) => (
          <div key={c.id} className="rounded-lg border border-slate-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-slate-400">
                {c.author} → {c.counterparty}
              </div>
              <StatusBadge status={c.status} />
            </div>

            <div className="text-slate-200">{c.description}</div>

            <div className="mt-2 text-xs text-slate-500">
              This is a commitment record only. No payments are involved.
            </div>
          </div>
        ))}
      </div>

      <footer className="mt-12 border-t border-slate-700 pt-4 text-sm text-slate-400">
        <div className="flex gap-4">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
        </div>
      </footer>
    </main>
  );
}
