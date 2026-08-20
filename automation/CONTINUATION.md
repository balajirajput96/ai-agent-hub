# Website Continuation Loop

The project’s hourly continuation is a **bounded website health job**, selected to keep deterministic hourly work inside the deployed application rather than starting a new AI task every hour. It remains separate from the existing 09:00 IST GitHub and Drive summary, which stays read-only and does not share this callback or its records.

## Durable state

`continuation_controls` stores the single project-owned configuration, including the Heartbeat task identity, enabled state, 2,400-cycle cap, completed count, and last successful cycle time. `continuation_cycles` is an immutable, non-secret execution ledger. Each record includes the execution number, UTC-hour idempotency key, authenticated schedule identity, action, result, bounded recovery count, validation status, blocker, and next recommendation.

## Safe execution

The `/api/scheduled/hourly-continuation` handler accepts only a platform-authenticated cron identity. It verifies that the incoming task owns the configured control, declines disabled or exhausted controls, executes a database `SELECT 1` probe, and writes at most one cycle per UTC hour. Platform retries receive a successful, explicit duplicate response instead of incrementing the count again. Each record derives its validation result and next action from the actual schedule ownership, database probe, and cycle boundary. The handler does not run shell commands, store credentials, call external connectors, modify GitHub, or change Google Drive.

## Lifecycle

The project-level schedule uses a six-field hourly UTC cron expression and is created only after the deployed handler is available. Its returned task identity is stored in `continuation_controls`. At 2,400 completed cycles, the handler stops recording new work and returns a safe limit response. The control can later be paused through the approved project schedule lifecycle without altering the daily report schedule.
