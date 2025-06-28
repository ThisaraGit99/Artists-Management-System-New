const { executeQuery } = require('./backend/config/database');

async function manualProfileUpdate() {
    console.log('🔄 Manually Updating Profile Completion Status...\n');

    try {
        // 1. Show current status
        console.log('📊 BEFORE: Current Profile Status');
        const beforeResult = await executeQuery(`
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

        beforeResult.data.forEach(artist => {
            const statusIcon = artist.profile_complete ? '✅' : '❌';
            console.log(`   ${statusIcon} Artist ID ${artist.id}: Bio: ${artist.bio_status}, NIC: ${artist.nic_status}, Complete: ${artist.profile_complete ? 'Yes' : 'No'}`);
        });

        // 2. Manually update profile_complete based on bio and nic
        console.log('\n🔄 Updating profile_complete manually...');
        const updateResult = await executeQuery(`
            UPDATE artists 
            SET profile_complete = CASE 
                WHEN (bio IS NOT NULL AND bio != '' AND nic IS NOT NULL AND nic != '') THEN 1
                ELSE 0
            END
        `);

        if (updateResult.success) {
            console.log(`✅ Successfully updated ${updateResult.data.affectedRows} artist records`);
        } else {
            console.log(`❌ Failed to update records: ${updateResult.error}`);
            return;
        }

        // 3. Show updated status
        console.log('\n📊 AFTER: Updated Profile Status');
        const afterResult = await executeQuery(`
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
                profile_complete,
                nic
            FROM artists
            ORDER BY id
        `);

        afterResult.data.forEach(artist => {
            const statusIcon = artist.profile_complete ? '✅' : '❌';
            console.log(`   ${statusIcon} Artist ID ${artist.id}: Bio: ${artist.bio_status}, NIC: ${artist.nic_status} (${artist.nic}), Complete: ${artist.profile_complete ? 'Yes' : 'No'}`);
        });

        // 4. Show summary
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

        // 5. Test the logic by updating one artist's bio
        console.log('\n🧪 Testing profile completion logic...');
        if (afterResult.data.length > 0) {
            const testArtist = afterResult.data[0];
            console.log(`Testing with Artist ID ${testArtist.id}...`);
            
            // Update bio and manually trigger the logic
            const newBio = 'Updated test bio for profile completion testing - Professional musician with extensive experience.';
            
            console.log('   Updating bio and manually checking profile completion...');
            await executeQuery('UPDATE artists SET bio = ? WHERE id = ?', [newBio, testArtist.id]);
            
            // Manually update profile_complete for this artist
            await executeQuery(`
                UPDATE artists 
                SET profile_complete = CASE 
                    WHEN (bio IS NOT NULL AND bio != '' AND nic IS NOT NULL AND nic != '') THEN 1
                    ELSE 0
                END
                WHERE id = ?
            `, [testArtist.id]);
            
            // Check result
            const testResult = await executeQuery(
                'SELECT id, profile_complete FROM artists WHERE id = ?',
                [testArtist.id]
            );
            
            const newStatus = testResult.data[0].profile_complete;
            console.log(`   ✅ After update: profile_complete = ${newStatus}`);
            
            if (newStatus === 1) {
                console.log('   🎉 Profile completion logic is working correctly!');
            } else {
                console.log('   ⚠️ Profile completion logic might have issues...');
            }
        }

        // 6. Show instructions for frontend testing
        console.log('\n📝 Next Steps:');
        console.log('   1. ✅ All artists with both Bio and NIC now have profile_complete = 1');
        console.log('   2. ✅ Artists missing Bio or NIC have profile_complete = 0');
        console.log('   3. 🌐 Test the frontend: Go to Artist Profile → Basic Info');
        console.log('   4. 🧪 Try updating Bio or NIC fields to test the API');
        console.log('   5. 🔄 The backend will need to manually update profile_complete in the updateProfile method');

    } catch (error) {
        console.error('❌ Error during manual update:', error);
        throw error;
    }
}

// Run the manual update
if (require.main === module) {
    manualProfileUpdate()
        .then(() => {
            console.log('\n✅ Manual profile update completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Manual update failed:', error);
            process.exit(1);
        });
}

module.exports = { manualProfileUpdate }; 