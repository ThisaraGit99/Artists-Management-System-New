const { pool } = require('./backend/config/database');

async function testDisputeAPI() {
    try {
        console.log('🔍 Testing dispute API...');
        
        // Test 1: Check table structure
        console.log('\n1. Checking disputes table structure...');
        const [columns] = await pool.execute('DESCRIBE disputes');
        console.log('Available columns:');
        columns.forEach(col => {
            console.log(`  - ${col.Field} (${col.Type})`);
        });
        
        // Test 2: Try to insert a test dispute record
        console.log('\n2. Testing dispute insertion...');
        
        // First, let's get a sample booking
        const [bookings] = await pool.execute('SELECT id FROM bookings LIMIT 1');
        if (bookings.length === 0) {
            console.log('❌ No bookings found to test with');
            return;
        }
        
        const bookingId = bookings[0].id;
        console.log('Using booking ID:', bookingId);
        
        // Test the exact query from the controller
        const autoResolveDate = new Date();
        autoResolveDate.setDate(autoResolveDate.getDate() + 2);
        
        const testQuery = `
            INSERT INTO disputes (
                booking_id, dispute_type, reporter_id, 
                issue_description, evidence_files, auto_resolve_date, status
            ) VALUES (?, 'non_delivery', ?, ?, ?, ?, 'open')
        `;
        
        console.log('Test query:', testQuery);
        console.log('Parameters:', [bookingId, 1, 'Test dispute', '[]', autoResolveDate]);
        
        const [result] = await pool.execute(testQuery, [
            bookingId, 1, 'Test dispute', '[]', autoResolveDate
        ]);
        
        console.log('✅ Dispute inserted successfully with ID:', result.insertId);
        
        // Clean up test record
        await pool.execute('DELETE FROM disputes WHERE id = ?', [result.insertId]);
        console.log('✅ Test record cleaned up');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Full error:', error);
    } finally {
        process.exit(0);
    }
}

testDisputeAPI(); 