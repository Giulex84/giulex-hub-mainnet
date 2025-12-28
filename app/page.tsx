export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-bold mb-4">IOU</h1>

      <p className="mb-4">
        IOU is a transparency utility that allows users to record commitments
        between identified peers.
      </p>

      <p className="mb-4">
        The platform does <strong>not</strong> process payments, move Pi, or
        facilitate settlements.
      </p>

      <p className="mb-6">
        Any real-world fulfillment happens independently of the application.
      </p>

      <div className="rounded-lg border p-4 text-sm text-slate-500">
        This app records commitments only. It is not a financial service.
      </div>
    </main>
  );
}
