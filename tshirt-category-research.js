const DATAFORSEO_USERNAME = 'jonray@tresr.com';
const DATAFORSEO_PASSWORD = 'ad95632e30d150ab';

// Main t-shirt categories to research
const baseCategories = [
    'memes', 'humor', 'funny', 'art', 'character', 'spiritual', 
    'pets', 'fitness', 'crypto', 'web3', 'nft', 'music', 
    'sports', 'gaming', 'vintage', 'retro', 'motivational', 
    'inspirational', 'political', 'science', 'tech', 'programming',
    'dad jokes', 'mom', 'family', 'couples', 'birthday', 'christmas',
    'halloween', 'summer', 'beach', 'travel', 'adventure', 'nature',
    'animals', 'cats', 'dogs', 'anime', 'manga', 'movies', 'tv shows',
    'bands', 'hip hop', 'rock', 'pop culture', 'geek', 'nerd',
    'food', 'coffee', 'beer', 'wine', 'whiskey', 'cocktails',
    'yoga', 'gym', 'crossfit', 'running', 'cycling', 'basketball',
    'football', 'baseball', 'soccer', 'golf', 'tennis', 'fishing',
    'hunting', 'camping', 'hiking', 'outdoor', 'military', 'veteran',
    'nurse', 'teacher', 'engineer', 'doctor', 'lawyer', 'firefighter',
    'police', 'custom', 'personalized', 'designer', 'luxury', 'streetwear',
    'minimalist', 'abstract', 'graphic', 'typography', 'quotes', 'sayings',
    'sarcastic', 'dark humor', 'puns', 'dad bod', 'mom life', 'parenting',
    'baby', 'kids', 'teen', 'college', 'university', 'graduation',
    'wedding', 'bachelor', 'bachelorette', 'pride', 'lgbtq', 'feminist',
    'environmental', 'climate', 'vegan', 'plant based', 'sustainable'
];

// Generate keyword variations
function generateKeywordVariations(categories) {
    const variations = [];
    const baseTerms = ['t-shirts', 't-shirt', 'tshirts', 'tshirt', 'shirts', 'tees'];
    
    categories.forEach(category => {
        baseTerms.forEach(term => {
            // Category + term variations
            variations.push(`${category} ${term}`);
            variations.push(`${term} ${category}`);
            variations.push(`best ${category} ${term}`);
            variations.push(`buy ${category} ${term}`);
            variations.push(`${category} ${term} for men`);
            variations.push(`${category} ${term} for women`);
            variations.push(`cheap ${category} ${term}`);
            variations.push(`custom ${category} ${term}`);
            variations.push(`${category} ${term} design`);
            variations.push(`${category} ${term} ideas`);
        });
    });
    
    return variations;
}

// Batch process keywords for efficiency
function createBatches(array, batchSize) {
    const batches = [];
    for (let i = 0; i < array.length; i += batchSize) {
        batches.push(array.slice(i, i + batchSize));
    }
    return batches;
}

// Get search volume and keyword difficulty data
async function getKeywordData(keywords) {
    const credentials = btoa(`${DATAFORSEO_USERNAME}:${DATAFORSEO_PASSWORD}`);
    
    console.log(`Fetching data for ${keywords.length} keywords...`);
    
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
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.tasks && data.tasks[0] && data.tasks[0].result) {
            return data.tasks[0].result;
        }
        
        return [];
    } catch (error) {
        console.error('Error fetching keyword data:', error);
        return [];
    }
}

