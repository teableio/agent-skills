# --base-id Reference

`--base-id` can be pre-configured via `teable config`. When the user explicitly provides a base ID, pass it with `--base-id` to the commands listed below.

## Commands that accept --base-id

### Data Query
| Command | Also requires |
|---------|---------------|
| `get-tables-meta` | |
| `get-fields` | `--table-id` |
| `get-records` | `--table-id` |
| `get-views` | `--table-id` |
| `sql-query` | `--sql` |
| `get-ai-config` | |

### Field Management
| Command | Also requires |
|---------|---------------|
| `create-field` | `--table-id` |
| `update-field` | `--table-id`, `--field-id` |
| `delete-field` | `--table-id`, `--field-id` |

### Record Management
| Command | Also requires |
|---------|---------------|
| `create-records` | `--table-id` |
| `update-records` | `--table-id` |
| `delete-records` | `--table-id` |

### Table Management
| Command | Also requires |
|---------|---------------|
| `create-table` | |
| `update-table` | `--table-id` |
| `delete-table` | `--table-id` |

### View Management
| Command | Also requires |
|---------|---------------|
| `create-view` | `--table-id` |
| `update-view` | `--view-id` |
| `delete-view` | `--view-id` |

### AI Fill
| Command | Also requires |
|---------|---------------|
| `trigger-ai-fill` | `--table-id`, `--field-id` |

### App Builder
| Command | Also requires |
|---------|---------------|
| `get-apps` | |
| `generate-app` | `--action` |

### Automation
| Command | Also requires |
|---------|---------------|
| `get-script-input` | `--workflow-id`, `--action-id` |
| `setup-automation-trigger` | `--trigger-type` |
| `generate-script-action` | `--workflow-id`, `--action-id` |
| `generate-script-flowchart` | `--workflow-id`, `--action-id` |
| `test-automation-node` | `--workflow-id`, `--node-id` |
| `activate-automation` | `--workflow-id` |
| `get-automations` | |
| `get-automation` | `--workflow-id` |
| `get-automation-runs` | `--workflow-id` |
| `delete-automation-node` | `--workflow-id`, `--node-id` |

### Advanced
| Command | Also requires |
|---------|---------------|
| `search-api` | `--query` |
| `call-api` | `--api-id` |
| `execute-script` | |
| `import-excel` | `--stage` |

## Commands that do NOT need --base-id

| Command | Purpose |
|---------|---------|
| `auth` / `auth status` | Manage authentication |
| `config` | Configure default base ID and other settings |
| `upload-attachment` | Upload local files (returns attachment token) |
| `get-user-integrations` | List connected external services |
| `connect-integration` | OAuth authorization for external services |
