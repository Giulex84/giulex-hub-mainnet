# Arena — Pi Mainnet hardening build

This revision follows the current Pi developer architecture: Pi SDK on the frontend, `/v2/me` verification on the backend, Server API Key only on the backend, and U2A approval/completion performed server-side.

## Review / release status

- Network: **Pi Mainnet**
- Pi SDK mode: `sandbox: false`
- Developer Portal version submitted for review: **1.0.2**
- Authentication: Pi SDK only
- Transactions: Pi only
- Premium: **1 Pi U2A**, verified server-side and persisted by verified Pi UID
- Daily Replay Ticket: **0.5 Pi U2A** consumable, verified and fulfilled server-side
- Replay payments with any other amount are rejected by the Mainnet backend.
- Daily Arena: server-controlled, persistent per UTC day, with best result and Top 10 leaderboard
- Async PvP: shared server-controlled deck, real Pioneer matchmaking and disclosed Arena Bot fallback
- Gameplay progress: persisted server-side and restored by verified Pi UID
- Mainnet A2U gameplay rewards: **disabled intentionally** until explicitly authorized for the production app
- Public review documents: `privacy.html`, `terms.html`, and `validation-key.txt` on the verified production domain

The Mainnet update is currently in review under Developer Portal version **1.0.2**. The portal submitted the update directly and did not permit changing this field; do not cancel or recreate the request solely to alter the version label.

## Important changes

- `Pi.init({ version: "2.0", sandbox: false })` is explicit for production.
- Authentication requests only `username` and `payments` because Arena does not currently use wallet address.
- The `accessToken` returned by `Pi.authenticate()` is verified by `/api/auth/verify`, which calls Pi `/v2/me`.
- Premium payment approval and completion validate the payment against the verified Pi UID, fixed amount (`1 Pi`) and fixed product metadata.
- Premium is granted only after Pi reports both server completion and transaction verification.
- Incomplete U2A payments are recovered server-side by looking up the payment with the Server API Key; the callback does not trust client UID/metadata.
- The old client-controlled A2U `0.3 Pi` combo reward endpoint has been removed. Triple combo now gives gameplay points only. This avoids offering a Mainnet A2U payout while A2U availability/review is restricted.
- Paid entitlement is no longer trusted from `localStorage`; it is stored server-side by verified Pi UID.
- Gameplay progress (`level`, `lives`, `score`) is also stored server-side by verified Pi UID and restored after signing back in. A non-Premium Game Over can restart the current level while preserving accumulated score/progress.
- Wildcard CORS was removed and baseline security headers were added.
- Dynamic Pi usernames are rendered as text rather than injected HTML.
- Daily and PvP card flips use atomic server-side state transitions to prevent concurrent-move corruption and reduce latency.
- Privacy Policy and Terms were updated to match actual data/payment behavior.

## Mainnet review checklist — submitted version 1.0.2

- Production URL opens inside Pi Browser without leaving a blank or legacy page.
- Pi sign-in requests only `username` and `payments` and the backend verifies `/v2/me`.
- Premium clearly states **1 Pi** before Pi Wallet confirmation and persists after reload.
- Daily Replay Ticket clearly states **0.5 Pi**, adds one consumable credit, and never awards Pi.
- Incomplete Premium and Replay payments recover without duplicate fulfillment.
- Classic progress, Daily state, Top 10 and async PvP restore from server-side state.
- PvP clearly discloses the Arena Bot and has no wager, entry fee or prize.
- Privacy and Terms links are visible from the main screen and publicly accessible without login.
- `validation-key.txt` is publicly accessible from the submitted production domain.
- Listing screenshots and description show the current Mainnet UI and do not mention Test-Pi, rewards or investment returns.

## Required production environment variables

Copy `.env.example` values into your deployment provider:

- `PI_API_KEY`: your existing Mainnet Server API Key from Pi Developer Portal.
- `ARENA_KV_KV_REST_API_URL` and `ARENA_KV_KV_REST_API_TOKEN` (created automatically by Vercel/Upstash when using the `ARENA_KV` custom prefix): server-side Redis-compatible REST KV credentials.

The persistent store protects both paid Premium entitlement and gameplay progress. If it is not configured, login/gameplay can still load, but Premium purchase is intentionally unavailable and gameplay cannot be restored across sessions.

## Deploy safely

1. Keep the existing Pi Developer Portal app, domain, PiNet subdomain, validation key and wallet applications. Do **not** recreate the Mainnet app merely to deploy this code.
2. Configure the three server-only environment variables above.
3. Deploy to the same verified production domain.
4. Confirm `https://YOUR_DOMAIN/validation-key.txt` still returns the existing validation key.
5. Open the production URL inside Pi Browser and sign in.
6. Confirm level/HP/score restore after closing and reopening the app.
7. Confirm Game Over can restart the current level without deleting accumulated score/progress.
8. Test a Premium U2A purchase with a controlled account only after the KV store is configured.
9. Verify that a successful purchase stays Premium after reloading and signing back in.

## About A2U rewards

The prior implementation accepted a UID and amount from the browser and created an A2U payment directly. That is unsafe and has been removed. The current Pi documentation states that A2U is restricted (the launch docs describe selected Mainnet apps; the advanced-payments page still describes Testnet-only availability). Do not re-enable Mainnet A2U rewards until your app is explicitly authorized and the reward eligibility itself is enforced server-side with durable anti-replay state.

## Reference documentation reviewed

- Pi Developer Documentation (current consolidated docs announced September 4, 2026)
- Authentication guide and `/v2/me`
- Build an App end-to-end flow
- Payments / Platform API
- Common Mistakes
- Launching on Pi Mainnet
- Advanced Payments

No code change can guarantee Pi Core Team approval; review and wallet authorization remain Pi Network decisions.
