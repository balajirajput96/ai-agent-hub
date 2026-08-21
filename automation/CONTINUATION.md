# Website Continuation Loop

The project’s hourly continuation is a **bounded website health job**, selected to keep deterministic hourly work inside the deployed application rather than starting a new AI task every hour. It remains separate from the existing 09:00 IST GitHub and Drive summary, which stays read-only and does not share this callback or its records.

## Durable state

`continuation_controls` stores the single project-owned configuration, including the Heartbeat task identity, enabled state, 2,400-cycle cap, completed count, and last successful cycle time. `continuation_cycles` is an immutable, non-secret execution ledger. Each record includes the execution number, UTC-hour idempotency key, authenticated schedule identity, action, result, bounded recovery count, validation status, blocker, and next recommendation.

## Safe execution

The `/api/scheduled/hourly-continuation` handler accepts only a platform-authenticated cron identity. It verifies that the incoming task owns the configured control, declines disabled or exhausted controls, executes a database `SELECT 1` probe, and writes at most one cycle per UTC hour. Platform retries receive a successful, explicit duplicate response instead of incrementing the count again. Each record derives its validation result and next action from the actual schedule ownership, database probe, cycle boundary, and one bounded server-side read-only inspection of the latest GitHub Actions workflow. The GitHub check is recorded as passed, attention, or unavailable; it never modifies repositories, workflows, Drive data, or provider credentials.

## Lifecycle

The project-level schedule uses a six-field hourly UTC cron expression and is created only after the deployed handler is available. Its returned task identity is stored in `continuation_controls`. At 2,400 completed cycles, the handler stops recording new work and returns a safe limit response. The control can later be paused through the approved project schedule lifecycle without altering the daily report schedule.

## Owner-only bootstrap

After a project owner creates or replaces the Heartbeat schedule, an authenticated administrator can call the `agentHub.bootstrapContinuationControl` mutation with the returned task identity. The mutation validates the bounded non-secret identifier and idempotently creates or updates the sole control row. It does not create schedules, accept connector credentials, expose scheduler data to non-administrators, or reset existing cycle counts.

## Verified production state

The enabled project-owned Heartbeat runs at `0 0 * * * *` UTC. Eight authorized production callbacks have returned HTTP 200 and written distinct UTC-hour records. The eighth cycle confirmed the database probe, schedule ownership, GitHub-workflow-passed, and cycle-limit fields in one non-secret record. The existing `Daily GitHub and Drive summary` remains active at 09:00 Asia/Calcutta with its established read-only instruction; the website continuation handler neither invokes nor modifies that task-level schedule.
