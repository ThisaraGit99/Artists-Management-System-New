const { executeQuery } = require('./backend/config/database');

async function checkUsers() {
    try {
        const result = await executeQuery('SELECT id, email, role FROM users WHERE role = "organizer"');
        console.log('Available organizers:');
        console.log(JSON.stringify(result.data, null, 2));
        
        const allUsers = await executeQuery('SELECT id, email, role FROM users LIMIT 5');
        console.log('\nAll users (sample):');
        console.log(JSON.stringify(allUsers.data, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
    process.exit(0);
}

checkUsers(); 