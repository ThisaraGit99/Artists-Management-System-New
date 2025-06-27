const db = require('./config/database');

async function checkTables() {
    try {
        console.log('=== CHECKING DISPUTE SYSTEM TABLES ===\n');
        
        // Check if disputes table exists
        console.log('1. Checking disputes table...');
        const disputesCheck = await new Promise((resolve, reject) => {
            db.query("SHOW TABLES LIKE 'disputes'", (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
        console.log('Disputes table exists:', disputesCheck.length > 0 ? 'YES' : 'NO');
        
        // Check if cancellation_requests table exists
        console.log('\n2. Checking cancellation_requests table...');
        const cancellationCheck = await new Promise((resolve, reject) => {
            db.query("SHOW TABLES LIKE 'cancellation_requests'", (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
        console.log('Cancellation_requests table exists:', cancellationCheck.length > 0 ? 'YES' : 'NO');
        
        // Show all tables
        console.log('\n3. All available tables:');
        const allTables = await new Promise((resolve, reject) => {
            db.query('SHOW TABLES', (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
        
        allTables.forEach(table => {
            const tableName = Object.values(table)[0];
            console.log(`  - ${tableName}`);
        });
        
        // Check bookings table structure
        console.log('\n4. Bookings table structure (status column):');
        const bookingsStructure = await new Promise((resolve, reject) => {
            db.query("SHOW COLUMNS FROM bookings WHERE Field = 'status'", (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
        
        if (bookingsStructure.length > 0) {
            console.log('Status column type:', bookingsStructure[0].Type);
        } else {
            console.log('Status column not found');
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

checkTables(); 