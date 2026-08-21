# Daily Maintenance System

This project preserves a safe, GitHub-centered maintenance loop: discover validated work, run deterministic checks, publish machine-readable results, and use bounded recovery only where the repository token can safely act.

## Reusable workflow inventory

| Component                      | Trigger                        | Behavior                                                                                                                                                   | Mutation boundary                               |
| ------------------------------ | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| CI                             | Push, pull request, manual     | Frozen install, type check, tests, and production build                                                                                                    | Read-only validation                            |
| CI Health Monitor              | Every six hours                | Finds failed runs for the current commit and requests a re-run where GitHub permits it                                                                     | Bounded re-run only; no cross-repository action |
| Daily Maintenance              | Daily and manual               | Validates the non-secret automation inventory, then runs formatting, type, test, build, migration, audit, and diff checks; uploads a JSON execution record | Read-only validation and artifact upload        |
| Hourly website continuation    | Hourly, capped at 2,400 cycles | Authenticates the project-owned callback, probes the database, verifies task ownership, and records one idempotent cycle                                   | No external connector or repository mutation    |
| Daily GitHub and Drive summary | Daily at 09:00 IST             | Reports accessible GitHub and Google Drive activity in this task                                                                                           | Read-only; no repository or Drive mutation      |

## Execution record

Each daily maintenance run calls `pnpm maintenance:check`, which first validates `automation/historical-automation-inventory.json` and then writes a `maintenance-record.json` file plus per-check logs to the ignored `maintenance-output/` directory. GitHub Actions uploads that directory for 100 days, matching the 2,400-hour continuation horizon. The record contains timestamps, a sanitized repository identity, commit identity, executed checks, outcomes, and an explicitly empty secret surface. If the GitHub repository identifier is unavailable or malformed, `scripts/maintenanceIdentity.mjs` records only `local:<directory-name>` rather than reading a managed remote URL. GitHub Actions run history and the artifact provide the durable execution record; this repository never commits generated run records or credentials.

## Safe failure handling

The repository does not automatically commit dependency updates, edit source code, rotate credentials, or alter external accounts. A failed validation produces a failed workflow and an artifact; the existing CI Health Monitor may re-run a failed workflow only for the current commit. This keeps recovery bounded, reviewable, and idempotent.

## External boundaries

Gemini requires a valid provider-managed credential. Antigravity requires the provider's interactive Google sign-in. Google Drive reporting remains read-only. These conditions are surfaced in the application and inventory, but the maintenance system does not attempt to bypass any provider authentication or store secrets.

### Hosted-runner queue boundary

The latest verification confirmed GitHub-hosted execution is working: CI, CI Health Monitor, and Daily Maintenance completed successfully on the matching repository. The same reusable command also completed successfully in both local worktrees, including inventory, format, type, test, build, migration, audit, and diff checks. If a future hosted-runner queue occurs, it is recorded as an external platform boundary rather than retried indefinitely.
