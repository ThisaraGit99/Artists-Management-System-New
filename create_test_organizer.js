const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

async function createTestOrganizer() {
    try {
        console.log('Creating test organizer...');
        
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '1234',
            database: 'artist_management_system'
        });

        // Hash password
        const hashedPassword = await bcrypt.hash('password123', 10);

        // Create user (without is_verified column)
        const [userResult] = await connection.execute(`
            INSERT INTO users (name, email, password, role, phone) 
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE name = VALUES(name)
        `, ['Test Organizer', 'organizer@example.com', hashedPassword, 'organizer', '+1234567890']);

        // Get user ID
        const [users] = await connection.execute(
            'SELECT id FROM users WHERE email = ?', 
            ['organizer@example.com']
        );
        const userId = users[0].id;

        // Create or update organizer profile (is_verified is in organizers table)
        await connection.execute(`
            INSERT INTO organizers (user_id, organization_name, organization_type, website, description, location, is_verified) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                organization_name = VALUES(organization_name),
                organization_type = VALUES(organization_type),
                website = VALUES(website),
                description = VALUES(description),
                location = VALUES(location),
                is_verified = VALUES(is_verified)
        `, [userId, 'Test Events Company', 'Event Planning Company', 'https://testevents.com', 'Professional event planning and management services', 'New York, NY', 1]);

        console.log('✅ Test organizer created successfully!');
        console.log('Email: organizer@example.com');
        console.log('Password: password123');

        await connection.end();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

createTestOrganizer(); 