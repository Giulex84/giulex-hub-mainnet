# Context, requirements and architecture — Arena

Recorded 2026-11-27. Owner instruction: autonomous engineering with explicit approval before any production/Mainnet change. This supersedes older broad deployment authorizations.

## Goal
Professional, stable, accessible mobile Pi application; preserve achieved functionality. Evidence must be reproducible, not inferred from a prior completion claim. Avoid unrelated tuning during judging/review.

## Current architecture
Next.js API routes and public HTML/JS, server Pi verification, Upstash Redis progress, rankings, Daily/PvP state and payment receipts.
Host: Vercel. Public entry: https://logo-five-mu.vercel.app.
Audited main baseline: `23caa67636887987304b2453547933e890c7c2d9`. This is a dated reference, not a permanent current SHA.

## Functional requirements and preservation
- Classic lifetime progress separate from UTC weekly earned points; duplicate and concurrent writes do not lose progress.
- Daily explicit Start, same-day resume, uncertain-response synchronization, server-controlled deck, weekly cosmetics and paid replay recovery.
- Async PvP with disclosed bot fallback; Mainnet A2U gameplay rewards remain disabled.
- Premium 1 Pi and Replay 0.5 Pi amounts/entitlements verified server-side. No price, reward or wallet changes.
- Ordinary metrics count logins only; closed November 17–20 sample report/history remains until expiry.

## Dependencies and boundaries
See root package.json/lockfile, API/lib modules and deployment configuration. Test tooling lives in tools/qa with its own pinned lockfile. Runtime and QA dependency audits are distinct. Database assertions use disposable local Redis, PGlite or SQLite fixtures only. Production variables/bindings are intentionally not recorded here.

## Historical evidence
Repository documentation contains prior Portal screenshots and user reports, not a live Portal check. Public demos exist for Arena, Sticker, IIOU, LaunchNest and Idle Realm; the revised IIOU demo is approved but its new YouTube URL has not been supplied. Never expose the second participant name. Do not change candidature links, pending logo/version requests or wallet associations implicitly.

## Pi compliance references
Reviewed 2026-11-27:
- https://developers.minepi.com/docs/build-first-app/MainnetListing
- https://developers.minepi.com/docs/build-first-app/PiNet
- https://developers.minepi.com/docs/api-reference/SdkReference
- https://developers.minepi.com/docs/api-reference/PlatformAPI
- https://minepi.com/pi-next/

Check current official text before implementing a policy-sensitive change. Required review topics: Pi-only authentication and transactions, server identity/payment validation, necessary data only, independent branding, professional working UI, developer KYC/Portal listing, accurate PiNet mapping and external-link necessity. Source-code compliance is not Pi approval. Do not confuse PiNet configuration with auction-domain ownership. Notifications require actual verified consent; DataLab is not evidence of access to app analytics.
