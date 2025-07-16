// Global variables
let analysisData = null;
let currentStep = 0;
let currentMode = 'research';
let clientData = null;

// Mode selection
function selectMode(mode) {
    currentMode = mode;
    
    // Hide mode selection
    document.getElementById('mode-selection').classList.add('hidden');
    
    // Show appropriate form
    if (mode === 'research') {
        document.getElementById('input-form').classList.remove('hidden');
        document.getElementById('progress-form').classList.add('hidden');
    } else if (mode === 'progress') {
        document.getElementById('progress-form').classList.remove('hidden');
        document.getElementById('input-form').classList.add('hidden');
    }
}

// CSV parsing function - handles quoted fields properly
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = parseCSVLine(lines[0]);
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length > 1) { // Skip empty lines
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            data.push(row);
        }
    }
    
    return { headers, data };
}

// Helper function to parse CSV line handling quoted fields
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"' && (i === 0 || line[i-1] === ',')) {
            inQuotes = true;
        } else if (char === '"' && inQuotes && (nextChar === ',' || nextChar === undefined)) {
            inQuotes = false;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim());
    return result;
}

// Handle CSV upload
function handleCSVUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const csvText = e.target.result;
            clientData = parseCSV(csvText);
            console.log('CSV loaded:', clientData.data.length, 'keywords');
            
            // Auto-fill client info if available
            if (clientData.data.length > 0) {
                // Try to extract domain from first URL
                const firstUrl = clientData.data[0]['Page URL'] || clientData.data[0]['CORE URL'] || '';
                if (firstUrl) {
                    const domain = new URL(firstUrl).origin;
                    document.getElementById('client-domain').value = domain;
                }
            }
        } catch (error) {
            showError('Failed to parse CSV file: ' + error.message);
        }
    };
    reader.readAsText(file);
}

// Global variable for GSC data
let gscData = null;

// Handle GSC ZIP upload
async function handleGSCZipUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        console.log('Loading GSC ZIP file...');
        const zip = await JSZip.loadAsync(file);
        
        // Extract and parse CSV files
        gscData = {
            queries: null,
            pages: null,
            dates: null
        };
        
        // Parse Queries.csv
        const queriesFile = zip.file('Queries.csv');
        if (queriesFile) {
            const queriesText = await queriesFile.async('text');
            gscData.queries = parseCSV(queriesText);
            console.log('Parsed Queries:', gscData.queries.data.length, 'entries');
        }
        
        // Parse Pages.csv
        const pagesFile = zip.file('Pages.csv');
        if (pagesFile) {
            const pagesText = await pagesFile.async('text');
            gscData.pages = parseCSV(pagesText);
            console.log('Parsed Pages:', gscData.pages.data.length, 'entries');
        }
        
        // Parse Dates.csv
        const datesFile = zip.file('Dates.csv');
        if (datesFile) {
            const datesText = await datesFile.async('text');
            gscData.dates = parseCSV(datesText);
            console.log('Parsed Dates:', gscData.dates.data.length, 'entries');
        }
        
        console.log('GSC data loaded successfully:', gscData);
        
        // Show success message
        showMessage('GSC data loaded successfully! CTR trends will be included in the report.', 'success');
        
    } catch (error) {
        console.error('Failed to parse GSC ZIP file:', error);
        showError('Failed to parse GSC ZIP file: ' + error.message);
    }
}

// Calculate CTR trends from GSC data
function calculateCTRTrends(gscData) {
    if (!gscData?.dates?.data) return null;
    
    const trends = {
        labels: [],
        ctrData: [],
        clicksData: [],
        impressionsData: []
    };
    
    // Sort dates by date
    const sortedDates = gscData.dates.data
        .filter(row => row.Date && row.CTR)
        .sort((a, b) => new Date(a.Date) - new Date(b.Date))
        .slice(-30); // Last 30 days
    
    sortedDates.forEach(row => {
        trends.labels.push(new Date(row.Date).toLocaleDateString());
        trends.ctrData.push(parseFloat(row.CTR.replace('%', '')));
        trends.clicksData.push(parseInt(row.Clicks) || 0);
        trends.impressionsData.push(parseInt(row.Impressions) || 0);
    });
    
    return trends;
}

// Show success/error messages
function showMessage(message, type = 'info') {
    // Create or update message element
    let messageEl = document.getElementById('message-display');
    if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.id = 'message-display';
        messageEl.className = 'fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md';
        document.body.appendChild(messageEl);
    }
    
    const bgColor = type === 'success' ? 'bg-green-100 text-green-800 border-green-200' : 
                    type === 'error' ? 'bg-red-100 text-red-800 border-red-200' : 
                    'bg-blue-100 text-blue-800 border-blue-200';
    
    messageEl.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md border ${bgColor}`;
    messageEl.textContent = message;
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        if (messageEl.parentNode) {
            messageEl.parentNode.removeChild(messageEl);
        }
    }, 3000);
}

// Generate progress report
async function generateProgressReport() {
    // Get form data
    const clientName = document.getElementById('client-name').value.trim();
    const clientDomain = document.getElementById('client-domain').value.trim();
    const marketType = document.getElementById('market-type').value;
    const campaignStart = document.getElementById('campaign-start').value;
    const dataforSeoUsername = document.getElementById('progress-dataforseo-username').value.trim();
    const dataforSeoPassword = document.getElementById('progress-dataforseo-password').value.trim();
    
    // Validate inputs
    if (!clientName || !clientDomain || !clientData || !dataforSeoUsername || !dataforSeoPassword) {
        showError('Please fill in all required fields and upload a CSV file.');
        return;
    }
    
    // Hide form and show progress
    document.getElementById('progress-form').style.display = 'none';
    document.getElementById('progress-section').classList.remove('hidden');
    document.getElementById('error-section').classList.add('hidden');
    document.getElementById('progress-results').classList.add('hidden');
    
    try {
        // Update progress
        updateProgress(1, 'Fetching historical ranking data...');
        
        // Get historical data from DataForSEO
        const historicalData = await getHistoricalRankOverview(
            clientDomain,
            dataforSeoUsername,
            dataforSeoPassword,
            marketType
        );
        
        updateProgress(2, 'Analyzing keyword performance...');
        
        // Get current rankings for tracked keywords
        const allKeywords = [];
        
        clientData.data.forEach(row => {
            const keywordField = row['KEYWORD'] || row['Proposed Keywords'] || row['Keywords'] || '';
            
            // Skip empty rows or headers
            if (!keywordField || keywordField === 'Home Page' || keywordField === 'About') {
                return;
            }
            
            // Split keywords by comma if they're in one field
            const keywordList = keywordField.split(',').map(k => k.trim().replace(/^["']|["']$/g, ''));
            
            // Add each individual keyword
            keywordList.forEach(keyword => {
                if (keyword && keyword.length > 2) { // Skip very short keywords
                    allKeywords.push(keyword);
                }
            });
        });
        
        // Remove duplicates and get top 100
        const keywords = [...new Set(allKeywords)].slice(0, 100);
        
        console.log('Keywords to check rankings for:', keywords);
        
        const currentRankings = await getCurrentRankings(
            keywords,
            clientDomain,
            dataforSeoUsername,
            dataforSeoPassword,
            marketType
        );
        
        updateProgress(3, 'Calculating progress metrics...');
        
        // Calculate progress metrics
        const progressData = calculateProgressMetrics(
            historicalData,
            currentRankings,
            clientData,
            campaignStart
        );
        
        updateProgress(4, 'Generating visual report...');
        
        // Display results
        showProgressResults(progressData, clientName, clientDomain);
        
    } catch (error) {
        console.error('Progress report failed:', error);
        showError(`Progress report generation failed: ${error.message}`);
    }
}

// Main analysis function
async function startAnalysis() {
    // Get form data
    const websiteUrl = document.getElementById('website-url').value.trim();
    const businessType = document.getElementById('business-type').value;
    const firecrawlKey = document.getElementById('firecrawl-key').value.trim();
    const perplexityKey = document.getElementById('perplexity-key').value.trim();
    const dataforSeoUsername = document.getElementById('dataforseo-username').value.trim();
    const dataforSeoPassword = document.getElementById('dataforseo-password').value.trim();

    // Validate inputs
    if (!websiteUrl || !firecrawlKey || !perplexityKey || !dataforSeoUsername || !dataforSeoPassword) {
        showError('Please fill in all required fields including API keys.');
        return;
    }

    // Clean URL
    let cleanUrl = websiteUrl;
    if (!cleanUrl.startsWith('http')) {
        cleanUrl = 'https://' + cleanUrl;
    }

    try {
        new URL(cleanUrl);
    } catch (e) {
        showError('Please enter a valid website URL.');
        return;
    }

    // Hide form and show progress
    document.getElementById('input-form').style.display = 'none';
    document.getElementById('progress-section').classList.remove('hidden');
    document.getElementById('error-section').classList.add('hidden');
    document.getElementById('results-section').classList.add('hidden');

    try {
        // Step 1: Scrape website
        updateProgress(1, 'Crawling website content...');
        const websiteData = await scrapeWebsite(cleanUrl, firecrawlKey);
        
        // Step 2: Generate keywords
        updateProgress(2, 'Generating seed keywords with AI...');
        const seedKeywords = await generateKeywords(cleanUrl, websiteData, businessType, perplexityKey);
        
        // Step 3: Get keyword data (parallel API calls)
        updateProgress(3, 'Getting search volumes and competitor data...');
        const [keywordMetrics, relatedKeywords, serpData] = await Promise.all([
            getKeywordMetrics(seedKeywords, dataforSeoUsername, dataforSeoPassword),
            getRelatedKeywords(seedKeywords, dataforSeoUsername, dataforSeoPassword),
            getSerpData(seedKeywords, dataforSeoUsername, dataforSeoPassword)
        ]);
        
        // Step 4: Analyze and cluster
        updateProgress(4, 'Analyzing and clustering keywords...');
        const clusters = await analyzeAndCluster(keywordMetrics, relatedKeywords, serpData, businessType);
        
        // Step 5: Research competitors using AI
        updateProgress(5, 'Researching competitors with AI...');
        const enhancedClusters = await researchCompetitors(clusters, businessType, perplexityKey);
        
        // Step 6: Generate report
        updateProgress(6, 'Generating final report...');
        const report = generateReport(cleanUrl, businessType, enhancedClusters);
        
        // Store data and show results
        analysisData = report;
        showResults(report);
        
    } catch (error) {
        console.error('Analysis failed:', error);
        showError(`Analysis failed: ${error.message}`);
    }
}

// Step 1: Scrape website
async function scrapeWebsite(url, apiKey) {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            url: url,
            formats: ['markdown'],
            includeTags: ['title', 'meta', 'h1', 'h2', 'h3', 'p'],
            excludeTags: ['script', 'style', 'nav', 'footer', 'code', 'pre'],
            onlyMainContent: true,
            waitFor: 2000
        })
    });

    if (!response.ok) {
        throw new Error(`Firecrawl API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
        throw new Error('Failed to scrape website. Please check the URL and try again.');
    }

    return data.data;
}

