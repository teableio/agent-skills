# Template Guide

Use templates to reuse a packaged project workflow rather than rebuilding its components independently.

## Selection and setup

1. Use `template search` to compare fit, required accounts, included components, and expected monthly automation runs. Search matches words in the name/description, not semantic intent; rephrase if no suitable result appears.
2. Decide the destination before `template install`: the current project receives a folder named after the template; `--new-project` creates a project in the same space instead. Do not install twice to retry unfinished setup.
3. Read the install result for outstanding account connections. Complete them through the setup card in the project's conversation; copying components does not prove they can run.
4. Use `template status` for project-wide health, then inspect a specific install when components fail or alerts report empty slots, failing automations, or quota problems.

## Submitting a reusable project

`template submit` freezes the current project for review as a new listing or the next version of its existing listing. Review the project for private content and credentials before submitting; describe changes for reviewers when updating an existing template. Records are excluded by default. Use `--include-data` only when the user explicitly intends to distribute reviewed data, never as a routine setup step.
