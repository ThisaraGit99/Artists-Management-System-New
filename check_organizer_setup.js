const { executeQuery } = require('./backend/config/database');

async function checkOrganizerSetup() {
    console.log('🔍 Checking Organizer Setup...\n');

    try {
        // 1. Check if organizers table exists
        console.log('1. Checking organizers table...');
        const organizersResult = await executeQuery('DESCRIBE organizers');
        
        if (organizersResult.success) {
            console.log('✅ Organizers table exists');
            console.log('Columns:', organizersResult.data.map(col => col.Field).join(', '));
        } else {
            console.log('❌ Organizers table does not exist');
            return;
        }

        // 2. Check organizer users
        console.log('\n2. Checking organizer users...');
        const usersResult = await executeQuery(
            "SELECT id, name, email, role FROM users WHERE role = 'organizer'"
        );

        if (usersResult.success) {
            console.log(`✅ Found ${usersResult.data.length} organizer users:`);
            usersResult.data.forEach(user => {
                console.log(`  - ${user.name} (${user.email}) - ID: ${user.id}`);
            });

            // 3. Check corresponding organizer records
            console.log('\n3. Checking organizer records...');
            for (const user of usersResult.data) {
                const organizerResult = await executeQuery(
                    'SELECT * FROM organizers WHERE user_id = ?',
                    [user.id]
                );

                if (organizerResult.success && organizerResult.data.length > 0) {
                    const organizer = organizerResult.data[0];
                    console.log(`✅ ${user.name}: Organizer record exists (DB ID: ${organizer.id})`);
                    console.log(`   Organization: ${organizer.organization_name || 'Not set'}`);
                } else {
                    console.log(`❌ ${user.name}: Missing organizer record in organizers table`);
                    
                    // Create missing organizer record
                    console.log(`   Creating organizer record for ${user.name}...`);
                    const createResult = await executeQuery(
                        `INSERT INTO organizers (user_id, organization_name, organization_type, location) 
                         VALUES (?, ?, 'Individual', 'Not specified')`,
                        [user.id, `${user.name}'s Organization`]
                    );

                    if (createResult.success) {
                        console.log(`   ✅ Created organizer record (ID: ${createResult.insertId})`);
                    } else {
                        console.log(`   ❌ Failed to create organizer record:`, createResult.error);
                    }
                }
            }
        } else {
            console.log('❌ No organizer users found');
        }

        // 4. Check events table for organizer_id references
        console.log('\n4. Checking events table...');
        const eventsResult = await executeQuery(
            'SELECT id, title, organizer_id FROM events LIMIT 5'
        );

        if (eventsResult.success) {
            console.log(`✅ Found ${eventsResult.data.length} events:`);
            eventsResult.data.forEach(event => {
                console.log(`  - "${event.title}" (Event ID: ${event.id}, Organizer ID: ${event.organizer_id})`);
            });
        } else {
            console.log('❌ No events found or events table issue');
        }

        // 5. Check event applications
        console.log('\n5. Checking event applications...');
        const applicationsResult = await executeQuery(
            `SELECT ea.id, ea.application_status, e.title as event_title, u.name as organizer_name
             FROM event_applications ea
             JOIN events e ON ea.event_id = e.id
             JOIN users u ON e.organizer_id = u.id
             WHERE ea.application_status = 'pending'
             LIMIT 5`
        );

        if (applicationsResult.success && applicationsResult.data.length > 0) {
            console.log(`✅ Found ${applicationsResult.data.length} pending applications:`);
            applicationsResult.data.forEach(app => {
                console.log(`  - App ID: ${app.id}, Event: "${app.event_title}", Organizer: ${app.organizer_name}`);
            });
        } else {
            console.log('⚠️ No pending applications found');
        }

    } catch (error) {
        console.error('❌ Error checking organizer setup:', error);
    }
}

// Run the check
checkOrganizerSetup().then(() => {
    console.log('\n🏁 Check completed');
    process.exit(0);
}).catch(error => {
    console.error('❌ Check error:', error);
    process.exit(1);
}); 