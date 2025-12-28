"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

type Commitment = {
  id: string;
  author: string;
  counterparty: string;
  description: string;
  status: "Pending" | "Completed" | "Cancelled";
};

export default function CommitmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<Commitment | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("commitments");
    if (!raw) return;

    const items: Commitment[] = JSON.parse(raw);
    const found = items.find((c) => c.id === id);
    if (found) setItem(found);
  }, [id]);

  function markCompleted() {
    if (!item) return;

    const raw = localStorage.getItem("commitments");
    if (!raw) return;

    const items: Commitment[] = JSON.parse(raw).map((c) =>
      c.id === item.id ? { ...c, status: "Completed" } : c
    );

    localStorage.setItem("commitments", JSON.stringify(items));
    router.push("/commitments");
  }

  if (!item) {
    return (
      <main className="mx-auto max-w-3xl p-6 text-white">
        <p className="text-slate-400">Commitment not found.</p>
        <Link href="/commitments" className="text-indigo-400 underline">
          Back
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Commitment detail</h1>

      <div className="rounded-lg border border-slate-700 p-4 space-y-3">
        <div className="text-sm text-slate-400">
          {item.author} → {item.counterparty}
        </div>

        <div className="text-lg">{item.description}</div>

        <div className="text-sm text-slate-300">
          Status: <strong>{item.status}</strong>
        </div>

        {item.status === "Pending" && (
          <button
            onClick={markCompleted}
            className="mt-4 rounded bg-green-600 px-4 py-2 text-white hover:bg-green-500"
          >
            Mark as completed
          </button>
        )}
      </div>

      <p className="mt-6 text-sm text-slate-400">
        This record does not involve payments or settlements.
      </p>

      <div className="mt-6">
        <Link href="/commitments" className="text-indigo-400 underline">
          Back to commitments
        </Link>
      </div>
    </main>
  );
}