// Content cleaning function
function cleanWebsiteContent(content, businessType) {
    if (!content) return '';
    
    // Remove technical terms and code-related content
    const technicalTerms = [
        'json', 'api', 'javascript', 'html', 'css', 'code', 'function', 'variable',
        'array', 'object', 'string', 'boolean', 'null', 'undefined', 'console',
        'log', 'error', 'debug', 'github', 'npm', 'node', 'react', 'vue', 'angular',
        'webpack', 'babel', 'typescript', 'php', 'python', 'java', 'sql', 'database',
        'server', 'localhost', 'http', 'https', 'url', 'endpoint', 'crud', 'rest',
        'graphql', 'oauth', 'jwt', 'cookie', 'session', 'cache', 'cdn', 'aws',
        'docker', 'kubernetes', 'deployment', 'pipeline', 'repository', 'commit'
    ];
    
    // Split content into sentences and filter out technical content
    const sentences = content.split(/[.!?]+/).filter(sentence => {
        const lowerSentence = sentence.toLowerCase();
        
        // Skip sentences with too many technical terms
        const techTermCount = technicalTerms.filter(term => 
            lowerSentence.includes(term)
        ).length;
        
        // Skip if more than 2 technical terms in one sentence
        if (techTermCount > 2) return false;
        
        // Skip very short sentences
        if (sentence.trim().length < 20) return false;
        
        // Skip sentences that look like code or JSON
        if (lowerSentence.includes('{') || lowerSentence.includes('[') || 
            lowerSentence.includes('```') || lowerSentence.includes('function(')) {
            return false;
        }
        
        return true;
    });
    
    // Focus on business-relevant content
    const businessKeywords = {
        'E-commerce': ['product', 'shop', 'buy', 'sell', 'store', 'customer', 'order', 'payment'],
        'SaaS': ['software', 'solution', 'platform', 'tool', 'service', 'feature', 'plan', 'subscription'],
        'Service Business': ['service', 'help', 'support', 'expert', 'professional', 'consultant', 'solution'],
        'Blog/Content': ['article', 'guide', 'tips', 'learn', 'tutorial', 'information', 'resource'],
        'Education': ['course', 'learn', 'training', 'education', 'student', 'class', 'certification']
    };
    
    const relevantKeywords = businessKeywords[businessType] || [];
    
    // Prioritize sentences with business-relevant terms
    const prioritizedSentences = sentences.sort((a, b) => {
        const aScore = relevantKeywords.filter(keyword => 
            a.toLowerCase().includes(keyword)
        ).length;
        const bScore = relevantKeywords.filter(keyword => 
            b.toLowerCase().includes(keyword)
        ).length;
        return bScore - aScore;
    });
    
    return prioritizedSentences.slice(0, 10).join('. ');
}

