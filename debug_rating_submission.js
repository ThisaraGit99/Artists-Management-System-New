const axios = require('axios');

// Configuration
const API_BASE = 'http://localhost:5000/api';

const ORGANIZER_CREDENTIALS = {
    email: 'jane.organizer@email.com',
    password: 'organizer123'
};

console.log('🔧 DEBUGGING RATING SUBMISSION ISSUE\n');

async function debugRatingSubmission() {
    let organizerToken = '';
    
    try {
        // 1. Test login first
        console.log('1️⃣ Testing organizer login...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, ORGANIZER_CREDENTIALS);
        
        if (loginResponse.data.success) {
            organizerToken = loginResponse.data.token;
            console.log('✅ Login successful');
            console.log(`   Token: ${organizerToken.substring(0, 20)}...`);
        } else {
            console.log('❌ Login failed:', loginResponse.data);
            return;
        }

        // 2. Test if organizer routes are accessible
        console.log('\n2️⃣ Testing organizer route access...');
        try {
            const profileResponse = await axios.get(`${API_BASE}/organizers/profile`, {
                headers: { Authorization: `Bearer ${organizerToken}` }
            });
            console.log('✅ Organizer routes accessible');
        } catch (error) {
            console.log('❌ Organizer route access failed:', error.response?.data?.message || error.message);
            if (error.response?.status === 401) {
                console.log('   🔒 Authentication issue detected');
            }
        }

        // 3. Check available bookings for rating
        console.log('\n3️⃣ Checking available bookings...');
        try {
            const bookingsResponse = await axios.get(`${API_BASE}/organizers/bookings`, {
                headers: { Authorization: `Bearer ${organizerToken}` }
            });
            
            if (bookingsResponse.data.success && bookingsResponse.data.data) {
                const completedBookings = bookingsResponse.data.data.filter(b => b.status === 'completed');
                console.log(`✅ Found ${completedBookings.length} completed bookings available for rating`);
                
                if (completedBookings.length > 0) {
                    const booking = completedBookings[0];
                    console.log(`   Using booking: ${booking.event_name} (ID: ${booking.id})`);
                    return booking.id;
                }
            }
        } catch (error) {
            console.log('❌ Could not fetch bookings:', error.response?.data?.message || error.message);
        }

        // 4. Test with a known booking ID from database
        console.log('\n4️⃣ Testing rating submission with test data...');
        
        const testRatingData = {
            booking_id: 1, // Using a known booking ID
            rating: 4,
            review_title: 'Debug Test Rating',
            review_text: 'This is a debug test to identify the rating submission issue.',
            communication_rating: 4,
            professionalism_rating: 4,
            quality_rating: 4,
            would_recommend: true
        };

        console.log('📤 Submitting test rating...');
        console.log(`   URL: ${API_BASE}/organizers/ratings`);
        console.log(`   Data:`, JSON.stringify(testRatingData, null, 2));
        console.log(`   Headers: Authorization: Bearer ${organizerToken.substring(0, 20)}...`);

        try {
            const ratingResponse = await axios.post(`${API_BASE}/organizers/ratings`, testRatingData, {
                headers: { 
                    'Authorization': `Bearer ${organizerToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('✅ Rating submission successful!');
            console.log(`   Response:`, ratingResponse.data);
            
        } catch (error) {
            console.log('❌ Rating submission FAILED');
            console.log(`   Status: ${error.response?.status}`);
            console.log(`   Error: ${error.response?.data?.message || error.message}`);
            console.log(`   Full response:`, error.response?.data);
            
            // Provide specific troubleshooting based on error
            if (error.response?.status === 401) {
                console.log('\n🔍 ISSUE: Authentication/Authorization problem');
                console.log('   Possible causes:');
                console.log('   - Token expired or invalid');
                console.log('   - User not verified as organizer');
                console.log('   - Middleware authentication failure');
            } else if (error.response?.status === 404) {
                console.log('\n🔍 ISSUE: Route not found');
                console.log('   Possible causes:');
                console.log('   - Rating routes not properly mounted');
                console.log('   - Backend server route configuration issue');
            } else if (error.response?.status === 400) {
                console.log('\n🔍 ISSUE: Bad request');
                console.log('   Possible causes:');
                console.log('   - Missing required fields');
                console.log('   - Invalid data format');
                console.log('   - Business logic validation failure');
            } else if (error.response?.status === 500) {
                console.log('\n🔍 ISSUE: Server error');
                console.log('   Possible causes:');
                console.log('   - Database connection problem');
                console.log('   - Backend code error');
                console.log('   - Missing database tables');
            }
        }

        // 5. Test the exact same call that frontend makes
        console.log('\n5️⃣ Testing frontend-style API call...');
        try {
            // This mimics exactly what the frontend RatingModal does
            const frontendStyleData = {
                booking_id: 1,
                rating: 5,
                review_title: 'Frontend Test Rating',
                review_text: 'Testing the exact same call pattern as frontend',
                communication_rating: 5,
                professionalism_rating: 5,
                quality_rating: 5,
                would_recommend: true
            };

            const frontendResponse = await axios.post('/api/organizer/ratings', frontendStyleData, {
                baseURL: 'http://localhost:5000',
                headers: { 
                    'Authorization': `Bearer ${organizerToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('✅ Frontend-style call successful!');
            
        } catch (error) {
            console.log('❌ Frontend-style call failed:', error.response?.data?.message || error.message);
            console.log('\n💡 SOLUTION: Frontend is calling wrong endpoint!');
            console.log('   Frontend calls: /api/organizer/ratings');
            console.log('   Correct endpoint: /api/organizers/ratings');
            console.log('   Fix: Update frontend RatingModal.js');
        }

    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    }
}

// Run the debug
debugRatingSubmission().catch(error => {
    console.error('❌ Debug script failed:', error);
    process.exit(1);
}); 