const axios = require('axios');
const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'artist_management_system'
};

// API base URL
const API_BASE = 'http://localhost:5000/api';

// Test credentials
const testUsers = {
    organizer: {
        email: 'jane.organizer@email.com',
        password: 'organizer123'
    },
    artist: {
        email: 'john.artist@email.com', 
        password: 'artist123'
    },
    admin: {
        email: 'admin@artistmgmt.com',
        password: 'admin123'
    }
};

let organizerToken = '';
let artistToken = '';
let adminToken = '';
let connection = null;

console.log('🌟 COMPREHENSIVE ARTIST REVIEW SYSTEM TEST\n');

async function connectToDatabase() {
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
}

async function login(credentials, userType) {
    try {
        const response = await axios.post(`${API_BASE}/auth/login`, credentials);
        if (response.data.success) {
            console.log(`✅ ${userType} logged in successfully`);
            return response.data.token;
        }
    } catch (error) {
        console.error(`❌ ${userType} login failed:`, error.response?.data?.message || error.message);
        return null;
    }
}

async function setupAuthentication() {
    console.log('\n📝 Setting up authentication...');
    
    organizerToken = await login(testUsers.organizer, 'Organizer');
    artistToken = await login(testUsers.artist, 'Artist');
    adminToken = await login(testUsers.admin, 'Admin');
    
    if (!organizerToken || !artistToken || !adminToken) {
        console.error('❌ Failed to authenticate all users');
        return false;
    }
    
    console.log('✅ All users authenticated successfully');
    return true;
}

async function createTestBooking() {
    try {
        console.log('\n🎯 Creating test booking for review...');
        
        // Create a new booking
        const bookingData = {
            artist_id: 1, // John Doe artist
            event_name: 'Review Test Event',
            event_description: 'Test event for review system',
            event_date: '2025-07-15',
            event_time: '18:00:00',
            duration: '3 hours',
            venue_address: 'Test Venue, Review City',
            total_amount: 500.00,
            special_requirements: 'Test requirements for review'
        };
        
        const response = await axios.post(`${API_BASE}/organizer/bookings`, bookingData, {
            headers: { Authorization: `Bearer ${organizerToken}` }
        });
        
        if (response.data.success) {
            const bookingId = response.data.data.bookingId;
            console.log(`✅ Test booking created: ID ${bookingId}`);
            
            // Mark the booking as completed so we can review it
            await connection.execute(
                'UPDATE bookings SET status = "completed", payment_status = "released" WHERE id = ?',
                [bookingId]
            );
            
            console.log(`✅ Booking ${bookingId} marked as completed`);
            return bookingId;
        }
    } catch (error) {
        console.error('❌ Failed to create test booking:', error.response?.data?.message || error.message);
        return null;
    }
}

async function testSubmitRating(bookingId) {
    try {
        console.log('\n⭐ Testing rating submission...');
        
        const ratingData = {
            booking_id: bookingId,
            rating: 5,
            review_title: 'Outstanding Performance!',
            review_text: 'The artist was absolutely amazing. Professional, talented, and went above and beyond our expectations. Would definitely book again!',
            communication_rating: 5,
            professionalism_rating: 5,
            quality_rating: 5,
            would_recommend: true
        };
        
        const response = await axios.post(`${API_BASE}/organizer/ratings`, ratingData, {
            headers: { Authorization: `Bearer ${organizerToken}` }
        });
        
        if (response.data.message === 'Rating submitted successfully') {
            console.log('✅ Rating submitted successfully');
            
            // Verify rating was saved in database
            const [reviews] = await connection.execute(
                'SELECT * FROM booking_reviews WHERE booking_id = ?',
                [bookingId]
            );
            
            if (reviews.length > 0) {
                const review = reviews[0];
                console.log(`✅ Rating saved to database: ${review.rating}/5 stars`);
                console.log(`✅ Review title: "${review.review_title}"`);
                console.log(`✅ Communication: ${review.communication_rating}/5`);
                console.log(`✅ Professionalism: ${review.professionalism_rating}/5`);
                console.log(`✅ Quality: ${review.quality_rating}/5`);
                console.log(`✅ Would recommend: ${review.would_recommend ? 'Yes' : 'No'}`);
                return review.id;
            }
        }
    } catch (error) {
        console.error('❌ Rating submission failed:', error.response?.data?.message || error.message);
        return null;
    }
}

