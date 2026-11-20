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

## Official rules check · November 19, 2026, 08:25 Europe/Rome

The official Summit landing page still labels November 19's hackathon announcement Upcoming. The November 18 official recap says full rules and registration instructions will be published November 19. Targeted official-domain searches did not locate the rules at this check. This is a time-bounded finding, not evidence that publication will be delayed.

| Requirement | Verified status | Arena action |
| --- | --- | --- |
| Existing apps and pre-event code | Not yet verified | Preserve source history; do not claim eligibility |
| Categories and judging criteria | Not yet verified | Keep Arena positioning and product evidence ready |
| Registration and submission deadline/timezone | Not yet verified | Use only the eventual official registration link |
| Video length, format and submission materials | Not yet verified | Keep current footage; prepare login, free Daily and same-day restore evidence |
| Source licensing, ownership and publication obligations | Not yet verified | Inventory third-party licenses before accepting terms |
| Prize allocation and payment conditions | Only total 200,000 USDT announced | Do not describe total pool as an individual award or Pi payment |
| Marketing incentive | Separate shared budget up to 20 million Pi announced | Do not combine with hackathon award entitlement |

Sources checked: https://minepi.com/ecosystem-summit/ and https://minepi.com/blog/pi-ecosystem-summit-2/ plus official-domain searches. No previous hackathon rules were substituted.

### Performance and measurement check

Vercel reports latest production deployment dpl_GFWinkSeZAMXnLwdgwdLwpFHeNT1 READY. Runtime-error lookup over the preceding 24 hours returned no errors; error/fatal/warning log lookup for the preceding 50 minutes returned no matching logs. Absence of reported errors does not establish successful authenticated gameplay or low latency. Hobby log retention prevents a detailed 48-hour reconstruction.

No fresh authorized owner report or real authenticated latency trace was available in this run. The owner's November 18 23:23 Rome screenshot (22:23 UTC, partial day) records 95 unique accounts,78 previously seen accounts and110 successful sign-ins, versus193/186/224 for the complete November17 UTC day. These are unequal windows; no equivalent-window comparison or November19 outcome is asserted. A decline in successful sign-ins is not itself proof of latency.

The previously identified awaited temporary database write without a dedicated timeout remains a risk requiring measured confirmation. No gameplay or telemetry collection code was changed during this check because persistent slowdown was not established. If slowdown is verified, the owner authorizes disabling only the temporary sample collection, preserving historical/sample data, ordinary metrics and the report. The November21 restoration remains in place.

## Published Pi Next requirements · November 20, 2026

This section supersedes the November 19 morning publication-status check above. Source: https://minepi.com/pi-next/ (checked November 20).

Registration: Developer Web Console, Hackathon tab; all team members register and one member submits each app. Optional midpoint details are communicated by email to registered participants. Deadline: January5,2027 23:59 PST = January6 07:59 UTC =08:59 Europe/Rome.

Demo: final app version, public video platform link, at most180seconds. Explain purpose, features/interface, intended users, need addressed and Pi integration. App needs English name/accurate English description, compliant logo, interface preview images, PiNet integration and privacy policy. Preserve current logo-review submission; do not edit the listing during review.

Judges evaluate listing alignment, Pi utility/ecosystem needs, technical completeness/innovation, UI/UX/accessibility, long-term Mainnet utility and distinctive use cases. Judges' Pick awards:25,000/15,000/10,000USDT. Community Engagement Awards share150,000USDT across up to2teams, combining judges' assessment, real engagement,retention and traction. The separate marketing budget is up to20millionPi, not a guaranteed award.

The public page supports bringing existing applications to Pi but does not explicitly settle eligibility for an already-listed Mainnet app, pre-event work or prior participants. No explicit source-license assignment terms or demo network mandate were found there. Developer Console exposes only a JavaScript application to the research reader; registration conditions have not been inspected or accepted. Do not assert Arena eligibility or registration completion until those conditions are checked.

### Arena demo assembly and narration draft

Owner recordings reviewed visually:141362 Classic178to179 and saved status;141363 Daily result,weekly progress/styles;141364 PvP versus explicitly identified Arena Bot;141599 Mainnet access verification,original Daily start,moves and completed result11moves695points,weekly4/7. The previously missing Daily-start footage is now available. Do not combine the earlier801point result with this new Daily as though they were the same run. Continuous close/reopen restoration evidence remains unverified in these sampled clips. Audio has not been verified.

Target edit around120–150seconds, beneath180second limit: introduction/home10s;Classic25s;Daily from14159940s;weeklystyles20s;PvP15s;Pi integration/closing15s. Trim URL typing,keyboard,empty loading and long scrolls; retain enough real action to show outcomes. No payment should be performed solely for filming. Record a short restoration clip only if it is to be explicitly demonstrated.

English narration draft: Arena is a memory and skill game for Pioneers who enjoy short challenges and lasting progression. Players sign in with their Pi account. In Classic, matching pairs builds combos and advances levels. The free Daily is a server-controlled challenge with six pairs and an eighteen-move limit. This recording shows a completed Daily in eleven moves. Original free Daily completions on distinct days within the same UTC week unlock personal card styles at two through seven days. Unlocked styles remain available. Asynchronous PvP supports Pioneer opponents and an explicitly labeled optional Arena Bot. Optional Pi purchases include Classic Premium and Replay Tickets. Premium doubles Classic base points and provides unlimited Classic lives; it does not change Daily or PvP. Game points and cosmetic recognition have no monetary value, and Daily and PvP do not award Pi.

No gameplay,metrics collection,listing configuration or owner progress was changed in this documentation update. November21 restoration remains scheduled.
