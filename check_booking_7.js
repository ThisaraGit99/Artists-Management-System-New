const { executeQuery } = require('./backend/config/database');

async function checkBooking7() {
    try {
        console.log('=== Checking Booking ID 7 ===\n');
        
        // Check if booking 7 exists
        const booking7Result = await executeQuery('SELECT * FROM bookings WHERE id = 7');
        
        if (!booking7Result.success || booking7Result.data.length === 0) {
            console.log('❌ Booking ID 7 does NOT exist in the database');
            
            // Show available bookings
            const allBookingsResult = await executeQuery('SELECT id, event_name, organizer_id, artist_id, status FROM bookings ORDER BY id');
            
            if (allBookingsResult.success) {
                console.log('\n📋 Available bookings:');
                if (allBookingsResult.data.length === 0) {
                    console.log('  No bookings found in database');
                } else {
                    allBookingsResult.data.forEach(b => {
                        console.log(`  ID: ${b.id} | Event: ${b.event_name} | Organizer: ${b.organizer_id} | Status: ${b.status}`);
                    });
                }
            }
        } else {
            console.log('✅ Booking ID 7 exists:');
            const booking = booking7Result.data[0];
            console.log(`  Event: ${booking.event_name}`);
            console.log(`  Organizer ID: ${booking.organizer_id}`);
            console.log(`  Artist ID: ${booking.artist_id}`);
            console.log(`  Status: ${booking.status}`);
            
            // Check which organizer owns it
            const organizerId = booking.organizer_id;
            const organizerResult = await executeQuery(
                'SELECT o.id, o.user_id, u.name, u.email, o.is_verified FROM organizers o JOIN users u ON o.user_id = u.id WHERE o.id = ?', 
                [organizerId]
            );
            
            if (organizerResult.success && organizerResult.data.length > 0) {
                console.log('\n👤 Owning organizer:');
                const organizer = organizerResult.data[0];
                console.log(`  Name: ${organizer.name}`);
                console.log(`  Email: ${organizer.email}`);
                console.log(`  User ID: ${organizer.user_id}`);
                console.log(`  Verified: ${organizer.is_verified ? 'Yes' : 'No'}`);
            }
        }
        
        // Show all organizers for reference
        console.log('\n👥 All organizers:');
        const allOrganizersResult = await executeQuery('SELECT o.id, o.user_id, u.name, u.email, o.is_verified FROM organizers o JOIN users u ON o.user_id = u.id');
        if (allOrganizersResult.success) {
            allOrganizersResult.data.forEach(org => {
                console.log(`  Organizer ID: ${org.id} | User ID: ${org.user_id} | Name: ${org.name} | Verified: ${org.is_verified ? 'Yes' : 'No'}`);
            });
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkBooking7(); 