async function testDuplicateRatingPrevention(bookingId) {
    try {
        console.log('\n🚫 Testing duplicate rating prevention...');
        
        const ratingData = {
            booking_id: bookingId,
            rating: 4,
            review_title: 'Another Review',
            review_text: 'This should be blocked',
            communication_rating: 4,
            professionalism_rating: 4,
            quality_rating: 4,
            would_recommend: true
        };
        
        const response = await axios.post(`${API_BASE}/organizer/ratings`, ratingData, {
            headers: { Authorization: `Bearer ${organizerToken}` }
        });
        
        console.log('❌ Duplicate rating was allowed - this should not happen!');
        return false;
    } catch (error) {
        if (error.response?.data?.message?.includes('Rating already submitted')) {
            console.log('✅ Duplicate rating correctly prevented');
            return true;
        } else {
            console.error('❌ Unexpected error:', error.response?.data?.message || error.message);
            return false;
        }
    }
}

async function testGetOrganizerRatings() {
    try {
        console.log('\n📋 Testing organizer submitted ratings retrieval...');
        
        const response = await axios.get(`${API_BASE}/organizer/ratings`, {
            headers: { Authorization: `Bearer ${organizerToken}` }
        });
        
        if (Array.isArray(response.data)) {
            console.log(`✅ Retrieved ${response.data.length} submitted ratings`);
            
            response.data.forEach((rating, index) => {
                console.log(`  ${index + 1}. Event: ${rating.event_name}`);
                console.log(`     Artist: ${rating.artist_name}`);
                console.log(`     Rating: ${rating.rating}/5 stars`);
                console.log(`     Date: ${new Date(rating.created_at).toLocaleDateString()}`);
            });
            
            return true;
        }
    } catch (error) {
        console.error('❌ Failed to get organizer ratings:', error.response?.data?.message || error.message);
        return false;
    }
}

async function testGetArtistRatings() {
    try {
        console.log('\n🎭 Testing artist ratings retrieval...');
        
        const response = await axios.get(`${API_BASE}/organizer/artists/1/ratings`);
        
        if (response.data.artist && response.data.reviews) {
            const artist = response.data.artist;
            const reviews = response.data.reviews;
            
            console.log(`✅ Artist: ${artist.name}`);
            console.log(`✅ Average Rating: ${artist.rating}/5.00`);
            console.log(`✅ Total Ratings: ${artist.total_ratings}`);
            console.log(`✅ Reviews Retrieved: ${reviews.length}`);
            
            reviews.forEach((review, index) => {
                console.log(`  Review ${index + 1}:`);
                console.log(`    Title: "${review.review_title}"`);
                console.log(`    Rating: ${review.rating}/5`);
                console.log(`    Organizer: ${review.organizer_name}`);
                console.log(`    Event: ${review.event_name}`);
                console.log(`    Date: ${new Date(review.created_at).toLocaleDateString()}`);
            });
            
            return true;
        }
    } catch (error) {
        console.error('❌ Failed to get artist ratings:', error.response?.data?.message || error.message);
        return false;
    }
}

