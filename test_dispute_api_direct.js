const { pool } = require('./backend/config/database');

async function testDisputeAPI() {
    try {
        console.log('🔍 Testing dispute API directly...');
        
        // Test the exact INSERT query from disputeController.js
        const bookingId = 1; // Use a test booking ID
        const organizerId = 1; // Use a test organizer ID
        const reason = 'Test dispute reason';
        const evidence = [];
        
        const autoResolveDate = new Date();
        autoResolveDate.setDate(autoResolveDate.getDate() + 2);
        
        console.log('Testing INSERT query...');
        const [disputeResult] = await pool.execute(`
            INSERT INTO disputes (
                booking_id, dispute_type, reporter_id, 
                issue_description, evidence_files, auto_resolve_date, status
            ) VALUES (?, 'non_delivery', ?, ?, ?, ?, 'open')
        `, [bookingId, organizerId, reason, JSON.stringify(evidence), autoResolveDate]);
        
        console.log('✅ Dispute inserted successfully with ID:', disputeResult.insertId);
        
        // Clean up
        await pool.execute('DELETE FROM disputes WHERE id = ?', [disputeResult.insertId]);
        console.log('✅ Test record cleaned up');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('SQL State:', error.sqlState);
        console.error('Error Code:', error.code);
        console.error('Full error:', error);
    } finally {
        process.exit(0);
    }
}

testDisputeAPI(); 