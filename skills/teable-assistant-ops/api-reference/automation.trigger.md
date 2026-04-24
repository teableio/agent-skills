# Automation Trigger Configuration

## Table of Contents
- [Trigger Types](#trigger-types) — recordCreated, recordUpdated, recordMatchesConditions, formSubmitted, scheduledTime, buttonClick, webhook, emailReceived
- [Common Patterns](#common-patterns) — getting table/view/field IDs

Triggers define WHEN an automation should run. Each trigger type has specific configuration requirements.

## Trigger Types

### 1. recordCreated - When Record Created
Triggers when a new record is created in a table.

```json
{
  "type": "recordCreated",
  "config": {
    "tableId": "tblXXXXXXX",           // Required: Table to watch
    "filter": { ... }                  // Optional: Additional filter conditions
  }
}
```

**Output Variables (accessible by subsequent actions):**
- `record.id` - The created record ID
- `record.fields.{fieldName}` - Field values of the created record
- `user` - User who created the record

### 2. recordUpdated - When Record Updated
Triggers when an existing record is modified.

```json
{
  "type": "recordUpdated",
  "config": {
    "tableId": "tblXXXXXXX",           // Required: Table to watch
    "watchFieldIds": ["fldXXX", ...],  // Optional: Only trigger when these fields change
    "filter": { ... }                  // Optional: Additional filter conditions
  }
}
```

**Output Variables:**
- `record.id` - The updated record ID
- `record.fields.{fieldName}` - Current field values
- `record.oldFields.{fieldName}` - Previous field values (before update)
- `user` - User who updated the record

### 3. recordMatchesConditions - When Record Matches Conditions
Triggers when a record transitions from non-matching to matching the specified filter conditions (on both creation and update events).

```json
{
  "type": "recordMatchesConditions",
  "config": {
    "tableId": "tblXXXXXXX",
    "filter": {                         // REQUIRED: Filter conditions to match
      "conjunction": "and",
      "filterSet": [
        { "fieldId": "fldXXX", "operator": "is", "value": "Done" }
      ]
    }
  }
}
```
For detailed filter syntax, see `view.filter` topic

**Output Variables:**
- `record.id` - The record ID
- `record.fields.{fieldName}` - Current field values
- `record.oldFields.{fieldName}` - Previous field values (before update, if applicable)
- `user` - User whose action caused the record to match

### 4. formSubmitted - When Form Submitted
Triggers when a form is submitted.

```json
{
  "type": "formSubmitted",
  "config": {
    "tableId": "tblXXXXXXX",           // Required: Table with the form
    "formId": "viwXXXXXXX"             // Required: The form view ID
  }
}
```

**Output Variables:**
- `record.id` - The created record ID
- `record.fields.{fieldName}` - Submitted field values
- `user` - Submitter (anonymous submissions may have empty fields)

### 5. scheduledTime - At Scheduled Time
Triggers on a schedule.

**Required fields:**
- `starting` — ISO datetime string (when the schedule becomes active)
- `tz` — IANA timezone, e.g., `"Asia/Shanghai"`
- `timing` — object (see below)

**Optional fields:**
- `ending` — ISO datetime string; must be in the future

**`timing.type` enum (exact values):** `"minutes" | "hours" | "days" | "weeks" | "months" | "OneTime"`
⚠️ NOT `"daily"` / `"weekly"` / `"monthly"` — those are wrong.

**Per-variant required sub-fields:**
- `minutes` → `interval: 1..60`
- `hours` → `interval: 1..24`
- `days` → `interval: 1..31`, `triggerTime: { hour: 0..23, minute: 0..59 }`
- `weeks` → `interval: 1..52`, `weekdays: ('MO'|'TU'|'WE'|'TH'|'FR'|'SA'|'SU')[]`, `triggerTime`
- `months` → `interval: 1..12`, `daysOfMonth: (1..31 | -1)[]` (`-1` = last day of month), `triggerTime`
- `OneTime` → no extra fields

⚠️ For `days`/`weeks`/`months`, `triggerTime` is an **object** `{hour, minute}` — NOT a `"HH:mm"` string.

**Canonical example (daily 09:00 Shanghai):**
```json
{
  "type": "scheduledTime",
  "config": {
    "starting": "2026-04-21T09:00:00.000Z",
    "tz": "Asia/Shanghai",
    "timing": {
      "type": "days",
      "interval": 1,
      "triggerTime": { "hour": 9, "minute": 0 }
    }
  }
}
```

**Every-5-minutes example:**
```json
{
  "type": "scheduledTime",
  "config": {
    "starting": "2026-04-21T09:00:00.000Z",
    "tz": "Asia/Shanghai",
    "timing": { "type": "minutes", "interval": 5 }
  }
}
```

**Output Variables (top-level, not under `meta`):**
- `actualTriggeredTime` - ISO 8601 string — when the trigger actually fired
- `expectTriggerTime` - ISO 8601 string — when the trigger was scheduled to fire
- `nextTriggerTime` - ISO 8601 string — next planned firing (`undefined` for the last run of a bounded schedule)

Note: the timezone is part of the trigger config, not the output. Parse the ISO timestamps with a date library if you need local-time formatting.

### 6. buttonClick - When Button Clicked
Triggers when a button field is clicked.

```json
{
  "type": "buttonClick",
  "config": {
    "tableId": "tblXXXXXXX",             // Required: Table containing the button
    "watchFieldIds": ["fldXXXXXXX"]      // Required: Button field IDs to watch (use ["all"] for any button)
  }
}
```

**Output Variables:**
- `record.id` - The record where button was clicked
- `record.fields.{fieldName}` - Field values of that record
- `user` - User who clicked the button

### 7. webhook - When Webhook Received
Triggers when an external HTTP request is sent to the webhook endpoint.

```json
{
  "type": "webhook",
  "config": {
    "authorization": {
      "type": "none"                     // Or "bearer" for token auth
    }
  }
}
```

**Output Variables:**
- `body` - The parsed JSON body of the incoming request

**Security:** Use bearer token authorization for production webhooks. The `automation setup-trigger` tool can auto-generate tokens.

### 8. emailReceived - When Email Received
Triggers when a new email is received. Supports IMAP connection.

**IMAP Configuration:**
```json
{
  "triggerType": "emailReceived",
  "emailReceivedConfig": {
    "connectionType": "imap",
    "host": "imap.example.com",
    "port": 993,
    "secure": true,
    "user": "user@example.com",
    "password": "password",
    "mailbox": "INBOX",
    "pollIntervalMinutes": 10
  }
}
```
Required: `emailReceivedConfig.connectionType`, `emailReceivedConfig.host`, `emailReceivedConfig.user`

**Output Variables:**
- `emails` - Array of received email objects (see fields below)
- `emailCount` - Number of emails received in this batch
- `triggerTime` - ISO timestamp when the trigger fired

Each entry in `emails[]`:
- `from` - Sender email address
- `fromName` - Sender display name (may be empty)
- `to` - Comma-separated recipient addresses
- `cc` - Comma-separated CC addresses
- `subject` - Email subject
- `date` - ISO timestamp from the email's Date header
- `messageId` - RFC 5322 Message-ID
- `body` - Plain text or HTML body (depends on trigger config `bodyFormat`)
- `priority` - `"high"` | `"normal"` | `"low"`
- `inReplyTo` - Message-ID this email is replying to (empty if not a reply)
- `attachments[]` - `{ filename, contentType, size, fileUrl }`

⚠️ **`fileUrl` is a short-lived signed URL** (lifetime varies by storage provider — minutes to hours). Download any attachments you need within the same script run; do not cache `fileUrl` for later use.

## Common Patterns

### Getting Table ID
Before creating a trigger, use `table get` to find available tables:
```
Tool: table get
Result: [{ id: "tblXXX", name: "Tasks", ... }]
```

### Getting View ID (for forms)
Use `view get` to find form views:
```
Tool: view get
Input: { tableId: "tblXXX" }
Result: [{ id: "viwXXX", name: "Contact Form", type: "form", ... }]
```

### Getting Field IDs
Use `field get` to find field IDs for watchFieldIds:
```
Tool: field get
Input: { tableId: "tblXXX" }
Result: [{ id: "fldXXX", name: "Status", type: "singleSelect", ... }]
```
