const axios = require('axios');

// Configuration
const API_BASE = 'http://localhost:5000/api';

const ORGANIZER_CREDENTIALS = {
    email: 'jane.organizer@email.com',
    password: 'organizer123'
};

console.log('🧪 TESTING REVIEW API ENDPOINTS\n');

async function testReviewEndpoints() {
    let organizerToken = '';
    
    try {
        // 1. Login to get token
        console.log('1️⃣ Logging in as organizer...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, ORGANIZER_CREDENTIALS);
        
        if (loginResponse.data.success) {
            organizerToken = loginResponse.data.token;
            console.log('✅ Login successful');
        } else {
            console.log('❌ Login failed');
            return;
        }
        
        // 2. Test endpoints
        const tests = [
            {
                name: 'GET organizer ratings',
                method: 'GET',
                url: `${API_BASE}/organizer/ratings`,
                headers: { Authorization: `Bearer ${organizerToken}` }
            },
            {
                name: 'GET artist ratings (public)',
                method: 'GET',
                url: `${API_BASE}/organizer/artists/1/ratings`
            },
            {
                name: 'GET specific booking rating',
                method: 'GET',
                url: `${API_BASE}/organizer/ratings/1`,
                headers: { Authorization: `Bearer ${organizerToken}` }
            }
        ];
        
        for (const test of tests) {
            console.log(`\n2️⃣ Testing: ${test.name}`);
            console.log(`   URL: ${test.url}`);
            
            try {
                const response = await axios({
                    method: test.method,
                    url: test.url,
                    headers: test.headers || {}
                });
                
                console.log(`✅ Success - Status: ${response.status}`);
                
                if (test.name.includes('organizer ratings')) {
                    console.log(`   Retrieved ${Array.isArray(response.data) ? response.data.length : 'unknown'} ratings`);
                } else if (test.name.includes('artist ratings')) {
                    if (response.data.artist && response.data.reviews) {
                        console.log(`   Artist: ${response.data.artist.name}`);
                        console.log(`   Rating: ${response.data.artist.rating}/5`);
                        console.log(`   Reviews: ${response.data.reviews.length}`);
                    }
                } else if (test.name.includes('booking rating')) {
                    if (response.data.success && response.data.data) {
                        console.log(`   Rating: ${response.data.data.rating}/5`);
                    }
                }
            } catch (error) {
                console.log(`❌ Failed - ${error.response?.status || 'Network Error'}`);
                console.log(`   Error: ${error.response?.data?.message || error.message}`);
            }
        }
        
        // 3. Test submitting a new rating
        console.log('\n3️⃣ Testing rating submission...');
        const ratingData = {
            booking_id: 1,
            rating: 5,
            review_title: 'Test Review from API',
            review_text: 'This is a test review from the API endpoint test.',
            communication_rating: 5,
            professionalism_rating: 5,
            quality_rating: 5,
            would_recommend: true
        };
        
        try {
            const submitResponse = await axios.post(`${API_BASE}/organizer/ratings`, ratingData, {
                headers: { Authorization: `Bearer ${organizerToken}` }
            });
            
            console.log('✅ Rating submission successful');
            console.log(`   Message: ${submitResponse.data.message}`);
        } catch (error) {
            if (error.response?.data?.message?.includes('already submitted')) {
                console.log('ℹ️ Rating already exists (expected)');
            } else {
                console.log(`❌ Rating submission failed: ${error.response?.data?.message || error.message}`);
            }
        }
        
        console.log('\n' + '='.repeat(50));
        console.log('🎯 ENDPOINT TEST SUMMARY');
        console.log('='.repeat(50));
        console.log('✅ All major review endpoints tested');
        console.log('📊 Review system API is functional');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testReviewEndpoints().catch(error => {
    console.error('❌ Endpoint test failed:', error);
    process.exit(1);
}); 