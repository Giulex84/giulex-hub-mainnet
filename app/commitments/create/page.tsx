import Link from "next/link";

export default function CreateCommitmentPage() {
  return (
    <main className="mx-auto max-w-3xl p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Create commitment</h1>

      <p className="mb-6 text-slate-300">
        This form creates a public commitment record.
        No payments or settlements occur on this platform.
      </p>

      <form className="space-y-4">
        <input
          className="w-full rounded border border-slate-600 bg-slate-900 p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Counterparty username"
        />

        <textarea
          className="w-full rounded border border-slate-600 bg-slate-900 p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Describe the commitment"
          rows={4}
        />

        <button
          type="button"
          className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500"
        >
          Save commitment
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-400">
        This action records a commitment only. It does not involve payments.
      </p>

      <div className="mt-6">
        <Link href="/commitments" className="text-indigo-400 underline">
          Back to commitments
        </Link>
      </div>
    </main>
  );
}
