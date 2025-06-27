const { pool } = require('./config/database');
const disputeController = require('./controllers/disputeController');

async function testDisputeDirectly() {
    try {
        console.log('🔍 Testing dispute functionality directly...');
        
        // Get booking 8 data
        const [bookings] = await pool.execute('SELECT * FROM bookings WHERE id = 8');
        if (bookings.length === 0) {
            console.log('❌ Booking 8 not found');
            return;
        }
        
        const booking = bookings[0];
        console.log('✅ Booking 8 found:', {
            id: booking.id,
            organizer_id: booking.organizer_id,
            status: booking.status,
            payment_status: booking.payment_status
        });
        
        // Get organizer user ID
        const [organizers] = await pool.execute('SELECT user_id FROM organizers WHERE id = ?', [booking.organizer_id]);
        if (organizers.length === 0) {
            console.log('❌ Organizer not found');
            return;
        }
        
        const organizerUserId = organizers[0].user_id;
        console.log('✅ Organizer user ID:', organizerUserId);
        
        // Simulate the request object
        const req = {
            params: { bookingId: '8' },
            body: {
                reason: 'Artist did not show up for the event',
                evidence: []
            },
            user: { id: organizerUserId }
        };
        
        // Simulate the response object
        let responseData = null;
        let statusCode = 200;
        
        const res = {
            status: (code) => {
                statusCode = code;
                return res;
            },
            json: (data) => {
                responseData = data;
                return res;
            }
        };
        
        // Call the dispute controller directly
        console.log('🧪 Calling disputeController.reportNonDelivery...');
        await disputeController.reportNonDelivery(req, res);
        
        console.log('📊 Response Status:', statusCode);
        console.log('📊 Response Data:', responseData);
        
        if (responseData && responseData.success) {
            console.log('✅ Dispute created successfully!');
            
            // Clean up the test dispute
            if (responseData.data && responseData.data.disputeId) {
                await pool.execute('DELETE FROM disputes WHERE id = ?', [responseData.data.disputeId]);
                await pool.execute('UPDATE bookings SET status = ? WHERE id = ?', [booking.status, booking.id]);
                console.log('✅ Test data cleaned up');
            }
        } else {
            console.log('❌ Dispute creation failed');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        process.exit(0);
    }
}

testDisputeDirectly(); 