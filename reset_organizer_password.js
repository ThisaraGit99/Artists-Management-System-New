const bcrypt = require('bcryptjs');
const { executeQuery } = require('./backend/config/database');

async function resetOrganizerPassword() {
    console.log('🔐 Resetting organizer password for testing...\n');
    
    try {
        // Hash the password "password123"
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        // Update the organizer's password
        const result = await executeQuery(
            'UPDATE users SET password = ? WHERE email = ?',
            [hashedPassword, 'jane.organizer@email.com']
        );
        
        if (result.success && result.affectedRows > 0) {
            console.log('✅ Password reset successful');
            console.log('📋 Email: jane.organizer@email.com');
            console.log('📋 Password: password123');
            console.log('\nYou can now use these credentials for testing');
        } else {
            console.log('❌ Password reset failed');
            console.log('📋 User may not exist');
        }
    } catch (error) {
        console.error('❌ Error resetting password:', error.message);
    }
    
    process.exit(0);
}

resetOrganizerPassword(); 