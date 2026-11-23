# Automation Guide

Use automations for event-driven work and deterministic trigger/action workflows. For scheduled work expressed as a self-contained agent prompt, use a [routine](routine-guide.md) instead; keep `scheduledTime` automation triggers for scripted action graphs.

## Available Commands

| Command | Purpose |
|---------|---------|
| `automation list` | List all automations in the project |
| `automation get` | Get detailed workflow (trigger, actions, script code, edges) |
| `automation update` | Rename/describe a workflow — applies **immediately**, bypasses the draft system |
| `automation delete` | Deactivate a workflow and move it to project trash (restorable — not permanent) |
| `automation setup-trigger` | Create or update workflow + trigger |
| `automation generate-script` | Add/update script code for an action |
| `automation generate-flowchart` | Generate flowchart for a script action |
| `automation test-node` | Test a trigger or action node |
| `automation activate` | Activate, deactivate, or discard draft |
| `automation get-runs` | Run history — `--status success\|failed\|running\|canceled\|pending`, paginate with `--cursor` + `--take` (max 10) |
| `automation get-run` | Step-level detail of a single run |
| `automation delete-node` | Delete an action/logic node (not trigger) |
| `automation get-script-input` | Get input data from previous workflow actions |

## Trigger Selection

> **Required**: `teable get-doc --topic automation.trigger` — trigger config, output variables, schedule config reference

| User scenario | Trigger type | Required options |
|--------------|-------------|-----------------|
| React to new records | `recordCreated` | `--table-id` |
| React to record changes | `recordUpdated` | `--table-id`; optional `--watch-field-ids` to limit fields |
| React when record matches filter | `recordMatchesConditions` | `--table-id`, `--filter` |
| React to form submission | `formSubmitted` | `--table-id`, `--form-id` |
| Run on a schedule (see timing types below) | `scheduledTime` | `--schedule-config` (see trigger reference) |
| User clicks a button field | `buttonClick` | `--table-id`, `--field-id` |
| External system sends HTTP request | `webhook` | optional `--webhook-config` for authorization and synchronous response; retain returned `webhook.url` and token |
| Email received via connected mailbox | `emailReceived` | `--email-received-config`; bind the password as `{ "alias": "..." }`, never plaintext |
| Connected app emits an event | `connectorEvent` | `--connector-event-config`; discover the toolkit/event type, then bind the user's connection alias |

For `connectorEvent`, follow the trigger reference's credential flow: create the trigger without an account, request the connection for the returned workflow ID, then update the trigger with the returned alias. Testing waits for the next real event when no sample exists, and activation creates the subscription. A `disconnected` event source requires reconnecting or rebinding an account.

**Schedule timing types** (for `scheduledTime` trigger):

| Frequency | `timing.type` | Extra config needed |
|-----------|--------------|-------------------|
| Every N minutes (1–60) | `minutes` | `interval` |
| Every N hours (1–24) | `hours` | `interval` |
| Daily / every N days | `days` | `interval`, `triggerTime: {hour, minute}` |
| Specific weekdays | `weeks` | `interval`, `weekdays: ["MO","TU",...]`, `triggerTime` |
| Monthly on specific dates | `months` | `interval`, `daysOfMonth: [1,15,...]`, `triggerTime` |

## Creation Workflow

1. Gather IDs: `table get` / `field get` / `view get`
2. `automation setup-trigger` — creates workflow + trigger + optional script action (use `--create-script-action`)
3. `automation get-script-input` — see what data is available from previous actions
4. `automation generate-script` — add script code (use `--dependencies` for npm packages, `--integrations` for external services)
5. `automation generate-flowchart` — visualize the script logic. If only workflow-id is known, use `automation get` to find the script action-id first. All three flags required: `--workflow-id`, `--action-id`, `--flowchart`
   - Node types: `start`, `end`, `step`, `condition`, `loop`, `tryCatch`
   - Edge types: `default`, `true`, `false`, `error`, `loop`
