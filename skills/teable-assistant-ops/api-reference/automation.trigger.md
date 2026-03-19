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
    "viewId": "viwXXXXXXX",            // Optional: Only watch records in this view
    "filter": { ... }                  // Optional: Additional filter conditions
  }
}
```

**Output Variables (accessible by subsequent actions):**
- `record.id` - The created record ID
- `record.fields.{fieldName}` - Field values of the created record
- `meta.tableId` - The table ID
- `meta.tableName` - The table name

### 2. recordUpdated - When Record Updated
Triggers when an existing record is modified.

```json
{
  "type": "recordUpdated",
  "config": {
    "tableId": "tblXXXXXXX",           // Required: Table to watch
    "viewId": "viwXXXXXXX",            // Optional: Only watch records in this view
    "watchFieldIds": ["fldXXX", ...],  // Optional: Only trigger when these fields change
    "filter": { ... }                  // Optional: Additional filter conditions
  }
}
```

**Output Variables:**
- `record.id` - The updated record ID
- `record.fields.{fieldName}` - Current field values
- `record.oldFields.{fieldName}` - Previous field values (before update)
- `meta.tableId`, `meta.tableName`

### 3. recordMatchesConditions - When Record Matches Conditions
Triggers when a record transitions from non-matching to matching the specified filter conditions (on both creation and update events).

```json
{
  "type": "recordMatchesConditions",
  "config": {
    "tableId": "tblXXXXXXX",
    "viewId": "viwXXXXXXX",            // Optional
    "watchFieldIds": ["fldXXX", ...],  // Optional: Only trigger when these fields change
    "filter": { ... }                  // Optional: Filter conditions to match
  }
}
```

**Output Variables:**
- `record.id` - The record ID
- `record.fields.{fieldName}` - Current field values
- `record.oldFields.{fieldName}` - Previous field values (before update, if applicable)
- `meta.tableId`, `meta.tableName`

### 4. formSubmitted - When Form Submitted
Triggers when a form is submitted.

```json
{
  "type": "formSubmitted",
  "config": {
    "tableId": "tblXXXXXXX",           // Required: Table with the form
    "viewId": "viwXXXXXXX"             // Required: The form view ID
  }
}
```

**Output Variables:**
- `record.id` - The created record ID
- `record.fields.{fieldName}` - Submitted field values
- `meta.formName` - The form name

### 5. scheduledTime - At Scheduled Time
Triggers on a schedule (like cron).

```json
{
  "type": "scheduledTime",
  "config": {
    "scheduleType": "daily" | "weekly" | "monthly" | "custom",
    "time": "09:00",                   // HH:mm format
    "timezone": "Asia/Shanghai",       // Timezone
    "dayOfWeek": [1, 3, 5],           // For weekly: 0=Sun, 1=Mon, etc.
    "dayOfMonth": 1,                   // For monthly
    "cron": "0 9 * * *"               // For custom: cron expression
  }
}
```

**Output Variables:**
- `meta.scheduledTime` - The scheduled execution time
- `meta.timezone` - The timezone

### 6. buttonClick - When Button Clicked
Triggers when a button field is clicked.

```json
{
  "type": "buttonClick",
  "config": {
    "tableId": "tblXXXXXXX",           // Required: Table containing the button
    "fieldId": "fldXXXXXXX"            // Required: The button field ID
  }
}
```

**Output Variables:**
- `record.id` - The record where button was clicked
- `record.fields.{fieldName}` - Field values of that record
- `meta.tableId`, `meta.fieldId`

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
- `headers` - Request headers
- `method` - HTTP method (POST, etc.)

**Security:** Use bearer token authorization for production webhooks. The setup-automation-trigger tool can auto-generate tokens.

### 8. emailReceived - When Email Received
Triggers when an email is received via a connected Gmail integration.

```json
{
  "type": "emailReceived",
  "config": {
    "integrationId": "intXXXXXXX"          // Required: ID of the connected Gmail
  }
}
```

**Prerequisites:** The user must first connect a Gmail integration via `connect-integration --provider gmail`. Use `get-user-integrations --provider gmail` to get the integration ID.

**Output Variables:**
- `email.from` - Sender email address
- `email.to` - Recipient email address(es)
- `email.subject` - Email subject line
- `email.body` - Email body content
- `email.date` - Timestamp the email was received
- `email.attachments` - Array of attachment metadata (name, size, type)

## Common Patterns

### Getting Table ID
Before creating a trigger, use `get-tables-meta` to find available tables:
```
Tool: get-tables-meta
Result: [{ id: "tblXXX", name: "Tasks", ... }]
```

### Getting View ID (for forms)
Use `get-views` to find form views:
```
Tool: get-views
Input: { tableId: "tblXXX" }
Result: [{ id: "viwXXX", name: "Contact Form", type: "form", ... }]
```

### Getting Field IDs
Use `get-fields` to find field IDs for watchFieldIds:
```
Tool: get-fields
Input: { tableId: "tblXXX" }
Result: [{ id: "fldXXX", name: "Status", type: "singleSelect", ... }]
```