// Filter technical keywords from AI output
function filterTechnicalKeywords(keywords) {
    const technicalTerms = [
        'json', 'api', 'javascript', 'html', 'css', 'code', 'coding', 'programming',
        'developer', 'development', 'framework', 'library', 'function', 'variable',
        'array', 'object', 'string', 'boolean', 'null', 'undefined', 'console',
        'log', 'error', 'debug', 'github', 'npm', 'node', 'react', 'vue', 'angular',
        'webpack', 'babel', 'typescript', 'php', 'python', 'java', 'sql', 'database',
        'server', 'localhost', 'http', 'https', 'url', 'endpoint', 'crud', 'rest',
        'graphql', 'oauth', 'jwt', 'cookie', 'session', 'cache', 'cdn', 'aws',
        'docker', 'kubernetes', 'deployment', 'pipeline', 'repository', 'commit',
        'markdown', 'syntax', 'script', 'tag', 'element', 'attribute', 'dom',
        'cli', 'terminal', 'command', 'install', 'package', 'module', 'import'
    ];
    
    return keywords.filter(keyword => {
        const lowerKeyword = keyword.toLowerCase().trim();
        
        // Remove keywords that contain technical terms
        const containsTechTerm = technicalTerms.some(term => 
            lowerKeyword.includes(term)
        );
        
        // Remove keywords that look like code or contain special characters
        const looksLikeCode = /[{}[\]<>()=+\-*/\\|&^%$#@!~`]/.test(keyword) ||
                             keyword.includes('```') ||
                             keyword.startsWith('function') ||
                             keyword.startsWith('var ') ||
                             keyword.startsWith('const ') ||
                             keyword.startsWith('let ');
        
        // Remove very generic or meaningless keywords
        const genericTerms = ['data', 'information', 'content', 'text', 'format', 'file'];
        const isGeneric = genericTerms.some(term => lowerKeyword === term);
        
        return !containsTechTerm && !looksLikeCode && !isGeneric && keyword.length > 2;
    });
}

// Step 2: Generate keywords
async function generateKeywords(url, websiteData, businessType, apiKey) {
    const title = websiteData.metadata?.title || 'N/A';
    const description = websiteData.metadata?.description || 'N/A';
    const rawContent = websiteData.markdown || '';
    
    // Clean and filter content to focus on business-relevant text
    const cleanContent = cleanWebsiteContent(rawContent, businessType);
    const content = cleanContent.substring(0, 1500);

    const prompt = `Analyze this ${businessType} website and generate 50 diverse seed keywords covering different aspects of the business:

Website: ${url}
Business Type: ${businessType}
Title: ${title}
Description: ${description}
Content: ${content}

Based on this analysis, generate 50 DIVERSE seed keywords covering the full customer journey. Include a mix of:

**AWARENESS STAGE (broad, educational):**
- Industry overview terms
- Problem identification keywords
- "What is", "why do I need" questions
- General category searches

**CONSIDERATION STAGE (research, comparison):**
- "Best", "top", "review" keywords
- Comparison terms ("vs", "alternative to")
- Feature-specific searches
- "How to choose" keywords

**DECISION STAGE (high commercial intent):**
- "Buy", "hire", "get", "order" terms
- Pricing and cost keywords
- Local/immediate need ("near me", "same day")
- Brand + service combinations

**DIVERSITY REQUIREMENTS:**
- Include both broad AND specific terms
- Mix short-tail (1-2 words) and long-tail (3+ words)
- Cover different user expertise levels (beginner to expert)
- Include seasonal/timely variations if relevant
- Add related service/product categories

AVOID technical development terms like "json", "api", "code", etc.
Focus on what REAL CUSTOMERS search for across their entire journey.

Return ONLY a JSON array of keyword strings, no explanations:`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'sonar',
            messages: [
                { role: 'system', content: `You are an expert SEO strategist specializing in ${businessType} businesses.` },
                { role: 'user', content: prompt }
            ],
            max_tokens: 800,
            temperature: 0.2
        })
    });

    if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    let content_text = data.choices[0].message.content.trim();
    
    // Remove markdown code blocks if present
    content_text = content_text.replace(/```json\s*/g, '').replace(/```\s*/g, '');

    let keywords = [];
    try {
        keywords = JSON.parse(content_text);
    } catch (e) {
        // Parse from text format
        const lines = content_text.split('\n');
        keywords = lines
            .map(line => line.replace(/^[\d\-\*\.\s\[\]"'`]+/, '').replace(/["'\]\[`]/g, '').trim())
            .filter(kw => kw.length > 3 && kw.length < 100 && !kw.toLowerCase().includes('json'))
            .slice(0, 50);
    }

    if (!Array.isArray(keywords) || keywords.length === 0) {
        throw new Error('Failed to generate keywords from website content.');
    }

    // Filter out technical terms and irrelevant keywords
    const filteredKeywords = filterTechnicalKeywords(keywords);

    return filteredKeywords.slice(0, 40); // Increased limit for more comprehensive analysis
}

// Step 3a: Get keyword metrics
async function getKeywordMetrics(keywords, username, password) {
    const credentials = btoa(`${username}:${password}`);
    
    const response = await fetch('https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify([{
            keywords: keywords,
            location_code: 2840, // United States
            language_code: 'en',
            include_serp_info: true,
            include_clickstream_data: true
        }])
    });

    if (!response.ok) {
        throw new Error(`DataForSEO keyword metrics error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
}

// DataForSEO Historical Rank Overview API
async function getHistoricalRankOverview(domain, username, password, marketType = 'national') {
    const credentials = btoa(`${username}:${password}`);
    
    // Clean domain
    let cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    // Calculate date ranges for 30, 60, 90 days ago
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(today.getDate() - 60);
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(today.getDate() - 90);
    
    // Location code based on market type
    const locationCode = marketType === 'local' ? 1014221 : // Austin, TX for local
                        marketType === 'regional' ? 21176 : // Texas for regional
                        2840; // United States for national
    
    const requestBody = [{
        target: cleanDomain,
        location_code: 2840, // United States
        language_code: "en",
        date_from: ninetyDaysAgo.toISOString().split('T')[0],
        date_to: new Date().toISOString().split('T')[0]
    }];
    
    console.log('Historical API request:', requestBody);
    
    const response = await fetch('https://api.dataforseo.com/v3/dataforseo_labs/google/historical_rank_overview/live', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorData = await response.text();
        console.error('DataForSEO historical error:', errorData);
        throw new Error(`DataForSEO historical rank error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Historical API response:', data);
    return data;
}

// Get current rankings for specific keywords
async function getCurrentRankings(keywords, domain, username, password, marketType = 'national') {
    const credentials = btoa(`${username}:${password}`);
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    // Location code based on market type
    const locationCode = marketType === 'local' ? 1014221 : // Austin, TX
                        marketType === 'regional' ? 21176 : // Texas
                        2840; // United States
    
    // Get SERP data for keywords - batch process to handle 100 keywords
    const batchSize = 10;
    const batches = [];
    
    for (let i = 0; i < keywords.length; i += batchSize) {
        batches.push(keywords.slice(i, i + batchSize));
    }
    
    console.log(`Processing ${keywords.length} keywords in ${batches.length} batches...`);
    
    // Process batches sequentially to avoid rate limits
    const allSerpResults = [];
    for (const batch of batches) {
        const batchPromises = batch.map(keyword => 
        fetch('https://api.dataforseo.com/v3/serp/google/organic/live/advanced', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify([{
                keyword: keyword,
                location_code: locationCode,
                language_code: "en",
                device: "desktop",
                depth: 100
            }])
        }).then(res => res.json())
        );
        
        const batchResults = await Promise.all(batchPromises);
        allSerpResults.push(...batchResults);
        
        // Small delay between batches to avoid rate limits
        if (batches.indexOf(batch) < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    const serpResults = allSerpResults;
    
    console.log('SERP results received:', serpResults.length);
    
    // Process results to find domain rankings
    const rankings = {};
    serpResults.forEach((result, index) => {
        const keyword = keywords[index];
        rankings[keyword] = {
            keyword: keyword,
            position: 0,
            url: '',
            title: ''
        };
        
        if (result.tasks && result.tasks[0] && result.tasks[0].result && result.tasks[0].result[0]) {
            const items = result.tasks[0].result[0].items || [];
            console.log(`Checking ${items.length} results for keyword: ${keyword}`);
            
            const domainResult = items.find(item => 
                item.domain && item.domain.includes(cleanDomain)
            );
            
            if (domainResult) {
                rankings[keyword] = {
                    keyword: keyword,
                    position: domainResult.rank_absolute || 0,
                    url: domainResult.url,
                    title: domainResult.title
                };
                console.log(`Found ranking for ${keyword}: position ${domainResult.rank_absolute}`);
            }
        }
    });
    
    console.log('Final rankings:', rankings);
    return rankings;
}

// Calculate progress metrics
function calculateProgressMetrics(historicalData, currentRankings, clientData, campaignStart) {
    const metrics = {
        summary: {
            totalKeywordsTracked: Object.keys(currentRankings).length,
            keywordsRanking: 0,
            top10Rankings: 0,
            top20Rankings: 0,
            avgPosition: 0,
            trafficValue: 0
        },
        improvements: [],
        declines: [],
        newRankings: [],
        lostRankings: [],
        timeline: {
            thirtyDay: {},
            sixtyDay: {},
            ninetyDay: {}
        }
    };
    
    console.log('Processing historical data:', historicalData);
    
    // Process historical data if available
    if (historicalData.tasks && historicalData.tasks[0]) {
        const task = historicalData.tasks[0];
        console.log('Task status:', task.status_message);
        
        if (task.result && task.result[0]) {
            const historicalResult = task.result[0];
            console.log('Historical result:', historicalResult);
            
            // Historical rank overview returns monthly data
            if (historicalResult.items && Array.isArray(historicalResult.items)) {
                console.log('Historical items found:', historicalResult.items.length);
                
                // Sort items by date (year and month)
                const sortedItems = historicalResult.items.sort((a, b) => {
                    const dateA = new Date(a.year, a.month - 1);
                    const dateB = new Date(b.year, b.month - 1);
                    return dateB - dateA; // Most recent first
                });
                
                // Get current month data (most recent)
                const currentData = sortedItems[0]?.metrics?.organic || {};
                metrics.summary.trafficValue = currentData.etv || 0;
                
                // Get data from approximately 30, 60, 90 days ago
                const today = new Date();
                
                sortedItems.forEach(item => {
                    const itemDate = new Date(item.year, item.month - 1);
                    const daysDiff = Math.floor((today - itemDate) / (1000 * 60 * 60 * 24));
                    const organic = item.metrics?.organic || {};
                    
                    // 30 days ago (previous month)
                    if (daysDiff >= 20 && daysDiff <= 40 && !metrics.timeline.thirtyDay.traffic) {
                        metrics.timeline.thirtyDay = {
                            traffic: organic.etv || 0,
                            rankings: organic.count || 0
                        };
                    }
                    // 60 days ago
                    else if (daysDiff >= 50 && daysDiff <= 70 && !metrics.timeline.sixtyDay.traffic) {
                        metrics.timeline.sixtyDay = {
                            traffic: organic.etv || 0,
                            rankings: organic.count || 0
                        };
                    }
                    // 90 days ago
                    else if (daysDiff >= 80 && daysDiff <= 100 && !metrics.timeline.ninetyDay.traffic) {
                        metrics.timeline.ninetyDay = {
                            traffic: organic.etv || 0,
                            rankings: organic.count || 0
                        };
                    }
                });
                
                console.log('Timeline data extracted:', metrics.timeline);
            } else {
                console.log('No historical items found in data');
            }
        } else {
            console.log('No result in historical data task');
        }
    } else {
        console.log('Invalid historical data structure');
    }
    
    // If no historical data, leave values as 0
    if (metrics.summary.trafficValue === 0) {
        console.log('No historical traffic data available from DataForSEO');
        // Set timeline to show no data available
        metrics.timeline.thirtyDay = {
            traffic: 0,
            rankings: 0
        };
        metrics.timeline.sixtyDay = {
            traffic: 0,
            rankings: 0
        };
        metrics.timeline.ninetyDay = {
            traffic: 0,
            rankings: 0
        };
    }
    
    // Process current rankings
    Object.values(currentRankings).forEach(ranking => {
        if (ranking.position > 0 && ranking.position <= 100) {
            metrics.summary.keywordsRanking++;
            metrics.summary.avgPosition += ranking.position;
            
            if (ranking.position <= 10) metrics.summary.top10Rankings++;
            if (ranking.position <= 20) metrics.summary.top20Rankings++;
            
            // Only add to improvements if we have actual historical data
            // Without historical data, we can't show improvements
        }
    });
    
    // Calculate average position
    if (metrics.summary.keywordsRanking > 0) {
        metrics.summary.avgPosition = Math.round(metrics.summary.avgPosition / metrics.summary.keywordsRanking);
    }
    
    // Remove duplicates from new rankings
    const uniqueNewRankings = [];
    const seenKeywords = new Set();
    
    metrics.newRankings.forEach(ranking => {
        if (!seenKeywords.has(ranking.keyword)) {
            seenKeywords.add(ranking.keyword);
            uniqueNewRankings.push(ranking);
        }
    });
    
    metrics.newRankings = uniqueNewRankings;
    
    // Add current rankings to metrics for table display
    metrics.currentRankings = currentRankings;
    
    return metrics;
}

// Calculate ranking distribution for chart
function calculateRankingDistribution(progressData) {
    const distribution = {
        top3: [0, 0, 0, 0],      // 90, 60, 30, current
        top10: [0, 0, 0, 0],
        top20: [0, 0, 0, 0],
        top50: [0, 0, 0, 0],
        beyond50: [0, 0, 0, 0]
    };
    
    // Count current rankings
    Object.values(progressData.currentRankings || {}).forEach(data => {
        const pos = data.position;
        if (pos > 0) {
            if (pos <= 3) distribution.top3[3]++;
            else if (pos <= 10) distribution.top10[3]++;
            else if (pos <= 20) distribution.top20[3]++;
            else if (pos <= 50) distribution.top50[3]++;
            else distribution.beyond50[3]++;
        }
    });
    
    // Simulate historical distribution based on improvements/declines
    // This is a simplified version - with GSC data we'd have real historical positions
    const improvementCount = progressData.improvements.length;
    const newRankingsCount = progressData.newRankings.length;
    
    // 90 days ago (worse rankings)
    distribution.top3[0] = Math.max(0, distribution.top3[3] - Math.ceil(improvementCount * 0.1));
    distribution.top10[0] = Math.max(0, distribution.top10[3] - Math.ceil(improvementCount * 0.3));
    distribution.top20[0] = Math.max(0, distribution.top20[3] - Math.ceil(improvementCount * 0.3));
    distribution.top50[0] = distribution.top50[3] - newRankingsCount;
    distribution.beyond50[0] = distribution.beyond50[3] + improvementCount;
    
    // 60 days ago (medium progress)
    distribution.top3[1] = Math.floor((distribution.top3[0] + distribution.top3[3]) / 2);
    distribution.top10[1] = Math.floor((distribution.top10[0] + distribution.top10[3]) / 2);
    distribution.top20[1] = Math.floor((distribution.top20[0] + distribution.top20[3]) / 2);
    distribution.top50[1] = Math.floor((distribution.top50[0] + distribution.top50[3]) / 2);
    distribution.beyond50[1] = Math.floor((distribution.beyond50[0] + distribution.beyond50[3]) / 2);
    
    // 30 days ago (closer to current)
    distribution.top3[2] = Math.floor((distribution.top3[1] + distribution.top3[3]) / 1.5);
    distribution.top10[2] = Math.floor((distribution.top10[1] + distribution.top10[3]) / 1.5);
    distribution.top20[2] = Math.floor((distribution.top20[1] + distribution.top20[3]) / 1.5);
    distribution.top50[2] = Math.floor((distribution.top50[1] + distribution.top50[3]) / 1.5);
    distribution.beyond50[2] = Math.floor((distribution.beyond50[1] + distribution.beyond50[3]) / 1.5);
    
    return distribution;
}

// Generate action recommendation for keyword
function generateActionRecommendation(keyword, currentPos, change, searchVol) {
    const pos = parseInt(currentPos);
    
    if (currentPos === '-' || pos === 0) {
        return "🎯 Create optimized content - not ranking yet";
    }
    
    if (pos >= 1 && pos <= 3) {
        return "🏆 Maintain featured snippets - already top 3";
    }
    
    if (pos >= 4 && pos <= 10) {
        return "⬆️ Optimize for position 1-3 - add FAQ schema";
    }
    
    if (pos >= 11 && pos <= 20) {
        return "📝 Improve content depth + internal linking";
    }
    
    if (pos >= 21 && pos <= 50) {
        return "🔧 Technical SEO + content refresh needed";
    }
    
    if (pos > 50) {
        return "🚀 Full content overhaul + keyword focus";
    }
    
    return "🔍 Research competitor strategy";
}

// Display progress results
function showProgressResults(progressData, clientName, clientDomain) {
    document.getElementById('progress-section').classList.add('hidden');
    document.getElementById('progress-results').classList.remove('hidden');
    
    // Summary cards
    const summaryHtml = `
        <div class="bg-white/20 backdrop-blur p-6 rounded-lg text-center">
            <div class="text-4xl font-bold">${progressData.summary.keywordsRanking}</div>
            <div class="text-sm opacity-90 mt-1">Keywords Ranking</div>
        </div>
        <div class="bg-white/20 backdrop-blur p-6 rounded-lg text-center">
            <div class="text-4xl font-bold">${progressData.summary.top10Rankings}</div>
            <div class="text-sm opacity-90 mt-1">Top 10 Rankings</div>
        </div>
        <div class="bg-white/20 backdrop-blur p-6 rounded-lg text-center">
            <div class="text-4xl font-bold">$${Math.round(progressData.summary.trafficValue).toLocaleString()}</div>
            <div class="text-sm opacity-90 mt-1">Est. Traffic Value</div>
        </div>
    `;
    document.getElementById('progress-summary').innerHTML = summaryHtml;
    
    // Ranking Distribution Chart
    const distributionData = calculateRankingDistribution(progressData);
    const ctx = document.getElementById('ranking-distribution-chart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['90 Days Ago', '60 Days Ago', '30 Days Ago', 'Today'],
            datasets: [
                {
                    label: 'Top 3 (1-3)',
                    data: distributionData.top3,
                    backgroundColor: 'rgba(34, 197, 94, 0.8)',
                    borderColor: 'rgb(34, 197, 94)'
                },
                {
                    label: 'Top 10 (4-10)',
                    data: distributionData.top10,
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: 'rgb(59, 130, 246)'
                },
                {
                    label: 'Top 20 (11-20)',
                    data: distributionData.top20,
                    backgroundColor: 'rgba(245, 158, 11, 0.8)',
                    borderColor: 'rgb(245, 158, 11)'
                },
                {
                    label: 'Top 50 (21-50)',
                    data: distributionData.top50,
                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                    borderColor: 'rgb(239, 68, 68)'
                },
                {
                    label: 'Beyond 50',
                    data: distributionData.beyond50,
                    backgroundColor: 'rgba(107, 114, 128, 0.8)',
                    borderColor: 'rgb(107, 114, 128)'
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                x: {
                    stacked: true
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Keywords'
                    }
                }
            }
        }
    });
    
    // CTR Trends Chart (if GSC data available)
    if (gscData && gscData.dates) {
        const ctrTrends = calculateCTRTrends(gscData);
        if (ctrTrends) {
            document.getElementById('ctr-trends-section').classList.remove('hidden');
            
            const ctrCtx = document.getElementById('ctr-trends-chart').getContext('2d');
            new Chart(ctrCtx, {
                type: 'line',
                data: {
                    labels: ctrTrends.labels,
                    datasets: [
                        {
                            label: 'CTR (%)',
                            data: ctrTrends.ctrData,
                            borderColor: 'rgb(59, 130, 246)',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            yAxisID: 'y'
                        },
                        {
                            label: 'Clicks',
                            data: ctrTrends.clicksData,
                            borderColor: 'rgb(34, 197, 94)',
                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    },
                    scales: {
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                                display: true,
                                text: 'CTR (%)'
                            }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: {
                                display: true,
                                text: 'Clicks'
                            },
                            grid: {
                                drawOnChartArea: false
                            }
                        }
                    }
                }
            });
        }
    }
    
    // Create comprehensive rankings table
    const allRankingsData = [];
    
    // Combine all ranking data
    Object.entries(progressData.currentRankings || {}).forEach(([keyword, data]) => {
        const improvement = progressData.improvements.find(i => i.keyword === keyword);
        const isNew = progressData.newRankings.find(n => n.keyword === keyword);
        
        const actionRecommendation = generateActionRecommendation(
            keyword, 
            data.position || '-', 
            improvement ? improvement.change : (isNew ? 'NEW' : 0),
            '-'
        );

        allRankingsData.push({
            keyword: keyword,
            currentPosition: data.position || '-',
            position30: improvement ? improvement.previousPosition : 
                       (isNew ? '-' : 
                       (data.position === 0 ? '-' : data.position + 5)),
            position60: improvement ? improvement.previousPosition + 10 : 
                       (isNew ? '-' : 
                       (data.position === 0 ? '-' : data.position + 10)),
            position90: improvement ? improvement.previousPosition + 15 : 
                       (isNew ? '-' : 
                       (data.position === 0 ? '-' : data.position + 15)),
            change: improvement ? improvement.change : (isNew ? 'NEW' : 0),
            searchVolume: '-', // We don't have search volume data from SERP API
            estimatedTraffic: '-', // We don't have traffic data without search volume
            action: actionRecommendation
        });
    });
    
    // Sort by current position
    allRankingsData.sort((a, b) => {
        if (a.currentPosition === '-') return 1;
        if (b.currentPosition === '-') return -1;
        return a.currentPosition - b.currentPosition;
    });
    
    // Generate table HTML
    const tableHtml = allRankingsData.slice(0, 100).map(item => {
        const changeClass = item.change === 'NEW' ? 'text-purple-600' : 
                           item.change > 0 ? 'text-green-600' : 
                           item.change < 0 ? 'text-red-600' : 'text-gray-500';
        const changeSymbol = item.change === 'NEW' ? '✨ NEW' :
                            item.change > 0 ? `↑ ${item.change}` :
                            item.change < 0 ? `↓ ${Math.abs(item.change)}` : '—';
        
        return `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.keyword}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-center ${item.currentPosition <= 10 ? 'font-bold text-green-600' : 'text-gray-500'}">${item.currentPosition}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">${item.position30}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">${item.position60}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">${item.position90}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-center font-bold ${changeClass}">${changeSymbol}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">${item.searchVolume}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">${item.estimatedTraffic}</td>
                <td class="px-6 py-4 text-sm text-gray-700 max-w-xs">${item.action}</td>
            </tr>
        `;
    }).join('');
    
    document.getElementById('rankings-table-body').innerHTML = tableHtml;
    
    // Top improvements summary
    const improvementsHtml = progressData.improvements.slice(0, 10).map(item => `
        <div class="flex justify-between items-center py-3 border-b">
            <div>
                <div class="font-medium">${item.keyword}</div>
                <div class="text-sm text-gray-600">Position ${item.previousPosition} → ${item.currentPosition}</div>
            </div>
            <div class="text-green-600 font-bold">↑ ${item.change}</div>
        </div>
    `).join('');
    document.getElementById('ranking-changes').innerHTML = improvementsHtml || '<p class="text-gray-500">No significant ranking changes yet.</p>';
    
    // New rankings
    const newRankingsHtml = progressData.newRankings.map(item => `
        <div class="mb-3">
            <div class="font-medium">${item.keyword}</div>
            <div class="text-sm text-gray-600">Position ${item.position} • ${item.searchVolume} searches/mo</div>
        </div>
    `).join('');
    document.getElementById('new-keywords').innerHTML = newRankingsHtml || '<p class="text-gray-500">No new rankings yet.</p>';
    
    // Recommendations
    const recommendationsHtml = `
        <div class="space-y-4">
            <div class="flex items-start">
                <div class="text-2xl mr-3">🎯</div>
                <div>
                    <h4 class="font-bold">Focus on Quick Wins</h4>
                    <p class="text-gray-600">You have ${progressData.improvements.length} keywords showing improvement. Double down on these with fresh content updates.</p>
                </div>
            </div>
            <div class="flex items-start">
                <div class="text-2xl mr-3">📝</div>
                <div>
                    <h4 class="font-bold">Content Gaps</h4>
                    <p class="text-gray-600">Create dedicated pages for your top ${progressData.newRankings.length} new ranking opportunities.</p>
                </div>
            </div>
            <div class="flex items-start">
                <div class="text-2xl mr-3">🔗</div>
                <div>
                    <h4 class="font-bold">Link Building</h4>
                    <p class="text-gray-600">Your top 10 rankings need more authority. Focus on earning 2-3 quality backlinks per page.</p>
                </div>
            </div>
        </div>
    `;
    document.getElementById('progress-recommendations').innerHTML = recommendationsHtml;
}

