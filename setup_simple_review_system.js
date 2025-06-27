const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupSimpleReviewSystem() {
    let connection;
    
    try {
        console.log('🚀 Setting up simplified review system...');
        
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '1234',
            database: 'artist_management_system'
        });

        console.log('✅ Connected to database');

        // Read and execute the simple schema file
        const schemaPath = path.join(__dirname, 'database', 'simple_review_system.sql');
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
                } else if (statement.includes('DROP TABLE')) {
                    console.log(`🗑️ Dropped old tables`);
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

        console.log('\n🎉 Simple review system setup complete!');
        console.log('\n📋 Features Available:');
        console.log('  ✨ Multi-dimensional rating system');
        console.log('  ✨ Review helpfulness voting');
        console.log('  ✨ Review categories and templates');
        console.log('  ✨ Public/private reviews');
        console.log('  ✨ Featured reviews');

    } catch (error) {
        console.error('❌ Error setting up simple review system:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the setup
setupSimpleReviewSystem().catch(console.error); 