const mysql = require('mysql2/promise');

async function checkOrganizerAccounts() {
    console.log('🔍 Checking Organizer Accounts');
    console.log('==============================');

    try {
        // Connect to database
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '1234',
            database: 'artist_management_system'
        });

        // Get all users with organizer role
        console.log('\n1. Checking users with organizer role...');
        const [users] = await connection.execute(
            'SELECT id, name, email, role, is_verified, created_at FROM users WHERE role = "organizer"'
        );

        console.log('Organizer Users:');
        users.forEach(user => {
            console.log(`- ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Verified: ${user.is_verified}`);
        });

        // Get organizer profiles
        console.log('\n2. Checking organizer profiles...');
        const [organizers] = await connection.execute(`
            SELECT o.*, u.name as user_name, u.email 
            FROM organizers o 
            LEFT JOIN users u ON o.user_id = u.id
        `);

        console.log('Organizer Profiles:');
        organizers.forEach(org => {
            console.log(`- User: ${org.user_name} (${org.email})`);
            console.log(`  Organization: ${org.organization_name || 'Not set'}`);
            console.log(`  Type: ${org.organization_type || 'Not set'}`);
            console.log(`  Verified: ${org.is_verified}`);
            console.log('---');
        });

        // If no organizers exist, let's create a test one
        if (users.length === 0) {
            console.log('\n3. No organizers found. Creating test organizer...');
            
            // Create test organizer user
            const [userResult] = await connection.execute(`
                INSERT INTO users (name, email, password, role, is_verified) 
                VALUES (?, ?, ?, ?, ?)
            `, ['Test Organizer', 'organizer@example.com', '$2b$10$example_hashed_password', 'organizer', 1]);

            const userId = userResult.insertId;

            // Create organizer profile
            await connection.execute(`
                INSERT INTO organizers (user_id, organization_name, organization_type, is_verified) 
                VALUES (?, ?, ?, ?)
            `, [userId, 'Test Events Company', 'Event Planning Company', 1]);

            console.log('✅ Test organizer created');
            console.log('Email: organizer@example.com');
            console.log('Password: password123 (you need to hash this)');
        }

        await connection.end();
        console.log('\n✅ Check completed');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkOrganizerAccounts(); 