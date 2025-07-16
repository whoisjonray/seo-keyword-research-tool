// Test DataForSEO API calls
// Run this in the browser console to test the APIs

// Your DataForSEO credentials
const DATAFORSEO_USERNAME = 'jonray@tresr.com';
const DATAFORSEO_PASSWORD = 'ad95632e30d150ab';

// Test 1: Domain Rank Overview (Historical Data)
async function testDomainRankOverview() {
    console.log('Testing Domain Rank Overview API...');
    
    const credentials = btoa(`${DATAFORSEO_USERNAME}:${DATAFORSEO_PASSWORD}`);
    const domain = 'johnsonmediaco.com';
    
    const requestBody = [{
        target: domain,
        location_name: "United States",
        language_name: "English"
    }];
    
    console.log('Request body:', requestBody);
    
    try {
        const response = await fetch('https://api.dataforseo.com/v3/dataforseo_labs/google/domain_rank_overview/live', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        const data = await response.json();
        console.log('Domain Rank Overview Response:', data);
        
        if (data.tasks && data.tasks[0] && data.tasks[0].result) {
            console.log('Result:', data.tasks[0].result[0]);
        }
        
        return data;
    } catch (error) {
        console.error('Domain Rank Overview Error:', error);
    }
}

// Test 2: Historical Rank Overview (if available)
async function testHistoricalRankOverview() {
    console.log('Testing Historical Rank Overview API...');
    
    const credentials = btoa(`${DATAFORSEO_USERNAME}:${DATAFORSEO_PASSWORD}`);
    const domain = 'johnsonmediaco.com';
    
    const today = new Date();
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(today.getDate() - 90);
    
    const requestBody = [{
        target: domain,
        location_code: 2840,
        language_code: "en",
        date_from: ninetyDaysAgo.toISOString().split('T')[0],
        date_to: today.toISOString().split('T')[0]
    }];
    
    console.log('Request body:', requestBody);
    
    try {
        const response = await fetch('https://api.dataforseo.com/v3/dataforseo_labs/google/historical_rank_overview/live', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        const data = await response.json();
        console.log('Historical Rank Overview Response:', data);
        
        if (data.tasks && data.tasks[0] && data.tasks[0].result) {
            console.log('Result:', data.tasks[0].result[0]);
        }
        
        return data;
    } catch (error) {
        console.error('Historical Rank Overview Error:', error);
    }
}

// Test 3: SERP API for current rankings
async function testSerpAPI() {
    console.log('Testing SERP API...');
    
    const credentials = btoa(`${DATAFORSEO_USERNAME}:${DATAFORSEO_PASSWORD}`);
    const testKeyword = 'austin video production';
    
    const requestBody = [{
        keyword: testKeyword,
        location_code: 2840,
        language_code: "en",
        device: "desktop",
        depth: 100
    }];
    
    console.log('Request body:', requestBody);
    
    try {
        const response = await fetch('https://api.dataforseo.com/v3/serp/google/organic/live/advanced', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        const data = await response.json();
        console.log('SERP API Response:', data);
        
        if (data.tasks && data.tasks[0] && data.tasks[0].result) {
            const items = data.tasks[0].result[0].items || [];
            console.log('Total results:', items.length);
            
            // Look for johnsonmediaco.com in results
            const jmcoResult = items.find(item => 
                item.domain && item.domain.includes('johnsonmediaco.com')
            );
            
            if (jmcoResult) {
                console.log('Found JMCo at position:', jmcoResult.rank_absolute);
                console.log('JMCo result:', jmcoResult);
            } else {
                console.log('JMCo not found in top 100 for this keyword');
            }
        }
        
        return data;
    } catch (error) {
        console.error('SERP API Error:', error);
    }
}

// Test 4: Available Locations
async function testAvailableLocations() {
    console.log('Testing Available Locations API...');
    
    const credentials = btoa(`${DATAFORSEO_USERNAME}:${DATAFORSEO_PASSWORD}`);
    
    try {
        const response = await fetch('https://api.dataforseo.com/v3/dataforseo_labs/locations_and_languages', {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        console.log('Locations Response:', data);
        
        // Find US location
        if (data.tasks && data.tasks[0] && data.tasks[0].result) {
            const usLocations = data.tasks[0].result.filter(loc => 
                loc.location_name && loc.location_name.includes('United States')
            ).slice(0, 5);
            console.log('US Locations:', usLocations);
        }
        
        return data;
    } catch (error) {
        console.error('Locations API Error:', error);
    }
}

// Run all tests
async function runAllTests() {
    console.log('=== Starting DataForSEO API Tests ===');
    
    // Test 1: Domain Rank Overview
    await testDomainRankOverview();
    console.log('\n---\n');
    
    // Test 2: Historical Rank Overview
    await testHistoricalRankOverview();
    console.log('\n---\n');
    
    // Test 3: SERP API
    await testSerpAPI();
    console.log('\n---\n');
    
    // Test 4: Available Locations
    await testAvailableLocations();
    
    console.log('=== Tests Complete ===');
}

// To run tests, paste this in console and then run:
// runAllTests()

console.log('Test script loaded. Run runAllTests() to test all APIs');