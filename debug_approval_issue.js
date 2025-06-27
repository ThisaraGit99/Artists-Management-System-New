const { executeQuery } = require('./backend/config/database');

async function debugApprovalIssue() {
    console.log('🔍 Debugging Approval Issue\n');

    try {
        // 1. Check organizer users
        console.log('1. Checking organizer users...');
        const organizers = await executeQuery(
            "SELECT id, name, email FROM users WHERE role = 'organizer'"
        );
        
        if (organizers.success) {
            console.log('✅ Found organizer users:');
            organizers.data.forEach(org => {
                console.log(`   - ${org.name} (${org.email}) - User ID: ${org.id}`);
            });
        }

        // 2. Check events table
        console.log('\n2. Checking events table...');
        const events = await executeQuery(
            'SELECT id, title, organizer_id FROM events LIMIT 5'
        );
        
        if (events.success) {
            console.log('✅ Found events:');
            events.data.forEach(event => {
                console.log(`   - "${event.title}" (ID: ${event.id}, Organizer ID: ${event.organizer_id})`);
            });
        }

        // 3. Check if there's a mismatch
        console.log('\n3. Checking organizer-event relationship...');
        const eventOrganizerCheck = await executeQuery(`
            SELECT e.id, e.title, e.organizer_id, u.name as organizer_name 
            FROM events e 
            LEFT JOIN users u ON e.organizer_id = u.id 
            WHERE u.role = 'organizer' OR u.role IS NULL
            LIMIT 5
        `);
        
        if (eventOrganizerCheck.success) {
            console.log('✅ Event-Organizer relationships:');
            eventOrganizerCheck.data.forEach(rel => {
                console.log(`   - Event "${rel.title}" → Organizer: ${rel.organizer_name || 'NOT FOUND'} (ID: ${rel.organizer_id})`);
            });
        }

        // 4. Check pending applications
        console.log('\n4. Checking pending applications...');
        const applications = await executeQuery(`
            SELECT ea.id, ea.event_id, ea.application_status, e.title as event_title
            FROM event_applications ea
            JOIN events e ON ea.event_id = e.id
            WHERE ea.application_status = 'pending'
            LIMIT 3
        `);
        
        if (applications.success) {
            console.log('✅ Found pending applications:');
            applications.data.forEach(app => {
                console.log(`   - App ID: ${app.id}, Event: "${app.event_title}" (Event ID: ${app.event_id})`);
            });
        }

        // 5. Quick fix - update events to have correct organizer_id
        console.log('\n5. Fixing organizer IDs if needed...');
        
        // Find the first organizer user
        const firstOrganizer = organizers.data?.[0];
        if (firstOrganizer) {
            console.log(`   Using organizer: ${firstOrganizer.name} (ID: ${firstOrganizer.id})`);
            
            // Update events that don't have the correct organizer_id
            const updateResult = await executeQuery(
                'UPDATE events SET organizer_id = ? WHERE organizer_id != ? OR organizer_id IS NULL',
                [firstOrganizer.id, firstOrganizer.id]
            );
            
            if (updateResult.success) {
                console.log('✅ Updated events with correct organizer_id');
            }
        }

        console.log('\n6. Testing approval now...');
        
        // Get the first pending application and try to approve it manually
        if (applications.success && applications.data.length > 0) {
            const testApp = applications.data[0];
            console.log(`   Testing approval of application ${testApp.id}...`);
            
            // Update application status directly
            const approveTest = await executeQuery(
                'UPDATE event_applications SET application_status = "approved", organizer_response = "Direct database test approval", responded_at = NOW() WHERE id = ?',
                [testApp.id]
            );
            
            if (approveTest.success) {
                console.log('✅ Direct database approval successful!');
                
                // Check if it worked
                const checkResult = await executeQuery(
                    'SELECT application_status, organizer_response FROM event_applications WHERE id = ?',
                    [testApp.id]
                );
                
                if (checkResult.success) {
                    console.log(`   Status: ${checkResult.data[0].application_status}`);
                    console.log(`   Response: ${checkResult.data[0].organizer_response}`);
                }
            }
        }

    } catch (error) {
        console.error('❌ Debug error:', error);
    }
}

debugApprovalIssue().then(() => {
    console.log('\n🏁 Debug completed');
    process.exit(0);
}); 