const { executeQuery } = require('./backend/config/database');

async function testApprovalDirectly() {
    console.log('🧪 Testing Application Approval Directly in Database\n');

    try {
        // 1. Find a pending application
        console.log('1. Finding pending applications...');
        const appsResult = await executeQuery(`
            SELECT ea.*, e.organizer_id, e.title as event_title, u.name as organizer_name
            FROM event_applications ea
            JOIN events e ON ea.event_id = e.id
            JOIN users u ON e.organizer_id = u.id
            WHERE ea.application_status = 'pending'
            LIMIT 1
        `);

        if (!appsResult.success || appsResult.data.length === 0) {
            console.log('❌ No pending applications found');
            return;
        }

        const application = appsResult.data[0];
        console.log(`✅ Found pending application:`, {
            id: application.id,
            eventId: application.event_id,
            eventTitle: application.event_title,
            organizerId: application.organizer_id,
            organizerName: application.organizer_name,
            artistId: application.artist_id,
            proposedBudget: application.proposed_budget
        });

        // 2. Get organizer DB ID
        console.log('\n2. Getting organizer DB ID...');
        const organizerResult = await executeQuery(
            'SELECT id FROM organizers WHERE user_id = ?',
            [application.organizer_id]
        );

        if (!organizerResult.success || organizerResult.data.length === 0) {
            console.log('❌ Organizer not found in organizers table');
            return;
        }

        const organizerDbId = organizerResult.data[0].id;
        console.log(`✅ Organizer DB ID: ${organizerDbId}`);

        // 3. Get event details
        console.log('\n3. Getting event details...');
        const eventResult = await executeQuery(
            'SELECT * FROM events WHERE id = ?',
            [application.event_id]
        );

        if (!eventResult.success || eventResult.data.length === 0) {
            console.log('❌ Event not found');
            return;
        }

        const event = eventResult.data[0];
        console.log(`✅ Event details:`, {
            id: event.id,
            title: event.title,
            eventDate: event.event_date,
            startTime: event.start_time
        });

        // 4. Try to update application status
        console.log('\n4. Updating application status...');
        const updateResult = await executeQuery(
            'UPDATE event_applications SET application_status = "approved", organizer_response = ?, responded_at = NOW() WHERE id = ?',
            ['Test approval - Direct database test', application.id]
        );

        if (updateResult.success) {
            console.log('✅ Application status updated successfully');
        } else {
            console.log('❌ Failed to update application status:', updateResult.error);
            return;
        }

        // 5. Try to create booking record
        console.log('\n5. Creating booking record...');
        try {
            const bookingResult = await executeQuery(
                `INSERT INTO bookings (
                    artist_id, organizer_id, event_id, application_id, 
                    event_name, event_date, event_time, 
                    total_amount, status, payment_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', 'pending')`,
                [
                    application.artist_id,
                    organizerDbId,
                    application.event_id,
                    application.id,
                    event.title,
                    event.event_date,
                    event.start_time || '19:00:00',
                    application.proposed_budget
                ]
            );

            if (bookingResult.success) {
                console.log('✅ Booking record created successfully:', bookingResult.insertId);
            } else {
                console.log('❌ Failed to create booking record:', bookingResult.error);
                console.log('   This is likely the source of the "cannot be approved" error');
            }
        } catch (bookingError) {
            console.log('❌ Booking creation error:', bookingError.message);
            console.log('   This is likely the source of the "cannot be approved" error');
        }

        // 6. Verify approval was successful
        console.log('\n6. Verifying approval...');
        const verifyResult = await executeQuery(
            'SELECT application_status, organizer_response FROM event_applications WHERE id = ?',
            [application.id]
        );

        if (verifyResult.success && verifyResult.data.length > 0) {
            const status = verifyResult.data[0];
            console.log(`✅ Final status: ${status.application_status}`);
            console.log(`✅ Response: ${status.organizer_response}`);
        }

    } catch (error) {
        console.error('❌ Test error:', error);
    }
}

// Run the test
testApprovalDirectly().then(() => {
    console.log('\n🏁 Test completed');
    process.exit(0);
}).catch(error => {
    console.error('❌ Test error:', error);
    process.exit(1);
}); 