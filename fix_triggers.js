const { executeQuery } = require('./backend/config/database');

async function fixTriggers() {
    console.log('🔧 Fixing Profile Completion Triggers...\n');

    try {
        // 1. First, drop any existing triggers
        console.log('🗑️ Dropping existing triggers...');
        try {
            await executeQuery('DROP TRIGGER IF EXISTS update_profile_complete_on_update');
            await executeQuery('DROP TRIGGER IF EXISTS update_profile_complete_on_insert');
            console.log('✅ Existing triggers dropped');
        } catch (error) {
            console.log('✅ No existing triggers to drop');
        }

        // 2. Create the UPDATE trigger using direct SQL execution
        console.log('📝 Creating UPDATE trigger...');
        const updateTriggerSQL = `
            CREATE TRIGGER update_profile_complete_on_update
            BEFORE UPDATE ON artists
            FOR EACH ROW
            BEGIN
                IF (NEW.bio IS NOT NULL AND NEW.bio != '' AND NEW.nic IS NOT NULL AND NEW.nic != '') THEN
                    SET NEW.profile_complete = 1;
                ELSE
                    SET NEW.profile_complete = 0;
                END IF;
            END
        `;

        // Use direct database connection to avoid prepared statement issues
        const mysql = require('mysql2/promise');
        const dbConfig = require('./backend/config/database');
        
        // Get connection config (simplified)
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'artist_management_system',
            multipleStatements: true
        });

        // Execute trigger creation
        await connection.execute(updateTriggerSQL);
        console.log('✅ UPDATE trigger created successfully');

        // 3. Create the INSERT trigger
        console.log('📝 Creating INSERT trigger...');
        const insertTriggerSQL = `
            CREATE TRIGGER update_profile_complete_on_insert
            BEFORE INSERT ON artists
            FOR EACH ROW
            BEGIN
                IF (NEW.bio IS NOT NULL AND NEW.bio != '' AND NEW.nic IS NOT NULL AND NEW.nic != '') THEN
                    SET NEW.profile_complete = 1;
                ELSE
                    SET NEW.profile_complete = 0;
                END IF;
            END
        `;

        await connection.execute(insertTriggerSQL);
        console.log('✅ INSERT trigger created successfully');

        // Close connection
        await connection.end();

        // 4. Verify triggers were created
        console.log('\n🔍 Verifying triggers...');
        const triggers = await executeQuery('SHOW TRIGGERS LIKE "artists"');
        console.log(`Triggers found: ${triggers.data.length}`);
        if (triggers.data.length > 0) {
            triggers.data.forEach(t => {
                console.log(`  ✅ ${t.Trigger} on ${t.Event} ${t.Timing}`);
            });
        }

        // 5. Now manually update all existing records to correct values
        console.log('\n🔄 Manually updating existing records...');
        const updateResult = await executeQuery(`
            UPDATE artists 
            SET profile_complete = CASE 
                WHEN (bio IS NOT NULL AND bio != '' AND nic IS NOT NULL AND nic != '') THEN 1
                ELSE 0
            END
        `);
        console.log(`✅ Updated ${updateResult.data.affectedRows} records`);

        // 6. Test the triggers by updating one record
        console.log('\n🧪 Testing triggers...');
        const testArtist = await executeQuery('SELECT id, bio FROM artists LIMIT 1');
        if (testArtist.data.length > 0) {
            const artistId = testArtist.data[0].id;
            const originalBio = testArtist.data[0].bio;
            
            console.log(`Testing with Artist ID ${artistId}...`);
            
            // Update the bio to trigger the trigger
            await executeQuery(
                'UPDATE artists SET bio = ? WHERE id = ?',
                [originalBio + ' [Trigger Test]', artistId]
            );
            
            // Check the result
            const result = await executeQuery(
                'SELECT id, profile_complete FROM artists WHERE id = ?',
                [artistId]
            );
            
            const newStatus = result.data[0].profile_complete;
            console.log(`✅ After trigger test: profile_complete = ${newStatus}`);
            
            if (newStatus === 1) {
                console.log('🎉 Triggers are working correctly!');
            } else {
                console.log('⚠️ Triggers might still have issues...');
            }
        }

        // 7. Show final status
        console.log('\n📊 Final Profile Status:');
        const finalStatus = await executeQuery(`
            SELECT 
                id,
                CASE 
                    WHEN bio IS NULL OR bio = '' THEN 'Empty'
                    ELSE 'Filled'
                END as bio_status,
                CASE 
                    WHEN nic IS NULL OR nic = '' THEN 'Empty'
                    ELSE 'Filled'
                END as nic_status,
                profile_complete
            FROM artists
            ORDER BY id
        `);

        finalStatus.data.forEach(artist => {
            const statusIcon = artist.profile_complete ? '✅' : '❌';
            console.log(`   ${statusIcon} Artist ID ${artist.id}: Bio: ${artist.bio_status}, NIC: ${artist.nic_status}, Complete: ${artist.profile_complete ? 'Yes' : 'No'}`);
        });

        // Summary
        const summary = await executeQuery(`
            SELECT 
                COUNT(*) as total_artists,
                SUM(CASE WHEN profile_complete = 1 THEN 1 ELSE 0 END) as complete_profiles,
                SUM(CASE WHEN profile_complete = 0 THEN 1 ELSE 0 END) as incomplete_profiles
            FROM artists
        `);

        const stats = summary.data[0];
        console.log('\n📈 Summary:');
        console.log(`   Total Artists: ${stats.total_artists}`);
        console.log(`   Complete Profiles: ${stats.complete_profiles}`);
        console.log(`   Incomplete Profiles: ${stats.incomplete_profiles}`);

    } catch (error) {
        console.error('❌ Error during trigger fix:', error);
        throw error;
    }
}

// Run the fix
if (require.main === module) {
    fixTriggers()
        .then(() => {
            console.log('\n✅ Trigger fix completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Trigger fix failed:', error);
            process.exit(1);
        });
}

module.exports = { fixTriggers }; 