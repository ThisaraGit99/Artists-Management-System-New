const { pool } = require('./config/database');

async function checkUsers() {
    try {
        console.log('🔍 Checking users in database...');
        
        const [users] = await pool.execute('SELECT id, email, role FROM users WHERE role = "organizer" LIMIT 5');
        console.log('Organizer users:');
        users.forEach(user => {
            console.log(`  - ID: ${user.id}, Email: ${user.email}, Role: ${user.role}`);
        });
        
        // Check specific user
        const [specific] = await pool.execute('SELECT * FROM users WHERE email = "jane.organizer@email.com"');
        if (specific.length > 0) {
            console.log('\nJane organizer found:', {
                id: specific[0].id,
                email: specific[0].email,
                role: specific[0].role,
                is_verified: specific[0].is_verified
            });
        } else {
            console.log('\nJane organizer not found');
        }
        
        // Get first available organizer
        if (users.length > 0) {
            console.log('\nFirst available organizer:', users[0]);
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        process.exit(0);
    }
}

checkUsers(); 