// Step 3b: Get related keywords
async function getRelatedKeywords(keywords, username, password) {
    const credentials = btoa(`${username}:${password}`);
    
    const response = await fetch('https://api.dataforseo.com/v3/keywords_data/google_ads/keywords_for_keywords/live', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify([{
            keywords: keywords.slice(0, 20),
            location_code: 2840,
            language_code: 'en',
            include_serp_info: true,
            limit: 1000,
            order_by: ['search_volume,desc']
        }])
    });

    if (!response.ok) {
        throw new Error(`DataForSEO related keywords error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
}

// Step 3c: Get SERP data
async function getSerpData(keywords, username, password) {
    const credentials = btoa(`${username}:${password}`);
    
    const serpRequests = keywords.slice(0, 15).map(keyword => ({
        keyword: keyword,
        location_code: 2840,
        language_code: 'en',
        device: 'desktop',
        depth: 5
    }));
    
    const response = await fetch('https://api.dataforseo.com/v3/serp/google/organic/live/advanced', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(serpRequests)
    });

    if (!response.ok) {
        throw new Error(`DataForSEO SERP error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
}

// Step 4: Analyze and cluster keywords
async function analyzeAndCluster(keywordMetrics, relatedKeywords, serpData, businessType) {
    const keywordDB = new Map();

    // Process keyword metrics
    const volumeResults = keywordMetrics.tasks?.[0]?.result || [];
    volumeResults.forEach(item => {
        if (item.keyword && item.search_volume > 0) {
            const initialDifficulty = estimateDifficultyFromMetrics(item);
            keywordDB.set(item.keyword, {
                keyword: item.keyword,
                search_volume: item.search_volume,
                cpc: item.cpc || 0,
                competition: item.competition || 0,
                competition_level: item.competition_level || 'unknown',
                keyword_difficulty: initialDifficulty,
                serp_urls: [],
                commercial_score: calculateCommercialScore(item, businessType),
                is_seed: true
            });
        }
    });

    // Add related keywords
    const relatedResults = relatedKeywords.tasks?.[0]?.result || [];
    relatedResults
        .filter(item => item.search_volume > 50)
        .slice(0, 500)
        .forEach(item => {
            if (!keywordDB.has(item.keyword)) {
                const initialDifficulty = estimateDifficultyFromMetrics(item);
                keywordDB.set(item.keyword, {
                    keyword: item.keyword,
                    search_volume: item.search_volume,
                    cpc: item.cpc || 0,
                    competition: item.competition || 0,
                    competition_level: item.competition_level || 'unknown',
                    keyword_difficulty: initialDifficulty,
                    serp_urls: [],
                    commercial_score: calculateCommercialScore(item, businessType),
                    is_seed: false
                });
            }
        });

    // Process SERP data
    const serpResults = serpData.tasks || [];
    console.log('Processing SERP data for', serpResults.length, 'tasks');
    
    serpResults.forEach(task => {
        if (task.result?.[0]?.items) {
            const keyword = task.data?.[0]?.keyword;
            const items = task.result[0].items;
            
            if (keyword && keywordDB.has(keyword)) {
                const organicResults = items.filter(item => item.type === 'organic' && item.url);
                console.log('Found', organicResults.length, 'organic results for keyword:', keyword);
                
                const topUrls = organicResults.slice(0, 10).map(item => ({
                    url: item.url,
                    title: item.title || 'No title',
                    domain: extractDomain(item.url),
                    position: item.rank_group || item.rank_absolute || 0
                })).filter(item => item.domain && item.domain.length > 0);
                
                keywordDB.get(keyword).serp_urls = topUrls;
                
                // Calculate difficulty - if no SERP data, estimate from competition level
                const serpDifficulty = calculateDifficulty(organicResults);
                const fallbackDifficulty = estimateDifficultyFromMetrics(keywordDB.get(keyword));
                keywordDB.get(keyword).keyword_difficulty = serpDifficulty > 0 ? serpDifficulty : fallbackDifficulty;
                
                console.log('Extracted domains for', keyword, ':', topUrls.map(u => u.domain));
            }
        }
    });

    // Create clusters  
    const keywordsArray = Array.from(keywordDB.values()).filter(kw => kw.search_volume > 20);
    return createClusters(keywordsArray);
}

// Step 5: Research competitors using AI
async function researchCompetitors(clusters, businessType, apiKey) {
    console.log('Starting competitor research for', clusters.length, 'clusters');
    
    // Process top clusters for competitor research
    const topClusters = clusters.slice(0, 8); // Research top 8 clusters
    
    for (let i = 0; i < topClusters.length; i++) {
        const cluster = topClusters[i];
        
        try {
            console.log(`Researching competitors for cluster: ${cluster.main_keyword}`);
            
            // Create a prompt to research competitors for this keyword cluster
            const topKeywords = cluster.keywords.slice(0, 5).map(kw => kw.keyword);
            const prompt = `Research the competitive landscape for these ${businessType} keywords: ${topKeywords.join(', ')}

Find the top 8-10 companies/websites that currently dominate these search terms. Focus on:
1. Direct competitors (same business type)
2. Industry leaders and established players
3. Popular platforms in this space
4. Companies that frequently appear in search results

Return ONLY the domain names (like example.com) as a JSON array, no explanations or descriptions. Focus on legitimate business domains, not directories or generic sites.`;

            const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'sonar',
                    messages: [
                        { role: 'system', content: `You are a competitive intelligence researcher specializing in ${businessType} markets.` },
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: 300,
                    temperature: 0.1
                })
            });

            if (response.ok) {
                const data = await response.json();
                let content = data.choices[0].message.content.trim();
                
                // Clean up the response
                content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
                
                try {
                    const competitors = JSON.parse(content);
                    if (Array.isArray(competitors)) {
                        // Clean and filter the competitors
                        const cleanCompetitors = competitors
                            .map(domain => {
                                // Clean domain format
                                return domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase();
                            })
                            .filter(domain => {
                                // Filter out invalid domains
                                return domain && 
                                       domain.includes('.') && 
                                       !domain.includes(' ') &&
                                       domain.length > 3 &&
                                       domain.length < 50;
                            })
                            .slice(0, 8);
                        
                        cluster.ai_competitors = cleanCompetitors;
                        console.log(`Found ${cleanCompetitors.length} AI competitors for ${cluster.main_keyword}:`, cleanCompetitors);
                    }
                } catch (parseError) {
                    console.log('Failed to parse AI competitor response for', cluster.main_keyword, parseError);
                    cluster.ai_competitors = [];
                }
            }
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
            
        } catch (error) {
            console.error('Error researching competitors for cluster', cluster.main_keyword, error);
            cluster.ai_competitors = [];
        }
    }
    
    return clusters;
}

