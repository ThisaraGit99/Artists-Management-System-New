const axios = require('axios');
const mysql = require('mysql2/promise');

const API_BASE = 'http://localhost:5000/api';

async function testArtistBookings() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '1234',
        database: 'artist_management_system'
    });

    try {
        console.log('📋 Testing Artist Bookings System...\n');
        
        // 1. Check database structure
        console.log('1️⃣ Checking database structure...');
        
        // Check if bookings table exists
        const [tables] = await connection.execute("SHOW TABLES LIKE 'bookings'");
        if (tables.length === 0) {
            console.log('❌ Bookings table does not exist');
            return;
        }
        console.log('✅ Bookings table exists');
        
        // Check bookings table structure
        const [columns] = await connection.execute("DESCRIBE bookings");
        console.log('📊 Bookings table columns:');
        columns.forEach(col => {
            console.log(`   ${col.Field} - ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : ''}`);
        });
        
        // 2. Check existing bookings
        console.log('\n2️⃣ Checking existing bookings...');
        const [bookings] = await connection.execute('SELECT COUNT(*) as count FROM bookings');
        console.log(`   Total bookings: ${bookings[0].count}`);
        
        if (bookings[0].count > 0) {
            // Show sample bookings
            const [sampleBookings] = await connection.execute(`
                SELECT b.*, a.user_id as artist_user_id, u.name as artist_name
                FROM bookings b
                LEFT JOIN artists a ON b.artist_id = a.id
                LEFT JOIN users u ON a.user_id = u.id
                LIMIT 3
            `);
            
            console.log('   Sample bookings:');
            sampleBookings.forEach((booking, index) => {
                console.log(`      ${index + 1}. Event: ${booking.event_name}`);
                console.log(`         Artist ID: ${booking.artist_id} (User ID: ${booking.artist_user_id})`);
                console.log(`         Artist: ${booking.artist_name || 'Unknown'}`);
                console.log(`         Status: ${booking.status}`);
                console.log(`         Amount: $${booking.total_amount}`);
                console.log('');
            });
        }
        
        // 3. Check organizers table
        console.log('3️⃣ Checking organizers/artists relationship...');
        const [artists] = await connection.execute('SELECT COUNT(*) as count FROM artists');
        const [organizers] = await connection.execute('SELECT COUNT(*) as count FROM organizers');
        console.log(`   Artists: ${artists[0].count}`);
        console.log(`   Organizers: ${organizers[0].count}`);
        
        // 4. Test API login
        console.log('\n4️⃣ Testing API authentication...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: 'john.artist@email.com',
            password: 'artist123'
        });
        
        if (!loginResponse.data.success) {
            console.log('❌ Login failed:', loginResponse.data.message);
            return;
        }
        
        console.log('✅ Artist login successful');
        const token = loginResponse.data.data.token;
        
        // 5. Test bookings API
        console.log('\n5️⃣ Testing bookings API...');
        
        try {
            const bookingsResponse = await axios.get(`${API_BASE}/artists/bookings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (bookingsResponse.data.success) {
                console.log('✅ Bookings API successful');
                console.log(`   Retrieved ${bookingsResponse.data.data.length} bookings`);
                console.log(`   Pagination:`, bookingsResponse.data.pagination);
                
                if (bookingsResponse.data.data.length > 0) {
                    console.log('\n   Sample booking from API:');
                    const booking = bookingsResponse.data.data[0];
                    console.log(`      Event: ${booking.event_name}`);
                    console.log(`      Status: ${booking.status}`);
                    console.log(`      Amount: $${booking.total_amount}`);
                    console.log(`      Organizer: ${booking.organizer_name}`);
                }
            } else {
                console.log('❌ Bookings API failed:', bookingsResponse.data.message);
            }
            
        } catch (error) {
            console.log('❌ Bookings API error:', error.response?.data?.message || error.message);
            if (error.response?.data) {
                console.log('   Response data:', error.response.data);
            }
        }
        
        // 6. Test dashboard stats API
        console.log('\n6️⃣ Testing dashboard stats API...');
        
        try {
            const statsResponse = await axios.get(`${API_BASE}/artists/dashboard/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (statsResponse.data.success) {
                console.log('✅ Dashboard stats API successful');
                const data = statsResponse.data.data;
                console.log('   Booking Stats:');
                console.log(`      Total: ${data.bookingStats.totalBookings}`);
                console.log(`      Active: ${data.bookingStats.activeBookings}`);
                console.log(`      Completed: ${data.bookingStats.completedBookings}`);
                console.log(`      Pending: ${data.bookingStats.pendingBookings}`);
            } else {
                console.log('❌ Dashboard stats failed:', statsResponse.data.message);
            }
            
        } catch (error) {
            console.log('❌ Dashboard stats error:', error.response?.data?.message || error.message);
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('📋 BOOKING SYSTEM TEST SUMMARY');
        console.log('='.repeat(60));
        console.log(`Database bookings: ${bookings[0].count}`);
        console.log(`Artists in DB: ${artists[0].count}`);
        console.log(`Organizers in DB: ${organizers[0].count}`);
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('   Response data:', error.response.data);
        }
    } finally {
        await connection.end();
    }
}

testArtistBookings().catch(console.error); 