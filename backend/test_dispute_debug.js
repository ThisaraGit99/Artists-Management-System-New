const { pool } = require('./config/database');

async function testDisputeAPI() {
    try {
        console.log('🔍 Testing dispute API for booking 8...');
        
        // Check if booking 8 exists
        const [bookings] = await pool.execute('SELECT * FROM bookings WHERE id = 8');
        if (bookings.length === 0) {
            console.log('❌ Booking 8 not found');
            return;
        }
        
        const booking = bookings[0];
        console.log('✅ Booking 8 found:', {
            id: booking.id,
            organizer_id: booking.organizer_id,
            artist_id: booking.artist_id,
            status: booking.status,
            payment_status: booking.payment_status
        });
        
        // Check organizer exists
        const [organizers] = await pool.execute('SELECT * FROM organizers WHERE id = ?', [booking.organizer_id]);
        if (organizers.length === 0) {
            console.log('❌ Organizer not found for booking 8');
            return;
        }
        
        console.log('✅ Organizer found:', {
            id: organizers[0].id,
            user_id: organizers[0].user_id
        });
        
        // Check disputes table structure
        console.log('\n📋 Disputes table structure:');
        const [columns] = await pool.execute('DESCRIBE disputes');
        columns.forEach(col => {
            console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : ''}`);
        });
        
        // Test the exact query from disputeController.js
        const autoResolveDate = new Date();
        autoResolveDate.setDate(autoResolveDate.getDate() + 2);
        
        console.log('\n🧪 Testing INSERT query...');
        console.log('Parameters:', {
            booking_id: booking.id,
            dispute_type: 'non_delivery',
            reporter_id: organizers[0].user_id,
            issue_description: 'Test dispute',
            evidence_files: '[]',
            auto_resolve_date: autoResolveDate,
            status: 'open'
        });
        
        const [disputeResult] = await pool.execute(`
            INSERT INTO disputes (
                booking_id, dispute_type, reporter_id, 
                issue_description, evidence_files, auto_resolve_date, status
            ) VALUES (?, 'non_delivery', ?, ?, ?, ?, 'open')
        `, [booking.id, organizers[0].user_id, 'Test dispute', '[]', autoResolveDate]);
        
        console.log('✅ Dispute created successfully with ID:', disputeResult.insertId);
        
        // Test updating booking status
        await pool.execute(
            'UPDATE bookings SET status = "not_delivered" WHERE id = ?',
            [booking.id]
        );
        console.log('✅ Booking status updated to not_delivered');
        
        // Clean up test data
        await pool.execute('DELETE FROM disputes WHERE id = ?', [disputeResult.insertId]);
        await pool.execute('UPDATE bookings SET status = ? WHERE id = ?', [booking.status, booking.id]);
        console.log('✅ Test data cleaned up');
        
        console.log('\n🎉 Dispute API test completed successfully!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('SQL State:', error.sqlState);
        console.error('Error Code:', error.code);
        if (error.sql) {
            console.error('SQL Query:', error.sql);
        }
    } finally {
        process.exit(0);
    }
}

testDisputeAPI(); 