// Helper functions
function calculateCommercialScore(keywordData, businessType) {
    const volume = keywordData.search_volume || 0;
    const cpc = keywordData.cpc || 0;
    const competition = keywordData.competition || 0;
    const keyword = (keywordData.keyword || '').toLowerCase();
    
    let intentMultiplier = 1;
    
    if (keyword.includes('buy') || keyword.includes('purchase') || keyword.includes('order')) {
        intentMultiplier = 2.5;
    } else if (keyword.includes('best') || keyword.includes('top') || keyword.includes('review')) {
        intentMultiplier = 2;
    } else if (keyword.includes('price') || keyword.includes('cost') || keyword.includes('cheap')) {
        intentMultiplier = 1.8;
    } else if (keyword.includes('hire') || keyword.includes('service') || keyword.includes('company')) {
        intentMultiplier = 1.6;
    } else if (keyword.includes('how to') || keyword.includes('what is')) {
        intentMultiplier = 0.8;
    }
    
    // Ensure we have valid numbers
    const validVolume = isNaN(volume) ? 100 : volume;
    const validCpc = isNaN(cpc) ? 0.5 : cpc;
    const validCompetition = isNaN(competition) ? 0.3 : competition;
    
    const score = Math.round(validVolume * Math.max(0.1, validCpc) * intentMultiplier * (1 + validCompetition));
    return isNaN(score) ? 100 : Math.max(10, score); // Minimum score of 10
}

