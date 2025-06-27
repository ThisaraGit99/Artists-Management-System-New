const axios = require('axios');

async function testOrganizerBookings() {
    try {
        // You'll need to replace this with a valid organizer token
        const token = 'your_organizer_token_here';
        
        const response = await axios.get('http://localhost:5000/api/organizers/bookings?status=&page=1&limit=10', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Success:', response.data);
        
    } catch (error) {
        console.log('Error Status:', error.response?.status);
        console.log('Error Message:', error.response?.data?.message);
        console.log('Error Details:', error.response?.data?.error);
        console.log('Full Error:', error.message);
    }
}

// For now, let's just test the database query directly
const { executeQuery } = require('./backend/config/database');

async function testDirectQuery() {
    try {
        console.log('Testing direct database query...');
        
        // Test if organizer exists
        const orgResult = await executeQuery('SELECT id FROM organizers LIMIT 1');
        console.log('Organizers found:', orgResult);
        
        if (orgResult.success && orgResult.data.length > 0) {
            const organizerId = orgResult.data[0].id;
            
            // Test the problematic query
            const bookingsQuery = `
                SELECT b.id, b.artist_id, b.organizer_id, b.event_name, b.total_amount, b.status
                FROM bookings b 
                WHERE b.organizer_id = ?
                LIMIT 1
            `;
            
            const bookingsResult = await executeQuery(bookingsQuery, [organizerId]);
            console.log('Bookings query result:', bookingsResult);
        }
        
    } catch (error) {
        console.error('Direct query error:', error);
    }
}

testDirectQuery(); 