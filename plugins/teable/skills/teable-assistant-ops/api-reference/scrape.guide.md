# Scrape — Third-Party Data

Structured data from specialist sources, billed in credits per run: social platforms (LinkedIn, Instagram, TikTok, X, YouTube, Facebook, Reddit, Threads, Douyin, Xiaohongshu, Bilibili, Weibo...), e-commerce (Amazon, Walmart, eBay, TikTok Shop...), company and people enrichment, web / news / maps / shopping search, SEO and keyword data, finance and US real-estate data. The catalog grows every week, so search rather than assume something is missing.

## When to reach for it

Whenever the task needs facts or data from outside the project and the user's own accounts: mining data (leads, companies, people, products, prices, reviews, posts, search results) or verifying a fact that depends on live or platform data (someone's current role, a company's size or funding, a product's price, an account's followers). Search here before inventing sample data, saying the data is unavailable, or writing your own scraper. Not for what you already know reliably — every run is billed.

An ordinary public web page is not a scrape: fetch it directly, for free. When that fetch fails, is blocked, or cannot give the structured data needed, use scrape.

A connected app is not a scrape either: an app the user connected (Composio or OAuth) acts as their own account — their inbox, their posts, their CRM. Public data of a platform (someone's profile by URL, posts by keyword, search results) is a scrape even when the user has that app connected, and a request that says scrape / public data is one.

## The scraper menu's prompt

It names a platform, maybe a "Data type" (profiles, posts, videos, comments...), and ends with "What to scrape: …". That is the input, never a table name: a link is the page or object to read, a bare word or phrase is a keyword search on that platform; a company name with Profile means its company page, a person's name their profile or a people search. Run with it; do not ask the user to restate what they typed, and never ask to confirm a single run.

## Workflow

1. **Search** — `scrape-search`
   - By platform (CLI: `teable scrape search --platform <id> [--type <type>]`): `platform` is a catalog id such as `youtube`, `linkedin`, `company-enrichment` (its English label works too); `type` is one of profile, posts, videos, comments, channel, company, jobs, search, hashtag, followers, products, reviews, ads, transcript, music, places, news, events, shop. Lists that platform's endpoints of that kind, every source side by side, each with its `requiredInputs` and `optionalInputs`.
   - By relevance (CLI: `teable scrape search --query <q> --use-case <request>`): `query` is platform and data type, e.g. `"linkedin person profile"`, `"tiktok videos by hashtag"`; `useCase` the user's request in their own words, with its subject. Low relevance on one page is not proof the data is unavailable: search again with how a source would describe it.
   - Choose by fit: the endpoint whose required inputs are what the user gave (`url` for a link; `query`, `name` or `keyword` for words) and whose output carries the fields the user needs; of those that fit equally, the cheaper.
   - A request that names a source ("use Bright Data") pins that source; one that names an endpoint id skips the search. When adding to a table that earlier runs filled, reuse their endpoint so the columns line up.
2. **Inspect** — `scrape-inspect` (CLI: `teable scrape inspect --endpoint-id <id>`), free
   - Only the one you will run. Returns `inputSchema` (JSON Schema), `sampleInput`, `maxCredits`, the source's `tags`, and `outputSchema` when the source publishes one.
   - Build the input from the schema exactly; never guess field names. Inspect a second endpoint only if the first cannot take the input.
3. **Run** — `scrape` (CLI: `teable scrape run --endpoint-id <id> --input '<json>'`)
   - `endpoint` from search, `input` one object matching the schema.
   - A sync endpoint answers with the data. An async one answers `{ pending: true, jobId }`: resume it with `scrape-status` (CLI: `teable scrape status --job-id <id> --wait 60`), never by running again.
   - The result names what ran (`source`, `name`): say which source the data came from, not what it cost.

## Limits

- `maxCredits` is the most one run can cost; it is held from the space while the run is in flight. A run is refused when the space cannot cover it, and refused outright when it is over the per-run limit (150 credits unless the deployment sets another): pick a cheaper endpoint or a smaller input, or say why neither works.
- Do not report prices or credits in your reply, and never ask the user to confirm a single run: the transcript shows what each run cost.
- Keep volume fields (`limit`, `count`, `max_results`, arrays of queries...) small unless the user asks for more; an endpoint without a limit field returns as many results as it finds.
- One run reads one input. For many items, run once per item.
- A run is billed whatever its outcome: never re-run the same input to retry a pending job.

## Example

```
scrape-search   query: "linkedin person profile"
                useCase: "Add the LinkedIn profile of linkedin.com/in/satyanadella to my CRM table"
scrape-inspect  endpoint: "scrapecreators/v1/linkedin/profile"
scrape          endpoint: "scrapecreators/v1/linkedin/profile"
                input: { "url": "https://www.linkedin.com/in/satyanadella" }
```