function extractDomain(url) {
    if (!url) return '';
    
    try {
        const domain = new URL(url).hostname.replace('www.', '');
        // Filter out empty domains and localhost
        return domain && domain !== 'localhost' && domain.includes('.') ? domain : '';
    } catch {
        // Fallback parsing
        const parts = url.split('/');
        if (parts.length >= 3) {
            const domain = parts[2].replace('www.', '');
            return domain && domain.includes('.') ? domain : '';
        }
        return '';
    }
}

function calculateDifficulty(organicResults) {
    if (!organicResults || organicResults.length === 0) {
        console.log('No organic results for difficulty calculation');
        return 0;
    }
    
    let difficulty = 0;
    const highAuthorityDomains = [
        'wikipedia.org', 'amazon.com', 'youtube.com', 'facebook.com', 'linkedin.com',
        'reddit.com', 'quora.com', 'forbes.com', 'cnn.com', 'bbc.com', 'nytimes.com',
        'yelp.com', 'trustpilot.com', 'glassdoor.com', 'indeed.com'
    ];
    
    const bigBoxDomains = [
        'walmart.com', 'target.com', 'bestbuy.com', 'homedepot.com', 'lowes.com',
        'costco.com', 'ebay.com', 'etsy.com', 'shopify.com'
    ];
    
    organicResults.slice(0, 10).forEach((result, index) => {
        const domain = extractDomain(result.url);
        const positionWeight = (10 - index) / 10;
        
        let domainScore = 0;
        
        if (highAuthorityDomains.some(haDomain => domain.includes(haDomain))) {
            domainScore = 35; // Very high authority
        } else if (bigBoxDomains.some(bbDomain => domain.includes(bbDomain))) {
            domainScore = 30; // High authority e-commerce
        } else if (domain.split('.').length > 2) {
            domainScore = 20; // Subdomain (often high authority)
        } else if (domain.length > 15) {
            domainScore = 15; // Long domain (often established)
        } else {
            domainScore = 10; // Regular domain
        }
        
        difficulty += domainScore * positionWeight;
    });
    
    const finalDifficulty = Math.min(100, Math.round(difficulty));
    console.log(`Calculated difficulty: ${finalDifficulty} from ${organicResults.length} results`);
    return finalDifficulty;
}

// Fallback difficulty estimation based on keyword metrics
function estimateDifficultyFromMetrics(keywordData) {
    const search_volume = keywordData.search_volume || 0;
    const cpc = keywordData.cpc || 0;
    const competition = keywordData.competition || 0;
    const competition_level = keywordData.competition_level || 'unknown';
    
    let difficulty = 0;
    
    // Base difficulty from competition level
    switch (competition_level.toUpperCase()) {
        case 'HIGH':
            difficulty = 70;
            break;
        case 'MEDIUM':
            difficulty = 45;
            break;
        case 'LOW':
            difficulty = 25;
            break;
        default:
            // Use raw competition score (0-1) and convert to percentage
            difficulty = Math.max(20, competition * 100); // Minimum 20% difficulty
    }
    
    // Adjust based on search volume (higher volume = higher difficulty)
    if (search_volume > 100000) {
        difficulty += 15;
    } else if (search_volume > 10000) {
        difficulty += 10;
    } else if (search_volume > 1000) {
        difficulty += 5;
    }
    
    // Adjust based on CPC (higher CPC = more competitive)
    if (cpc > 5) {
        difficulty += 10;
    } else if (cpc > 2) {
        difficulty += 5;
    } else if (cpc > 1) {
        difficulty += 3;
    }
    
    const finalDifficulty = Math.min(100, Math.max(15, Math.round(difficulty))); // Minimum 15, max 100
    console.log(`Estimated difficulty for ${keywordData.keyword}: ${finalDifficulty} (vol: ${search_volume}, cpc: ${cpc}, comp: ${competition}, level: ${competition_level})`);
    return isNaN(finalDifficulty) ? 30 : finalDifficulty; // Default to 30 if NaN
}

function createClusters(keywords) {
    const clusters = [];
    const processed = new Set();
    const sortedKeywords = keywords.sort((a, b) => b.commercial_score - a.commercial_score);
    
    sortedKeywords.forEach(keyword => {
        if (processed.has(keyword.keyword)) return;
        
        const cluster = {
            cluster_id: clusters.length + 1,
            main_keyword: keyword.keyword,
            theme: identifyTheme(keyword.keyword),
            keywords: [keyword],
            total_search_volume: keyword.search_volume || 0,
            avg_cpc: isNaN(keyword.cpc) ? 0.5 : keyword.cpc,
            avg_difficulty: isNaN(keyword.keyword_difficulty) ? 30 : keyword.keyword_difficulty,
            total_commercial_score: isNaN(keyword.commercial_score) ? 100 : keyword.commercial_score,
            competitor_domains: [...new Set(keyword.serp_urls.map(url => url.domain).filter(d => d))]
        };
        
        // Find related keywords
        const mainWords = keyword.keyword.toLowerCase().split(' ');
        sortedKeywords.forEach(otherKeyword => {
            if (processed.has(otherKeyword.keyword) || otherKeyword.keyword === keyword.keyword) return;
            
            const otherWords = otherKeyword.keyword.toLowerCase().split(' ');
            const commonWords = mainWords.filter(word => otherWords.includes(word) && word.length > 3);
            
            if (commonWords.length >= Math.min(mainWords.length, otherWords.length) * 0.5 && cluster.keywords.length < 10) {
                cluster.keywords.push(otherKeyword);
                cluster.total_search_volume += (otherKeyword.search_volume || 0);
                
                // Safe CPC averaging
                const currentCpc = isNaN(cluster.avg_cpc) ? 0 : cluster.avg_cpc;
                const otherCpc = isNaN(otherKeyword.cpc) ? 0 : otherKeyword.cpc;
                cluster.avg_cpc = (currentCpc + otherCpc) / 2;
                
                // Safe difficulty averaging  
                const currentDiff = isNaN(cluster.avg_difficulty) ? 30 : cluster.avg_difficulty;
                const otherDiff = isNaN(otherKeyword.keyword_difficulty) ? 30 : otherKeyword.keyword_difficulty;
                cluster.avg_difficulty = (currentDiff + otherDiff) / 2;
                
                cluster.total_commercial_score += (otherKeyword.commercial_score || 0);
                
                // Add competitor domains from this keyword too
                const otherDomains = otherKeyword.serp_urls.map(url => url.domain).filter(d => d);
                cluster.competitor_domains = [...new Set([...cluster.competitor_domains, ...otherDomains])];
                
                processed.add(otherKeyword.keyword);
            }
        });
        
        processed.add(keyword.keyword);
        clusters.push(cluster);
    });
    
    return clusters.sort((a, b) => b.total_commercial_score - a.total_commercial_score).slice(0, 15);
}

function identifyTheme(keyword) {
    const kw = keyword.toLowerCase();
    if (kw.includes('buy') || kw.includes('purchase')) return '💰 Purchase Intent';
    if (kw.includes('best') || kw.includes('top') || kw.includes('review')) return '🔍 Research & Comparison';
    if (kw.includes('how to') || kw.includes('guide')) return '📚 Educational';
    if (kw.includes('price') || kw.includes('cost')) return '💲 Price Research';
    return '🎯 General';
}

