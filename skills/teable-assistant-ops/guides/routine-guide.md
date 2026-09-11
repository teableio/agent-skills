# Routine Guide

Use routines for scheduled, headless agent work that can be expressed as a self-contained prompt. Use an automation instead when work is event-driven or needs an explicit trigger/action graph.

## Safe workflow

1. Write a prompt containing all context each run needs; routines do not see the current conversation.
2. Preview creation with `routine create --dry-run`. Confirm the interpreted schedule, timezone, bounds, and upcoming occurrences with the user.
3. Create as a draft. Use `routine run-now` to preview real behavior, retain its run ID, and poll `routine get-run` until terminal.
4. Read the agent's closing text from the run; inspect the full conversation only when more detail or per-message credit use matters. Fix the prompt or schedule with `routine update --dry-run`, then save and preview again.
5. Activate only after the user approves both schedule and behavior.

## Scheduling decisions

- RRULE times are wall-clock values in the specified IANA timezone. Keep timezone separate; do not put `TZID`, `DTSTART`, or `UNTIL` in the RRULE.
- Use `starting` to anchor intervals and one-shot dates; use `ending` for a time boundary and `COUNT` for a bounded number of occurrences.
- Prefer fresh chats for independent runs. Continue the previous chat only when later runs intentionally depend on accumulated conversational state.
- Set the run limit to match expected work. A run exceeding it fails with a timeout rather than continuing indefinitely.

## Lifecycle and recovery

- `routine get` distinguishes saved draft configuration from the published schedule: when `hasDraft` is true, the next run still follows the published configuration.
- Deactivation pauses future scheduling; missed occurrences are not replayed wholesale on reactivation.
- Activation fails when the configuration has no future occurrence, such as an exhausted `COUNT`; update and preview the schedule first.
- `routine run-now` also works for drafts but rejects overlapping in-flight runs.
- Use `routine get-runs` for newest-first history and cursor pagination. A failed run may have executed (`runFail`, `timeout`) or never started (`creditExceed`, `overlap`, `queueTimeout`); distinguish these before retrying.
- Deletion stops scheduling and moves the routine to base trash. Runs and chats remain readable, and restoration returns the routine paused.
