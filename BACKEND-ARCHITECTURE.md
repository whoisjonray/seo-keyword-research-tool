# SEO Keyword Research Tool - Backend Architecture

## Overview
This tool orchestrates three powerful APIs to provide comprehensive keyword research in 2-3 minutes:

1. **Firecrawl** - Website content extraction and understanding
2. **Perplexity AI** - Intelligent keyword generation and competitor research  
3. **DataForSEO** - Professional SEO metrics, search volumes, and SERP analysis

## Detailed Process Flow

### Step 1: Website Crawling (Firecrawl)
**Purpose**: Understand what the business is about by analyzing their website content.

```javascript
// API Endpoint: https://api.firecrawl.dev/v1/scrape
// Method: POST
```

**What it does:**
- Scrapes the target website with JavaScript rendering
- Extracts text from title, meta, h1-h3, and p tags
- Excludes navigation, footer, scripts, and code elements
- Returns clean markdown content
- Waits 2 seconds for dynamic content to load

**Output**: Clean, structured content about the business

### Step 2: AI Keyword Generation (Perplexity)
**Purpose**: Generate relevant keywords based on website content and business type.

```javascript
// API Endpoint: https://api.perplexity.ai/chat/completions
// Model: sonar (formerly llama-3.1-sonar-small-128k-online)
```

**The AI is prompted to:**
- Think like actual customers (not developers)
- Generate keywords across the customer journey
- Include various search intents:
  - Informational: "how to...", "what is..."
  - Commercial: "best...", "top...", "reviews"
  - Transactional: "buy...", "price...", "cost"
  - Navigational: brand searches
- Consider seasonal and location variations
- Mix short-tail (1-2 words) and long-tail (3+ words)

**Output**: 30-60 highly relevant seed keywords

### Step 3: Keyword Data Enrichment (DataForSEO)
Three parallel API calls fetch comprehensive SEO data:

#### 3a. Keyword Metrics API
```javascript
// Endpoint: /v3/keywords_data/google_ads/search_volume/live
```
- Search volume data
- Cost-per-click (CPC)
- Competition level
- Clickstream data
- Seasonal trends

#### 3b. Related Keywords API
```javascript
// Endpoint: /v3/keywords_data/google_ads/keywords_for_keywords/live
```
- Expands seed keywords
- Finds up to 1,000 related terms
- Ordered by search volume
- Includes long-tail variations

#### 3c. SERP Analysis API
```javascript
// Endpoint: /v3/serp/google/organic/live/advanced
```
- Top 5 results for each keyword
- Competitor domains ranking
- Content types (blog, product, video)
- SERP features (snippets, FAQs, etc.)

### Step 4: Intelligent Clustering & Analysis
The tool performs sophisticated analysis:

**Keyword Clustering:**
- Groups keywords by semantic similarity
- Identifies topic clusters
- Detects search intent patterns

**Difficulty Calculation:**
- Analyzes competitor domain authority
- Considers SERP competitiveness
- Estimates ranking difficulty (0-100)

**Commercial Value Scoring:**
- Higher CPC = higher commercial intent
- Competition level indicates business value
- Intent matching (transactional > commercial > informational)

### Step 5: AI Competitor Research (Perplexity)
**Purpose**: Deep dive into competitor strategies for each keyword cluster.

For each cluster, the AI:
- Identifies main competitors from SERP data
- Researches their content strategies
- Suggests differentiation approaches
- Provides specific tactics to outrank them

### Step 6: Report Generation
Produces comprehensive, actionable insights:

**Quick Wins Section:**
- Keywords with search volume 100-1000
- Low competition (difficulty < 30)
- Decent commercial value

**High-Value Targets:**
- High commercial intent keywords
- Strong CPC values
- Best revenue potential

**Keyword Clusters:**
- Grouped by topic/intent
- Total search volume per cluster
- Content strategy for each cluster

**Competitor Analysis:**
- Top competitors by visibility
- Their strengths and weaknesses
- Gaps you can exploit

**Action Plan:**
- Immediate actions (1-2 weeks)
- Medium-term strategy (1-3 months)
- Long-term goals (6-12 months)

## Technical Implementation Details

### API Authentication
- **Firecrawl**: Bearer token authentication
- **Perplexity**: Bearer token authentication
- **DataForSEO**: Basic auth (username:password base64 encoded)

### Error Handling
- Graceful fallbacks if any API fails
- Specific error messages for debugging
- Continues analysis with available data

### Performance Optimizations
- Parallel API calls using Promise.all()
- Limits on API requests to control costs
- Smart filtering to process only valuable keywords

### Cost Management
**Per Analysis Costs:**
- **Firecrawl**: ~$0.01 (1 page scrape)
- **Perplexity**: ~$0.02 (2 AI completions)
- **DataForSEO**: ~$0.50-1.00 (varies by keyword count)
- **Total**: ~$0.53-1.03 per complete analysis

**Cost Controls:**
- Limits seed keywords to top 50
- SERP analysis for top 15 keywords only
- Related keywords capped at 1,000

## Data Processing Pipeline

```
1. Website URL Input
   ↓
2. Firecrawl: Extract Content
   ↓
3. Content Cleaning (remove technical terms)
   ↓
4. Perplexity: Generate Seed Keywords
   ↓
5. DataForSEO: Enrich with Metrics (3 parallel calls)
   ↓
6. Keyword Clustering Algorithm
   ↓
7. Perplexity: Competitor Research
   ↓
8. Report Generation
   ↓
9. Interactive Results Display
```

## Key Algorithms

### Commercial Score Calculation
```javascript
score = (cpc * 0.4) + (competition * 0.3) + (intent_match * 0.3)
```

### Difficulty Estimation
```javascript
difficulty = (serp_competition * 0.5) + (domain_authority_avg * 0.3) + (content_depth * 0.2)
```

### Cluster Scoring
```javascript
cluster_value = (total_volume * 0.4) + (avg_commercial_score * 0.4) + (keyword_count * 0.2)
```

## Security Considerations
- API keys stored client-side only (not on server)
- HTTPS for all API communications
- No user data persisted server-side
- Rate limiting to prevent abuse

## Future Enhancement Opportunities
1. **Database Integration**: Store reports for historical tracking
2. **Bulk Analysis**: Process multiple websites
3. **Custom Location Targeting**: Beyond US market
4. **API Caching**: Reduce costs for repeated queries
5. **Export Formats**: CSV, PDF reports
6. **White-Label Options**: Custom branding

## Maintenance Notes
- Monitor API deprecations (e.g., Perplexity model changes)
- Update difficulty algorithms based on results
- Adjust cost limits based on usage patterns
- Keep technical term filter list updated

---

Last Updated: July 2025
Tool Version: 1.0.0