const { executeQuery } = require('./backend/config/database');

async function checkData() {
    try {
        console.log('Checking organizer and booking data...');
        
        // Check organizers
        const organizersResult = await executeQuery('SELECT id, user_id, organization_name FROM organizers');
        console.log('\n=== ORGANIZERS ===');
        if (organizersResult.success) {
            console.log('Count:', organizersResult.data.length);
            organizersResult.data.forEach(org => {
                console.log(`ID: ${org.id}, User: ${org.user_id}, Name: ${org.organization_name}`);
            });
        } else {
            console.log('Error:', organizersResult.error);
        }
        
        // Check bookings
        const bookingsResult = await executeQuery('SELECT id, organizer_id, artist_id, event_name FROM bookings LIMIT 5');
        console.log('\n=== BOOKINGS ===');
        if (bookingsResult.success) {
            console.log('Count:', bookingsResult.data.length);
            bookingsResult.data.forEach(booking => {
                console.log(`ID: ${booking.id}, Organizer: ${booking.organizer_id}, Artist: ${booking.artist_id}, Event: ${booking.event_name}`);
            });
        } else {
            console.log('Error:', bookingsResult.error);
        }
        
        // Check users with organizer role
        const organizerUsersResult = await executeQuery("SELECT id, name, email FROM users WHERE role = 'organizer'");
        console.log('\n=== ORGANIZER USERS ===');
        if (organizerUsersResult.success) {
            console.log('Count:', organizerUsersResult.data.length);
            organizerUsersResult.data.forEach(user => {
                console.log(`ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`);
            });
        } else {
            console.log('Error:', organizerUsersResult.error);
        }
        
        process.exit(0);
        
    } catch (error) {
        console.error('Script error:', error);
        process.exit(1);
    }
}

checkData(); 