const DATAFORSEO_USERNAME = 'jonray@tresr.com';
const DATAFORSEO_PASSWORD = 'ad95632e30d150ab';

// Comprehensive category list
const allCategories = [
    // High-volume generic
    'custom', 'personalized', 'graphic', 'vintage', 'retro', 'plain', 'blank',
    
    // Humor & Entertainment
    'funny', 'memes', 'humor', 'sarcastic', 'puns', 'dad jokes', 'dark humor',
    
    // Pop Culture
    'band', 'music', 'rock', 'hip hop', 'rap', 'country', 'metal', 'punk',
    'movie', 'tv shows', 'star wars', 'marvel', 'disney', 'harry potter',
    'anime', 'manga', 'gaming', 'video game', 'fortnite', 'minecraft',
    
    // Sports & Fitness
    'sports', 'football', 'basketball', 'baseball', 'soccer', 'hockey',
    'golf', 'tennis', 'running', 'gym', 'fitness', 'yoga', 'crossfit',
    'workout', 'bodybuilding', 'cycling', 'fishing', 'hunting',
    
    // Lifestyle & Interests
    'travel', 'adventure', 'camping', 'hiking', 'outdoor', 'beach', 'summer',
    'nature', 'mountain', 'ocean', 'surf', 'skate', 'streetwear',
    
    // Art & Design
    'art', 'artist', 'abstract', 'minimalist', 'typography', 'quotes',
    'inspirational', 'motivational', 'spiritual', 'religious', 'christian',
    'blessed', 'faith', 'zen', 'meditation',
    
    // Animals & Pets
    'pets', 'dog', 'cat', 'animal', 'wildlife', 'horse', 'wolf', 'lion',
    'tiger', 'bear', 'elephant', 'bird', 'fish',
    
    // Tech & Internet
    'tech', 'programming', 'coding', 'developer', 'hacker', 'geek', 'nerd',
    'science', 'math', 'engineering', 'crypto', 'bitcoin', 'nft', 'web3',
    
    // Occasions & Holidays
    'birthday', 'christmas', 'halloween', 'thanksgiving', 'easter', 'valentine',
    'new year', 'graduation', 'wedding', 'bachelor', 'bachelorette', 'party',
    
    // Family & Relationships
    'family', 'mom', 'dad', 'parent', 'couples', 'boyfriend', 'girlfriend',
    'husband', 'wife', 'grandpa', 'grandma', 'baby', 'kids', 'toddler',
    
    // Professional & Career
    'nurse', 'teacher', 'doctor', 'firefighter', 'police', 'military',
    'veteran', 'engineer', 'lawyer', 'chef', 'mechanic', 'construction',
    
    // Food & Drink
    'food', 'coffee', 'beer', 'wine', 'whiskey', 'tequila', 'vodka',
    'pizza', 'taco', 'burger', 'bbq', 'vegan', 'vegetarian',
    
    // Social & Political
    'pride', 'lgbtq', 'feminist', 'political', 'patriotic', 'american',
    'usa', 'flag', 'vote', 'protest', 'activism', 'environmental',
    
    // Fashion Styles
    'bohemian', 'boho', 'grunge', 'gothic', 'emo', 'hipster', 'preppy',
    'trendy', 'designer', 'luxury', 'premium', 'cheap', 'bulk'
];

