# Scraping Guide

Use scraping for public/platform data and live facts outside the project and the user's own accounts. Fetch ordinary public pages directly first; use scraping when blocked or when structured platform data is needed. Connected-account work belongs to [integrations](integration-guide.md).

> **Reference**: [scrape.guide.md](../api-reference/scrape.guide.md) or `teable get-doc --topic scrape.guide`

## Find → inspect → run

1. When a platform is named, use `scrape search` with `--platform` and the requested data `--type` to compare sources by required inputs. Otherwise use `--query` with `--use-case` containing the user's request and subject. Choose the endpoint whose required inputs match what the user supplied; among equally suitable endpoints prefer the cheaper one.
2. Inspect only the selected endpoint with `scrape inspect`. Build the input exactly from `inputSchema`, preserving JSON types; use `outputSchema` when present to judge whether the needed fields are returned. Inspect another only if the first cannot take the input.
3. Run once per input object. A specified endpoint skips search, not inspection; a specified source pins the source. Reuse the previous endpoint when appending to a table so columns stay aligned.

The scraper menu's “What to scrape” text is input, not a table name: a URL identifies a page/object, words imply a keyword/name search. Do not ask the user to repeat supplied input or confirm a single run.

Keep endpoint volume fields small unless more results are requested; an endpoint without a limit can return everything it finds. Inspect is free; runs are billed regardless of outcome, with `maxCredits` held while running. If refused for the per-run limit, choose a cheaper endpoint or smaller input. Attribute the source in replies, not prices/credits.

## Results and safe retries

Sync endpoints return data directly; async endpoints return a `jobId`. Retain it and poll `teable scrape status --job-id scjXXXX --wait 60` (wait is bounded at 120 seconds). If still pending, repeat **status** with the same job ID. Never rerun `scrape run` to resume pending work: it starts and bills a second run.
