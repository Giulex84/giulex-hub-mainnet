# Arena — Pi Mainnet hardening build

This revision follows the current Pi developer architecture: Pi SDK on the frontend, `/v2/me` verification on the backend, Server API Key only on the backend, and U2A approval/completion performed server-side.

## Review / release status

- Network: **Pi Mainnet**
- PiNet URL: **https://jr.pi** (open in Pi Browser)
- Pi SDK mode: `sandbox: false`
- Developer Portal version submitted for review: **1.0.3**
- Authentication: Pi SDK only
- Transactions: Pi only
- Premium: **1 Pi U2A**, verified server-side and persisted by verified Pi UID
- Daily Replay Ticket: **0.5 Pi U2A** consumable, verified and fulfilled server-side
- Replay payments with any other amount are rejected by the Mainnet backend.
- Classic Arena: persistent progression with a verified weekly Top 10 leaderboard, personal rank, level and score. Results are validated and recorded server-side by verified Pi UID.
- Daily Arena: server-controlled, persistent per UTC day, with best result and Top 10 leaderboard
- Daily Arena now creates an attempt only after an explicit Start; opening the tab only restores an existing attempt. The interface shows 6-pair progress and preserves same-day resume.
- Async PvP: shared server-controlled deck, real Pioneer matchmaking and disclosed Arena Bot fallback
- Gameplay progress: persisted server-side and restored by verified Pi UID
- Mainnet A2U gameplay rewards: **disabled intentionally** until explicitly authorized for the production app
- Public review documents: `privacy.html`, `terms.html`, and `validation-key.txt` on the verified production domain (`https://jr.pi` in Pi Browser)

The Mainnet update is currently in review under Developer Portal version **1.0.3**. The portal submitted the update directly and did not permit changing this field; do not cancel or recreate the request solely to alter the version label.

On **September 30, 2026**, a Developer Portal listing update was submitted for review with the refreshed Arena crossed-swords logo and current Classic, Daily and PvP screenshots. This listing-only refresh does not change Arena's data processing, payments or gameplay terms, so the Privacy Policy and Terms of Service remain accurate without a date-only revision.

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
- First-party backend telemetry counts pseudonymous daily users and aggregate product events without cookies or advertising trackers. Reports require the private `ARENA_METRICS_KEY` header.
- Privacy Policy and Terms were updated to match actual data/payment behavior.


## Mainnet review checklist — submitted version 1.0.3

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
- `ARENA_METRICS_KEY`: a long random secret used only to read the private `/api/metrics` report. Telemetry collection does not expose this key to the browser.

The private report includes new/returning users, unique Daily and PvP funnels, completion and drop-off rates, average Daily completion time, D1/D3/D7 cohort retention, and first-party source attribution (`?source=fireside`, `?source=staking`, or direct). These expanded fields begin collecting from the release that introduced them; older aggregate event counts remain visible.

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

## Daily recovery and next actions

Daily start and card-flip errors reload server state without replaying the move. If reload fails, card input stays blocked until the Restore Saved Daily action succeeds. Daily status reconciles completion ranking, idempotent streak and deduplicated completion/failure telemetry. Finished Daily challenges offer free Classic play; active challenges keep the Continue action. Rewards, prices and move limits are unchanged.

Admin labels distinguish unfinished Daily user-days from actual abandonment, expose move-limit failure events separately, and identify staking counters as tagged-link source telemetry rather than listing staking balances. Run `npm test` for API/UI recovery, dashboard and payment-validation checks. The Redis suite is included and prints an explicit skip when no local Redis executable is provided. To run every check, use `REDIS_TEST_SERVER=/path/to/redis-server npm test`; `npm run test:redis` runs only the isolated Redis suite. These tests never connect to Mainnet Redis or execute a Pi payment and do not replace an authenticated Pi Browser connection-loss test.


## Mainnet reliability corrections

