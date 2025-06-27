const { executeQuery } = require('./backend/config/database');

async function checkBookingsTable() {
    try {
        console.log('=== Bookings Table Structure ===\n');
        
        const result = await executeQuery('DESCRIBE bookings');
        
        if (result.success) {
            console.log('Columns in bookings table:');
            result.data.forEach(col => {
                console.log(`- ${col.Field} (${col.Type})`);
            });
        } else {
            console.error('Error describing table:', result.error);
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkBookingsTable(); 