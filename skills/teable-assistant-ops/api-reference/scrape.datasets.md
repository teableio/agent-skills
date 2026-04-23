
# Scrape Tool — Dataset Reference

Fetch structured data from 44+ web platforms. Each dataset requires a `datasetId` identifier and an `inputs` object with the required fields.

## Usage

```
datasetId: "<datasetId>"
inputs: [{ "url": "https://...", ... }]
```

### Batch scrape (multiple URLs in one call)
```
datasetId: "<datasetId>"
inputs: [
  { "url": "https://example.com/page1" },
  { "url": "https://example.com/page2" },
  { "url": "https://example.com/page3" }
]
```

---

## E-Commerce

| Dataset ID | Description | Required Inputs |
|---|---|---|
| `amazon_product` | Amazon product data. URL must contain `/dp/`. | `url` |
| `amazon_product_reviews` | Amazon product reviews. URL must contain `/dp/`. | `url` |
| `amazon_product_search` | Amazon product search results. | `keyword`, `url` (Amazon domain) |
| `walmart_product` | Walmart product data. URL must contain `/ip/`. | `url` |
| `walmart_seller` | Walmart seller data. | `url` |
| `ebay_product` | eBay product data. | `url` |
| `homedepot_products` | HomeDepot product data. | `url` |
| `zara_products` | Zara product data. | `url` |
| `etsy_products` | Etsy product data. | `url` |
| `bestbuy_products` | BestBuy product data. | `url` |

## LinkedIn

| Dataset ID | Description | Required Inputs |
|---|---|---|
| `linkedin_person_profile` | LinkedIn person profile data. | `url` |
| `linkedin_company_profile` | LinkedIn company profile data. | `url` |
| `linkedin_job_listings` | LinkedIn job listings. | `url` |
| `linkedin_posts` | LinkedIn post data. URL must be a pulse or posts URL. | `url` |
| `linkedin_people_search` | LinkedIn people search. | `url`, `first_name`, `last_name` |

## Business Intelligence

| Dataset ID | Description | Required Inputs |
|---|---|---|
| `crunchbase_company` | Crunchbase company data. | `url` |
| `zoominfo_company_profile` | ZoomInfo company profile data. | `url` |

## Instagram

| Dataset ID | Description | Required Inputs |
|---|---|---|
| `instagram_profiles` | Instagram profile data. | `url` |
| `instagram_posts` | Instagram post data. | `url` |
| `instagram_reels` | Instagram reel data. | `url` |
| `instagram_comments` | Instagram comments data. | `url` |

## Facebook

| Dataset ID | Description | Required Inputs |
|---|---|---|
| `facebook_posts` | Facebook post data. | `url` |
| `facebook_marketplace_listings` | Facebook marketplace listing data. | `url` |
| `facebook_company_reviews` | Facebook company reviews. | `url`, `num_of_reviews` |
| `facebook_events` | Facebook events data. | `url` |

## TikTok

| Dataset ID | Description | Required Inputs |
|---|---|---|
| `tiktok_profiles` | TikTok profile data. | `url` |
| `tiktok_posts` | TikTok post data. | `url` |
| `tiktok_shop` | TikTok shop product data. | `url` |
| `tiktok_comments` | TikTok comments data. | `url` |

## Google

| Dataset ID | Description | Required Inputs |
|---|---|---|
| `google_maps_reviews` | Google Maps reviews. Default `days_limit`: 3. | `url`, `days_limit` |
| `google_shopping` | Google Shopping product data. | `url` |
| `google_play_store` | Google Play Store app data. | `url` |

## App Stores

| Dataset ID | Description | Required Inputs |
|---|---|---|
| `apple_app_store` | Apple App Store app data. | `url` |

## X (Twitter)

| Dataset ID | Description | Required Inputs |
|---|---|---|
| `x_posts` | X/Twitter post data. | `url` |
| `x_profile_posts` | X/Twitter posts from a profile. Optional date filtering. | `url`, `start_date`, `end_date` |

## YouTube

| Dataset ID | Description | Required Inputs |
|---|---|---|
| `youtube_profiles` | YouTube profile data. | `url` |
| `youtube_comments` | YouTube comments. Default `num_of_comments`: 10. | `url`, `num_of_comments` |
| `youtube_videos` | YouTube video data. | `url` |

## News & Media

| Dataset ID | Description | Required Inputs |
|---|---|---|
| `reuter_news` | Reuters news article data. | `url` |

## Developer

| Dataset ID | Description | Required Inputs |
|---|---|---|
| `github_repository_file` | GitHub repository file data. | `url` |

## Finance

| Dataset ID | Description | Required Inputs |
|---|---|---|
| `yahoo_finance_business` | Yahoo Finance business data. | `url` |

## Real Estate

| Dataset ID | Description | Required Inputs |
|---|---|---|
| `zillow_properties_listing` | Zillow properties listing data. | `url` |

## Travel

| Dataset ID | Description | Required Inputs |
|---|---|---|
| `booking_hotel_listings` | Booking.com hotel listings data. | `url` |

## Reddit

| Dataset ID | Description | Required Inputs |
|---|---|---|
| `reddit_posts` | Reddit post data. | `url` |

---

## Examples

### Scrape a LinkedIn profile
```
datasetId: "linkedin_person_profile"
inputs: [{ "url": "https://www.linkedin.com/in/satyanadella/" }]
```

### Scrape an Amazon product
```
datasetId: "amazon_product"
inputs: [{ "url": "https://www.amazon.com/dp/B0CFLD1MQ1" }]
```

### Search Amazon products
```
datasetId: "amazon_product_search"
inputs: [{ "keyword": "wireless headphones", "url": "https://www.amazon.com" }]
```

### Scrape Instagram profile
```
datasetId: "instagram_profiles"
inputs: [{ "url": "https://www.instagram.com/natgeo/" }]
```

### Scrape X/Twitter profile posts with date range
```
datasetId: "x_profile_posts"
inputs: [{ "url": "https://x.com/elonmusk", "start_date": "2024-01-01", "end_date": "2024-01-31" }]
```

### Batch scrape multiple LinkedIn profiles
```
datasetId: "linkedin_person_profile"
inputs: [
  { "url": "https://www.linkedin.com/in/satyanadella/" },
  { "url": "https://www.linkedin.com/in/williamhgates/" }
]
```
