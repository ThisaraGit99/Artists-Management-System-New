const mysql = require('mysql2/promise');

async function checkUsers() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'artist_management_system'
        });

        console.log('🔍 Checking all users in database:');
        console.log('==================================');

        const [users] = await connection.execute(
            'SELECT id, name, email, role, created_at FROM users ORDER BY id'
        );

        if (users.length === 0) {
            console.log('❌ No users found in database');
        } else {
            users.forEach((user, index) => {
                console.log(`\n👤 User ${index + 1}:`);
                console.log(`  ID: ${user.id}`);
                console.log(`  Name: ${user.name}`);
                console.log(`  Email: ${user.email}`);
                console.log(`  Role: ${user.role}`);
                console.log(`  Created: ${user.created_at}`);
            });
        }

        await connection.end();

    } catch (error) {
        console.error('❌ Database error:', error.message);
    }
}

checkUsers(); 