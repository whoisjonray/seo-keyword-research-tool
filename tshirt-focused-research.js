const DATAFORSEO_USERNAME = 'jonray@tresr.com';
const DATAFORSEO_PASSWORD = 'ad95632e30d150ab';

// Priority categories based on your list + high-value additions
const priorityCategories = [
    // Your specified categories
    'memes', 'humor', 'funny', 'art', 'character', 'spiritual',
    'pets', 'fitness', 'crypto', 'web3', 'nft', 'music',
    'sports', 'gaming',
    
    // High-volume additions
    'vintage', 'retro', 'graphic', 'band', 'movie', 'anime',
    'motivational', 'inspirational', 'birthday', 'christmas',
    'halloween', 'dad jokes', 'mom life', 'couples', 'family',
    'cat', 'dog', 'coffee', 'beer', 'gym', 'yoga',
    'basketball', 'football', 'baseball', 'soccer',
    'nurse', 'teacher', 'custom', 'personalized',
    'sarcastic', 'pun', 'quote', 'saying',
    'pride', 'lgbtq', 'feminist', 'political',
    'nature', 'travel', 'adventure', 'camping',
    'geek', 'nerd', 'science', 'tech', 'programming'
];

// Generate focused keyword set
function generateFocusedKeywords(categories) {
    const keywords = [];
    const primaryTerms = ['t-shirts', 't-shirt', 'tshirt'];
    const modifiers = ['', 'best ', 'cheap ', 'custom ', 'buy '];
    const suffixes = ['', ' for men', ' for women', ' design', ' ideas'];
    
    categories.forEach(category => {
        primaryTerms.forEach(term => {
            modifiers.forEach(modifier => {
                // Base variations
                keywords.push(`${modifier}${category} ${term}`);
                
                // Add most valuable suffixes for key modifiers
                if (modifier === '' || modifier === 'best ') {
                    suffixes.forEach(suffix => {
                        keywords.push(`${modifier}${category} ${term}${suffix}`);
                    });
                }
            });
        });
    });
    
    return [...new Set(keywords)]; // Remove duplicates
}

// Get batch keyword data with metrics
async function getKeywordMetrics(keywords) {
    const credentials = btoa(`${DATAFORSEO_USERNAME}:${DATAFORSEO_PASSWORD}`);
    
    console.log(`📊 Fetching metrics for ${keywords.length} keywords...`);
    
    try {
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
            const errorData = await response.text();
            throw new Error(`API error: ${response.status} - ${errorData}`);
        }

        const data = await response.json();
        
        if (data.tasks && data.tasks[0] && data.tasks[0].result) {
            return data.tasks[0].result;
        }
        
        return [];
    } catch (error) {
        console.error('Error fetching keyword metrics:', error.message);
        return [];
    }
}

// Get keyword difficulty for top keywords
async function getKeywordDifficulty(keywords) {
    const credentials = btoa(`${DATAFORSEO_USERNAME}:${DATAFORSEO_PASSWORD}`);
    
    console.log(`💪 Fetching difficulty for ${keywords.length} keywords...`);
    
    try {
        const response = await fetch('https://api.dataforseo.com/v3/dataforseo_labs/google/bulk_keyword_difficulty/live', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify([{
                keywords: keywords,
                location_code: 2840,
                language_code: 'en'
            }])
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`API error: ${response.status} - ${errorData}`);
        }

        const data = await response.json();
        
        if (data.tasks && data.tasks[0] && data.tasks[0].result) {
            return data.tasks[0].result;
        }
        
        return [];
    } catch (error) {
        console.error('Error fetching difficulty:', error.message);
        return [];
    }
}

// Extract category from keyword
function extractCategory(keyword) {
    const lowerKeyword = keyword.toLowerCase();
    
    for (const category of priorityCategories) {
        if (lowerKeyword.includes(category)) {
            return category;
        }
    }
    
    // Fallback extraction
    const cleaned = lowerKeyword.replace(/t-?shirts?|tees?|best|cheap|custom|buy|for men|for women|design|ideas/gi, '').trim();
    return cleaned.split(' ')[0] || 'general';
}

// Calculate opportunity score
function calculateOpportunityScore(searchVolume, cpc, competition, difficulty) {
    const volumeScore = Math.min(searchVolume / 100, 100);
    const difficultyScore = 100 - (difficulty || 50);
    const cpcScore = Math.min((cpc || 0) * 20, 100);
    const competitionScore = 100 - ((competition || 0.5) * 100);
    
    return Math.round(
        volumeScore * 0.35 +
        difficultyScore * 0.35 +
        cpcScore * 0.20 +
        competitionScore * 0.10
    );
}

