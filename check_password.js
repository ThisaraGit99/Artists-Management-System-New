const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function checkPasswords() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '1234',
            database: 'artist_management_system'
        });
        
        console.log('🔍 Checking user passwords...\n');
        
        const [users] = await connection.execute('SELECT id, name, email, password, role FROM users');
        
        for (const user of users) {
            console.log(`${user.role.toUpperCase()}: ${user.name} (${user.email})`);
            console.log(`   Password hash: ${user.password.substring(0, 20)}...`);
            
            // Test common passwords
            const testPasswords = ['password123', 'admin123', '123456', 'password'];
            
            for (const testPwd of testPasswords) {
                const isMatch = await bcrypt.compare(testPwd, user.password);
                if (isMatch) {
                    console.log(`   ✅ CORRECT PASSWORD: "${testPwd}"`);
                    break;
                }
            }
            console.log('');
        }
        
        await connection.end();
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkPasswords(); 