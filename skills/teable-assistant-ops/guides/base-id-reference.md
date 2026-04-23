# --base-id Reference

`--base-id` can be pre-configured via `teable config`. When the user explicitly provides a base ID, pass it with `--base-id` to the commands listed below.

## Commands that accept --base-id

### Data Query
| Command | Also requires |
|---------|---------------|
| `table get` | |
| `field get` | `--table-id` |
| `record get` | `--table-id` |
| `view get` | `--table-id` |
| `sql-query` | `--sql` |
| `get-ai-config` | |
| `get-collaborators` | |

### Field Management
| Command | Also requires |
|---------|---------------|
| `field create` | `--table-id` |
| `field update` | `--table-id`, `--field-id` |
| `field delete` | `--table-id`, `--field-id` |

### Record Management
| Command | Also requires |
|---------|---------------|
| `record create` | `--table-id` |
| `record update` | `--table-id` |
| `record delete` | `--table-id` |

### Table Management
| Command | Also requires |
|---------|---------------|
| `table create` | |
| `table update` | `--table-id` |
| `table delete` | `--table-id` |

### Node & Folder Management
| Command | Also requires |
|---------|---------------|
| `get-node-tree` | |
| `folder create` | `--name` |
| `folder rename` | `--folder-id`, `--name` |
| `folder delete` | `--folder-id` |
| `folder move` | `--node-id` |

### View Management
| Command | Also requires |
|---------|---------------|
| `view create` | `--table-id` |
| `view update` | `--view-id` |
| `view delete` | `--view-id` |

### AI Fill
| Command | Also requires |
|---------|---------------|
| `trigger-ai-fill` | `--table-id`, `--field-id` |

### App Builder
| Command | Also requires |
|---------|---------------|
| `app list` | |
| `app create` | |
| `app update` | `--app-id` |

### Automation
| Command | Also requires |
|---------|---------------|
| `automation get-script-input` | `--workflow-id`, `--action-id` |
| `automation setup-trigger` | `--trigger-type` |
| `automation generate-script` | `--workflow-id`, `--action-id` |
| `automation generate-flowchart` | `--workflow-id`, `--action-id`, `--flowchart` |
| `automation test-node` | `--workflow-id`, `--node-id` |
| `automation activate` | `--workflow-id` |
| `automation list` | |
| `automation get` | `--workflow-id` |
| `automation get-runs` | `--workflow-id` |
| `automation get-run` | `--workflow-id`, `--run-id` |
| `automation delete-node` | `--workflow-id`, `--node-id` |

### Advanced
| Command | Also requires |
|---------|---------------|
| `search-api` | `--query` |
| `call-api` | `--method`, `--url` |
| `import` | `--file` or `--attachment-token` or `--data` |
| `scrape` | `--dataset-id`, `--inputs` |
| `tools list` | |
| `get-doc` | `--topic` |

## Commands that do NOT need --base-id

| Command | Purpose |
|---------|---------|
| `auth` / `auth status` | Manage authentication |
| `config` | Configure default base ID and other settings |
| `upload-attachment` | Upload local files (returns attachment token) |
| `import-status` | Poll import job status (uses `--table-id`) |
| `integration list` | List connected external services |
| `integration connect` | OAuth authorization for external services |
| `integration get-token` | Get access token for a connected integration |
