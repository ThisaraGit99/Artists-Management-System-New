const mysql = require('mysql2/promise');

async function testUserManagement() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'artist_management_system'
        });

        console.log('🔍 Testing User Management with Verification Status');
        console.log('=================================================');

        // Test the query from User.getAll to see what data we get
        const query = `
            SELECT 
                u.id, u.name, u.email, u.role, u.phone, u.profile_image, 
                u.created_at, u.updated_at,
                CASE 
                    WHEN u.role = 'admin' THEN 'active'
                    WHEN u.role = 'artist' THEN 
                        CASE WHEN a.is_verified = 1 THEN 'verified' ELSE 'unverified' END
                    WHEN u.role = 'organizer' THEN 
                        CASE WHEN o.is_verified = 1 THEN 'verified' ELSE 'unverified' END
                    ELSE 'unknown'
                END as status,
                CASE 
                    WHEN u.role = 'admin' THEN 1
                    WHEN u.role = 'artist' THEN COALESCE(a.is_verified, 0)
                    WHEN u.role = 'organizer' THEN COALESCE(o.is_verified, 0)
                    ELSE 0
                END as is_verified
            FROM users u
            LEFT JOIN artists a ON u.id = a.user_id AND u.role = 'artist'
            LEFT JOIN organizers o ON u.id = o.user_id AND u.role = 'organizer'
            ORDER BY u.created_at DESC
        `;

        const [users] = await connection.execute(query);

        console.log('\n📊 Current Users with Status:');
        console.log('-------------------------------');

        users.forEach((user, index) => {
            console.log(`\n👤 User ${index + 1}:`);
            console.log(`  ID: ${user.id}`);
            console.log(`  Name: ${user.name}`);
            console.log(`  Email: ${user.email}`);
            console.log(`  Role: ${user.role}`);
            console.log(`  Status: ${user.status}`);
            console.log(`  Is Verified: ${Boolean(user.is_verified)}`);
        });

        console.log('\n🔧 Testing Status Update...');

        // Find a test artist to update
        const testArtist = users.find(u => u.role === 'artist' && u.email === 'testartist@example.com');
        if (testArtist) {
            console.log(`\n📝 Found test artist: ${testArtist.name}`);
            console.log(`   Current status: ${testArtist.status}`);
            
            // Toggle verification status
            const newVerified = testArtist.is_verified ? 0 : 1;
            const newStatus = newVerified ? 'verified' : 'unverified';
            
            await connection.execute(
                'UPDATE artists SET is_verified = ? WHERE user_id = ?',
                [newVerified, testArtist.id]
            );
            
            console.log(`   ✅ Updated to: ${newStatus}`);
            
            // Verify the change
            const [updatedUser] = await connection.execute(query + ' AND u.id = ?', [testArtist.id]);
            if (updatedUser.length > 0) {
                console.log(`   🔍 Verified change: ${updatedUser[0].status}`);
            }
        }

        // Test organizer status as well
        const testOrganizer = users.find(u => u.role === 'organizer' && u.email === 'test01@mail.com');
        if (testOrganizer) {
            console.log(`\n📝 Found test organizer: ${testOrganizer.name}`);
            console.log(`   Current status: ${testOrganizer.status}`);
            
            // Toggle verification status
            const newVerified = testOrganizer.is_verified ? 0 : 1;
            const newStatus = newVerified ? 'verified' : 'unverified';
            
            await connection.execute(
                'UPDATE organizers SET is_verified = ? WHERE user_id = ?',
                [newVerified, testOrganizer.id]
            );
            
            console.log(`   ✅ Updated to: ${newStatus}`);
        }

        await connection.end();
        console.log('\n🎉 User Management Test Complete!');

    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
}

testUserManagement(); 