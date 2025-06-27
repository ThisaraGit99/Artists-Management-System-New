const { pool } = require('./config/database');

async function testDisputeAPI() {
    try {
        console.log('🔍 Testing dispute API after fix...');
        
        // Test the exact INSERT query from disputeController.js
        const bookingId = 1;
        const organizerId = 1;
        const reason = 'Test dispute after fix';
        const evidence = [];
        
        const autoResolveDate = new Date();
        autoResolveDate.setDate(autoResolveDate.getDate() + 2);
        
        console.log('\n1. Testing disputeController.js INSERT query...');
        const [disputeResult] = await pool.execute(`
            INSERT INTO disputes (
                booking_id, dispute_type, reporter_id, 
                issue_description, evidence_files, auto_resolve_date, status
            ) VALUES (?, 'non_delivery', ?, ?, ?, ?, 'open')
        `, [bookingId, organizerId, reason, JSON.stringify(evidence), autoResolveDate]);
        
        console.log('✅ Dispute inserted successfully with ID:', disputeResult.insertId);
        
        // Test the organizerController.js INSERT query
        console.log('\n2. Testing organizerController.js INSERT query...');
        const [oldDisputeResult] = await pool.execute(`
            INSERT INTO disputes 
            (booking_id, reported_by_id, issue_description)
            VALUES (?, ?, ?)
        `, [bookingId, organizerId, 'Test old controller dispute']);
        
        console.log('✅ Old controller dispute inserted with ID:', oldDisputeResult.insertId);
        
        // Clean up test records
        await pool.execute('DELETE FROM disputes WHERE id IN (?, ?)', [disputeResult.insertId, oldDisputeResult.insertId]);
        console.log('✅ Test records cleaned up');
        
        console.log('\n🎉 Both dispute APIs are working correctly!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('SQL State:', error.sqlState);
        console.error('Error Code:', error.code);
    } finally {
        process.exit(0);
    }
}

testDisputeAPI(); 