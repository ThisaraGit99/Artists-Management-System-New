const { executeQuery } = require('./backend/config/database');
const fs = require('fs');
const path = require('path');

async function applyNicChanges() {
    console.log('🚀 Starting NIC Column and Profile Completion Update...\n');

    try {
        // 1. Add NIC column to artists table
        console.log('1. Adding NIC column to artists table...');
        try {
            await executeQuery('ALTER TABLE artists ADD COLUMN nic VARCHAR(20) DEFAULT NULL AFTER bio');
            console.log('✅ NIC column added successfully');
        } catch (error) {
            if (error.message.includes('Duplicate column name')) {
                console.log('✅ NIC column already exists');
            } else {
                throw error;
            }
        }

        // 2. Add index for NIC column
        console.log('2. Adding index for NIC column...');
        try {
            await executeQuery('CREATE INDEX idx_artists_nic ON artists(nic)');
            console.log('✅ NIC index created successfully');
        } catch (error) {
            if (error.message.includes('Duplicate key name')) {
                console.log('✅ NIC index already exists');
            } else {
                throw error;
            }
        }

        // 3. Update profile_complete logic
        console.log('3. Updating profile_complete based on bio and nic...');
        
        // Set profile_complete = 1 where both bio and nic are filled
        const updateComplete = await executeQuery(`
            UPDATE artists 
            SET profile_complete = 1 
            WHERE bio IS NOT NULL 
              AND bio != '' 
              AND nic IS NOT NULL 
              AND nic != ''
        `);
        console.log(`✅ Set ${updateComplete.data.affectedRows} profiles to complete`);

        // Set profile_complete = 0 where either bio or nic is empty/null
        const updateIncomplete = await executeQuery(`
            UPDATE artists 
            SET profile_complete = 0 
            WHERE bio IS NULL 
              OR bio = '' 
              OR nic IS NULL 
              OR nic = ''
        `);
        console.log(`✅ Set ${updateIncomplete.data.affectedRows} profiles to incomplete`);

        // 4. Create triggers (drop existing ones first if they exist)
        console.log('4. Creating triggers for automatic profile_complete updates...');
        
        // Drop existing triggers if they exist
        try {
            await executeQuery('DROP TRIGGER IF EXISTS update_profile_complete_on_update');
            await executeQuery('DROP TRIGGER IF EXISTS update_profile_complete_on_insert');
        } catch (error) {
            // Ignore errors if triggers don't exist
        }

        // Create UPDATE trigger
        await executeQuery(`
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
        `);
        console.log('✅ UPDATE trigger created');

        // Create INSERT trigger
        await executeQuery(`
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
        `);
        console.log('✅ INSERT trigger created');

        // 5. Show verification results
        console.log('\n📊 Verification Results:');
        
        // Show table structure
        const structure = await executeQuery('DESCRIBE artists');
        console.log('\n📋 Updated Artists Table Structure:');
        structure.data.forEach(column => {
            if (column.Field === 'nic' || column.Field === 'bio' || column.Field === 'profile_complete') {
                console.log(`   ${column.Field}: ${column.Type} ${column.Null === 'YES' ? '(nullable)' : '(not null)'} ${column.Default ? `default: ${column.Default}` : ''}`);
            }
        });

        // Show profile completion status
        const statusResult = await executeQuery(`
            SELECT 
                id,
                user_id,
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

        console.log('\n📈 Current Profile Status:');
        if (statusResult.data.length > 0) {
            statusResult.data.forEach(artist => {
                console.log(`   Artist ID ${artist.id}: Bio: ${artist.bio_status}, NIC: ${artist.nic_status}, Complete: ${artist.profile_complete ? 'Yes' : 'No'}`);
            });
        } else {
            console.log('   No artists found in database');
        }

        // Show summary
        const summaryResult = await executeQuery(`
            SELECT 
                COUNT(*) as total_artists,
                SUM(CASE WHEN profile_complete = 1 THEN 1 ELSE 0 END) as complete_profiles,
                SUM(CASE WHEN profile_complete = 0 THEN 1 ELSE 0 END) as incomplete_profiles
            FROM artists
        `);

        if (summaryResult.data.length > 0) {
            const summary = summaryResult.data[0];
            console.log('\n📊 Profile Completion Summary:');
            console.log(`   Total Artists: ${summary.total_artists}`);
            console.log(`   Complete Profiles: ${summary.complete_profiles}`);
            console.log(`   Incomplete Profiles: ${summary.incomplete_profiles}`);
        }

        console.log('\n✅ NIC column and profile completion logic successfully implemented!');
        console.log('\n📝 Next Steps:');
        console.log('   1. Artists must fill both Bio and NIC to have profile_complete = 1');
        console.log('   2. The triggers will automatically update profile_complete when bio or nic changes');
        console.log('   3. Frontend now includes NIC field in the profile form');
        console.log('   4. Backend API endpoints now handle NIC field');

    } catch (error) {
        console.error('❌ Error during setup:', error);
        throw error;
    }
}

// Run the setup
if (require.main === module) {
    applyNicChanges()
        .then(() => {
            console.log('\n🎉 Setup completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Setup failed:', error);
            process.exit(1);
        });
}

module.exports = { applyNicChanges }; 