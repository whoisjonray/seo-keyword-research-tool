// Copy and paste this into the browser console at https://seo-keyword-research-tool-production.up.railway.app/

// Test DataForSEO Domain Rank Overview
const testDomainRankOverview = async () => {
    const credentials = btoa('jonray@tresr.com:ad95632e30d150ab');
    
    // Try different parameter combinations
    const tests = [
        {
            name: "Test 1: location_name only",
            body: [{
                target: "johnsonmediaco.com",
                location_name: "United States",
                language_name: "English"
            }]
        },
        {
            name: "Test 2: location_code only",
            body: [{
                target: "johnsonmediaco.com",
                location_code: 2840,
                language_code: "en"
            }]
        },
        {
            name: "Test 3: minimal params",
            body: [{
                target: "johnsonmediaco.com"
            }]
        }
    ];
    
    for (const test of tests) {
        console.log(`\n=== ${test.name} ===`);
        console.log('Request:', test.body);
        
        try {
            const response = await fetch('https://api.dataforseo.com/v3/dataforseo_labs/google/domain_rank_overview/live', {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(test.body)
            });
            
            const data = await response.json();
            
            if (data.status_code === 20000) {
                console.log('✅ Success!');
                if (data.tasks?.[0]?.result?.[0]) {
                    console.log('Metrics:', data.tasks[0].result[0].metrics);
                }
            } else {
                console.log('❌ Error:', data.status_message || 'Unknown error');
                if (data.tasks?.[0]?.status_message) {
                    console.log('Task error:', data.tasks[0].status_message);
                }
            }
        } catch (error) {
            console.log('❌ Network error:', error.message);
        }
    }
};

// Test SERP API
const testSerpAPI = async () => {
    const credentials = btoa('jonray@tresr.com:ad95632e30d150ab');
    
    console.log('\n=== Testing SERP API ===');
    
    const response = await fetch('https://api.dataforseo.com/v3/serp/google/organic/live/advanced', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify([{
            keyword: "austin video production",
            location_code: 2840,
            language_code: "en",
            device: "desktop",
            depth: 100
        }])
    });
    
    const data = await response.json();
    
    if (data.status_code === 20000) {
        console.log('✅ SERP API Success!');
        const items = data.tasks?.[0]?.result?.[0]?.items || [];
        console.log('Total results:', items.length);
        
        const jmco = items.find(item => item.domain?.includes('johnsonmediaco.com'));
        if (jmco) {
            console.log('Found johnsonmediaco.com at position:', jmco.rank_absolute);
        } else {
            console.log('johnsonmediaco.com not found in top 100');
        }
    } else {
        console.log('❌ SERP API Error:', data.status_message);
    }
};

// Run both tests
console.log('Starting DataForSEO API tests...');
testDomainRankOverview().then(() => testSerpAPI());