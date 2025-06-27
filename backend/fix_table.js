const db = require('./config/database');

async function fixTable() {
    try {
        console.log('Adding organizer_id column...');
        const result = await db.executeQuery('ALTER TABLE bookings ADD COLUMN organizer_id INT');
        console.log('Result:', result);
    } catch (error) {
        console.log('Error:', error.message);
    }
}

fixTable(); 