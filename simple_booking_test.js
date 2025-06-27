const mysql = require('mysql2/promise');

async function testBookings() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'artist_management'
    });
    
    try {
        // Check booking 7
        const [booking7] = await connection.execute('SELECT * FROM bookings WHERE id = 7');
        console.log('Booking 7 exists:', booking7.length > 0);
        if (booking7.length > 0) {
            console.log('Booking 7:', booking7[0]);
        }
        
        // Show all bookings
        const [allBookings] = await connection.execute('SELECT id, event_name, organizer_id FROM bookings ORDER BY id');
        console.log('\nAll bookings:');
        allBookings.forEach(b => console.log(`ID: ${b.id}, Event: ${b.event_name}, Organizer: ${b.organizer_id}`));
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await connection.end();
    }
}

testBookings(); 