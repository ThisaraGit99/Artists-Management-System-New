const { executeQuery } = require('./backend/config/database');

async function testProfileImageSetup() {
    console.log('🧪 Testing Profile Image Setup...\n');
    
    try {
        // Test 1: Check if profile_image column exists in artists table
        console.log('1. Checking if profile_image column exists in artists table...');
        const columnCheck = await executeQuery(
            "SHOW COLUMNS FROM artists LIKE 'profile_image'"
        );
        
        if (columnCheck.success && columnCheck.data.length > 0) {
            console.log('✅ profile_image column exists in artists table');
            console.log('   Column details:', columnCheck.data[0]);
        } else {
            console.log('❌ profile_image column NOT found in artists table');
            console.log('   Please run: ALTER TABLE artists ADD COLUMN profile_image VARCHAR(255) DEFAULT NULL AFTER bio;');
            return;
        }
        
        // Test 2: Check artists table structure
        console.log('\n2. Checking full artists table structure...');
        const tableStructure = await executeQuery('DESCRIBE artists');
        if (tableStructure.success) {
            console.log('✅ Artists table structure:');
            tableStructure.data.forEach(column => {
                const marker = column.Field === 'profile_image' ? '👉 ' : '   ';
                console.log(`${marker}${column.Field} - ${column.Type} - ${column.Null} - ${column.Default}`);
            });
        }
        
        // Test 3: Test file upload directory
        console.log('\n3. Checking upload directories...');
        const fs = require('fs');
        const path = require('path');
        
        const uploadDir = path.join(__dirname, 'backend', 'uploads', 'profile-images');
        if (fs.existsSync(uploadDir)) {
            console.log('✅ Upload directory exists:', uploadDir);
        } else {
            console.log('❌ Upload directory missing:', uploadDir);
            console.log('   Creating directory...');
            fs.mkdirSync(uploadDir, { recursive: true });
            console.log('✅ Upload directory created');
        }
        
        // Test 4: Check if a sample artist exists to test with
        console.log('\n4. Checking for existing artists...');
        const artistsCheck = await executeQuery(
            'SELECT a.id, a.user_id, a.profile_image, u.name FROM artists a JOIN users u ON a.user_id = u.id LIMIT 3'
        );
        
        if (artistsCheck.success && artistsCheck.data.length > 0) {
            console.log('✅ Found existing artists:');
            artistsCheck.data.forEach(artist => {
                console.log(`   - ID: ${artist.id}, User: ${artist.name}, Profile Image: ${artist.profile_image || 'None'}`);
            });
        } else {
            console.log('ℹ️  No artists found in database yet');
        }
        
        console.log('\n🎉 Profile Image Setup Test Complete!');
        console.log('\n📝 Next Steps:');
        console.log('   1. Start your backend server: cd backend && npm start');
        console.log('   2. Start your frontend server: cd frontend && npm start');
        console.log('   3. Login as an artist and go to Artist Profile → Basic Info');
        console.log('   4. Try uploading a profile image!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testProfileImageSetup(); 