async function comprehensiveAnalysis() {
    console.log('🎯 COMPREHENSIVE T-SHIRT CATEGORY ANALYSIS');
    console.log('===========================================\n');
    
    const credentials = btoa(`${DATAFORSEO_USERNAME}:${DATAFORSEO_PASSWORD}`);
    const allResults = [];
    const batchSize = 50;
    
    // Process in batches
    for (let i = 0; i < allCategories.length; i += batchSize) {
        const batch = allCategories.slice(i, i + batchSize);
        const keywords = [];
        
        batch.forEach(cat => {
            keywords.push(`${cat} t-shirts`);
            keywords.push(`${cat} t-shirt`);
            keywords.push(`${cat} tshirts`);
        });
        
        console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(allCategories.length/batchSize)}...`);
        
        try {
            const response = await fetch('https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live', {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify([{
                    keywords: keywords,
                    location_code: 2840,
                    language_code: 'en',
                    include_serp_info: true
                }])
            });

            const data = await response.json();
            
            if (data.tasks && data.tasks[0] && data.tasks[0].result) {
                allResults.push(...data.tasks[0].result);
            }
            
        } catch (error) {
            console.error(`Error in batch ${Math.floor(i/batchSize) + 1}:`, error.message);
        }
        
        // Rate limiting
        if (i + batchSize < allCategories.length) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    // Process results
    console.log('\nProcessing results...\n');
    
    const categoryData = new Map();
    
    allResults.forEach(item => {
        if (item && item.search_volume > 10) {
            const category = allCategories.find(cat => 
                item.keyword.toLowerCase().includes(cat)
            );
            
            if (category) {
                if (!categoryData.has(category)) {
                    categoryData.set(category, {
                        category: category,
                        total_search_volume: 0,
                        max_volume: 0,
                        avg_cpc: 0,
                        competition_sum: 0,
                        keyword_count: 0,
                        keywords: []
                    });
                }
                
                const catData = categoryData.get(category);
                catData.total_search_volume += item.search_volume;
                catData.max_volume = Math.max(catData.max_volume, item.search_volume);
                catData.avg_cpc += (item.cpc || 0);
                catData.competition_sum += (item.competition || 0);
                catData.keyword_count += 1;
                catData.keywords.push({
                    keyword: item.keyword,
                    volume: item.search_volume,
                    cpc: item.cpc || 0,
                    competition: item.competition_level || 'unknown'
                });
            }
        }
    });
    
    // Calculate averages and difficulty scores
    categoryData.forEach(cat => {
        cat.avg_cpc = cat.keyword_count > 0 ? cat.avg_cpc / cat.keyword_count : 0;
        cat.avg_competition = cat.keyword_count > 0 ? cat.competition_sum / cat.keyword_count : 0;
        
        // Estimate difficulty (0-100)
        cat.estimated_difficulty = Math.round(
            (cat.avg_competition * 50) + // Competition contributes 50%
            (cat.total_search_volume > 100000 ? 25 : cat.total_search_volume / 4000) + // Volume contributes 25%
            (cat.avg_cpc > 5 ? 25 : cat.avg_cpc * 5) // CPC contributes 25%
        );
        
        // Calculate opportunity score
        cat.opportunity_score = Math.round(
            (Math.min(cat.total_search_volume / 1000, 100) * 0.4) + // Volume weight 40%
            ((100 - cat.estimated_difficulty) * 0.4) + // Ease weight 40%
            (Math.min(cat.avg_cpc * 10, 100) * 0.2) // Commercial value 20%
        );
        
        // Sort keywords
        cat.keywords.sort((a, b) => b.volume - a.volume);
    });
    
    // Sort categories
    const sortedByVolume = Array.from(categoryData.values())
        .sort((a, b) => b.total_search_volume - a.total_search_volume);
    
    const sortedByDifficulty = Array.from(categoryData.values())
        .filter(c => c.total_search_volume > 1000)
        .sort((a, b) => a.estimated_difficulty - b.estimated_difficulty);
    
    const sortedByOpportunity = Array.from(categoryData.values())
        .sort((a, b) => b.opportunity_score - a.opportunity_score);
    
    // Display results
    console.log('========================================');
    console.log('📊 TOP 100 T-SHIRT CATEGORIES BY SEARCH VOLUME');
    console.log('========================================\n');
    
    const top100 = sortedByVolume.slice(0, 100);
    
    top100.forEach((cat, index) => {
        console.log(`${index + 1}. ${cat.category.toUpperCase()}`);
        console.log(`   📈 Total Volume: ${cat.total_search_volume.toLocaleString()} searches/month`);
        console.log(`   💰 Avg CPC: $${cat.avg_cpc.toFixed(2)}`);
        console.log(`   💪 Difficulty: ${cat.estimated_difficulty}/100`);
        console.log(`   ⭐ Opportunity: ${cat.opportunity_score}/100`);
        if (cat.keywords[0]) {
            console.log(`   🔝 Top: "${cat.keywords[0].keyword}" (${cat.keywords[0].volume.toLocaleString()})`);
        }
        console.log('');
    });
    
    // Easiest categories
    console.log('\n========================================');
    console.log('🎯 EASIEST CATEGORIES TO RANK FOR');
    console.log('========================================\n');
    
    sortedByDifficulty.slice(0, 30).forEach((cat, index) => {
        console.log(`${index + 1}. ${cat.category.toUpperCase()}`);
        console.log(`   💪 Difficulty: ${cat.estimated_difficulty}/100`);
        console.log(`   📈 Volume: ${cat.total_search_volume.toLocaleString()}`);
        console.log(`   🎯 Action: ${cat.estimated_difficulty < 30 ? '🟢 Quick Win!' : 
                       cat.estimated_difficulty < 50 ? '🟡 Good Target' : '🔴 Competitive'}`);
        console.log('');
    });
    
    // Create report
    const report = {
        analysis_date: new Date().toISOString(),
        total_categories_analyzed: categoryData.size,
        total_keywords_processed: allResults.length,
        
        top_100_by_search_volume: top100.map((cat, i) => ({
            rank: i + 1,
            category: cat.category,
            total_monthly_searches: cat.total_search_volume,
            max_keyword_volume: cat.max_volume,
            avg_cpc: parseFloat(cat.avg_cpc.toFixed(2)),
            estimated_difficulty: cat.estimated_difficulty,
            opportunity_score: cat.opportunity_score,
            top_keyword: cat.keywords[0] ? cat.keywords[0].keyword : null
        })),
        
        easiest_to_rank: sortedByDifficulty.slice(0, 50).map((cat, i) => ({
            rank: i + 1,
            category: cat.category,
            estimated_difficulty: cat.estimated_difficulty,
            total_monthly_searches: cat.total_search_volume,
            opportunity_score: cat.opportunity_score
        })),
        
        recommendations: {
            quick_wins: sortedByDifficulty.filter(c => c.estimated_difficulty < 30)
                .slice(0, 10).map(c => c.category),
            high_opportunity: sortedByOpportunity.slice(0, 15).map(c => c.category),
            volume_leaders: sortedByVolume.slice(0, 15).map(c => c.category)
        },
        
        summary: {
            total_monthly_search_volume: sortedByVolume.reduce((sum, c) => sum + c.total_search_volume, 0),
            categories_over_10k_searches: sortedByVolume.filter(c => c.total_search_volume > 10000).length,
            categories_under_30_difficulty: sortedByDifficulty.filter(c => c.estimated_difficulty < 30).length,
            avg_cpc_across_all: (sortedByVolume.reduce((sum, c) => sum + c.avg_cpc, 0) / sortedByVolume.length).toFixed(2)
        }
    };
    
    // Save report
    const fs = require('fs');
    const jsonPath = `tshirt-100-categories-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    console.log(`\n✅ Full report saved to: ${jsonPath}`);
    
    // Create CSV
    const csvPath = `tshirt-100-categories-${new Date().toISOString().split('T')[0]}.csv`;
    const csvContent = [
        'Rank,Category,Monthly Searches,Avg CPC,Difficulty (0-100),Opportunity Score,Top Keyword',
        ...report.top_100_by_search_volume.map(c => 
            `${c.rank},"${c.category}",${c.total_monthly_searches},${c.avg_cpc},${c.estimated_difficulty},${c.opportunity_score},"${c.top_keyword || ''}"`
        )
    ].join('\n');
    fs.writeFileSync(csvPath, csvContent);
    console.log(`✅ CSV export saved to: ${csvPath}\n`);
    
    // Summary
    console.log('========================================');
    console.log('📊 ANALYSIS SUMMARY');
    console.log('========================================');
    console.log(`Total Categories: ${report.total_categories_analyzed}`);
    console.log(`Total Search Volume: ${report.summary.total_monthly_search_volume.toLocaleString()}`);
    console.log(`Categories > 10K searches: ${report.summary.categories_over_10k_searches}`);
    console.log(`Easy Categories (< 30 difficulty): ${report.summary.categories_under_30_difficulty}`);
    console.log(`Average CPC: $${report.summary.avg_cpc_across_all}`);
    
    return report;
}

// Run analysis
comprehensiveAnalysis().catch(error => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
});