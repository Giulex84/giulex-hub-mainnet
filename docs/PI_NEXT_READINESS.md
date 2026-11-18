# Arena readiness for Pi Next

Updated November 18, 2026. Owner-authorized preparation for an existing Pi Mainnet app.

## Application positioning

Arena is a short-session memory game for Pi Browser. Players develop persistent Classic progress, complete a free server-controlled Daily and unlock personal card styles through weekly Daily completion. Asynchronous PvP supports Pioneer matches and a disclosed bot fallback.

Candidate demonstration sequence
1. Open Arena and authorize Pi identity.
2. Restore saved progress, then start the original free Daily.
3. Match pairs and show that the server validates moves.
4. Close and reopen, restoring the same UTC-day attempt.
5. Show the result, weekly cosmetic progress and optional result sharing.
6. Explain the optional 1 Pi Classic Premium and 0.5 Pi Replay products.
7. Show the owner-only measurement report with its time range and limitations.

This is a draft demonstration sequence. Format and duration will follow the official competition rules.

## Evidence available

The owner's dashboard screenshots show 212, 200, 232, 220 and 192 distinct authenticated accounts on November 12–16 respectively. The mean is 211.2 per day. Their sum, 1,056, represents user-days. Returning-account counts identify accounts seen on a previous UTC day. They do not establish cohort retention or completed game sessions.

Temporary Daily measurement runs prospectively from deployment on November 17 through November 20 at 23:00 UTC. The first and last UTC days are partial. Report matched completions and failures against measured original-free starts, with raw counts and sample limitations. Telemetry failures and unfinished attempts can reduce the observed completion rate. Cohort D7, whole-period unique accounts and session duration are not currently measured.

## Verified engineering checks

- The main entry point is public/arena.html, served by the root rewrite.
- Pi SDK Mainnet mode and server identity verification are implemented.
- Backend payment checks cover product, network, amount, direction and user.
- Classic persistence and weekly records use atomic Redis operations.
- Daily and PvP decks and flips are controlled server-side.
- Retried moves and purchases have recovery and deduplication coverage.
- Weekly Daily unlocks occur after 2/3/4/5/6/7 distinct original-free completions in one UTC week.
- Cosmetic recognition has no cash or Pi payout.
- Classic scores remain client-calculated and backend-bounded. Premium affects Classic points. This distinction must appear accurately in descriptions.

Validation for this update uses mock Pi identity and payment responses plus an isolated real Redis with persistence disabled. It does not issue real payments or read live player records.

## Owner-reported Pi Browser acceptance · November 18, 2026

The owner reports completing the requested close/reopen check and confirms that data persisted in Pi Browser. The accompanying screenshots confirm that the updated metrics labels are visible. This is owner-reported persistence evidence. Detailed interruption, new-device and purchase-recovery acceptance remain to be recorded individually.

## Owner/account checks that remain

- Current Developer Portal listing, image, registered URLs and app-wallet state.
- Detailed real-device interruption and same-day Daily restoration evidence, supplementing the owner's close/reopen persistence confirmation above.
- Existing purchase restoration and payment recovery with a consenting test user.
- Current Pi Ad Network eligibility and approval.
- The official Pi Next rules, including whether existing apps and pre-event code are eligible.
- Competition registration, deadlines, categories, ownership/licensing, submission format, award distribution and conditions.

## Delivery order

November 18: align documentation and legal descriptions, verify the current suite, prepare this evidence and demonstration outline.

November 19: check the published Pi Next rules and map each requirement to evidence. Choose Arena's eligible submission scope before changing the gameplay for the competition.

November 20: finish the agreed Daily sample. Avoid changing challenge rules during the sample.

November 21: verify the automatic cutoff, restore ordinary login-only collection and review sample quality before quoting results. An owner-authorized follow-up has already been scheduled.

## Growth experiments after the baseline

First verify PiNet result links reach the intended screen. Then consider a voluntary Notification Center pilot for up to 20 consenting users, subject to the current platform limit. Measure delivery and subsequent qualifying activity only under an explicitly described collection window. There is no notification-sending implementation in this release.

Evaluate Pi Ads eligibility before monetization changes. Keep optional purchases transparent and review any rewarded benefit for its effect on rankings and existing purchases.

## Official sources and present availability

- https://minepi.com/blog/ecosystem-summit-begins/
  Developer Web Console/MCP, App Growth Initiative, redesigned directory, improved linking and Notification Center. Subscriptions and x402 are demonstrated on Testnet.
- https://minepi.com/blog/pi-ecosystem-summit-2/
  CiDi Games demonstrates authentication, Pi Payments and Pi Ads integration. The announcement schedules Pi Next rules and registration instructions for November 19.
- https://minepi.com/ecosystem-summit/
  Official video program.
- https://developers.minepi.com/docs/build-first-app/MainnetListing
  Current listing requirements, including Pi Authentication, Pi transactions, functioning UI, branding and limited data collection.
- https://developers.minepi.com/docs/api-reference/PlatformAPI
  Backend payment and notification integration.
- https://developers.minepi.com/docs/setup-ads/Ads
  Monetization approval and server verification of rewarded ads.

The announced hackathon prize pool is 200,000 USDT. The marketing initiative has a separate shared budget of up to 20 million Pi. Selection, app approval and eligibility are decided by Pi. No competition win, individual prize amount or current program admission has been verified.
