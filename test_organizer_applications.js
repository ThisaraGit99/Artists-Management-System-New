const { executeQuery } = require('./backend/config/database');

async function testOrganizerApplications() {
    console.log('🧪 Testing Organizer Applications System...\n');
    
    try {
        // 1. Check if there are any users
        console.log('1. Checking users in system...');
        const usersResult = await executeQuery('SELECT id, name, email, role FROM users LIMIT 5');
        if (usersResult.success && usersResult.data.length > 0) {
            console.log('✅ Found users:');
            usersResult.data.forEach(user => {
                console.log(`   ${user.id}: ${user.name} (${user.email}) - ${user.role}`);
            });
        } else {
            console.log('❌ No users found in system');
            return;
        }
        
        // 2. Check events
        console.log('\n2. Checking events in system...');
        const eventsResult = await executeQuery('SELECT id, title, organizer_id, status FROM events LIMIT 5');
        if (eventsResult.success && eventsResult.data.length > 0) {
            console.log('✅ Found events:');
            eventsResult.data.forEach(event => {
                console.log(`   ${event.id}: ${event.title} (organizer: ${event.organizer_id}, status: ${event.status})`);
            });
        } else {
            console.log('❌ No events found in system');
            return;
        }
        
        // 3. Check applications table
        console.log('\n3. Checking event_applications table...');
        const appsResult = await executeQuery('SELECT COUNT(*) as count FROM event_applications');
        if (appsResult.success) {
            console.log(`✅ event_applications table exists with ${appsResult.data[0].count} applications`);
        } else {
            console.log('❌ event_applications table error:', appsResult.error);
        }
        
        console.log('\n✅ Basic test completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
    
    process.exit(0);
}

testOrganizerApplications(); 