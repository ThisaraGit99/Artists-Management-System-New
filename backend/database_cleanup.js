const mysql = require('mysql2/promise');

async function cleanupOldReviewSystem() {
    let connection;
    
    try {
        console.log('🧹 Starting cleanup of old review system...');
        
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '1234',
            database: 'artist_management_system'
        });

        console.log('✅ Connected to database');

        // Drop triggers first
        console.log('Dropping triggers...');
        const triggers = ['after_review_insert', 'after_review_update', 'after_review_delete'];
        for (const trigger of triggers) {
            try {
                await connection.execute(`DROP TRIGGER IF EXISTS ${trigger}`);
                console.log(`✅ Dropped trigger: ${trigger}`);
            } catch (e) {
                console.log(`⚠️ Trigger ${trigger} not found`);
            }
        }

        // Drop stored procedures
        console.log('Dropping stored procedures...');
        try {
            await connection.execute('DROP PROCEDURE IF EXISTS recalculate_artist_ratings');
            console.log('✅ Dropped procedure: recalculate_artist_ratings');
        } catch (e) {
            console.log('⚠️ Procedure recalculate_artist_ratings not found');
        }

        // Drop tables
        console.log('Dropping old review tables...');
        try {
            await connection.execute('DROP TABLE IF EXISTS booking_reviews');
            console.log('✅ booking_reviews table dropped');
        } catch (e) {
            console.log('⚠️ booking_reviews table not found');
        }

        try {
            await connection.execute('DROP TABLE IF EXISTS artist_ratings');
            console.log('✅ artist_ratings table dropped');
        } catch (e) {
            console.log('⚠️ artist_ratings table not found');
        }

        // Clean up any rating-related columns from artists table
        console.log('Cleaning rating columns from artists table...');
        try {
            await connection.execute('ALTER TABLE artists DROP COLUMN IF EXISTS rating');
            await connection.execute('ALTER TABLE artists DROP COLUMN IF EXISTS total_ratings');
            console.log('✅ Rating columns removed from artists table');
        } catch (e) {
            console.log('⚠️ Rating columns may not exist in artists table');
        }

        console.log('🎉 Old review system cleanup complete!');

    } catch (error) {
        console.error('❌ Error during cleanup:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the cleanup
cleanupOldReviewSystem().catch(console.error); 