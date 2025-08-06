const DATAFORSEO_USERNAME = 'jonray@tresr.com';
const DATAFORSEO_PASSWORD = 'ad95632e30d150ab';

// Test with core categories
const testCategories = [
    'funny', 'memes', 'vintage', 'graphic', 'band',
    'sports', 'gaming', 'anime', 'fitness', 'music',
    'art', 'custom', 'personalized', 'christmas', 'halloween'
];

async function quickTest() {
    console.log('🚀 Quick T-Shirt Category Test\n');
    
    const credentials = btoa(`${DATAFORSEO_USERNAME}:${DATAFORSEO_PASSWORD}`);
    
    // Build test keywords
    const keywords = [];
    testCategories.forEach(cat => {
        keywords.push(`${cat} t-shirts`);
        keywords.push(`best ${cat} t-shirts`);
        keywords.push(`${cat} t-shirt designs`);
    });
    
    console.log(`Testing ${keywords.length} keywords...\n`);
    
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
            const results = data.tasks[0].result;
            
            // Process results
            const categoryData = new Map();
            
            results.forEach(item => {
                if (item.search_volume > 0) {
                    const category = testCategories.find(cat => 
                        item.keyword.toLowerCase().includes(cat)
                    );
                    
                    if (category) {
                        if (!categoryData.has(category)) {
                            categoryData.set(category, {
                                category: category,
                                total_volume: 0,
                                keywords: []
                            });
                        }
                        
                        const catData = categoryData.get(category);
                        catData.total_volume += item.search_volume;
                        catData.keywords.push({
                            keyword: item.keyword,
                            volume: item.search_volume,
                            cpc: item.cpc || 0,
                            competition: item.competition_level || 'unknown'
                        });
                    }
                }
            });
            
            // Sort and display
            const sorted = Array.from(categoryData.values())
                .sort((a, b) => b.total_volume - a.total_volume);
            
            console.log('TOP T-SHIRT CATEGORIES BY SEARCH VOLUME:');
            console.log('=========================================\n');
            
            sorted.forEach((cat, index) => {
                console.log(`${index + 1}. ${cat.category.toUpperCase()}`);
                console.log(`   Total Volume: ${cat.total_volume.toLocaleString()} searches/month`);
                console.log(`   Top Keywords:`);
                cat.keywords
                    .sort((a, b) => b.volume - a.volume)
                    .slice(0, 3)
                    .forEach(kw => {
                        console.log(`     - "${kw.keyword}": ${kw.volume.toLocaleString()} searches, $${kw.cpc.toFixed(2)} CPC`);
                    });
                console.log('');
            });
            
            // Summary
            console.log('SUMMARY:');
            console.log('--------');
            console.log(`Categories Analyzed: ${categoryData.size}`);
            console.log(`Total Keywords: ${results.length}`);
            console.log(`Total Search Volume: ${results.reduce((sum, r) => sum + (r.search_volume || 0), 0).toLocaleString()}`);
            
        } else {
            console.log('No data received from API');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

quickTest();