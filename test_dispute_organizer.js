const axios = require('axios');

async function testDisputeWithOrganizer() {
    try {
        console.log('🔍 Testing dispute API with organizer role...');
        
        // First, let's check what users exist
        console.log('1. Checking available users...');
        
        // Login as admin to check users
        const adminLogin = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@artistmgmt.com',  
            password: 'admin123'
        });
        
        if (adminLogin.data.success) {
            console.log('✅ Admin logged in');
            
            // Get users list
            const usersResponse = await axios.get('http://localhost:5000/api/admin/users', {
                headers: { 'Authorization': `Bearer ${adminLogin.data.token}` }
            });
            
            const organizers = usersResponse.data.data.filter(user => user.role === 'organizer');
            console.log('📋 Available organizers:', organizers.length);
            
            if (organizers.length > 0) {
                const organizer = organizers[0];
                console.log('Using organizer:', organizer.email);
                
                // Try to login as organizer (assuming password is 'organizer123' or similar)
                const possiblePasswords = ['organizer123', 'password123', 'test123', '123456'];
                
                for (const password of possiblePasswords) {
                    try {
                        console.log(`2. Trying to login as organizer with password: ${password}`);
                        const organizerLogin = await axios.post('http://localhost:5000/api/auth/login', {
                            email: organizer.email,
                            password: password
                        });
                        
                        if (organizerLogin.data.success) {
                            console.log('✅ Organizer logged in successfully');
                            
                            // Test dispute API
                            console.log('3. Testing dispute endpoint...');
                            const disputeResponse = await axios.post(
                                'http://localhost:5000/api/disputes/bookings/8/report-non-delivery',
                                {
                                    reason: 'Artist did not show up for the event',
                                    evidence: []
                                },
                                {
                                    headers: {
                                        'Authorization': `Bearer ${organizerLogin.data.token}`,
                                        'Content-Type': 'application/json'
                                    }
                                }
                            );
                            
                            console.log('✅ Dispute API Response:', disputeResponse.data);
                            return; // Success, exit
                        }
                    } catch (loginError) {
                        console.log(`❌ Login failed with ${password}:`, loginError.response?.data?.message);
                    }
                }
                
                console.log('❌ Could not login as organizer with any password');
            } else {
                console.log('❌ No organizers found in database');
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });
    }
}

testDisputeWithOrganizer(); 