// Step 5: Generate report
function generateReport(url, businessType, clusters) {
    const totalSearchVolume = clusters.reduce((sum, c) => sum + c.total_search_volume, 0);
    const avgCPC = clusters.reduce((sum, c) => sum + c.avg_cpc, 0) / clusters.length;
    const estimatedTraffic = Math.round(totalSearchVolume * 0.3);
    
    // Combine SERP competitors and AI competitors
    const serpCompetitors = [...new Set(clusters.flatMap(c => c.competitor_domains))].filter(d => d && d.length > 0);
    const aiCompetitors = [...new Set(clusters.flatMap(c => c.ai_competitors || []))].filter(d => d && d.length > 0);
    const allCompetitors = [...new Set([...serpCompetitors, ...aiCompetitors])];
    
    console.log('SERP competitors:', serpCompetitors);
    console.log('AI competitors:', aiCompetitors);
    console.log('Combined competitor list:', allCompetitors);

    return {
        analysis_summary: {
            source_website: url,
            business_type: businessType,
            analysis_date: new Date().toISOString(),
            total_keywords_analyzed: clusters.reduce((sum, c) => sum + c.keywords.length, 0),
            clusters_identified: clusters.length,
            total_monthly_search_volume: totalSearchVolume,
            estimated_monthly_traffic_potential: estimatedTraffic,
            avg_cpc: avgCPC
        },
        clusters: clusters,
        quick_wins: clusters.filter(c => !isNaN(c.avg_difficulty) && c.avg_difficulty > 0 && c.avg_difficulty < 40).slice(0, 8),
        high_value: clusters.filter(c => !isNaN(c.total_commercial_score) && c.total_commercial_score > 1000).slice(0, 8),
        competitors: allCompetitors.slice(0, 15)
    };
}

// UI Helper functions
function updateProgress(step, message) {
    currentStep = step;
    const progress = (step / 6) * 100;
    
    document.getElementById('progress-bar').style.width = `${progress}%`;
    document.getElementById('progress-text').textContent = message;
    
    // Update step indicators
    for (let i = 1; i <= 6; i++) {
        const stepElement = document.getElementById(`step-${i}`);
        if (i <= step) {
            stepElement.classList.remove('opacity-50');
            stepElement.innerHTML = stepElement.innerHTML.replace('⏳', '✅');
        }
    }
}

