const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupFixedReviewSystem() {
    let connection;
    
    try {
        console.log('🚀 Setting up improved review system (fixed version)...');
        
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '1234',
            database: 'artist_management_system'
        });

        console.log('✅ Connected to database');

        // Read and execute the fixed schema file
        const schemaPath = path.join(__dirname, 'database', 'new_review_system_schema_fixed.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Split the schema into individual statements
        const statements = schema
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

        console.log(`📝 Executing ${statements.length} database statements...`);

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            
            try {
                await connection.execute(statement);
                
                if (statement.includes('CREATE TABLE')) {
                    const tableName = statement.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/i)?.[1];
                    console.log(`✅ Created table: ${tableName}`);
                } else if (statement.includes('CREATE INDEX')) {
                    const indexName = statement.match(/CREATE INDEX (\w+)/i)?.[1];
                    console.log(`✅ Created index: ${indexName}`);
                } else if (statement.includes('CREATE VIEW')) {
                    const viewName = statement.match(/CREATE VIEW (\w+)/i)?.[1];
                    console.log(`✅ Created view: ${viewName}`);
                } else if (statement.includes('INSERT INTO')) {
                    const tableName = statement.match(/INSERT INTO (\w+)/i)?.[1];
                    console.log(`✅ Inserted data into: ${tableName}`);
                } else if (statement.includes('ALTER TABLE')) {
                    console.log(`✅ Altered table structure`);
                }
            } catch (error) {
                if (!error.message.includes('already exists') && !error.message.includes('Duplicate column')) {
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
        console.log('\n📊 Checking user rating columns...');
        try {
            const [columns] = await connection.execute(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = 'artist_management_system' 
                AND TABLE_NAME = 'users' 
                AND COLUMN_NAME IN ('average_rating', 'total_reviews', 'rating_distribution', 'last_rating_update')
            `);
            console.log(`✅ User rating columns added: ${columns.length}/4`);
            columns.forEach(col => console.log(`   - ${col.COLUMN_NAME}`));
        } catch (error) {
            console.log(`❌ Could not verify user rating columns: ${error.message}`);
        }

        // Check views
        console.log('\n👁️ Checking views...');
        try {
            const [views] = await connection.execute(`
                SELECT TABLE_NAME 
                FROM INFORMATION_SCHEMA.VIEWS 
                WHERE TABLE_SCHEMA = 'artist_management_system'
                AND TABLE_NAME IN ('public_reviews_detailed', 'user_rating_stats')
            `);
            console.log(`✅ Views created: ${views.length}/2`);
            views.forEach(view => console.log(`   - ${view.TABLE_NAME}`));
        } catch (error) {
            console.log(`❌ Could not verify views: ${error.message}`);
        }

        // Get sample template
        console.log('\n📝 Sample review templates:');
        try {
            const [templates] = await connection.execute(
                'SELECT template_name, category FROM review_templates LIMIT 3'
            );
            templates.forEach(template => {
                console.log(`   - ${template.template_name} (${template.category})`);
            });
        } catch (error) {
            console.log(`❌ Could not retrieve templates: ${error.message}`);
        }

        // Initialize some sample data
        console.log('\n📊 Checking existing data...');
        
        // Check if we have any bookings to work with
        const [bookings] = await connection.execute(
            'SELECT COUNT(*) as count FROM bookings WHERE status = "completed"'
        );
        
        console.log(`✅ Found ${bookings[0].count} completed bookings for potential reviews`);
        
        // Check users count
        const [users] = await connection.execute(
            'SELECT COUNT(*) as count FROM users WHERE role IN ("organizer", "artist")'
        );
        
        console.log(`✅ Found ${users[0].count} users (organizers + artists)`);

        console.log('\n🎉 New review system setup complete!');
        console.log('\n📋 New Features Available:');
        console.log('  ✨ Enhanced multi-dimensional rating system');
        console.log('  ✨ Review helpfulness voting (helpful/unhelpful)');
        console.log('  ✨ Review categories and tags for better organization');
        console.log('  ✨ Pre-built review templates to guide users');
        console.log('  ✨ Featured reviews system for showcasing best reviews');
        console.log('  ✨ Automatic rating calculations with JSON distribution');
        console.log('  ✨ Better moderation and approval workflow');
        console.log('  ✨ Public/private review visibility controls');
        console.log('  ✨ Comprehensive views for easy data retrieval');
        console.log('  ✨ Bi-directional reviews (organizer ↔ artist)');

        console.log('\n🔧 Next Steps:');
        console.log('  1. Update backend API controllers');
        console.log('  2. Create new frontend components');
        console.log('  3. Test the new review submission flow');

    } catch (error) {
        console.error('❌ Error setting up new review system:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the setup
setupFixedReviewSystem().catch(console.error); 