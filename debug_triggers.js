const { executeQuery } = require('./backend/config/database');

async function debugTriggers() {
    console.log('🔍 Debugging trigger and data issues...\n');

    try {
        // 1. Check if triggers exist
        console.log('📋 Checking triggers:');
        const triggers = await executeQuery('SHOW TRIGGERS LIKE "artists"');
        console.log(`Triggers found: ${triggers.data.length}`);
        if (triggers.data.length > 0) {
            triggers.data.forEach(t => {
                console.log(`  - ${t.Trigger} on ${t.Event} ${t.Timing}`);
            });
        } else {
            console.log('  ⚠️ No triggers found!');
        }

        // 2. Check actual data
        console.log('\n📊 Checking actual data:');
        const data = await executeQuery(`
            SELECT 
                id, 
                bio, 
                nic, 
                profile_complete, 
                LENGTH(bio) as bio_length, 
                LENGTH(nic) as nic_length,
                (bio IS NOT NULL AND bio != '') as bio_valid,
                (nic IS NOT NULL AND nic != '') as nic_valid
            FROM artists 
            LIMIT 3
        `);
        
        data.data.forEach(row => {
            console.log(`\nArtist ${row.id}:`);
            console.log(`  bio_length: ${row.bio_length}, bio_valid: ${row.bio_valid}`);
            console.log(`  nic_length: ${row.nic_length}, nic_valid: ${row.nic_valid}`);
            console.log(`  profile_complete: ${row.profile_complete}`);
            console.log(`  Bio: '${row.bio?.substring(0, 50)}...'`);
            console.log(`  NIC: '${row.nic}'`);
            
            // Check what the trigger logic should produce
            const shouldBeComplete = row.bio_valid && row.nic_valid;
            console.log(`  Should be complete: ${shouldBeComplete}`);
            if (shouldBeComplete && !row.profile_complete) {
                console.log(`  ❌ MISMATCH: Should be complete but isn't!`);
            }
        });

        // 3. Test manual trigger logic
        console.log('\n🧪 Testing manual trigger logic:');
        const testResult = await executeQuery(`
            SELECT 
                id,
                CASE 
                    WHEN (bio IS NOT NULL AND bio != '' AND nic IS NOT NULL AND nic != '') THEN 1
                    ELSE 0
                END as should_be_complete,
                profile_complete
            FROM artists
            LIMIT 5
        `);

        testResult.data.forEach(row => {
            const match = row.should_be_complete === row.profile_complete;
            const status = match ? '✅' : '❌';
            console.log(`  ${status} Artist ${row.id}: should_be=${row.should_be_complete}, actual=${row.profile_complete}`);
        });

        // 4. Try to manually update one record to test trigger
        console.log('\n🔧 Testing trigger manually...');
        const firstArtist = data.data[0];
        if (firstArtist) {
            console.log(`Manually updating Artist ${firstArtist.id} bio to trigger the trigger...`);
            
            const updateResult = await executeQuery(
                'UPDATE artists SET bio = ? WHERE id = ?',
                [firstArtist.bio + ' [Updated for trigger test]', firstArtist.id]
            );
            
            if (updateResult.success) {
                // Check the result
                const checkResult = await executeQuery(
                    'SELECT id, profile_complete FROM artists WHERE id = ?',
                    [firstArtist.id]
                );
                
                console.log(`  Result: profile_complete = ${checkResult.data[0].profile_complete}`);
                
                if (checkResult.data[0].profile_complete === 1) {
                    console.log('  ✅ Trigger is working!');
                } else {
                    console.log('  ❌ Trigger is not working!');
                }
            }
        }

    } catch (error) {
        console.error('❌ Error during debugging:', error);
        throw error;
    }
}

// Run the debug
if (require.main === module) {
    debugTriggers()
        .then(() => {
            console.log('\n✅ Debug completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Debug failed:', error);
            process.exit(1);
        });
}

module.exports = { debugTriggers }; 