// Get keyword difficulty using DataForSEO Labs
async function getKeywordDifficulty(keywords) {
    const credentials = btoa(`${DATAFORSEO_USERNAME}:${DATAFORSEO_PASSWORD}`);
    
    console.log(`Fetching difficulty data for ${keywords.length} keywords...`);
    
    try {
        const response = await fetch('https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_difficulty/live', {
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
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.tasks && data.tasks[0] && data.tasks[0].result) {
            return data.tasks[0].result;
        }
        
        return [];
    } catch (error) {
        console.error('Error fetching difficulty data:', error);
        return [];
    }
}

// Get related keywords for expansion
async function getRelatedKeywords(seedKeywords) {
    const credentials = btoa(`${DATAFORSEO_USERNAME}:${DATAFORSEO_PASSWORD}`);
    
    console.log(`Fetching related keywords for ${seedKeywords.length} seed keywords...`);
    
    try {
        const response = await fetch('https://api.dataforseo.com/v3/keywords_data/google_ads/keywords_for_keywords/live', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify([{
                keywords: seedKeywords,
                location_code: 2840,
                language_code: 'en',
                include_serp_info: true,
                limit: 1000,
                order_by: ['search_volume,desc']
            }])
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.tasks && data.tasks[0] && data.tasks[0].result) {
            return data.tasks[0].result;
        }
        
        return [];
    } catch (error) {
        console.error('Error fetching related keywords:', error);
        return [];
    }
}

// Calculate opportunity score
function calculateOpportunityScore(keyword, searchVolume, cpc, competition, difficulty) {
    // Higher score = better opportunity
    // Factors: High volume, Low difficulty, High CPC (commercial value), Low competition
    
    const volumeScore = Math.min(searchVolume / 100, 100); // Normalize to 0-100
    const difficultyScore = 100 - (difficulty || 50); // Inverse of difficulty
    const cpcScore = Math.min(cpc * 10, 100); // Normalize CPC to 0-100
    const competitionScore = 100 - (competition * 100); // Inverse of competition
    
    // Weighted average
    const opportunityScore = (
        volumeScore * 0.35 +  // 35% weight on search volume
        difficultyScore * 0.35 + // 35% weight on ease of ranking
        cpcScore * 0.20 + // 20% weight on commercial value
        competitionScore * 0.10 // 10% weight on competition
    );
    
    return Math.round(opportunityScore);
}

// Extract category from keyword
function extractCategory(keyword) {
    const lowerKeyword = keyword.toLowerCase();
    
    // Check each base category
    for (const category of baseCategories) {
        if (lowerKeyword.includes(category)) {
            return category;
        }
    }
    
    // If no match, extract the first meaningful word
    const words = lowerKeyword.replace(/t-?shirts?|tees?|shirts?/gi, '').trim().split(' ');
    return words[0] || 'general';
}

// Main research function
async function researchTshirtCategories() {
    console.log('🚀 Starting T-Shirt Category Research for TRESR.com');
    console.log('================================================\n');
    
    const allKeywordData = new Map();
    
    // Step 1: Generate initial keyword variations
    console.log('📝 Step 1: Generating keyword variations...');
    const keywordVariations = generateKeywordVariations(baseCategories);
    console.log(`Generated ${keywordVariations.length} keyword variations\n`);
    
    // Step 2: Get search volume data in batches
    console.log('📊 Step 2: Fetching search volume data...');
    const volumeBatches = createBatches(keywordVariations, 100);
    
    for (let i = 0; i < volumeBatches.length; i++) {
        console.log(`Processing batch ${i + 1}/${volumeBatches.length}...`);
        const volumeData = await getKeywordData(volumeBatches[i]);
        
        volumeData.forEach(item => {
            if (item.keyword && item.search_volume > 10) {
                allKeywordData.set(item.keyword, {
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
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`Collected ${allKeywordData.size} keywords with search volume\n`);
    
    // Step 3: Get related keywords for top performers
    console.log('🔍 Step 3: Finding related keywords...');
    const topKeywords = Array.from(allKeywordData.values())
        .sort((a, b) => b.search_volume - a.search_volume)
        .slice(0, 20)
        .map(k => k.keyword);
    
    const relatedKeywords = await getRelatedKeywords(topKeywords);
    
    relatedKeywords.forEach(item => {
        if (item.keyword && item.search_volume > 50 && !allKeywordData.has(item.keyword)) {
            // Filter for t-shirt related keywords
            const lowerKeyword = item.keyword.toLowerCase();
            if (lowerKeyword.includes('shirt') || lowerKeyword.includes('tee') || 
                lowerKeyword.includes('apparel') || lowerKeyword.includes('clothing')) {
                
                allKeywordData.set(item.keyword, {
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
        }
    });
    
    console.log(`Total keywords after expansion: ${allKeywordData.size}\n`);
    
    // Step 4: Get keyword difficulty for top keywords
    console.log('💪 Step 4: Analyzing keyword difficulty...');
    const keywordsForDifficulty = Array.from(allKeywordData.values())
        .sort((a, b) => b.search_volume - a.search_volume)
        .slice(0, 200)
        .map(k => k.keyword);
    
    const difficultyBatches = createBatches(keywordsForDifficulty, 50);
    
    for (let i = 0; i < difficultyBatches.length; i++) {
        console.log(`Processing difficulty batch ${i + 1}/${difficultyBatches.length}...`);
        const difficultyData = await getKeywordDifficulty(difficultyBatches[i]);
        
        difficultyData.forEach(item => {
            if (item.keyword && allKeywordData.has(item.keyword)) {
                allKeywordData.get(item.keyword).difficulty = item.keyword_difficulty || 50;
            }
        });
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Step 5: Calculate opportunity scores
    console.log('\n📈 Step 5: Calculating opportunity scores...');
    allKeywordData.forEach(data => {
        data.opportunity_score = calculateOpportunityScore(
            data.keyword,
            data.search_volume,
            data.cpc,
            data.competition,
            data.difficulty || 50
        );
    });
    
    // Step 6: Aggregate by category
    console.log('📂 Step 6: Aggregating by category...');
    const categoryStats = new Map();
    
    allKeywordData.forEach(data => {
        const category = data.category;
        
        if (!categoryStats.has(category)) {
            categoryStats.set(category, {
                category: category,
                total_search_volume: 0,
                avg_cpc: 0,
                avg_difficulty: 0,
                avg_competition: 0,
                keyword_count: 0,
                top_keywords: [],
                total_opportunity_score: 0,
                avg_opportunity_score: 0
            });
        }
        
        const stats = categoryStats.get(category);
        stats.total_search_volume += data.search_volume;
        stats.avg_cpc += data.cpc;
        stats.avg_difficulty += (data.difficulty || 50);
        stats.avg_competition += data.competition;
        stats.keyword_count += 1;
        stats.total_opportunity_score += data.opportunity_score;
        stats.top_keywords.push({
            keyword: data.keyword,
            search_volume: data.search_volume,
            difficulty: data.difficulty,
            opportunity_score: data.opportunity_score
        });
    });
    
    // Calculate averages and sort top keywords
    categoryStats.forEach(stats => {
        stats.avg_cpc = stats.avg_cpc / stats.keyword_count;
        stats.avg_difficulty = stats.avg_difficulty / stats.keyword_count;
        stats.avg_competition = stats.avg_competition / stats.keyword_count;
        stats.avg_opportunity_score = stats.total_opportunity_score / stats.keyword_count;
        stats.top_keywords = stats.top_keywords
            .sort((a, b) => b.search_volume - a.search_volume)
            .slice(0, 5);
    });
    
    // Step 7: Generate final report
    console.log('\n📋 Generating final report...\n');
    
    const sortedCategories = Array.from(categoryStats.values())
        .sort((a, b) => b.total_search_volume - a.search_volume);
    
    // Top 100 categories by search volume
    const top100ByVolume = sortedCategories.slice(0, 100);
    
    // Easiest categories to rank for (low difficulty, decent volume)
    const easiestToRank = Array.from(categoryStats.values())
        .filter(c => c.total_search_volume > 1000)
        .sort((a, b) => a.avg_difficulty - b.avg_difficulty)
        .slice(0, 50);
    
    // Best opportunities (high opportunity score)
    const bestOpportunities = Array.from(categoryStats.values())
        .sort((a, b) => b.avg_opportunity_score - a.avg_opportunity_score)
        .slice(0, 50);
    
    // Generate report
    const report = {
        analysis_date: new Date().toISOString(),
        total_keywords_analyzed: allKeywordData.size,
        total_categories_found: categoryStats.size,
        
        top_100_categories_by_volume: top100ByVolume.map((cat, index) => ({
            rank: index + 1,
            category: cat.category,
            total_monthly_searches: cat.total_search_volume,
            avg_cpc: `$${cat.avg_cpc.toFixed(2)}`,
            avg_difficulty: Math.round(cat.avg_difficulty),
            keyword_count: cat.keyword_count,
            opportunity_score: Math.round(cat.avg_opportunity_score),
            top_keywords: cat.top_keywords.slice(0, 3).map(k => ({
                keyword: k.keyword,
                searches: k.search_volume,
                difficulty: k.difficulty || 'N/A'
            }))
        })),
        
        easiest_categories_to_rank: easiestToRank.map((cat, index) => ({
            rank: index + 1,
            category: cat.category,
            avg_difficulty: Math.round(cat.avg_difficulty),
            total_monthly_searches: cat.total_search_volume,
            opportunity_score: Math.round(cat.avg_opportunity_score),
            recommended_action: cat.avg_difficulty < 30 ? 'Quick Win - Target Immediately' : 
                               cat.avg_difficulty < 50 ? 'Good Opportunity - Build Content' : 
                               'Long-term Target'
        })),
        
        best_opportunity_categories: bestOpportunities.map((cat, index) => ({
            rank: index + 1,
            category: cat.category,
            opportunity_score: Math.round(cat.avg_opportunity_score),
            total_monthly_searches: cat.total_search_volume,
            avg_difficulty: Math.round(cat.avg_difficulty),
            avg_cpc: `$${cat.avg_cpc.toFixed(2)}`,
            potential_monthly_traffic: Math.round(cat.total_search_volume * 0.3),
            estimated_value: `$${(cat.total_search_volume * 0.3 * cat.avg_cpc).toFixed(0)}/month`
        })),
        
        recommendations: {
            immediate_actions: [
                'Create category pages for top 10 easiest categories to rank',
                'Optimize existing pages for high-volume category keywords',
                'Build content clusters around best opportunity categories'
            ],
            
            category_page_strategy: {
                quick_wins: easiestToRank.slice(0, 10).map(c => c.category),
                high_value_targets: bestOpportunities.slice(0, 10).map(c => c.category),
                volume_leaders: top100ByVolume.slice(0, 10).map(c => c.category)
            },
            
            content_recommendations: [
                'Create "Best [Category] T-Shirts" buying guides',
                'Develop "[Category] T-Shirt Design Ideas" inspiration pages',
                'Build comparison pages for popular categories',
                'Create seasonal collections for trending categories'
            ]
        },
        
        summary_stats: {
            total_monthly_search_volume: Array.from(allKeywordData.values())
                .reduce((sum, k) => sum + k.search_volume, 0),
            avg_keyword_difficulty: Math.round(
                Array.from(allKeywordData.values())
                    .reduce((sum, k) => sum + (k.difficulty || 50), 0) / allKeywordData.size
            ),
            total_categories_with_10k_plus_searches: sortedCategories
                .filter(c => c.total_search_volume >= 10000).length,
            total_categories_with_low_difficulty: categoryStats.size -
                Array.from(categoryStats.values())
                    .filter(c => c.avg_difficulty < 40).length
        }
    };
    
    return report;
}

// Export functions for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { researchTshirtCategories };
}

// Run the analysis
console.log('Starting T-Shirt Category Research...\n');
researchTshirtCategories().then(report => {
    console.log('\n========================================');
    console.log('T-SHIRT CATEGORY RESEARCH COMPLETE');
    console.log('========================================\n');
    
    // Display summary
    console.log('📊 SUMMARY STATISTICS:');
    console.log(`Total Keywords Analyzed: ${report.total_keywords_analyzed.toLocaleString()}`);
    console.log(`Total Categories Found: ${report.total_categories_found}`);
    console.log(`Total Monthly Search Volume: ${report.summary_stats.total_monthly_search_volume.toLocaleString()}`);
    console.log(`Average Keyword Difficulty: ${report.summary_stats.avg_keyword_difficulty}/100`);
    console.log(`Categories with 10K+ Searches: ${report.summary_stats.total_categories_with_10k_plus_searches}\n`);
    
    // Display top 10 categories by volume
    console.log('🏆 TOP 10 CATEGORIES BY SEARCH VOLUME:');
    console.log('----------------------------------------');
    report.top_100_categories_by_volume.slice(0, 10).forEach(cat => {
        console.log(`${cat.rank}. ${cat.category.toUpperCase()}`);
        console.log(`   📈 ${cat.total_monthly_searches.toLocaleString()} monthly searches`);
        console.log(`   💰 ${cat.avg_cpc} avg CPC`);
        console.log(`   💪 ${cat.avg_difficulty}/100 difficulty`);
        console.log(`   ⭐ ${cat.opportunity_score}/100 opportunity score`);
        console.log('');
    });
    
    // Display easiest categories
    console.log('🎯 TOP 10 EASIEST CATEGORIES TO RANK:');
    console.log('--------------------------------------');
    report.easiest_categories_to_rank.slice(0, 10).forEach(cat => {
        console.log(`${cat.rank}. ${cat.category.toUpperCase()}`);
        console.log(`   💪 ${cat.avg_difficulty}/100 difficulty`);
        console.log(`   📈 ${cat.total_monthly_searches.toLocaleString()} monthly searches`);
        console.log(`   🎯 ${cat.recommended_action}`);
        console.log('');
    });
    
    // Display best opportunities
    console.log('💎 TOP 10 BEST OPPORTUNITY CATEGORIES:');
    console.log('---------------------------------------');
    report.best_opportunity_categories.slice(0, 10).forEach(cat => {
        console.log(`${cat.rank}. ${cat.category.toUpperCase()}`);
        console.log(`   ⭐ ${cat.opportunity_score}/100 opportunity score`);
        console.log(`   📈 ${cat.total_monthly_searches.toLocaleString()} monthly searches`);
        console.log(`   💰 Estimated value: ${cat.estimated_value}`);
        console.log(`   🚀 Potential traffic: ${cat.potential_monthly_traffic.toLocaleString()} visits/month`);
        console.log('');
    });
    
    // Save full report to file
    const fs = require('fs');
    const reportPath = `tshirt-category-report-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n✅ Full report saved to: ${reportPath}`);
    
    // Save CSV for easy analysis
    const csvPath = `tshirt-categories-${new Date().toISOString().split('T')[0]}.csv`;
    const csvHeader = 'Rank,Category,Monthly Searches,Avg CPC,Difficulty,Opportunity Score\n';
    const csvData = report.top_100_categories_by_volume
        .map(cat => `${cat.rank},"${cat.category}",${cat.total_monthly_searches},${cat.avg_cpc},${cat.avg_difficulty},${cat.opportunity_score}`)
        .join('\n');
    fs.writeFileSync(csvPath, csvHeader + csvData);
    console.log(`✅ CSV export saved to: ${csvPath}\n`);
    
}).catch(error => {
    console.error('❌ Research failed:', error);
});