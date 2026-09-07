# Scraping Guide

Use scraping for structured data from a supported platform page, not as a generic page fetcher. Fetch ordinary or unsupported pages directly.

> **Reference**: [scrape.datasets.md](../api-reference/scrape.datasets.md) — curated datasets and exact input shapes

## Dataset Selection

1. Match the target URL against the curated reference and use its stable dataset ID.
2. If no curated dataset matches, use `scrape search` with the platform name plus data type, then use the returned raw `gd_` dataset ID.
3. Preserve every returned input field and JSON type. Most datasets accept URL-only objects, but some require extra strings, numbers, or arrays.

Batch URLs only when they use the same dataset ID. This avoids separate billed runs and keeps each input shape consistent.

```bash
teable scrape search --query "glassdoor company reviews"
teable scrape run --dataset-id gd_XXXX --inputs '[{"url":"https://example.com/company"}]'
```

## Pending Results

A run waits up to 180 seconds. If it returns `{ "pending": true, "snapshotId": "..." }`, retain that ID, wait about 10 seconds, then check it with `scrape status`. Repeat until data or an error is returned.

```bash
teable scrape status --snapshot-id s_XXXX
```

**Never rerun `scrape run` for the same pending inputs**: that starts and bills a new scrape rather than resuming the existing one.