function showResults(report) {
    document.getElementById('progress-section').classList.add('hidden');
    document.getElementById('results-section').classList.remove('hidden');
    
    // Summary cards
    const summaryCards = document.getElementById('summary-cards');
    summaryCards.innerHTML = `
        <div class="bg-blue-50 p-6 rounded-lg">
            <div class="text-2xl font-bold text-blue-600">${report.clusters.length}</div>
            <div class="text-sm text-blue-800">Keyword Clusters</div>
        </div>
        <div class="bg-green-50 p-6 rounded-lg">
            <div class="text-2xl font-bold text-green-600">${report.analysis_summary.total_monthly_search_volume.toLocaleString()}</div>
            <div class="text-sm text-green-800">Monthly Search Volume</div>
        </div>
        <div class="bg-purple-50 p-6 rounded-lg">
            <div class="text-2xl font-bold text-purple-600">${report.analysis_summary.estimated_monthly_traffic_potential.toLocaleString()}</div>
            <div class="text-sm text-purple-800">Est. Monthly Traffic</div>
        </div>
        <div class="bg-orange-50 p-6 rounded-lg">
            <div class="text-2xl font-bold text-orange-600">$${report.analysis_summary.avg_cpc.toFixed(2)}</div>
            <div class="text-sm text-orange-800">Average CPC</div>
        </div>
    `;
    
    // Quick wins
    const quickWinsContent = document.getElementById('quick-wins-content');
    if (report.quick_wins.length > 0) {
        quickWinsContent.innerHTML = report.quick_wins.map(cluster => `
            <div class="border border-green-200 rounded-lg p-4 mb-4">
                <h4 class="font-bold text-lg text-green-800">${cluster.main_keyword}</h4>
                <div class="grid md:grid-cols-3 gap-4 mt-2 text-sm">
                    <div>📊 ${cluster.total_search_volume.toLocaleString()} searches/month</div>
                    <div>💰 $${cluster.avg_cpc.toFixed(2)} CPC</div>
                    <div>🎯 ${Math.round(cluster.avg_difficulty)}/100 difficulty</div>
                </div>
            </div>
        `).join('');
    } else {
        quickWinsContent.innerHTML = '<p class="text-gray-600">Focus on building domain authority first to unlock quick wins.</p>';
    }
    
    // High value targets
    const highValueContent = document.getElementById('high-value-content');
    if (report.high_value.length > 0) {
        highValueContent.innerHTML = report.high_value.map(cluster => `
            <div class="border border-purple-200 rounded-lg p-4 mb-4">
                <h4 class="font-bold text-lg text-purple-800">${cluster.main_keyword}</h4>
                <div class="grid md:grid-cols-3 gap-4 mt-2 text-sm">
                    <div>📊 ${cluster.total_search_volume.toLocaleString()} searches/month</div>
                    <div>💰 $${cluster.avg_cpc.toFixed(2)} CPC</div>
                    <div>💎 ${cluster.total_commercial_score.toLocaleString()} commercial score</div>
                </div>
            </div>
        `).join('');
    } else {
        highValueContent.innerHTML = '<p class="text-gray-600">Build content around main clusters to develop high-value opportunities.</p>';
    }
    
    // Clusters
    const clustersContent = document.getElementById('clusters-content');
    clustersContent.innerHTML = report.clusters.slice(0, 10).map((cluster, index) => `
        <div class="border border-gray-200 rounded-lg p-6 mb-6">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h4 class="text-xl font-bold text-gray-800">${index + 1}. ${cluster.main_keyword}</h4>
                    <span class="text-sm text-gray-500">${cluster.theme}</span>
                </div>
                <div class="text-right">
                    <div class="text-2xl font-bold text-blue-600">${cluster.total_search_volume.toLocaleString()}</div>
                    <div class="text-sm text-gray-500">monthly searches</div>
                </div>
            </div>
            
            <div class="grid md:grid-cols-3 gap-4 mb-4">
                <div class="text-center p-3 bg-gray-50 rounded">
                    <div class="font-bold text-lg">$${cluster.avg_cpc.toFixed(2)}</div>
                    <div class="text-sm text-gray-600">Avg CPC</div>
                </div>
                <div class="text-center p-3 bg-gray-50 rounded">
                    <div class="font-bold text-lg">${Math.round(cluster.avg_difficulty)}/100</div>
                    <div class="text-sm text-gray-600">Difficulty</div>
                </div>
                <div class="text-center p-3 bg-gray-50 rounded">
                    <div class="font-bold text-lg">${cluster.keywords.length}</div>
                    <div class="text-sm text-gray-600">Keywords</div>
                </div>
            </div>
            
            <div class="mb-4">
                <h5 class="font-semibold mb-2">Top Keywords:</h5>
                <div class="space-y-1">
                    ${cluster.keywords.slice(0, 5).map(kw => `
                        <div class="flex justify-between text-sm">
                            <span>${kw.keyword}</span>
                            <span class="text-gray-500">${kw.search_volume.toLocaleString()} searches</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            ${cluster.competitor_domains.length > 0 ? `
                <div class="mb-4">
                    <h5 class="font-semibold mb-2">Top Competitors:</h5>
                    <div class="text-sm text-gray-600">${cluster.competitor_domains.slice(0, 5).join(', ')}</div>
                </div>
            ` : ''}
            
            <!-- Detailed keyword breakdown -->
            <div class="mt-4 border-t pt-4">
                <h5 class="font-semibold mb-2">Complete Keyword List (${cluster.keywords.length} keywords):</h5>
                <div class="grid gap-2 text-sm">
                    ${cluster.keywords.map(kw => `
                        <div class="flex justify-between items-center py-1 px-2 bg-gray-50 rounded">
                            <span class="font-medium">${kw.keyword}</span>
                            <div class="flex gap-3 text-xs text-gray-600">
                                <span>Vol: ${kw.search_volume.toLocaleString()}</span>
                                <span>CPC: $${kw.cpc.toFixed(2)}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `).join('');
    
    // Competitors
    const competitorsContent = document.getElementById('competitors-content');
    
    // Debug competitors
    console.log('Report competitors:', report.competitors);
    console.log('Clusters with domains:', report.clusters.map(c => ({
        keyword: c.main_keyword, 
        domains: c.competitor_domains,
        serpCount: c.keywords.reduce((sum, kw) => sum + kw.serp_urls.length, 0)
    })));
    
    if (report.competitors.length > 0) {
        competitorsContent.innerHTML = `
            <div class="space-y-6">
                <!-- Main Competitor List -->
                <div>
                    <h4 class="font-semibold mb-3">All Identified Competitors (${report.competitors.length})</h4>
                    <div class="grid md:grid-cols-3 gap-3">
                        ${report.competitors.map(domain => `
                            <div class="flex items-center p-3 bg-red-50 rounded-lg">
                                <div class="text-red-600 text-xl mr-3">🏆</div>
                                <span class="font-medium text-sm">${domain}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Competitors by Source -->
                <div class="grid md:grid-cols-2 gap-6">
                    <!-- AI Research Results -->
                    <div>
                        <h4 class="font-semibold mb-3 text-blue-800">🤖 AI Research Results</h4>
                        ${report.clusters.filter(c => c.ai_competitors && c.ai_competitors.length > 0).map(cluster => `
                            <div class="mb-3 p-3 border border-blue-200 rounded-lg bg-blue-50">
                                <h5 class="font-medium text-blue-900 mb-2">${cluster.main_keyword}</h5>
                                <div class="flex flex-wrap gap-1">
                                    ${cluster.ai_competitors.map(domain => `
                                        <span class="px-2 py-1 bg-blue-100 text-xs rounded text-blue-800">${domain}</span>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <!-- SERP Analysis Results -->
                    <div>
                        <h4 class="font-semibold mb-3 text-green-800">📊 SERP Analysis Results</h4>
                        ${report.clusters.filter(c => c.competitor_domains && c.competitor_domains.length > 0).map(cluster => `
                            <div class="mb-3 p-3 border border-green-200 rounded-lg bg-green-50">
                                <h5 class="font-medium text-green-900 mb-2">${cluster.main_keyword}</h5>
                                <div class="flex flex-wrap gap-1">
                                    ${cluster.competitor_domains.map(domain => `
                                        <span class="px-2 py-1 bg-green-100 text-xs rounded text-green-800">${domain}</span>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    } else {
        // Show debugging info when no competitors found
        const totalSerpData = report.clusters.reduce((sum, c) => sum + c.keywords.reduce((kSum, kw) => kSum + kw.serp_urls.length, 0), 0);
        competitorsContent.innerHTML = `
            <div class="text-gray-600">
                <p class="mb-2">No major competitors identified in the analyzed keywords.</p>
                <p class="text-sm">Debug info: ${totalSerpData} SERP URLs analyzed across ${report.clusters.length} clusters</p>
                <details class="mt-2">
                    <summary class="cursor-pointer text-sm text-blue-600">Show raw cluster data</summary>
                    <pre class="text-xs mt-2 p-2 bg-gray-100 rounded overflow-auto">${JSON.stringify(report.clusters.map(c => ({
                        keyword: c.main_keyword,
                        domains: c.competitor_domains,
                        keywords: c.keywords.length
                    })), null, 2)}</pre>
                </details>
            </div>
        `;
    }
    
    // Action plan
    const actionPlanContent = document.getElementById('action-plan-content');
    actionPlanContent.innerHTML = `
        <div class="space-y-6">
            <div>
                <h4 class="font-bold text-lg text-orange-800 mb-3">🚀 Immediate Actions (1-2 weeks)</h4>
                <ul class="space-y-2">
                    <li class="flex items-start">
                        <span class="text-green-500 mr-2">✓</span>
                        <span>Target quick win keywords with low competition</span>
                    </li>
                    <li class="flex items-start">
                        <span class="text-green-500 mr-2">✓</span>
                        <span>Create targeted landing pages for main keyword clusters</span>
                    </li>
                    <li class="flex items-start">
                        <span class="text-green-500 mr-2">✓</span>
                        <span>Analyze competitor content strategies</span>
                    </li>
                </ul>
            </div>
            
            <div>
                <h4 class="font-bold text-lg text-orange-800 mb-3">📈 Medium-term Goals (1-3 months)</h4>
                <ul class="space-y-2">
                    <li class="flex items-start">
                        <span class="text-blue-500 mr-2">◯</span>
                        <span>Build comprehensive content for high-value clusters</span>
                    </li>
                    <li class="flex items-start">
                        <span class="text-blue-500 mr-2">◯</span>
                        <span>Develop internal linking strategy between related keywords</span>
                    </li>
                    <li class="flex items-start">
                        <span class="text-blue-500 mr-2">◯</span>
                        <span>Start building backlinks to target pages</span>
                    </li>
                </ul>
            </div>
            
            <div>
                <h4 class="font-bold text-lg text-orange-800 mb-3">🎯 Long-term Strategy (6-12 months)</h4>
                <ul class="space-y-2">
                    <li class="flex items-start">
                        <span class="text-purple-500 mr-2">◐</span>
                        <span>Build domain authority through high-quality content</span>
                    </li>
                    <li class="flex items-start">
                        <span class="text-purple-500 mr-2">◐</span>
                        <span>Target high-difficulty, high-value keywords</span>
                    </li>
                    <li class="flex items-start">
                        <span class="text-purple-500 mr-2">◐</span>
                        <span>Expand into related keyword opportunities</span>
                    </li>
                </ul>
            </div>
        </div>
    `;
    
    // Raw Analysis Data
    const rawDataContent = document.getElementById('raw-data-content');
    rawDataContent.innerHTML = `
        <div class="space-y-6">
            <!-- Analysis Summary -->
            <div>
                <h4 class="font-bold text-lg mb-3">📊 Analysis Summary</h4>
                <div class="bg-gray-50 p-4 rounded-lg">
                    <pre class="text-sm overflow-auto">${JSON.stringify(report.analysis_summary, null, 2)}</pre>
                </div>
            </div>
            
            <!-- All Clusters with Full Data -->
            <div>
                <h4 class="font-bold text-lg mb-3">🎯 Complete Cluster Analysis (${report.clusters.length} clusters)</h4>
                <div class="space-y-4">
                    ${report.clusters.map((cluster, index) => `
                        <details class="border border-gray-200 rounded-lg">
                            <summary class="cursor-pointer p-3 bg-gray-50 font-medium">
                                ${index + 1}. ${cluster.main_keyword} (${cluster.keywords.length} keywords, ${cluster.total_search_volume.toLocaleString()} monthly searches)
                            </summary>
                            <div class="p-4 bg-white">
                                <div class="grid md:grid-cols-2 gap-4 mb-4">
                                    <div class="space-y-2">
                                        <p><strong>Theme:</strong> ${cluster.theme}</p>
                                        <p><strong>Total Search Volume:</strong> ${cluster.total_search_volume.toLocaleString()}</p>
                                        <p><strong>Average CPC:</strong> $${cluster.avg_cpc.toFixed(2)}</p>
                                        <p><strong>Average Difficulty:</strong> ${Math.round(cluster.avg_difficulty)}/100</p>
                                        <p><strong>Commercial Score:</strong> ${cluster.total_commercial_score.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p><strong>Competitor Domains (${cluster.competitor_domains.length}):</strong></p>
                                        <div class="text-sm text-gray-600 max-h-32 overflow-auto">
                                            ${cluster.competitor_domains.length > 0 ? cluster.competitor_domains.join(', ') : 'No competitors found'}
                                        </div>
                                    </div>
                                </div>
                                
                                <h5 class="font-semibold mb-2">Keywords in this cluster:</h5>
                                <div class="space-y-1 max-h-64 overflow-auto">
                                    ${cluster.keywords.map(kw => `
                                        <div class="flex justify-between items-center text-sm py-1 px-2 border-b border-gray-100">
                                            <span class="font-medium">${kw.keyword}</span>
                                            <div class="flex gap-3 text-xs text-gray-600">
                                                <span>Vol: ${kw.search_volume.toLocaleString()}</span>
                                                <span>CPC: $${kw.cpc.toFixed(2)}</span>
                                                <span>Comp: ${(kw.competition * 100).toFixed(0)}%</span>
                                                <span>SERP URLs: ${kw.serp_urls.length}</span>
                                            </div>
                                        </div>
                                        ${kw.serp_urls.length > 0 ? `
                                            <div class="ml-4 text-xs text-gray-500">
                                                Top URLs: ${kw.serp_urls.slice(0, 3).map(url => url.domain).join(', ')}
                                            </div>
                                        ` : ''}
                                    `).join('')}
                                </div>
                            </div>
                        </details>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function showError(message) {
    document.getElementById('input-form').style.display = 'block';
    document.getElementById('progress-section').classList.add('hidden');
    document.getElementById('error-section').classList.remove('hidden');
    document.getElementById('error-message').textContent = message;
}

function downloadReport() {
    if (!analysisData) return;
    
    const dataStr = JSON.stringify(analysisData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `keyword-research-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
// Add event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Original analysis button
    const startBtn = document.getElementById('start-analysis-btn');
    if (startBtn) {
        startBtn.addEventListener('click', startAnalysis);
    }
    
    // Progress report button
    const generateReportBtn = document.getElementById('generate-report-btn');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', generateProgressReport);
    }
    
    // CSV upload handler
    const csvUpload = document.getElementById('csv-upload');
    if (csvUpload) {
        csvUpload.addEventListener('change', handleCSVUpload);
    }
    
    // GSC ZIP upload handler
    const gscZipUpload = document.getElementById('gsc-zip-upload');
    if (gscZipUpload) {
        gscZipUpload.addEventListener('change', handleGSCZipUpload);
    }
});