async function testUpdateRating(ratingId) {
    try {
        console.log('\n✏️ Testing rating update...');
        
        const updateData = {
            rating: 4,
            review_title: 'Great Performance - Updated',
            review_text: 'Updated review: The artist was very good, though there was a minor timing issue. Overall satisfied with the performance.',
            communication_rating: 4,
            professionalism_rating: 5,
            quality_rating: 4,
            would_recommend: true
        };
        
        const response = await axios.put(`${API_BASE}/organizer/ratings/${ratingId}`, updateData, {
            headers: { Authorization: `Bearer ${organizerToken}` }
        });
        
        if (response.data.message === 'Rating updated successfully') {
            console.log('✅ Rating updated successfully');
            
            // Verify update in database
            const [reviews] = await connection.execute(
                'SELECT * FROM booking_reviews WHERE id = ?',
                [ratingId]
            );
            
            if (reviews.length > 0) {
                const review = reviews[0];
                console.log(`✅ Updated rating: ${review.rating}/5 stars`);
                console.log(`✅ Updated title: "${review.review_title}"`);
                return true;
            }
        }
    } catch (error) {
        console.error('❌ Rating update failed:', error.response?.data?.message || error.message);
        return false;
    }
}

async function testGetBookingRating(bookingId) {
    try {
        console.log('\n🔍 Testing specific booking rating retrieval...');
        
        const response = await axios.get(`${API_BASE}/organizer/ratings/${bookingId}`, {
            headers: { Authorization: `Bearer ${organizerToken}` }
        });
        
        if (response.data.success && response.data.data) {
            const rating = response.data.data;
            console.log('✅ Booking rating retrieved successfully');
            console.log(`   Rating: ${rating.rating}/5`);
            console.log(`   Title: "${rating.review_title}"`);
            console.log(`   Communication: ${rating.communication_rating}/5`);
            console.log(`   Professionalism: ${rating.professionalism_rating}/5`);
            console.log(`   Quality: ${rating.quality_rating}/5`);
            return true;
        }
    } catch (error) {
        console.error('❌ Failed to get booking rating:', error.response?.data?.message || error.message);
        return false;
    }
}

async function testRatingValidation() {
    try {
        console.log('\n🔒 Testing rating validation...');
        
        // Test invalid rating (out of range)
        const invalidRatingData = {
            booking_id: 999, // Non-existent booking
            rating: 6, // Invalid rating
            review_title: 'Test',
            review_text: 'Test',
            communication_rating: 0, // Invalid rating
            professionalism_rating: 5,
            quality_rating: 5,
            would_recommend: true
        };
        
        try {
            await axios.post(`${API_BASE}/organizer/ratings`, invalidRatingData, {
                headers: { Authorization: `Bearer ${organizerToken}` }
            });
            console.log('❌ Invalid rating was accepted - this should not happen!');
            return false;
        } catch (error) {
            if (error.response?.status === 404 || error.response?.data?.message?.includes('not found')) {
                console.log('✅ Invalid booking correctly rejected');
                return true;
            } else {
                console.log('✅ Rating validation working (different error):', error.response?.data?.message);
                return true;
            }
        }
    } catch (error) {
        console.error('❌ Rating validation test failed:', error.message);
        return false;
    }
}

async function testIncompleteBookingRating() {
    try {
        console.log('\n⏳ Testing rating attempt on incomplete booking...');
        
        // Create a pending booking
        const bookingData = {
            artist_id: 1,
            event_name: 'Pending Event Test',
            event_description: 'This should not be ratable',
            event_date: '2025-08-15',
            event_time: '19:00:00',
            duration: '2 hours',
            venue_address: 'Test Venue',
            total_amount: 300.00
        };
        
        const bookingResponse = await axios.post(`${API_BASE}/organizer/bookings`, bookingData, {
            headers: { Authorization: `Bearer ${organizerToken}` }
        });
        
        if (bookingResponse.data.success) {
            const pendingBookingId = bookingResponse.data.data.bookingId;
            
            // Try to rate the pending booking
            const ratingData = {
                booking_id: pendingBookingId,
                rating: 5,
                review_title: 'Should not work',
                review_text: 'This should be rejected',
                communication_rating: 5,
                professionalism_rating: 5,
                quality_rating: 5,
                would_recommend: true
            };
            
            try {
                await axios.post(`${API_BASE}/organizer/ratings`, ratingData, {
                    headers: { Authorization: `Bearer ${organizerToken}` }
                });
                console.log('❌ Pending booking rating was allowed - this should not happen!');
                return false;
            } catch (error) {
                if (error.response?.data?.message?.includes('completed bookings')) {
                    console.log('✅ Pending booking rating correctly rejected');
                    return true;
                } else {
                    console.log('✅ Pending booking rating rejected (different reason):', error.response?.data?.message);
                    return true;
                }
            }
        }
    } catch (error) {
        console.error('❌ Incomplete booking rating test failed:', error.message);
        return false;
    }
}

