const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testOrganizerBookingFlow() {
    console.log('Testing Complete Organizer Booking Flow\n');

    let organizerToken, artistToken, bookingId;

    try {
        // Step 1: Login as organizer
        console.log('1. Logging in as organizer...');
        const organizerLogin = await axios.post(`${API_BASE}/auth/login`, {
            email: 'organizer@test.com',
            password: 'password123'
        });
        organizerToken = organizerLogin.data.token;
        console.log('Organizer logged in successfully\n');

        // Step 2: Login as artist  
        console.log('2. Logging in as artist...');
        const artistLogin = await axios.post(`${API_BASE}/auth/login`, {
            email: 'artist@test.com', 
            password: 'password123'
        });
        artistToken = artistLogin.data.token;
        console.log('Artist logged in successfully\n');

        // Step 3: Organizer browses artists
        console.log('3. Organizer browsing available artists...');
        const browseResponse = await axios.get(`${API_BASE}/artists/browse`, {
            headers: { Authorization: `Bearer ${organizerToken}` }
        });
        
        if (browseResponse.data.success && browseResponse.data.data.length > 0) {
            const artist = browseResponse.data.data[0];
            console.log(`Found artist: ${artist.name} (ID: ${artist.id})\n`);

            // Step 4: Organizer sends booking request
            console.log('4. Organizer sending booking request...');
            const bookingRequest = await axios.post(`${API_BASE}/organizers/bookings`, {
                artist_id: artist.id,
                event_name: 'Test Wedding Reception',
                event_description: 'Live music for wedding reception',
                event_date: '2024-08-15',
                event_time: '19:00',
                duration: '4 hours',
                venue_address: '123 Wedding Venue St, City',
                total_amount: 1500,
                special_requirements: 'Sound system required'
            }, {
                headers: { Authorization: `Bearer ${organizerToken}` }
            });

            if (bookingRequest.data.success) {
                bookingId = bookingRequest.data.bookingId;
                console.log(`Booking request sent successfully! Booking ID: ${bookingId}\n`);
                
                // Step 5: Artist approves booking
                console.log('5. Artist approving booking request...');
                const approveResponse = await axios.put(`${API_BASE}/artists/bookings/${bookingId}/status`, {
                    action: 'accept',
                    message: 'Happy to perform at your wedding!'
                }, {
                    headers: { Authorization: `Bearer ${artistToken}` }
                });

                if (approveResponse.data.success) {
                    console.log('Artist approved the booking!\n');
                    
                    // Step 6: Organizer makes payment (escrow)
                    console.log('6. Organizer making payment (held in escrow)...');
                    const paymentResponse = await axios.post(`${API_BASE}/organizers/bookings/${bookingId}/payment`, {}, {
                        headers: { Authorization: `Bearer ${organizerToken}` }
                    });

                    if (paymentResponse.data.success) {
                        console.log('Payment processed successfully! Funds held in escrow.');
                        console.log(`Total Amount: $${paymentResponse.data.data.totalAmount}`);
                        console.log(`Platform Fee: $${paymentResponse.data.data.platformFee}`);
                        console.log(`Net to Artist: $${paymentResponse.data.data.netAmount}\n`);
                        
                        // Step 7: Organizer confirms event completion (releases payment)
                        console.log('7. Organizer confirming event completion (releasing payment)...');
                        const completionResponse = await axios.post(`${API_BASE}/organizers/bookings/${bookingId}/complete`, {}, {
                            headers: { Authorization: `Bearer ${organizerToken}` }
                        });

                        if (completionResponse.data.success) {
                            console.log('Event marked as completed! Payment released to artist.');
                            console.log(`Final Status: ${completionResponse.data.data.bookingStatus}`);
                            console.log(`Payment Status: ${completionResponse.data.data.paymentStatus}\n`);
                            
                            console.log('SUCCESS! Complete organizer booking flow working perfectly!');
                        } else {
                            console.log('Payment release failed:', completionResponse.data.message);
                        }
                    } else {
                        console.log('Payment failed:', paymentResponse.data.message);
                    }
                } else {
                    console.log('Artist approval failed:', approveResponse.data.message);
                }
            } else {
                console.log('Booking request failed:', bookingRequest.data.message);
            }
        } else {
            console.log('No artists found to test with');
        }

    } catch (error) {
        console.error('Test failed:', error.response?.data?.message || error.message);
        if (error.response?.data) {
            console.error('Error details:', error.response.data);
        }
    }
}

testOrganizerBookingFlow(); 