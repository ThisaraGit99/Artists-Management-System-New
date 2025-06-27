const { executeQuery } = require('./backend/config/database');

async function testApprovalFunctionality() {
    console.log('🔍 Starting comprehensive approval functionality test...\n');
    
    try {
        // Step 1: Test database connection
        console.log('📋 Step 1: Testing database connection...');
        const dbTest = await executeQuery('SELECT 1 as test');
        if (dbTest.success) {
            console.log('✅ Database connection successful');
        } else {
            console.log('❌ Database connection failed:', dbTest.error);
            return;
        }
        
        // Step 2: Load the controller
        console.log('\n📋 Step 2: Loading eventApplicationController...');
        let eventApplicationController;
        try {
            eventApplicationController = require('./backend/controllers/eventApplicationController');
            console.log('✅ Controller loaded successfully');
            console.log('📋 Available methods:', Object.keys(eventApplicationController));
        } catch (error) {
            console.log('❌ Failed to load controller:', error.message);
            return;
        }
        
        // Step 3: Check helper functions exist
        console.log('\n📋 Step 3: Checking helper functions...');
        console.log('📋 getOrganizerDbId type:', typeof eventApplicationController.getOrganizerDbId);
        console.log('📋 getUserArtistId type:', typeof eventApplicationController.getUserArtistId);
        
        if (typeof eventApplicationController.getOrganizerDbId !== 'function') {
            console.log('❌ getOrganizerDbId is not a function');
            return;
        }
        if (typeof eventApplicationController.getUserArtistId !== 'function') {
            console.log('❌ getUserArtistId is not a function');
            return;
        }
        console.log('✅ Helper functions exist');
        
        // Step 4: Test getOrganizerDbId function
        console.log('\n📋 Step 4: Testing getOrganizerDbId function...');
        try {
            const organizerDbId = await eventApplicationController.getOrganizerDbId(3);
            console.log('✅ getOrganizerDbId result for user 3:', organizerDbId);
            
            if (!organizerDbId) {
                console.log('⚠️ No organizer found for user ID 3');
                // Check if organizer exists
                const organizerCheck = await executeQuery('SELECT * FROM organizers WHERE user_id = ?', [3]);
                console.log('📋 Organizer table check:', organizerCheck);
            }
        } catch (error) {
            console.log('❌ Error testing getOrganizerDbId:', error.message);
            return;
        }
        
        // Step 5: Check test data exists
        console.log('\n📋 Step 5: Checking test data existence...');
        
        // Check event 8 exists
        const eventCheck = await executeQuery('SELECT * FROM events WHERE id = ?', [8]);
        console.log('📋 Event 8 exists:', eventCheck.success && eventCheck.data.length > 0);
        if (eventCheck.success && eventCheck.data.length > 0) {
            console.log('📋 Event details:', eventCheck.data[0]);
        }
        
        // Check application 11 exists
        const applicationCheck = await executeQuery('SELECT * FROM event_applications WHERE id = ?', [11]);
        console.log('📋 Application 11 exists:', applicationCheck.success && applicationCheck.data.length > 0);
        if (applicationCheck.success && applicationCheck.data.length > 0) {
            console.log('📋 Application details:', applicationCheck.data[0]);
        }
        
        // Check user 3 exists
        const userCheck = await executeQuery('SELECT * FROM users WHERE id = ?', [3]);
        console.log('📋 User 3 exists:', userCheck.success && userCheck.data.length > 0);
        if (userCheck.success && userCheck.data.length > 0) {
            console.log('📋 User details:', userCheck.data[0]);
        }
        
        // Step 6: Simulate the approval process
        console.log('\n📋 Step 6: Simulating approval process...');
        
        const eventId = 8;
        const applicationId = 11;
        const userId = 3;
        const organizer_response = 'Test approval';
        
        console.log('📋 Test parameters:', { eventId, applicationId, userId, organizer_response });
        
        // Step 6a: Verify event belongs to organizer
        console.log('\n📋 Step 6a: Verifying event ownership...');
        const eventOwnershipResult = await executeQuery(
            'SELECT * FROM events WHERE id = ? AND organizer_id = ?',
            [eventId, userId]
        );
        console.log('📋 Event ownership check:', {
            success: eventOwnershipResult.success,
            found: eventOwnershipResult.data?.length > 0,
            data: eventOwnershipResult.data
        });
        
        // Step 6b: Verify application exists and is pending
        console.log('\n📋 Step 6b: Verifying application status...');
        const applicationStatusResult = await executeQuery(
            'SELECT * FROM event_applications WHERE id = ? AND event_id = ?',
            [applicationId, eventId]
        );
        console.log('📋 Application status check:', {
            success: applicationStatusResult.success,
            found: applicationStatusResult.data?.length > 0,
            status: applicationStatusResult.data?.[0]?.application_status,
            data: applicationStatusResult.data
        });
        
        // Step 6c: Test the getOrganizerDbId call specifically
        console.log('\n📋 Step 6c: Testing getOrganizerDbId call...');
        try {
            const organizerDbId = await eventApplicationController.getOrganizerDbId(userId);
            console.log('✅ getOrganizerDbId successful:', organizerDbId);
            
            if (!organizerDbId) {
                console.log('❌ No organizer DB ID found for user', userId);
                // Check organizers table structure
                const organizersTableCheck = await executeQuery('DESCRIBE organizers');
                console.log('📋 Organizers table structure:', organizersTableCheck.data);
                
                // Check all organizers
                const allOrganizers = await executeQuery('SELECT * FROM organizers LIMIT 5');
                console.log('📋 Sample organizers:', allOrganizers.data);
                
                return;
            }
            
            // Step 6d: Test the update query
            console.log('\n📋 Step 6d: Testing application update...');
            const updateResult = await executeQuery(
                'UPDATE event_applications SET application_status = "approved", organizer_response = ?, responded_at = NOW() WHERE id = ?',
                [organizer_response, applicationId]
            );
            console.log('📋 Update result:', updateResult);
            
            if (updateResult.success && updateResult.affectedRows > 0) {
                console.log('✅ Application updated successfully');
                
                // Verify the update
                const verifyUpdate = await executeQuery('SELECT * FROM event_applications WHERE id = ?', [applicationId]);
                console.log('📋 Updated application:', verifyUpdate.data?.[0]);
                
                // Rollback for testing
                await executeQuery(
                    'UPDATE event_applications SET application_status = "pending", organizer_response = NULL, responded_at = NULL WHERE id = ?',
                    [applicationId]
                );
                console.log('📋 Rolled back changes for testing');
            } else {
                console.log('❌ Application update failed');
            }
            
        } catch (error) {
            console.log('❌ Error in getOrganizerDbId call:', error);
            console.log('❌ Stack trace:', error.stack);
        }
        
        console.log('\n🎯 Test completed!');
        
    } catch (error) {
        console.error('❌ Test failed with error:', error);
        console.error('❌ Stack trace:', error.stack);
    }
}

// Run the test
testApprovalFunctionality().then(() => {
    console.log('\n📋 Test execution finished');
    process.exit(0);
}).catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
}); 