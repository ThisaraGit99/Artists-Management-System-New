const mysql = require('mysql2/promise');

async function createReviewTables() {
    let connection;
    
    try {
        console.log('🚀 Creating review system tables directly...');
        
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '1234',
            database: 'artist_management_system'
        });

        console.log('✅ Connected to database');

        // 1. Drop existing tables if they exist
        console.log('🗑️ Dropping existing tables...');
        await connection.execute('DROP TABLE IF EXISTS review_votes');
        await connection.execute('DROP TABLE IF EXISTS review_categories');
        await connection.execute('DROP TABLE IF EXISTS reviews');
        await connection.execute('DROP TABLE IF EXISTS review_templates');
        console.log('✅ Dropped old tables');

        // 2. Create review_templates table
        console.log('📝 Creating review_templates table...');
        await connection.execute(`
            CREATE TABLE review_templates (
                id INT AUTO_INCREMENT PRIMARY KEY,
                template_name VARCHAR(100) NOT NULL,
                template_text TEXT NOT NULL,
                category ENUM('positive', 'negative', 'neutral') NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Created review_templates table');

        // 3. Create reviews table
        console.log('📝 Creating reviews table...');
        await connection.execute(`
            CREATE TABLE reviews (
                id INT AUTO_INCREMENT PRIMARY KEY,
                booking_id INT NOT NULL,
                reviewer_id INT NOT NULL,
                reviewee_id INT NOT NULL,
                reviewer_type ENUM('organizer', 'artist') NOT NULL,
                overall_rating DECIMAL(2,1) NOT NULL,
                communication_rating DECIMAL(2,1) DEFAULT NULL,
                professionalism_rating DECIMAL(2,1) DEFAULT NULL,
                punctuality_rating DECIMAL(2,1) DEFAULT NULL,
                quality_rating DECIMAL(2,1) DEFAULT NULL,
                review_title VARCHAR(200) NOT NULL,
                review_text TEXT NOT NULL,
                would_recommend BOOLEAN NOT NULL DEFAULT FALSE,
                is_public BOOLEAN NOT NULL DEFAULT TRUE,
                is_featured BOOLEAN DEFAULT FALSE,
                helpful_votes INT DEFAULT 0,
                unhelpful_votes INT DEFAULT 0,
                is_approved BOOLEAN DEFAULT TRUE,
                moderation_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_booking_reviewer (booking_id, reviewer_id),
                FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
                FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Created reviews table');

        // 4. Create review_categories table
        console.log('📝 Creating review_categories table...');
        await connection.execute(`
            CREATE TABLE review_categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                review_id INT NOT NULL,
                category ENUM(
                    'outstanding', 'professional', 'reliable', 'creative', 'responsive',
                    'on_time', 'great_value', 'exceeded_expectations', 'would_rebook',
                    'poor_communication', 'late', 'unprofessional', 'low_quality', 'overpriced'
                ) NOT NULL,
                FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
                UNIQUE KEY unique_review_category (review_id, category)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Created review_categories table');

        // 5. Create review_votes table
        console.log('📝 Creating review_votes table...');
        await connection.execute(`
            CREATE TABLE review_votes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                review_id INT NOT NULL,
                voter_id INT NOT NULL,
                vote_type ENUM('helpful', 'unhelpful') NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
                FOREIGN KEY (voter_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_vote (review_id, voter_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Created review_votes table');

        // 6. Add indexes
        console.log('📊 Creating indexes...');
        await connection.execute('CREATE INDEX idx_reviews_booking ON reviews(booking_id)');
        await connection.execute('CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id, reviewer_type)');
        await connection.execute('CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id)');
        await connection.execute('CREATE INDEX idx_reviews_rating ON reviews(overall_rating)');
        await connection.execute('CREATE INDEX idx_reviews_public ON reviews(is_public, is_approved)');
        await connection.execute('CREATE INDEX idx_reviews_created ON reviews(created_at)');
        await connection.execute('CREATE INDEX idx_reviews_featured ON reviews(is_featured, is_public)');
        
        await connection.execute('CREATE INDEX idx_categories_review ON review_categories(review_id)');
        await connection.execute('CREATE INDEX idx_categories_type ON review_categories(category)');
        
        await connection.execute('CREATE INDEX idx_votes_review ON review_votes(review_id)');
        await connection.execute('CREATE INDEX idx_votes_voter ON review_votes(voter_id)');
        console.log('✅ Created all indexes');

        // 7. Insert sample templates
        console.log('📝 Inserting sample review templates...');
        await connection.execute(`
            INSERT INTO review_templates (template_name, template_text, category) VALUES
            ('Outstanding Performance', 'This artist delivered an absolutely outstanding performance that exceeded all our expectations. Professional, talented, and a pleasure to work with.', 'positive'),
            ('Great Professional', 'Very professional and reliable artist. Great communication throughout the booking process and delivered exactly what was promised.', 'positive'),
            ('Highly Recommended', 'Would definitely book this artist again! Everything went smoothly and the quality was excellent.', 'positive'),
            ('Good but Minor Issues', 'Overall good performance with minor issues that didn''t significantly impact the event. Would consider booking again.', 'neutral'),
            ('Average Experience', 'The performance met basic expectations. Nothing exceptional but got the job done.', 'neutral'),
            ('Communication Issues', 'There were some communication challenges that made coordination difficult, though the final performance was acceptable.', 'negative'),
            ('Not as Expected', 'The performance did not meet our expectations. There were several issues that impacted our event.', 'negative')
        `);
        console.log('✅ Inserted sample templates');

        // 8. Add rating columns to users table (if they don't exist)
        console.log('📊 Adding rating columns to users table...');
        try {
            await connection.execute('ALTER TABLE users ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0.00');
            console.log('✅ Added average_rating column');
        } catch (e) {
            if (e.message.includes('Duplicate column')) {
                console.log('⚠️ average_rating column already exists');
            } else {
                console.error('❌ Error adding average_rating:', e.message);
            }
        }

        try {
            await connection.execute('ALTER TABLE users ADD COLUMN total_reviews INT DEFAULT 0');
            console.log('✅ Added total_reviews column');
        } catch (e) {
            if (e.message.includes('Duplicate column')) {
                console.log('⚠️ total_reviews column already exists');
            } else {
                console.error('❌ Error adding total_reviews:', e.message);
            }
        }

        // 9. Verify the setup
        console.log('\n🔍 Verifying table creation...');
        const tables = ['reviews', 'review_categories', 'review_votes', 'review_templates'];
        for (const table of tables) {
            const [result] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
            console.log(`✅ Table ${table}: ${result[0].count} records`);
        }

        // 10. Check if we can create a sample review
        console.log('\n🎯 Checking for completed bookings...');
        const [bookings] = await connection.execute(
            'SELECT COUNT(*) as count FROM bookings WHERE status = "completed"'
        );
        console.log(`✅ Found ${bookings[0].count} completed bookings`);

        if (bookings[0].count > 0) {
            console.log('💡 System is ready for reviews!');
        }

        console.log('\n🎉 Review system setup completed successfully!');
        console.log('\n📋 New Features:');
        console.log('  ✨ Multi-dimensional ratings (overall, communication, professionalism, punctuality, quality)');
        console.log('  ✨ Review helpfulness voting (helpful/unhelpful)');
        console.log('  ✨ Review categories for organization');
        console.log('  ✨ Pre-built review templates');
        console.log('  ✨ Public/private review visibility');
        console.log('  ✨ Featured reviews capability');
        console.log('  ✨ Proper data integrity with foreign keys');

    } catch (error) {
        console.error('❌ Error creating review tables:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the creation
createReviewTables().catch(console.error); 