
# SendEmail in Script Action

Send emails via the runtime API in automation scripts.

## API Endpoint

```
POST /api/automation/runtime/email
Authorization: Bearer ${process.env.AUTOMATION_TOKEN}
Content-Type: application/json
```

## Request Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| to | string \| string[] | Yes | Recipient email(s) |
| subject | string | Yes | Email subject |
| body | string | Yes | Email body (Markdown or HTML) |
| cc | string \| string[] | No | CC recipients |
| bcc | string \| string[] | No | BCC recipients |
| senderName | string | No | Sender display name |
| replyTo | string | No | Reply-to address |
| smtp | object | No | Custom SMTP config |

## Examples

### Basic Email

```javascript
const response = await fetch(process.env.PUBLIC_ORIGIN + '/api/automation/runtime/email', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.AUTOMATION_TOKEN}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    to: input.trigger.record.fields.Email,
    subject: `Task Assigned: ${input.trigger.record.fields.TaskName}`,
    body: `
# New Task

Hi **${input.trigger.record.fields.AssigneeName}**,

You have a new task:
- **Task**: ${input.trigger.record.fields.TaskName}
- **Due**: ${input.trigger.record.fields.DueDate}

[View Task](${input.trigger.record.url})
    `
  })
});
```

### With Custom SMTP

```javascript
await fetch(process.env.PUBLIC_ORIGIN + '/api/automation/runtime/email', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.AUTOMATION_TOKEN}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    to: ['user1@example.com', 'user2@example.com'],
    subject: 'Notification',
    body: '<h1>HTML works too</h1>',
    senderName: 'My App',
    smtp: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      sender: 'noreply@myapp.com',
      auth: { user: 'user@gmail.com', pass: 'app-password' }
    }
  })
});
```

## SMTP Providers

| Provider | Host | Port |
|----------|------|------|
| Gmail | smtp.gmail.com | 587 |
| Outlook | smtp.office365.com | 587 |
| Amazon SES | email-smtp.{region}.amazonaws.com | 587 |
| SendGrid | smtp.sendgrid.net | 587 |

## Body Rendering (markdown-it)

The `body` field is rendered using **markdown-it** with:
- `html: true` - Raw HTML allowed
  - Important: `<!-- -->` html comment will break the email rendering, do not use it! 
- `breaks: true` - 
 → `<br>`

### Supported Syntax

| Markdown | HTML Output |
|----------|-------------|
| `**bold**` | `<strong>bold</strong>` |
| `*italic*` | `<em>italic</em>` |
| `~~strike~~` | `<del>strike</del>` |
| `# Heading` | `<h1>Heading</h1>` |
| `[text](url)` | `<a href="url">text</a>` |
| `![alt](src)` | `<img alt="alt" src="src">` |
| `> quote` | `<blockquote>quote</blockquote>` |
| `---` | `<hr>` |
| Line break (
) | `<br>` (auto-converted) |

### Lists

```markdown
- Item 1
- Item 2

1. First
2. Second
```

### Raw HTML

Since `html: true`, you can embed HTML directly:

```html
<table>
  <tr><td>Cell 1</td><td>Cell 2</td></tr>
</table>
<p style="color: blue;">Styled text</p>
```