// Main analysis function
async function analyzeTshirtCategories() {
    console.log('🎯 T-SHIRT CATEGORY ANALYSIS FOR TRESR.COM');
    console.log('==========================================\n');
    
    // Step 1: Generate keywords
    console.log('Step 1: Generating focused keyword set...');
    const keywords = generateFocusedKeywords(priorityCategories);
    console.log(`✅ Generated ${keywords.length} keywords\n`);
    
    // Step 2: Get keyword metrics in batches
    console.log('Step 2: Fetching keyword metrics...');
    const keywordData = new Map();
    const batchSize = 100;
    
    for (let i = 0; i < keywords.length; i += batchSize) {
        const batch = keywords.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(keywords.length/batchSize)}...`);
        
        const metrics = await getKeywordMetrics(batch);
        
        metrics.forEach(item => {
            if (item.keyword && item.search_volume > 10) {
                keywordData.set(item.keyword, {
                    keyword: item.keyword,
                    search_volume: item.search_volume || 0,
                    cpc: item.cpc || 0,
                    competition: item.competition || 0,
                    competition_level: item.competition_level || 'unknown',
                    category: extractCategory(item.keyword),
                    difficulty: null,
                    opportunity_score: 0
                });
            }
        });
        
        // Rate limiting
        if (i + batchSize < keywords.length) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    console.log(`✅ Collected data for ${keywordData.size} keywords\n`);
    
    // Step 3: Get difficulty for top keywords
    console.log('Step 3: Analyzing keyword difficulty...');
    const topKeywords = Array.from(keywordData.values())
        .sort((a, b) => b.search_volume - a.search_volume)
        .slice(0, 100)
        .map(k => k.keyword);
    
    const difficultyData = await getKeywordDifficulty(topKeywords);
    
    difficultyData.forEach(item => {
        if (item.keyword && keywordData.has(item.keyword)) {
            keywordData.get(item.keyword).difficulty = item.keyword_difficulty || 50;
        }
    });
    
    console.log(`✅ Difficulty analysis complete\n`);
    
    // Step 4: Calculate opportunity scores
    console.log('Step 4: Calculating opportunity scores...');
    keywordData.forEach(data => {
        data.opportunity_score = calculateOpportunityScore(
            data.search_volume,
            data.cpc,
            data.competition,
            data.difficulty || 50
        );
    });
    
    // Step 5: Aggregate by category
    console.log('Step 5: Aggregating category data...\n');
    const categoryStats = new Map();
    
    keywordData.forEach(data => {
        const category = data.category;
        
        if (!categoryStats.has(category)) {
            categoryStats.set(category, {
                category: category,
                keywords: [],
                total_search_volume: 0,
                avg_cpc: 0,
                avg_difficulty: 0,
                avg_competition: 0,
                max_search_volume: 0,
                opportunity_score: 0
            });
        }
        
        const stats = categoryStats.get(category);
        stats.keywords.push(data);
        stats.total_search_volume += data.search_volume;
        stats.max_search_volume = Math.max(stats.max_search_volume, data.search_volume);
    });
    
    // Calculate averages and sort keywords
    categoryStats.forEach(stats => {
        const count = stats.keywords.length;
        stats.avg_cpc = stats.keywords.reduce((sum, k) => sum + k.cpc, 0) / count;
        stats.avg_difficulty = stats.keywords.reduce((sum, k) => sum + (k.difficulty || 50), 0) / count;
        stats.avg_competition = stats.keywords.reduce((sum, k) => sum + k.competition, 0) / count;
        stats.opportunity_score = stats.keywords.reduce((sum, k) => sum + k.opportunity_score, 0) / count;
        
        // Sort keywords by search volume
        stats.keywords.sort((a, b) => b.search_volume - a.search_volume);
    });
    
    // Generate reports
    const sortedCategories = Array.from(categoryStats.values());
    
    // Sort by different criteria
    const byVolume = [...sortedCategories].sort((a, b) => b.total_search_volume - a.total_search_volume);
    const byDifficulty = [...sortedCategories].filter(c => c.total_search_volume > 500)
        .sort((a, b) => a.avg_difficulty - b.avg_difficulty);
    const byOpportunity = [...sortedCategories].sort((a, b) => b.opportunity_score - a.opportunity_score);
    
    // Display results
    console.log('========================================');
    console.log('📊 TOP 100 T-SHIRT CATEGORIES BY SEARCH VOLUME');
    console.log('========================================\n');
    
    byVolume.slice(0, 100).forEach((cat, index) => {
        console.log(`${index + 1}. ${cat.category.toUpperCase()}`);
        console.log(`   📈 Volume: ${cat.total_search_volume.toLocaleString()} searches/month`);
        console.log(`   💰 Avg CPC: $${cat.avg_cpc.toFixed(2)}`);
        console.log(`   💪 Difficulty: ${Math.round(cat.avg_difficulty)}/100`);
        console.log(`   ⭐ Opportunity: ${Math.round(cat.opportunity_score)}/100`);
        console.log(`   🔝 Top keyword: "${cat.keywords[0]?.keyword}" (${cat.keywords[0]?.search_volume.toLocaleString()} searches)`);
        console.log('');
    });
    
    console.log('\n========================================');
    console.log('🎯 EASIEST CATEGORIES TO RANK FOR');
    console.log('========================================\n');
    
    byDifficulty.slice(0, 50).forEach((cat, index) => {
        console.log(`${index + 1}. ${cat.category.toUpperCase()}`);
        console.log(`   💪 Difficulty: ${Math.round(cat.avg_difficulty)}/100`);
        console.log(`   📈 Volume: ${cat.total_search_volume.toLocaleString()} searches/month`);
        console.log(`   💰 Avg CPC: $${cat.avg_cpc.toFixed(2)}`);
        console.log(`   🎯 Action: ${cat.avg_difficulty < 30 ? '🟢 Quick Win!' : cat.avg_difficulty < 50 ? '🟡 Good Target' : '🔴 Build Authority First'}`);
        console.log('');
    });
    
    console.log('\n========================================');
    console.log('💎 BEST OPPORTUNITY CATEGORIES');
    console.log('========================================\n');
    
    byOpportunity.slice(0, 30).forEach((cat, index) => {
        const potentialTraffic = Math.round(cat.total_search_volume * 0.3);
        const estimatedValue = (potentialTraffic * cat.avg_cpc).toFixed(0);
        
        console.log(`${index + 1}. ${cat.category.toUpperCase()}`);
        console.log(`   ⭐ Opportunity Score: ${Math.round(cat.opportunity_score)}/100`);
        console.log(`   📈 Volume: ${cat.total_search_volume.toLocaleString()} searches/month`);
        console.log(`   🚀 Potential Traffic: ${potentialTraffic.toLocaleString()} visits/month`);
        console.log(`   💵 Estimated Value: $${estimatedValue}/month`);
        console.log('');
    });
    
    // Create actionable report
    const report = {
        analysis_date: new Date().toISOString(),
        total_keywords_analyzed: keywordData.size,
        total_categories: categoryStats.size,
        
        top_100_by_volume: byVolume.slice(0, 100).map((cat, i) => ({
            rank: i + 1,
            category: cat.category,
            total_monthly_searches: cat.total_search_volume,
            max_keyword_volume: cat.max_search_volume,
            avg_cpc: cat.avg_cpc.toFixed(2),
            avg_difficulty: Math.round(cat.avg_difficulty),
            opportunity_score: Math.round(cat.opportunity_score),
            keyword_count: cat.keywords.length,
            top_3_keywords: cat.keywords.slice(0, 3).map(k => ({
                keyword: k.keyword,
                volume: k.search_volume,
                cpc: k.cpc.toFixed(2)
            }))
        })),
        
        easiest_to_rank: byDifficulty.slice(0, 50).map((cat, i) => ({
            rank: i + 1,
            category: cat.category,
            avg_difficulty: Math.round(cat.avg_difficulty),
            total_monthly_searches: cat.total_search_volume,
            opportunity_score: Math.round(cat.opportunity_score),
            action: cat.avg_difficulty < 30 ? 'Quick Win' : cat.avg_difficulty < 50 ? 'Good Target' : 'Long Term'
        })),
        
        best_opportunities: byOpportunity.slice(0, 30).map((cat, i) => ({
            rank: i + 1,
            category: cat.category,
            opportunity_score: Math.round(cat.opportunity_score),
            total_monthly_searches: cat.total_search_volume,
            potential_traffic: Math.round(cat.total_search_volume * 0.3),
            estimated_monthly_value: Math.round(cat.total_search_volume * 0.3 * cat.avg_cpc)
        })),
        
        action_plan: {
            immediate_targets: byDifficulty.filter(c => c.avg_difficulty < 35).slice(0, 10).map(c => c.category),
            high_value_targets: byOpportunity.slice(0, 10).map(c => c.category),
            volume_leaders: byVolume.slice(0, 10).map(c => c.category)
        }
    };
    
    // Save report
    const fs = require('fs');
    const jsonPath = `tshirt-category-analysis-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    console.log(`\n✅ Full report saved to: ${jsonPath}`);
    
    // Create CSV
    const csvPath = `tshirt-categories-${new Date().toISOString().split('T')[0]}.csv`;
    const csvContent = [
        'Rank,Category,Monthly Searches,Max Volume Keyword,Avg CPC,Difficulty,Opportunity Score',
        ...report.top_100_by_volume.map(c => 
            `${c.rank},"${c.category}",${c.total_monthly_searches},${c.max_keyword_volume},${c.avg_cpc},${c.avg_difficulty},${c.opportunity_score}`
        )
    ].join('\n');
    fs.writeFileSync(csvPath, csvContent);
    console.log(`✅ CSV export saved to: ${csvPath}\n`);
    
    return report;
}

// Run the analysis
analyzeTshirtCategories().catch(error => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
});