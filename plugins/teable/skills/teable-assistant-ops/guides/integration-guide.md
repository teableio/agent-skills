# Integration Guide

Use connections for the user's own accounts (inbox, CRM, personal posts). For public/platform data independent of their account, use [scraping](scrape-guide.md), even if that platform is connected.

## Discover → connect → bind

1. Use `integration list` to check existing connections. For Composio tasks, use `integration search` with the whole task in natural language, not a guessed tool name. Review returned tool slugs/input schemas, suggested plan, `connectable` apps, and `accounts` when several accounts exist.
2. Choose the connection route: built-in OAuth uses `integration connect --provider` (Slack, Gmail, Outlook, Airtable, or Google Sheets); Composio uses `--toolkit` with a slug returned by search. Do not pass both selectors. `--name` applies only to built-in providers, not toolkit connections.
3. An unconnected search hit can be authorized with `integration connect --toolkit <slug> --wait`; do not ask for an API key just because it is not connected. If the toolkit instead prompts for an API key, the user must run that connection themselves in their terminal. Never collect or echo that key in chat.
4. Verify connection completion before binding it to an app/workflow. Connection ownership and resource grants are separate; use [Secrets Guide](secret-guide.md) for resource access.

Use `integration get-token` only when an access token is actually needed, and never expose it in replies. For automation script bindings and Slack token selection, see [External Integrations](automation-guide.md#external-integrations) and [Slack reference](../api-reference/integration.slack.md).

Tool discovery is not event discovery: do not substitute a search tool slug for a connector-event type in a routine or automation.