6. `automation test-node` — test trigger or action. `--record-id` picks the test record (record-based triggers); `--with-dependency` also runs dependency nodes; side effects (emails, API calls) only fire with `--side-effect` (default off for safe testing)
7. `automation activate --method activate`

**Script files**: `automation get` and `automation get-script-input` persist scripts to `.teable/cli/scripts/<workflowId>/<actionId>.js` and return that path as `code`.
To modify: read the file at that path → edit the script file in place — creating a new file breaks the path linkage to the workflow. Pass the same persisted path to `automation generate-script --code <path>`.

## Draft System & Lifecycle

**Lifecycle**: `Edit → Test → Activate → Running → Edit → Test → Activate → ...`

All edits (trigger config, script code, node changes) create a **draft** version — they are NOT immediately effective on a running automation.

| Situation | `--method` | Effect |
|-----------|-----------|--------|
| New automation ready to go live | `activate` | Enable + apply all draft changes |
| Running automation causing issues | `deactivate` | Stop immediately, draft preserved |
| Want to undo draft edits | `discard` | Revert to last active version |

**Risk**: `activate` in production starts sending real emails/API calls immediately.

Use `automation get --include-active-snapshot` to compare draft vs published version when `hasDraft=true`.

## Script Rules

Script actions are Turing-complete: CRUD, AI generation, email, HTTP requests, Slack/Teams/webhook integrations — all via Teable REST API and built-in `fetch()`.

> **Required**: `teable get-doc --topic automation.api` — the script runtime (built-in auth token and base URL, trigger input, outputs, granted secrets), request examples, and the REST APIs scripts call. It needs `@teable/cli` 0.6.55 or later: if the output has no **Script Runtime** section, run `npm install -g @teable/cli` and read it again.
> **Optional**: `teable get-doc --topic automation.send-email` — email sending; `teable get-doc --topic integration.slack` — Slack API

**Custom secrets**: store and grant credentials to the workflow with `teable secret`; the script reads a granted secret by its alias (see the runtime section of `teable get-doc --topic automation.api`). Inspect resource placeholders and bindings before granting. See [secret-guide.md](secret-guide.md).

**Rules:**
- Use built-in `fetch()` only — never `node-fetch` or other HTTP libraries
- For sync/import keyed by a unique value, use `POST /api/table/<tableId>/record/upsert`, never create-then-catch-duplicate. Set `matchField` to one field with `unique=true`; `onConflict: "ignore"` leaves existing rows unchanged, while `"update"` writes only supplied columns.
- `console.log` is debug-only — never use it to notify users
- Notifications: default to **Email API** when no channel is specified (run `teable get-doc --topic automation.send-email` first); Slack/Teams/webhook via HTTP requests in script

**AI in scripts**: call `POST /api/automation/runtime/ai` on the runtime base URL with `{ prompt, attachments?, modelKey?, temperature?, outputType? }` — supports up to 10 file attachments (images, PDFs, Office docs; each ≤20MB) and `outputType: "object"` for parsed JSON output. The project comes from the automation context — do NOT put a baseId in the URL. Read `teable get-doc --topic automation.ai` first for the full request shape, attachment field mapping, and available model keys. Prefer one request with several attachments over one request per attachment; on 429 (AI concurrency saturated) retry later, don't loop immediately.

**Common script patterns**: the auth header and get/create record examples are in `teable get-doc --topic automation.api`; email and AI calls use the same header (`automation.send-email`, `automation.ai`).

## External Integrations

For tool discovery and account authorization, read [Integration Guide](integration-guide.md). Use `integration list` to check connected services, `integration connect --provider slack` to start OAuth, and `integration get-token --integration-id intXXX` to get access tokens.

To use integrations in scripts:
1. `integration list` — get integration IDs
2. Pass `--integrations '[{"id":"<integration-id>","provider":"slack"}]'` to `automation generate-script`
3. Access in script via `input.integrations["<id>"].authConfig`
4. See `get-doc --topic integration.slack` for Slack API patterns
