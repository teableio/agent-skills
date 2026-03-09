# Automation Guide

## Table of Contents
- [Trigger Types](#trigger-types) — 7 trigger types, output variables, schedule config, webhook security
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

### Trigger Output Variables

Each trigger provides output variables accessible by subsequent actions:

**recordCreated / formSubmitted / buttonClick:**
- `record.id`, `record.fields.{fieldName}`, `meta.tableId`, `meta.tableName`

**recordUpdated / recordMatchesConditions:**
- `record.id`, `record.fields.{fieldName}`, `record.oldFields.{fieldName}` (previous values), `meta.tableId`, `meta.tableName`

**scheduledTime:**
- `meta.scheduledTime`, `meta.timezone`

**webhook:**
- `body` (parsed JSON), `headers`, `method`

### Schedule Config

```json
{
  "scheduleType": "daily" | "weekly" | "monthly" | "custom",
  "time": "09:00",
  "timezone": "Asia/Shanghai",
  "dayOfWeek": [1, 3, 5],    // for weekly: 0=Sun, 1=Mon, etc.
  "dayOfMonth": 1,            // for monthly
  "cron": "0 9 * * *"         // for custom
}
```

### Webhook Security

Use bearer token authorization for production webhooks. The `setup-automation-trigger` tool can auto-generate tokens.

## Creation Workflow

### 1. Create workflow + trigger
```bash
teable setup-automation-trigger \
  --trigger-type recordCreated \
  --table-id tblXXX \
  --name "My Automation" \
  --description "Trigger when new record created" \
  --create-script-action
```
Returns: `workflowId`, `triggerId`, `actionId`, `inputSchema`, `scriptUsage`

### 2. Get script input (optional)
```bash
teable get-script-input --workflow-id wflXXX --action-id actXXX
```
Returns the input object available in the script — each key is a nodeId with its output data. Use this to understand what data is available from previous workflow actions before writing script code.

### 3. Add script logic
```bash
teable generate-script-action \
  --workflow-id wflXXX \
  --action-id actXXX \
  --code '<javascript code>' \
  --description "What this script does"
```

Optional: `--dependencies '["lodash"]'` for npm packages, `--integrations '[{"id":"...","provider":"slack"}]'` for external services.

### 4. Generate flowchart
After generating the script, always create a flowchart to visualize the script logic — this helps users understand the automation flow at a glance.

If the user only provides a workflow ID (no action ID), first retrieve the automation details to find the script action:
```bash
teable get-automation --workflow-id wflXXX
# Look for the node with type: "script" → its id is the action-id
```

Then analyze the script code from the response and construct the flowchart nodes and edges:
```bash
teable generate-script-flowchart \
  --workflow-id wflXXX \
  --action-id actXXX \
  --nodes '[{"id":"start","type":"start","label":"Start"},...]' \
  --edges '[{"source":"start","target":"step1","type":"default"},...]'
```
`--nodes` and `--edges` are **required** — you must read the script code and build the flow structure yourself.

Node types: `start`, `end`, `step`, `condition`, `loop`, `tryCatch`
Edge types: `default`, `true`, `false`, `error`, `loop`

### 5. Test
```bash
teable test-automation-node --workflow-id wflXXX --node-id <triggerId|actionId>
```

### 6. Activate
```bash
teable activate-automation --workflow-id wflXXX
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

For full REST API reference: see [../api-reference/automation.api.md](../api-reference/automation.api.md), [../api-reference/automation.send-email.md](../api-reference/automation.send-email.md), and [../api-reference/integration.slack.md](../api-reference/integration.slack.md)

## Managing Automations

```bash
# List all automations
teable get-automations

# View details (code, variables, trigger config)
teable get-automation --workflow-id wflXXX

# View run history
teable get-automation-runs --workflow-id wflXXX

# Deactivate
teable activate-automation --workflow-id wflXXX --disable

# Delete a node
teable delete-automation-node --workflow-id wflXXX --node-id actXXX
```

## External Integrations

To use Slack or other integrations in scripts:
1. `get-user-integrations` — get integration IDs
2. Pass `--integrations '[{"id":"<integration-id>","provider":"slack"}]'` to `generate-script-action`
3. Access in script via `input.integrations["<id>"].authConfig`
