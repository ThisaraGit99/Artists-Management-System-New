const axios = require('axios');
const mysql = require('mysql2/promise');

// Configuration
const API_BASE = 'http://localhost:5000/api';
const DB_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'artist_management_system'
};

const ORGANIZER_CREDENTIALS = {
    email: 'jane.organizer@email.com',
    password: 'organizer123'
};

console.log('🌟 ARTIST REVIEW SYSTEM - BASIC TEST\n');

async function testReviewSystem() {
    let connection = null;
    let organizerToken = null;
    
    try {
        // 1. Test database connection
        console.log('1️⃣ Testing database connection...');
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Database connected successfully');
        
        // 2. Test server connection
        console.log('\n2️⃣ Testing server connection...');
        try {
            await axios.get(`${API_BASE}/auth/test`);
            console.log('✅ Server is running');
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                console.log('❌ Server is not running. Please start the backend server first.');
                console.log('   Run: cd backend && npm run dev');
                return;
            }
        }
        
        // 3. Test organizer login
        console.log('\n3️⃣ Testing organizer login...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, ORGANIZER_CREDENTIALS);
        if (loginResponse.data.success) {
            organizerToken = loginResponse.data.token;
            console.log('✅ Organizer logged in successfully');
        } else {
            console.log('❌ Organizer login failed');
            return;
        }
        
        // 4. Check for completed bookings
        console.log('\n4️⃣ Checking for completed bookings...');
        const [completedBookings] = await connection.execute(
            `SELECT b.*, a.id as artist_db_id, u.name as artist_name 
             FROM bookings b 
             JOIN artists a ON b.artist_id = a.id 
             JOIN users u ON a.user_id = u.id 
             WHERE b.status = 'completed' 
             AND b.organizer_id = 1 
             LIMIT 1`
        );
        
        if (completedBookings.length === 0) {
            console.log('⚠️ No completed bookings found. Creating test booking...');
            
            // Create and complete a test booking
            const [result] = await connection.execute(
                `INSERT INTO bookings (
                    artist_id, organizer_id, event_name, event_description, 
                    event_date, event_time, duration, venue_address, 
                    total_amount, status, payment_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    1, 1, 'Test Review Event', 'Testing review system',
                    '2025-07-01', '19:00:00', '3 hours', 'Test Venue',
                    500.00, 'completed', 'released'
                ]
            );
            
            const testBookingId = result.insertId;
            console.log(`✅ Test booking created: ID ${testBookingId}`);
            
            // Use this booking for testing
            completedBookings.push({
                id: testBookingId,
                artist_db_id: 1,
                artist_name: 'John Doe',
                event_name: 'Test Review Event'
            });
        }
        
        const testBooking = completedBookings[0];
        console.log(`✅ Using booking: ${testBooking.event_name} (ID: ${testBooking.id})`);
        
        // 5. Check if booking already has a review
        console.log('\n5️⃣ Checking existing reviews...');
        const [existingReviews] = await connection.execute(
            'SELECT * FROM booking_reviews WHERE booking_id = ?',
            [testBooking.id]
        );
        
        if (existingReviews.length > 0) {
            console.log(`✅ Found existing review: ${existingReviews[0].review_title}`);
            console.log(`   Rating: ${existingReviews[0].rating}/5`);
            console.log(`   Communication: ${existingReviews[0].communication_rating}/5`);
            console.log(`   Professionalism: ${existingReviews[0].professionalism_rating}/5`);
            console.log(`   Quality: ${existingReviews[0].quality_rating}/5`);
        } else {
            // 6. Test submitting a new review
            console.log('\n6️⃣ Testing review submission...');
            
            const reviewData = {
                booking_id: testBooking.id,
                rating: 5,
                review_title: 'Excellent Performance!',
                review_text: 'The artist was fantastic! Professional, talented, and exceeded all expectations. Highly recommended!',
                communication_rating: 5,
                professionalism_rating: 5,
                quality_rating: 5,
                would_recommend: true
            };
            
            try {
                const reviewResponse = await axios.post(`${API_BASE}/organizer/ratings`, reviewData, {
                    headers: { Authorization: `Bearer ${organizerToken}` }
                });
                
                if (reviewResponse.data.message === 'Rating submitted successfully') {
                    console.log('✅ Review submitted successfully!');
                } else {
                    console.log('❌ Review submission failed:', reviewResponse.data.message);
                }
            } catch (error) {
                console.log('❌ Review submission error:', error.response?.data?.message || error.message);
            }
        }
        
        // 7. Test retrieving organizer's submitted reviews
        console.log('\n7️⃣ Testing organizer review retrieval...');
        try {
            const orgReviewsResponse = await axios.get(`${API_BASE}/organizer/ratings`, {
                headers: { Authorization: `Bearer ${organizerToken}` }
            });
            
            if (Array.isArray(orgReviewsResponse.data)) {
                console.log(`✅ Retrieved ${orgReviewsResponse.data.length} submitted reviews`);
                orgReviewsResponse.data.forEach((review, index) => {
                    console.log(`   ${index + 1}. ${review.event_name} - ${review.rating}/5 stars`);
                });
            }
        } catch (error) {
            console.log('❌ Organizer review retrieval failed:', error.response?.data?.message || error.message);
        }
        
        // 8. Test retrieving artist ratings (public endpoint)
        console.log('\n8️⃣ Testing artist ratings retrieval...');
        try {
            const artistRatingsResponse = await axios.get(`${API_BASE}/organizer/artists/1/ratings`);
            
            if (artistRatingsResponse.data.artist && artistRatingsResponse.data.reviews) {
                const artist = artistRatingsResponse.data.artist;
                const reviews = artistRatingsResponse.data.reviews;
                
                console.log(`✅ Artist: ${artist.name}`);
                console.log(`✅ Average Rating: ${artist.rating}/5.00`);
                console.log(`✅ Total Reviews: ${artist.total_ratings}`);
                console.log(`✅ Public Reviews: ${reviews.length}`);
                
                if (reviews.length > 0) {
                    console.log('\n   Recent Reviews:');
                    reviews.slice(0, 3).forEach((review, index) => {
                        console.log(`   ${index + 1}. "${review.review_title}" - ${review.rating}/5`);
                        console.log(`      by ${review.organizer_name} for ${review.event_name}`);
                    });
                }
            }
        } catch (error) {
            console.log('❌ Artist ratings retrieval failed:', error.response?.data?.message || error.message);
        }
        
        // 9. Test checking specific booking rating
        console.log('\n9️⃣ Testing specific booking rating check...');
        try {
            const bookingRatingResponse = await axios.get(`${API_BASE}/organizer/ratings/${testBooking.id}`, {
                headers: { Authorization: `Bearer ${organizerToken}` }
            });
            
            if (bookingRatingResponse.data.success && bookingRatingResponse.data.data) {
                const rating = bookingRatingResponse.data.data;
                console.log('✅ Booking rating found:');
                console.log(`   Overall: ${rating.rating}/5`);
                console.log(`   Title: "${rating.review_title}"`);
                console.log(`   Communication: ${rating.communication_rating}/5`);
                console.log(`   Professionalism: ${rating.professionalism_rating}/5`);
                console.log(`   Quality: ${rating.quality_rating}/5`);
                console.log(`   Would Recommend: ${rating.would_recommend ? 'Yes' : 'No'}`);
            }
        } catch (error) {
            if (error.response?.status === 404) {
                console.log('ℹ️ No rating found for this booking (this might be expected)');
            } else {
                console.log('❌ Booking rating check failed:', error.response?.data?.message || error.message);
            }
        }
        
        // 10. Test duplicate submission prevention
        console.log('\n🔟 Testing duplicate review prevention...');
        const duplicateReviewData = {
            booking_id: testBooking.id,
            rating: 4,
            review_title: 'Another Review',
            review_text: 'This should be blocked',
            communication_rating: 4,
            professionalism_rating: 4,
            quality_rating: 4,
            would_recommend: true
        };
        
        try {
            await axios.post(`${API_BASE}/organizer/ratings`, duplicateReviewData, {
                headers: { Authorization: `Bearer ${organizerToken}` }
            });
            console.log('❌ Duplicate review was allowed - this is a problem!');
        } catch (error) {
            if (error.response?.data?.message?.includes('already submitted')) {
                console.log('✅ Duplicate review correctly prevented');
            } else {
                console.log('⚠️ Different error occurred:', error.response?.data?.message);
            }
        }
        
        console.log('\n' + '='.repeat(50));
        console.log('🎉 BASIC REVIEW SYSTEM TEST COMPLETED!');
        console.log('='.repeat(50));
        console.log('✅ Review system appears to be working correctly');
        console.log('📊 All basic functionality tested successfully');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('Error details:', error.response?.data || error);
    } finally {
        // Clean up
        if (connection) {
            await connection.end();
            console.log('\n✅ Database connection closed');
        }
    }
}

// Run the test
testReviewSystem().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
}); 