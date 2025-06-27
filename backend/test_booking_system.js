const { executeQuery } = require('./config/database');

async function testBookingSystem() {
    console.log('🧪 Testing Booking System...\n');

    try {
        // Test 1: Check tables exist
        console.log('📋 1. Checking database tables...');
        
        const tables = ['users', 'organizers', 'artists', 'bookings', 'packages'];
        for (const table of tables) {
            const result = await executeQuery(`SHOW TABLES LIKE '${table}'`);
            if (result.success && result.data.length > 0) {
                console.log(`✅ ${table} table exists`);
            } else {
                console.log(`❌ ${table} table missing`);
            }
        }

        // Test 2: Check if organizer exists
        console.log('\n👤 2. Checking organizer data...');
        const organizerResult = await executeQuery(
            'SELECT u.id, u.name, o.id as organizer_id FROM users u JOIN organizers o ON u.id = o.user_id WHERE u.role = "organizer"'
        );
        if (organizerResult.success && organizerResult.data.length > 0) {
            console.log(`✅ Found ${organizerResult.data.length} organizer(s)`);
            organizerResult.data.forEach(org => {
                console.log(`   - ${org.name} (ID: ${org.id}, Organizer ID: ${org.organizer_id})`);
            });
        } else {
            console.log('❌ No organizers found');
        }

        // Test 3: Check if artists exist
        console.log('\n🎭 3. Checking artist data...');
        const artistResult = await executeQuery(
            'SELECT u.id, u.name, a.id as artist_id FROM users u JOIN artists a ON u.id = a.user_id WHERE u.role = "artist"'
        );
        if (artistResult.success && artistResult.data.length > 0) {
            console.log(`✅ Found ${artistResult.data.length} artist(s)`);
            artistResult.data.forEach(artist => {
                console.log(`   - ${artist.name} (ID: ${artist.id}, Artist ID: ${artist.artist_id})`);
            });
        } else {
            console.log('❌ No artists found');
        }

        // Test 4: Check bookings
        console.log('\n📅 4. Checking booking data...');
        const bookingResult = await executeQuery('SELECT COUNT(*) as count FROM bookings');
        if (bookingResult.success) {
            console.log(`✅ Found ${bookingResult.data[0].count} booking(s)`);
        } else {
            console.log('❌ Error checking bookings');
        }

        // Test 5: Check packages
        console.log('\n📦 5. Checking package data...');
        const packageResult = await executeQuery('SELECT COUNT(*) as count FROM packages');
        if (packageResult.success) {
            console.log(`✅ Found ${packageResult.data[0].count} package(s)`);
        } else {
            console.log('❌ Error checking packages');
        }

        // Test 6: Test booking query (the actual query used in controller)
        console.log('\n🔍 6. Testing booking fetch query...');
        try {
            const testQuery = `
                SELECT b.*, 
                       a.user_id as artist_user_id,
                       u.name as artist_name,
                       u.email as artist_email,
                       u.phone as artist_phone,
                       p.title as package_title,
                       p.description as package_description
                FROM bookings b
                JOIN artists a ON b.artist_id = a.id
                JOIN users u ON a.user_id = u.id
                LEFT JOIN packages p ON b.package_id = p.id
                LIMIT 1
            `;
            
            const testResult = await executeQuery(testQuery);
            if (testResult.success) {
                console.log('✅ Booking query works correctly');
                if (testResult.data.length > 0) {
                    console.log('   Sample booking found:', testResult.data[0].event_name || 'No event name');
                } else {
                    console.log('   No bookings in database yet');
                }
            } else {
                console.log('❌ Booking query failed:', testResult.error);
            }
        } catch (error) {
            console.log('❌ Booking query error:', error.message);
        }

        console.log('\n🎉 Test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        process.exit(0);
    }
}

testBookingSystem(); 