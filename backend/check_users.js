const mysql = require('mysql2/promise');

async function checkUsers() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '1234',
            database: 'artist_management_system'
        });
        
        console.log('📋 Users in database:\n');
        
        const [users] = await connection.execute('SELECT id, name, email, role FROM users ORDER BY role, id');
        
        users.forEach(user => {
            console.log(`${user.role.toUpperCase()}: ${user.name} (${user.email}) - ID: ${user.id}`);
        });
        
        console.log('\n🔍 Event 7 details:');
        const [event7] = await connection.execute(`
            SELECT e.id, e.title, e.organizer_id, u.name, u.email 
            FROM events e 
            JOIN users u ON e.organizer_id = u.id 
            WHERE e.id = 7
        `);
        
        if (event7.length > 0) {
            const event = event7[0];
            console.log(`Event 7: "${event.title}" by ${event.name} (${event.email})`);
            console.log(`Use email: ${event.email} with password: password123`);
        } else {
            console.log('Event 7 not found');
        }
        
        await connection.end();
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkUsers(); 