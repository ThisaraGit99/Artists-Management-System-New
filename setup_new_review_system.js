const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupNewReviewSystem() {
    let connection;
    
    try {
        console.log('🚀 Setting up new improved review system...');
        
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '1234',
            database: 'artist_management_system',
            multipleStatements: true
        });

        console.log('✅ Connected to database');

        // Read and execute the schema file
        const schemaPath = path.join(__dirname, 'database', 'new_review_system_schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Split the schema into individual statements
        const statements = schema
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

        console.log(`📝 Executing ${statements.length} database statements...`);

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.includes('DELIMITER')) continue; // Skip delimiter changes
            
            try {
                await connection.execute(statement);
                if (statement.includes('CREATE TABLE')) {
                    const tableName = statement.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/i)?.[1];
                    console.log(`✅ Created table: ${tableName}`);
                } else if (statement.includes('CREATE PROCEDURE')) {
                    const procName = statement.match(/CREATE PROCEDURE (\w+)/i)?.[1];
                    console.log(`✅ Created procedure: ${procName}`);
                } else if (statement.includes('CREATE TRIGGER')) {
                    const triggerName = statement.match(/CREATE TRIGGER (\w+)/i)?.[1];
                    console.log(`✅ Created trigger: ${triggerName}`);
                } else if (statement.includes('CREATE VIEW')) {
                    const viewName = statement.match(/CREATE VIEW (\w+)/i)?.[1];
                    console.log(`✅ Created view: ${viewName}`);
                } else if (statement.includes('INSERT INTO')) {
                    const tableName = statement.match(/INSERT INTO (\w+)/i)?.[1];
                    console.log(`✅ Inserted data into: ${tableName}`);
                }
            } catch (error) {
                if (!error.message.includes('already exists')) {
                    console.error(`❌ Error executing statement: ${statement.substring(0, 50)}...`);
                    console.error(`   Error: ${error.message}`);
                }
            }
        }

        // Verify the setup
        console.log('\n🔍 Verifying new review system setup...');
        
        const tables = ['reviews', 'review_categories', 'review_votes', 'review_templates'];
        for (const table of tables) {
            try {
                const [result] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
                console.log(`✅ Table ${table}: ${result[0].count} records`);
            } catch (error) {
                console.log(`❌ Table ${table}: Not found or error - ${error.message}`);
            }
        }

        // Check if user rating columns were added
        try {
            const [columns] = await connection.execute(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = 'artist_management_system' 
                AND TABLE_NAME = 'users' 
                AND COLUMN_NAME IN ('average_rating', 'total_reviews', 'rating_distribution')
            `);
            console.log(`✅ User rating columns added: ${columns.length}/3`);
        } catch (error) {
            console.log(`❌ Could not verify user rating columns: ${error.message}`);
        }

        // Initialize some sample data
        console.log('\n📊 Initializing sample data...');
        
        // Check if we have any bookings to work with
        const [bookings] = await connection.execute(
            'SELECT COUNT(*) as count FROM bookings WHERE status = "completed"'
        );
        
        console.log(`✅ Found ${bookings[0].count} completed bookings for potential reviews`);
        
        if (bookings[0].count > 0) {
            console.log('💡 You can now create reviews for completed bookings!');
        } else {
            console.log('💡 Create some completed bookings first, then add reviews');
        }

        console.log('\n🎉 New review system setup complete!');
        console.log('\n📋 New Features Available:');
        console.log('  ✨ Enhanced rating system with multiple categories');
        console.log('  ✨ Review helpfulness voting');
        console.log('  ✨ Review categories and tags');
        console.log('  ✨ Review templates for better user experience');
        console.log('  ✨ Featured reviews system');
        console.log('  ✨ Automatic rating calculations');
        console.log('  ✨ Better moderation and approval workflow');
        console.log('  ✨ JSON-based rating distribution tracking');

    } catch (error) {
        console.error('❌ Error setting up new review system:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the setup
setupNewReviewSystem().catch(console.error); 