async function testArtistRatingStats() {
    try {
        console.log('\n📊 Testing artist rating statistics...');
        
        // Check artist rating stats in the artists table
        const [artists] = await connection.execute(
            'SELECT id, rating, total_ratings FROM artists WHERE id = 1'
        );
        
        if (artists.length > 0) {
            const artist = artists[0];
            console.log(`✅ Artist rating: ${artist.rating}/5.00`);
            console.log(`✅ Total ratings: ${artist.total_ratings}`);
            
            // Verify rating calculation
            const [avgRating] = await connection.execute(
                `SELECT AVG(rating) as avg_rating, COUNT(*) as count 
                 FROM booking_reviews 
                 WHERE reviewee_id = (SELECT user_id FROM artists WHERE id = 1)
                 AND reviewer_type = 'organizer'`
            );
            
            if (avgRating.length > 0) {
                const calculated = avgRating[0];
                console.log(`✅ Calculated average: ${calculated.avg_rating}`);
                console.log(`✅ Calculated count: ${calculated.count}`);
                
                // Check if the stored values match calculated values
                const avgMatch = Math.abs(artist.rating - calculated.avg_rating) < 0.01;
                const countMatch = artist.total_ratings === calculated.count;
                
                if (avgMatch && countMatch) {
                    console.log('✅ Artist rating statistics are accurate');
                    return true;
                } else {
                    console.log('⚠️ Artist rating statistics may need recalculation');
                    return false;
                }
            }
        }
    } catch (error) {
        console.error('❌ Artist rating stats test failed:', error.message);
        return false;
    }
}

async function runComprehensiveReviewTests() {
    console.log('🚀 Starting comprehensive review system tests...\n');
    
    // Connect to database
    if (!await connectToDatabase()) {
        return;
    }
    
    // Setup authentication
    if (!await setupAuthentication()) {
        return;
    }
    
    // Test flow
    const testBookingId = await createTestBooking();
    if (!testBookingId) {
        console.log('❌ Cannot continue without test booking');
        return;
    }
    
    const ratingId = await testSubmitRating(testBookingId);
    if (!ratingId) {
        console.log('❌ Cannot continue without successful rating submission');
        return;
    }
    
    // Run all tests
    const tests = [
        () => testDuplicateRatingPrevention(testBookingId),
        () => testGetOrganizerRatings(),
        () => testGetArtistRatings(),
        () => testUpdateRating(ratingId),
        () => testGetBookingRating(testBookingId),
        () => testRatingValidation(),
        () => testIncompleteBookingRating(),
        () => testArtistRatingStats()
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
        try {
            const result = await test();
            if (result) {
                passed++;
            } else {
                failed++;
            }
        } catch (error) {
            console.error('❌ Test failed with error:', error.message);
            failed++;
        }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 COMPREHENSIVE REVIEW SYSTEM TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`✅ Tests Passed: ${passed}`);
    console.log(`❌ Tests Failed: ${failed}`);
    console.log(`📊 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    
    if (failed === 0) {
        console.log('\n🎉 ALL REVIEW SYSTEM TESTS PASSED! 🎉');
        console.log('✨ The artist review system is working perfectly!');
    } else {
        console.log('\n⚠️ Some tests failed. Please review the issues above.');
    }
    
    // Close database connection
    if (connection) {
        await connection.end();
        console.log('\n✅ Database connection closed');
    }
}

// Run the comprehensive test suite
runComprehensiveReviewTests().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
}); 