# Daily Maintenance System

This repository preserves a safe, GitHub-centered maintenance loop: discover validated work, run deterministic checks, publish machine-readable results, and use bounded recovery only where the repository token can safely act.

## Reusable workflow inventory

| Component         | Trigger                    | Behavior                                                                                               | Mutation boundary                               |
| ----------------- | -------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| CI                | Push, pull request, manual | Frozen install, type check, tests, and production build                                                | Read-only validation                            |
| CI Health Monitor | Every six hours            | Finds failed runs for the current commit and requests a re-run where GitHub permits it                 | Bounded re-run only; no cross-repository action |
| Daily Maintenance | Daily and manual           | Runs formatting, type, test, build, migration, audit, and diff checks; uploads a JSON execution record | Read-only validation and artifact upload        |

## Execution record

Each daily maintenance run calls `pnpm maintenance:check`, which writes a `maintenance-record.json` file and per-check logs to the ignored `maintenance-output/` directory. GitHub Actions uploads that directory as an artifact. The record contains timestamps, repository and commit identity, executed checks, outcomes, and an explicitly empty secret surface. GitHub Actions run history and the artifact provide the durable execution record; this repository never commits generated run records or credentials.

## Safe failure handling

The repository does not automatically commit dependency updates, edit source code, rotate credentials, or alter external accounts. A failed validation produces a failed workflow and an artifact; the existing CI Health Monitor may re-run a failed workflow only for the current commit. This keeps recovery bounded, reviewable, and idempotent.

## External boundaries

Gemini requires a valid provider-managed credential. Antigravity requires the provider's interactive Google sign-in. Google Drive reporting remains read-only. These conditions are surfaced in the application and inventory, but the maintenance system does not attempt to bypass any provider authentication or store secrets.

### Hosted-runner queue boundary

At the latest verification, GitHub Actions was enabled for the repository and allowed all configured actions, but the newly dispatched CI and Daily Maintenance runs were still pending or queued before executing any job step. There are no configured self-hosted runners, so this is a GitHub-hosted runner scheduling boundary rather than a source or workflow-step failure. The same reusable command completed successfully in both local worktrees, including the full format, type, test, build, migration, audit, and diff set. The scheduled workflow remains enabled and will retain its artifact-based record once a hosted runner is allocated.
