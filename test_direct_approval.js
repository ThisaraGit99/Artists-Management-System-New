const { executeQuery } = require('./backend/config/database');
const eventApplicationController = require('./backend/controllers/eventApplicationController');

async function testDirectApproval() {
    console.log('🎯 Testing direct approval functionality...\n');
    
    try {
        // Create mock request and response objects
        const mockReq = {
            params: {
                eventId: '8',
                applicationId: '11'
            },
            user: {
                id: 3
            },
            body: {
                organizer_response: 'Application approved for testing'
            }
        };
        
        const mockRes = {
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                console.log('📋 Response Status:', this.statusCode || 200);
                console.log('📋 Response Data:', JSON.stringify(data, null, 2));
                return this;
            }
        };
        
        console.log('📋 Test parameters:');
        console.log('   Event ID:', mockReq.params.eventId);
        console.log('   Application ID:', mockReq.params.applicationId);
        console.log('   User ID:', mockReq.user.id);
        console.log('   Organizer Response:', mockReq.body.organizer_response);
        
        // First, let's check the current application status
        console.log('\n📋 Current application status:');
        const currentStatus = await executeQuery('SELECT * FROM event_applications WHERE id = ?', [11]);
        if (currentStatus.success && currentStatus.data.length > 0) {
            console.log('   Status:', currentStatus.data[0].application_status);
            console.log('   Response:', currentStatus.data[0].organizer_response);
        }
        
        // Test the approval function directly
        console.log('\n🚀 Executing approveApplication function...');
        
        await eventApplicationController.approveApplication(mockReq, mockRes);
        
        // Check the updated application status
        console.log('\n📋 Updated application status:');
        const updatedStatus = await executeQuery('SELECT * FROM event_applications WHERE id = ?', [11]);
        if (updatedStatus.success && updatedStatus.data.length > 0) {
            console.log('   Status:', updatedStatus.data[0].application_status);
            console.log('   Response:', updatedStatus.data[0].organizer_response);
            console.log('   Responded At:', updatedStatus.data[0].responded_at);
        }
        
        // Check if booking was created
        console.log('\n📋 Checking booking creation:');
        const bookingCheck = await executeQuery('SELECT * FROM bookings WHERE application_id = ?', [11]);
        if (bookingCheck.success && bookingCheck.data.length > 0) {
            console.log('✅ Booking created successfully');
            console.log('   Booking ID:', bookingCheck.data[0].id);
            console.log('   Status:', bookingCheck.data[0].status);
            console.log('   Payment Status:', bookingCheck.data[0].payment_status);
        } else {
            console.log('⚠️ No booking found - may have failed during creation');
        }
        
        // Reset the application status for future testing
        console.log('\n📋 Resetting application status for future testing...');
        await executeQuery(
            'UPDATE event_applications SET application_status = "pending", organizer_response = NULL, responded_at = NULL WHERE id = ?',
            [11]
        );
        
        // Clean up any test booking
        await executeQuery('DELETE FROM bookings WHERE application_id = ?', [11]);
        
        console.log('✅ Test completed successfully and data reset');
        
    } catch (error) {
        console.error('❌ Direct approval test failed:', error);
        console.error('❌ Stack trace:', error.stack);
    }
}

// Run the test
testDirectApproval().then(() => {
    console.log('\n🎯 Direct approval test finished');
    process.exit(0);
}).catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
}); 