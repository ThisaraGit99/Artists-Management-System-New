const { executeQuery } = require('./backend/config/database');

async function debugBooking7() {
    try {
        console.log('=== DEBUG: Booking ID 7 Issue ===\n');
        
        // Check if booking 7 exists
        const booking = await executeQuery('SELECT * FROM bookings WHERE id = 7');
        console.log('Booking 7 exists:', booking.success ? booking.data.length > 0 : false);
        
        if (booking.success && booking.data.length > 0) {
            console.log('Booking 7 data:', JSON.stringify(booking.data[0], null, 2));
            
            // Check which organizer owns it
            const organizerId = booking.data[0].organizer_id;
            const organizer = await executeQuery('SELECT o.*, u.name, u.email FROM organizers o JOIN users u ON o.user_id = u.id WHERE o.id = ?', [organizerId]);
            console.log('\nOwning organizer:', JSON.stringify(organizer.data[0], null, 2));
        } else {
            console.log('Booking 7 does not exist!');
            
            // Show all bookings
            const allBookings = await executeQuery('SELECT id, event_name, organizer_id FROM bookings ORDER BY id');
            console.log('\nAll available bookings:');
            if (allBookings.success) {
                allBookings.data.forEach(b => {
                    console.log(`ID: ${b.id}, Event: ${b.event_name}, Organizer: ${b.organizer_id}`);
                });
            }
        }
        
        // Check organizer verification status for current users
        console.log('\n=== Organizer Verification Status ===');
        const organizers = await executeQuery('SELECT o.id, o.user_id, o.is_verified, u.name, u.email FROM organizers o JOIN users u ON o.user_id = u.id');
        if (organizers.success) {
            organizers.data.forEach(org => {
                console.log(`Organizer ID: ${org.id}, User: ${org.name} (${org.email}), Verified: ${org.is_verified}`);
            });
        }
        
    } catch (error) {
        console.error('Debug failed:', error);
    }
}

debugBooking7(); 