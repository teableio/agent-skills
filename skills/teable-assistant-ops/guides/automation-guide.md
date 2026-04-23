# Automation Guide

## Table of Contents
- [Trigger Types](#trigger-types) — 8 trigger types, output variables, schedule config, webhook security
- [Creation Workflow](#creation-workflow) — step-by-step: trigger → script input → script → flowchart → test → activate
- [Script Action API](#script-action-api) — runtime variables, common API patterns (records, email, Slack)
- [Managing Automations](#managing-automations) — list, view, run history, deactivate, delete
- [External Integrations](#external-integrations) — Slack and other integrations in scripts

## Trigger Types

| Trigger | Required Options | Description |
|---------|-----------------|-------------|
| `recordCreated` | `--table-id` | Fires when a new record is created |
| `recordUpdated` | `--table-id`, optional `--watch-field-ids` | Fires when a record is updated |
| `recordMatchesConditions` | `--table-id` | Fires when record matches filter conditions on create/update |
| `formSubmitted` | `--table-id`, `--form-id` | Fires when a form is submitted |
| `scheduledTime` | `--schedule-config` | Fires at scheduled intervals |
| `buttonClick` | `--table-id`, `--field-id` | Fires when a button field is clicked |
| `webhook` | optional `--webhook-authorization` | Fires on incoming webhook request |
| `emailReceived` | `--email-received-config` | Fires when an email is received via connected email integration |

### Trigger Output Variables

Each trigger provides output variables accessible by subsequent actions:

**recordCreated / formSubmitted / buttonClick:**
- `record.id`, `record.fields.{fieldName}`, `user`

**recordUpdated / recordMatchesConditions:**
- `record.id`, `record.fields.{fieldName}`, `record.oldFields.{fieldName}` (previous values), `user`

**scheduledTime:**
- `actualTriggeredTime`, `expectTriggerTime`, `nextTriggerTime` (all ISO 8601 strings)

**webhook:**
- `body` (parsed JSON)

**emailReceived:**
- `emails[]` (array of email objects with `from`, `fromName`, `to`, `cc`, `subject`, `date`, `messageId`, `body`, `priority`, `inReplyTo`, `attachments[]`), `emailCount`, `triggerTime`

### Schedule Config

`timing.type` enum: `"minutes" | "hours" | "days" | "weeks" | "months" | "OneTime"`

```json
{
  "starting": "2026-04-21T09:00:00.000Z",
  "tz": "Asia/Shanghai",
  "timing": {
    "type": "days",
    "interval": 1,
    "triggerTime": { "hour": 9, "minute": 0 }
  }
}
```

### Webhook Security

Use bearer token authorization for production webhooks. The `automation setup-trigger` tool can auto-generate tokens.

## Creation Workflow

### 1. Create workflow + trigger
```bash
teable automation setup-trigger \
  --trigger-type recordCreated \
  --table-id tblXXX \
  --name "My Automation" \
  --description "Trigger when new record created" \
  --create-script-action
```
Returns: `workflowId`, `triggerId`, `actionId`, `inputSchema`, `scriptUsage`

### 2. Get script input (optional)
```bash
teable automation get-script-input --workflow-id wflXXX --action-id actXXX
```
Returns the input object available in the script — each key is a nodeId with its output data. Use this to understand what data is available from previous workflow actions before writing script code.

### 3. Add script logic
```bash
teable automation generate-script \
  --workflow-id wflXXX \
  --action-id actXXX \
  --code '<javascript code>' \
  --description "What this script does"
```

Optional: `--dependencies '["lodash"]'` for npm packages, `--integrations '[{"id":"...","provider":"slack"}]'` for external services.

**Script files** — `automation get` and `automation get-script-input` write the current script code to `.teable/cli/scripts/<actionId>.js` and return the file path. Edit the file in place, then pass its path to `automation generate-script --code <path>`.

### 4. Generate flowchart
After generating the script, always create a flowchart to visualize the script logic — this helps users understand the automation flow at a glance.

If the user only provides a workflow ID (no action ID), first retrieve the automation details to find the script action:
```bash
teable automation get --workflow-id wflXXX
# Look for the node with type: "script" → its id is the action-id
```

Then analyze the script code from the response and construct a single flowchart JSON object:
```bash
teable automation generate-flowchart \
  --workflow-id wflXXX \
  --action-id actXXX \
  --flowchart '{"nodes":[{"id":"start","type":"start","label":"Start"},...],"edges":[{"source":"start","target":"step1","type":"default"},...]}'
```
`--flowchart` is **required** — you must read the script code and build the flow structure as a single JSON object containing both `nodes` and `edges`.

Node types: `start`, `end`, `step`, `condition`, `loop`, `tryCatch`
Edge types: `default`, `true`, `false`, `error`, `loop`

### 5. Test
```bash
teable automation test-node --workflow-id wflXXX --node-id <triggerId|actionId>
```

### 6. Activate
```bash
teable automation activate --workflow-id wflXXX --method activate
```

## Script Action API

Available in script runtime:

| Variable | Description |
|----------|-------------|
| `process.env.AUTOMATION_TOKEN` | Auth token for API calls |
| `process.env.PUBLIC_ORIGIN` | Base URL for Teable API |
| `input[triggerId]` | Trigger data (record, fields, etc.) |
| `input.integrations["<id>"].authConfig` | Integration credentials |
| `output.set(key, value)` | Return data for next action |

### Common API patterns

```javascript
const baseUrl = process.env.PUBLIC_ORIGIN;
const headers = {
  Authorization: `Bearer ${process.env.AUTOMATION_TOKEN}`,
  "Content-Type": "application/json"
};

// Get records
const res = await fetch(`${baseUrl}/api/table/${tableId}/record`, { headers });

// Create records
await fetch(`${baseUrl}/api/table/${tableId}/record`, {
  method: "POST", headers,
  body: JSON.stringify({ records: [{ fields: { Name: "Test" } }] })
});

// Send email
await fetch(`${baseUrl}/api/automation/runtime/email`, {
  method: "POST", headers,
  body: JSON.stringify({ to: "user@example.com", subject: "Hi", body: "Hello" })
});

// External API (e.g., Slack webhook)
await fetch("https://hooks.slack.com/...", {
  method: "POST",
  body: JSON.stringify({ text: "Hello from Teable" })
});
```

**Rules**: Use built-in `fetch()` only — never `node-fetch` or other HTTP libraries.

**Notifications**: `console.log` is debug-only — never use it to notify users. Default to Email API when no notification channel is specified (read `../api-reference/automation.send-email.md` first). For Slack or webhooks, use HTTP requests in script to external services.

For full REST API reference: see [../api-reference/automation.api.md](../api-reference/automation.api.md), [../api-reference/automation.send-email.md](../api-reference/automation.send-email.md), and [../api-reference/integration.slack.md](../api-reference/integration.slack.md)

## Managing Automations

**Workflow lifecycle**: `Edit → Test → Activate → Running → Edit → Test → Activate → ...`
An active automation can be paused: `Deactivate → Paused`

**Draft system**: All edits (trigger config, script code, node changes) create a **draft** version — they are NOT immediately effective on a running automation. Use `automation activate` to publish or manage drafts:

- `--method activate` — Enable automation AND apply all draft changes to the running version
- `--method deactivate` — Disable the automation (stops all automated actions immediately)
- `--method discard` — Discard draft changes and revert to last active version

**Risk**: Activating in production will start sending real emails/API calls. Deactivating stops all automated actions immediately.

Use `automation get --include-active-snapshot` to compare draft vs published version when `hasDraft=true`.

```bash
# List all automations
teable automation list

# View details (code, variables, trigger config)
teable automation get --workflow-id wflXXX

# Compare draft vs active version
teable automation get --workflow-id wflXXX --include-active-snapshot

# View run history
teable automation get-runs --workflow-id wflXXX

# View run history (filter by status)
teable automation get-runs --workflow-id wflXXX --status completed

# Step-level detail of a single run
teable automation get-run --workflow-id wflXXX --run-id runXXX

# Activate — enable + apply draft changes
teable automation activate --workflow-id wflXXX --method activate

# Deactivate — pause automation
teable automation activate --workflow-id wflXXX --method deactivate

# Discard — revert draft to last active version
teable automation activate --workflow-id wflXXX --method discard

# Delete a node
teable automation delete-node --workflow-id wflXXX --node-id actXXX
```

## External Integrations

To use Slack or other integrations in scripts:
1. `integration list` — get integration IDs
2. Pass `--integrations '[{"id":"<integration-id>","provider":"slack"}]'` to `automation generate-script`
3. Access in script via `input.integrations["<id>"].authConfig`