- Daily start commits its board and attempt count atomically. Replay reset commits ticket consumption, the new board and attempt count together, and rejects an expired lock owner.
- New clients send the UTC day, expected card state and server-issued attempt identifier. A stale move or reset cannot mutate a later attempt. Existing Daily records use their original start timestamp as a compatibility identifier; older clients remain accepted and should refresh to use the new safeguards.
- Completion best-result comparison and ranking updates are atomic. Reconciliation preserves the completion timestamp and cannot roll a streak back when an older day finishes late.
- Status recovery reloads replay credits as well as the board. Input and replay reset stay blocked until uncertain state is restored; timeout coverage includes reading the response body.
- Replay payment fulfillment writes its marker and ticket in one Lua operation. Both current and legacy recovery routes revalidate the final server payment lookup before delivery.
- Daily telemetry keeps the server-selected challenge day when a request straddles midnight. The admin period duration is weighted by completed observations, and retention excludes cohorts whose observation day is still in progress. Older dashboard responses cannot replace a newer period.
- Empty matched-card lists encoded as `{}` by Redis Lua are restored to arrays at the Daily/PvP response boundary. Other malformed lists fail closed.
- Malformed saved Daily records fail closed instead of being replaced with a new challenge.

Automated fault injection covers lost replies after Redis commits, concurrent taps, expired locks, old-attempt requests, streak/result reconciliation and telemetry deduplication. It does not audit historical production balances. A fulfillment marker written by older code without its ticket cannot be safely repaired automatically: compare the verified payment, fulfillment marker and ticket-use history manually before any adjustment. Telemetry remains best effort and can omit events.


## Classic weekly earned points — effective October 12, 2026

The Classic Weekly Top 10 counts positive increments of the persisted personal score during the UTC week (Monday 00:00 UTC), rather than the historical total. Partial saves accrue points; completing a level makes the player eligible for that week. Once eligible, subsequent saved points, including points earned after Game Over/restart, update the ranking. Personal score and level remain preserved.

One Redis Lua operation commits the game state, weekly points and ranking. Cumulative-score high-water deltas make duplicate, concurrent and response-loss retries idempotent; stale lower-score writes cannot roll progress back. Frontend saves and completions share a serialized queue and retry uncertain transport/server failures once. Classic scoring remains client-calculated and bounded, not a server-controlled deck or prize-grade anti-cheat system.

New v2 ranking keys isolate the new rule and leave legacy weeks untouched. Weekly counters/ranking records retain the existing 14-day expiry; personal progress is not expired. No cron or destructive reset is required. Existing local/cached clients are supported by the backend.

Deployment-time limitation: scores already saved by the old code after October 12 00:00 UTC and before deployment cannot be attributed exactly without historical snapshots. They are not reconstructed from lifetime totals or invented. The first positive score increment processed by the new backend is included; there is no discarded first-game baseline.

`REDIS_TEST_SERVER=/path/to/isolated/redis-server npm test` includes first-game, partial-save, duplicate, concurrent-write, Game Over, response-loss, rollover and persistence checks against real local Lua. These tests use mock Pi identity and never access production wallets/storage.


## Weekly cosmetic badges (October 12, 2026)
Classic weekly points count earned score increments, not lifetime totals. Historical progress remains saved. Equal weekly scores share competition rank (1, 1, 3); lifetime level no longer changes the displayed position. Top-three positions earn permanent gold/silver/bronze badges, with all ties included. Premium affects Classic scoring, so this is cosmetic recognition, not an equal-condition contest or a monetary reward.

The first eligible week starts October 12 UTC; first awards are available October 19 UTC. Closed weeks are finalized atomically on the next authenticated Classic leaderboard request, not by a scheduled job. All enrolled weeks are reconciled, so players can return late and still receive their badges. New badge-eligible weekly entries, completed award snapshots and per-user badges persist; pre-existing legacy weeks are not awarded or reset. The Hall of Fame displays the eight latest closed weeks; personal badges remain permanent. No Pi payouts, frames or paid advantages are introduced.

Progress, points and rank writes are atomic. Lower-score stale saves cannot roll back historical progress. Finalized weeks reject delayed writes before mutation and the client can retry against the current week. Existing scores saved before the weekly-rule deployment cannot be safely backfilled from lifetime totals. All Testnet key prefixes and payment settings remain isolated.


## Minimal analytics release

New analytics collect successful Mainnet Pi logins, distinct daily accounts and returning accounts only. Other analytics events are ignored without storage writes. Legacy data is preserved; missing historical return counts are not reconstructed. Reports distinguish login-only collection from older activity counters. The Arena October 20, 2026 incident is marked as partial data, not backfilled. Payment receipts and gameplay persistence are unchanged.
