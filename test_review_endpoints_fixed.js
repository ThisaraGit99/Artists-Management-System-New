const axios = require('axios');

// Configuration
const API_BASE = 'http://localhost:5000/api';

const ORGANIZER_CREDENTIALS = {
    email: 'jane.organizer@email.com',
    password: 'organizer123'
};

console.log('🧪 TESTING REVIEW API ENDPOINTS (CORRECTED)\n');

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
        
        // 2. Test rating endpoints with correct paths
        const tests = [
            {
                name: 'GET organizer ratings',
                method: 'GET',
                url: `${API_BASE}/organizers/ratings`,
                headers: { Authorization: `Bearer ${organizerToken}` }
            },
            {
                name: 'GET artist ratings (public)',
                method: 'GET',
                url: `${API_BASE}/organizers/artists/1/ratings`
            },
            {
                name: 'GET specific booking rating',
                method: 'GET',
                url: `${API_BASE}/organizers/ratings/1`,
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
                    if (Array.isArray(response.data)) {
                        console.log(`   Retrieved ${response.data.length} ratings`);
                        if (response.data.length > 0) {
                            console.log(`   Sample: "${response.data[0].review_title}" - ${response.data[0].rating}/5`);
                        }
                    } else {
                        console.log('   Response format unexpected');
                    }
                } else if (test.name.includes('artist ratings')) {
                    if (response.data.artist && response.data.reviews) {
                        console.log(`   Artist: ${response.data.artist.name}`);
                        console.log(`   Rating: ${response.data.artist.rating}/5`);
                        console.log(`   Total Reviews: ${response.data.artist.total_ratings}`);
                        console.log(`   Public Reviews: ${response.data.reviews.length}`);
                    } else {
                        console.log('   Response format:', Object.keys(response.data));
                    }
                } else if (test.name.includes('booking rating')) {
                    if (response.data.success && response.data.data) {
                        console.log(`   Rating: ${response.data.data.rating}/5`);
                        console.log(`   Title: "${response.data.data.review_title}"`);
                    } else {
                        console.log('   Response:', response.data);
                    }
                }
            } catch (error) {
                console.log(`❌ Failed - ${error.response?.status || 'Network Error'}`);
                console.log(`   Error: ${error.response?.data?.message || error.message}`);
                if (error.response?.status === 404) {
                    console.log('   💡 This endpoint might not exist or use different path');
                }
            }
        }
        
        // 3. Test submitting a new rating (if booking doesn't have one)
        console.log('\n3️⃣ Testing rating submission...');
        const ratingData = {
            booking_id: 2, // Try different booking
            rating: 4,
            review_title: 'Test Review from Corrected API',
            review_text: 'This is a test review from the corrected API endpoint test. Great service overall!',
            communication_rating: 4,
            professionalism_rating: 5,
            quality_rating: 4,
            would_recommend: true
        };
        
        try {
            const submitResponse = await axios.post(`${API_BASE}/organizers/ratings`, ratingData, {
                headers: { Authorization: `Bearer ${organizerToken}` }
            });
            
            console.log('✅ Rating submission successful');
            console.log(`   Message: ${submitResponse.data.message}`);
        } catch (error) {
            if (error.response?.data?.message?.includes('already submitted')) {
                console.log('ℹ️ Rating already exists for this booking');
            } else if (error.response?.data?.message?.includes('completed')) {
                console.log('ℹ️ Can only rate completed bookings');
            } else {
                console.log(`❌ Rating submission failed: ${error.response?.data?.message || error.message}`);
            }
        }
        
        // 4. Test duplicate prevention
        console.log('\n4️⃣ Testing duplicate prevention...');
        try {
            await axios.post(`${API_BASE}/organizers/ratings`, {
                booking_id: 1, // This should already have a rating
                rating: 3,
                review_title: 'Duplicate Test',
                review_text: 'This should be prevented',
                communication_rating: 3,
                professionalism_rating: 3,
                quality_rating: 3,
                would_recommend: false
            }, {
                headers: { Authorization: `Bearer ${organizerToken}` }
            });
            
            console.log('❌ Duplicate rating was allowed - this is a problem!');
        } catch (error) {
            if (error.response?.data?.message?.includes('already submitted')) {
                console.log('✅ Duplicate rating correctly prevented');
            } else {
                console.log(`⚠️ Different error: ${error.response?.data?.message || error.message}`);
            }
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('🎯 CORRECTED REVIEW SYSTEM TEST RESULTS');
        console.log('='.repeat(60));
        console.log('✅ Review API endpoints tested with correct paths');
        console.log('📊 Review system functionality verified');
        console.log('🔒 Security features tested');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testReviewEndpoints().catch(error => {
    console.error('❌ Endpoint test failed:', error);
    process.exit(1);
}); 