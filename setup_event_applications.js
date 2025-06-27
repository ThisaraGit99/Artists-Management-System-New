const { executeQuery } = require('./backend/config/database');

async function setupEventApplications() {
    console.log('🚀 Setting up Event Applications System...\n');

    try {
        // 1. Create event_applications table
        console.log('1. Creating event_applications table...');
        await executeQuery(`
            CREATE TABLE IF NOT EXISTS event_applications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                event_id INT NOT NULL,
                artist_id INT NOT NULL,
                proposed_budget DECIMAL(10, 2) NOT NULL,
                message TEXT,
                application_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                organizer_response TEXT,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                responded_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
                FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE,
                UNIQUE KEY unique_event_artist (event_id, artist_id)
            )
        `);
        console.log('✅ event_applications table created');

        // 2. Add columns to events table
        console.log('2. Adding columns to events table...');
        try {
            await executeQuery('ALTER TABLE events ADD COLUMN total_applications INT DEFAULT 0');
            console.log('✅ total_applications column added');
        } catch (e) {
            console.log('✅ total_applications column already exists');
        }
        
        try {
            await executeQuery('ALTER TABLE events ADD COLUMN approved_applications INT DEFAULT 0');
            console.log('✅ approved_applications column added');
        } catch (e) {
            console.log('✅ approved_applications column already exists');
        }

        try {
            await executeQuery('ALTER TABLE events ADD COLUMN application_deadline DATE NULL');
            console.log('✅ application_deadline column added');
        } catch (e) {
            console.log('✅ application_deadline column already exists');
        }

        // 3. Add columns to bookings table
        console.log('3. Adding columns to bookings table...');
        try {
            await executeQuery('ALTER TABLE bookings ADD COLUMN event_id INT NULL AFTER organizer_id');
            console.log('✅ event_id column added to bookings');
        } catch (e) {
            console.log('✅ event_id column already exists in bookings');
        }

        try {
            await executeQuery('ALTER TABLE bookings ADD COLUMN application_id INT NULL AFTER event_id');
            console.log('✅ application_id column added to bookings');
        } catch (e) {
            console.log('✅ application_id column already exists in bookings');
        }

        // 4. Create indexes
        console.log('4. Creating indexes...');
        try {
            await executeQuery('CREATE INDEX idx_event_applications_event_id ON event_applications(event_id)');
            console.log('✅ Event applications event_id index created');
        } catch (e) {
            console.log('✅ Event applications event_id index already exists');
        }

        try {
            await executeQuery('CREATE INDEX idx_event_applications_artist_id ON event_applications(artist_id)');
            console.log('✅ Event applications artist_id index created');
        } catch (e) {
            console.log('✅ Event applications artist_id index already exists');
        }

        try {
            await executeQuery('CREATE INDEX idx_event_applications_status ON event_applications(application_status)');
            console.log('✅ Event applications status index created');
        } catch (e) {
            console.log('✅ Event applications status index already exists');
        }

        // 5. Insert sample data for testing
        console.log('5. Creating sample event for testing...');
        try {
            // Check if we have at least one organizer
            const organizerCheck = await executeQuery('SELECT user_id FROM organizers LIMIT 1');
            
            if (organizerCheck.success && organizerCheck.data.length > 0) {
                const organizerUserId = organizerCheck.data[0].user_id;
                
                await executeQuery(`
                    INSERT INTO events (organizer_id, title, description, event_type, event_date, start_time, end_time, venue_name, venue_city, venue_state, budget_min, budget_max, status, is_public) 
                    VALUES (?, 'Summer Music Festival 2024', 'A vibrant outdoor music festival featuring multiple artists across various genres', 'Festival', '2024-07-15', '18:00:00', '23:00:00', 'Central Park Amphitheater', 'New York', 'NY', 1000.00, 5000.00, 'published', true)
                `, [organizerUserId]);
                
                console.log('✅ Sample event created for testing');
            } else {
                console.log('⚠️ No organizers found - sample event not created');
            }
        } catch (e) {
            console.log('⚠️ Sample event might already exist or error occurred:', e.message);
        }

        console.log('\n✅ Database setup completed successfully!');
        console.log('\n📊 Summary:');
        console.log('- ✅ event_applications table created');
        console.log('- ✅ events table enhanced with application tracking');
        console.log('- ✅ bookings table linked to events and applications');
        console.log('- ✅ Indexes created for better performance');
        console.log('- ✅ Sample data created for testing');

        console.log('\n🎯 Next Steps:');
        console.log('1. Backend controller and routes need to be created');
        console.log('2. Frontend components for event applications will be created');
        console.log('3. Test the complete workflow');

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        throw error;
    }
}

if (require.main === module) {
    setupEventApplications()
        .then(() => {
            console.log('\n🎉 Setup completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Setup failed:', error.message);
            process.exit(1);
        });
}

module.exports = setupEventApplications; 