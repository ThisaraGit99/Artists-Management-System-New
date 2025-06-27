const mysql = require('mysql2/promise');

console.log('🧪 Simple Debug Test\n');

async function simpleTest() {
    try {
        console.log('Testing database connection...');
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '1234',
            database: 'artist_management_system'
        });
        
        console.log('✅ Database connected');

        console.log('\nChecking Event 7 organizer...');
        const [rows] = await connection.execute(`
            SELECT e.id, e.title, e.organizer_id, u.name, u.email 
            FROM events e 
            JOIN users u ON e.organizer_id = u.id 
            WHERE e.id = 7
        `);
        
        console.log('Query completed, rows:', rows.length);
        
        if (rows.length > 0) {
            const event = rows[0];
            console.log(`✅ Found: "${event.title}" by ${event.name} (${event.email})`);
            
            // Check Application 10
            const [appRows] = await connection.execute('SELECT * FROM event_applications WHERE id = 10');
            console.log(`Application 10 found: ${appRows.length > 0 ? 'YES' : 'NO'}`);
            
            if (appRows.length > 0) {
                console.log(`Status: ${appRows[0].application_status}`);
            }
            
        } else {
            console.log('❌ Event 7 not found');
        }
        
        await connection.end();
        console.log('✅ Database connection closed');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

simpleTest(); 