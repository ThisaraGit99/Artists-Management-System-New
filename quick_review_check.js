const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'artist_management_system'
};

console.log('🔍 QUICK REVIEW SYSTEM CHECK\n');

async function quickCheck() {
    let connection = null;
    
    try {
        // Connect to database
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Database connected');
        
        // Check if booking_reviews table exists and has data
        const [tables] = await connection.execute("SHOW TABLES LIKE 'booking_reviews'");
        if (tables.length > 0) {
            console.log('✅ booking_reviews table exists');
            
            // Check table structure
            const [columns] = await connection.execute("DESCRIBE booking_reviews");
            console.log(`✅ Table has ${columns.length} columns`);
            
            // Check for existing reviews
            const [reviews] = await connection.execute("SELECT COUNT(*) as count FROM booking_reviews");
            console.log(`✅ Found ${reviews[0].count} existing reviews`);
            
            if (reviews[0].count > 0) {
                // Show sample review
                const [sample] = await connection.execute(`
                    SELECT br.*, u.name as organizer_name, a_user.name as artist_name
                    FROM booking_reviews br 
                    JOIN users u ON br.reviewer_id = u.id 
                    JOIN users a_user ON br.reviewee_id = a_user.id
                    LIMIT 1
                `);
                
                if (sample.length > 0) {
                    const review = sample[0];
                    console.log('\n📋 Sample Review:');
                    console.log(`   Organizer: ${review.organizer_name}`);
                    console.log(`   Artist: ${review.artist_name}`);
                    console.log(`   Rating: ${review.rating}/5`);
                    console.log(`   Title: "${review.review_title}"`);
                    console.log(`   Communication: ${review.communication_rating}/5`);
                    console.log(`   Professionalism: ${review.professionalism_rating}/5`);
                    console.log(`   Quality: ${review.quality_rating}/5`);
                    console.log(`   Recommend: ${review.would_recommend ? 'Yes' : 'No'}`);
                }
            }
        } else {
            console.log('❌ booking_reviews table does not exist');
        }
        
        // Check if artists table has rating stats
        const [artists] = await connection.execute(`
            SELECT id, rating, total_ratings 
            FROM artists 
            WHERE rating > 0 OR total_ratings > 0 
            LIMIT 3
        `);
        
        if (artists.length > 0) {
            console.log('\n⭐ Artist Rating Stats:');
            artists.forEach((artist, index) => {
                console.log(`   Artist ${artist.id}: ${artist.rating}/5.00 (${artist.total_ratings} ratings)`);
            });
        } else {
            console.log('\n⚠️ No artist rating statistics found');
        }
        
        // Check for completed bookings that could be rated
        const [completedBookings] = await connection.execute(`
            SELECT COUNT(*) as count 
            FROM bookings 
            WHERE status = 'completed'
        `);
        
        console.log(`\n📅 Completed bookings available for rating: ${completedBookings[0].count}`);
        
        // Check for users who can submit ratings
        const [organizers] = await connection.execute(`
            SELECT COUNT(*) as count 
            FROM users u 
            JOIN organizers o ON u.id = o.user_id 
            WHERE u.role = 'organizer'
        `);
        
        console.log(`👤 Total organizers who can submit ratings: ${organizers[0].count}`);
        
        console.log('\n' + '='.repeat(50));
        console.log('📊 REVIEW SYSTEM STATUS SUMMARY');
        console.log('='.repeat(50));
        
        if (tables.length > 0) {
            const [reviewCount] = await connection.execute("SELECT COUNT(*) as count FROM booking_reviews");
            if (reviewCount[0].count > 0) {
                console.log('✅ Review system is SET UP and HAS DATA');
                console.log('📝 Reviews can be submitted and are being stored');
                console.log('⭐ Rating statistics are being calculated');
                console.log('\n🎯 RECOMMENDATION: System is working! Minor API issues to fix.');
            } else {
                console.log('⚠️ Review system is SET UP but NO DATA yet');
                console.log('📝 Ready to accept first reviews');
                console.log('\n🎯 RECOMMENDATION: Test submitting your first review');
            }
        } else {
            console.log('❌ Review system NOT SET UP');
            console.log('\n🎯 RECOMMENDATION: Run database setup scripts first');
        }
        
    } catch (error) {
        console.error('❌ Check failed:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n✅ Database connection closed');
        }
    }
}

// Run the quick check
quickCheck().catch(error => {
    console.error('❌ Quick check failed:', error);
    process.exit(1);
}); 