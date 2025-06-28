const { executeQuery } = require('./config/database');

async function testNicDatabase() {
    try {
        console.log('🔍 Testing NIC Database Operations\n');

        // 1. Check current database state
        console.log('1. Current Database State:');
        const currentState = await executeQuery(
            'SELECT id, user_id, bio, nic, profile_complete FROM artists'
        );
        console.log('Current artists:', currentState.data);

        // 2. Check table structure
        console.log('\n2. Table Structure:');
        const tableStructure = await executeQuery(
            'DESCRIBE artists'
        );
        console.log('Artists table structure:', tableStructure.data);

        // 3. Check triggers
        console.log('\n3. Database Triggers:');
        const triggers = await executeQuery(
            'SHOW TRIGGERS'
        );
        console.log('Triggers:', triggers.data);

        // 4. Test update on first artist
        if (currentState.data.length > 0) {
            const testArtist = currentState.data[0];
            console.log('\n4. Testing Update on Artist ID:', testArtist.id);
            
            const testNic = '999912345678V';
            console.log('Attempting to update NIC to:', testNic);
            
            const updateResult = await executeQuery(
                'UPDATE artists SET nic = ? WHERE id = ?',
                [testNic, testArtist.id]
            );
            console.log('Update result:', updateResult);

            // Verify update
            const verifyUpdate = await executeQuery(
                'SELECT id, nic FROM artists WHERE id = ?',
                [testArtist.id]
            );
            console.log('After update:', verifyUpdate.data[0]);
        }

    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Run the test
testNicDatabase().then(() => process.exit()); 