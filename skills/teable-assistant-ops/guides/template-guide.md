# Template Guide

Use templates to reuse a packaged project workflow rather than rebuilding its components independently.

## Selection and setup

1. Use `template search` to compare fit, required accounts, included components, and expected monthly automation runs. Results rank by installations in the last 30 days, not runtime success. Search matches words in the name/description, not semantic intent; rephrase if no suitable result appears.
2. Decide the destination before `template install`: the current project receives a folder named after the template; `--new-project` creates a project in the same space instead. Do not install twice to retry unfinished setup.
3. Read the install result for outstanding account connections. Complete them through the setup card in the project's conversation; copying components does not prove they can run.
4. Use `template status` for project-wide health, then inspect a specific install when components fail or alerts report empty slots, failing automations, or quota problems.

## Submitting a reusable project

Prepare a dedicated template project, not a project people work in:

1. Inspect `get-node-tree` and choose the components to reuse. Preview `template extract` with `--nodes` and `--dry-run`; review included dependencies and what stays behind, then confirm the scope with the user before extracting.
2. Extraction creates a new template project in the same space without changing the source. No records are copied, automations arrive off, tables read/written by selected apps or automations come along, and links to tables left behind become text. Check that the resulting structure still expresses the intended workflow.
3. Switch project context to the **new project** for all remaining work. Replace author-only settings/content with install-time settings or sample content, add reviewed sample records, and write the post-install guide using the new project's IDs.
4. Run `template check` and resolve `content.findings` until `content.open` is 0. Review the project manually too: text matching cannot certify that company names, logos or addresses are safe to distribute. Inspect automatic `checks` and the `records` count, then rerun after fixes.
5. Only after review, `template submit` freezes the project as a new listing or the next version of its existing listing. Describe changes for reviewers on updates. A template project ships **whole, including its sample records**, and author-only findings block submission; do not assume omitting `--include-data` excludes those records.

For other projects, records remain excluded by default; use `--include-data` only when the user explicitly intends to distribute reviewed data. Prefer extraction over submitting a working project.

## Authoring the post-install guide

The guide is a setup card whose steps tick from project data. Before editing, read `template guide`: it returns the saved draft, otherwise the last submitted guide (`null` if none), plus referenced resource `names`. If a Playbook app or `lib/playbook.ts` already describes setup, derive the steps from it rather than inventing a competing flow.

1. Read `teable template guide-save --help` for the JSON contract and writing limits. Use this project's real IDs, 3–6 steps in setup order, stable step slugs, short action titles and plain-language instructions.
2. Prefer data-proven completion over `manual`: business rename, changed field values, real contacts, cleared samples, app publication, successful automation, or connected accounts. Include `business` only for a renamed step. For `real`/`cleared`, sample emails must use `example.com`; omit `business.sample` and changed-field samples, which submission captures from records. Use `connected` only when automations, apps or routines actually require account credentials; otherwise it starts ticked and validation reports a problem.
3. Point steps at the resource where the user acts. A table target identifies the field to fill; an app anchor is valid only if its code contains the corresponding `data-guide` marker. Optional daily reminders describe ongoing workflows after setup (at most two).
4. Save the **whole** draft with `template guide-save` from a JSON file; it replaces, not merges. Inspect `alreadyTrue` and `problem` in the result. Steps already satisfied by the data as shipped are refused at submission: revise the condition or sample data and save again, rather than claiming validation succeeded.
5. Submit only after checks pass. The next `template submit` uses the saved draft, otherwise the previous version's guide. A submit-time `--guide` replaces it and `--no-guide` removes it; either also becomes the draft. Use `template guide-save --clear` only when intentionally removing the guide from the next submission.
