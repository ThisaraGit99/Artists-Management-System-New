const axios = require('axios');

async function testUpcomingOnlyFilter() {
    try {
        console.log('🔍 Testing "Upcoming Only" filter functionality...\n');
        
        // Get events from API
        const response = await axios.get('http://localhost:5000/api/events/browse/all?status=published', {
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoidGVzdGFydGlzdCIsInJvbGUiOiJhcnRpc3QiLCJpYXQiOjE3MzcxOTE1MTAsImV4cCI6MTczNzI3NzkxMH0.Zr4pj9J9Iq-rjL6LMfMRHGYL6k_Y1YHQ1iMoGIWJYMs'
            }
        });
        
        if (!response.data.success || !response.data.data) {
            console.log('❌ No events found in API response');
            return;
        }
        
        const events = response.data.data;
        console.log(`📋 Total events found: ${events.length}\n`);
        
        // Current date/time
        const now = new Date();
        console.log(`📅 Current date/time: ${now.toISOString()}\n`);
        
        // Analyze each event
        let upcomingCount = 0;
        let pastCount = 0;
        
        console.log('📊 Event Analysis:');
        console.log('==================');
        
        events.forEach((event, index) => {
            console.log(`${index + 1}. Event: "${event.title || event.name}"`);
            
            // Check date fields
            const dateField = event.date || event.event_date;
            console.log(`   📅 Raw date field: ${dateField}`);
            
            if (dateField) {
                const eventDate = new Date(dateField);
                const isUpcoming = eventDate >= now;
                const daysDiff = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
                
                console.log(`   📆 Parsed date: ${eventDate.toISOString()}`);
                console.log(`   🎯 Is upcoming: ${isUpcoming}`);
                console.log(`   📊 Days difference: ${daysDiff}`);
                
                if (isUpcoming) {
                    console.log(`   ✅ FILTER RESULT: SHOW (Upcoming)`);
                    upcomingCount++;
                } else {
                    console.log(`   ❌ FILTER RESULT: HIDE (Past event)`);
                    pastCount++;
                }
            } else {
                console.log(`   ⚠️ No date field found!`);
                pastCount++; // Events without dates are considered past
            }
            console.log('');
        });
        
        console.log('📈 Summary:');
        console.log(`   🔜 Upcoming events: ${upcomingCount}`);
        console.log(`   📅 Past events: ${pastCount}`);
        console.log(`   📋 Total events: ${events.length}\n`);
        
        // Test the exact filter logic used in frontend
        console.log('🧪 Testing Frontend Filter Logic:');
        console.log('==================================');
        
        const filteredUpcoming = events.filter(event => {
            const eventDate = new Date(event.date || event.event_date);
            return eventDate >= now;
        });
        
        const filteredAll = events; // When showUpcomingOnly is false
        
        console.log(`When "Upcoming Only" is ON: ${filteredUpcoming.length} events should show`);
        console.log(`When "Upcoming Only" is OFF: ${filteredAll.length} events should show\n`);
        
        if (filteredUpcoming.length === 0 && upcomingCount > 0) {
            console.log('🐛 BUG DETECTED: Filter logic is not working correctly!');
        } else if (filteredUpcoming.length !== upcomingCount) {
            console.log('🐛 BUG DETECTED: Mismatch between manual count and filter result!');
        } else {
            console.log('✅ Filter logic appears to be working correctly');
        }
        
        // Show upcoming events for verification
        if (filteredUpcoming.length > 0) {
            console.log('\n🔜 Upcoming Events List:');
            filteredUpcoming.forEach((event, index) => {
                const eventDate = new Date(event.date || event.event_date);
                console.log(`   ${index + 1}. ${event.title || event.name} - ${eventDate.toLocaleDateString()}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testUpcomingOnlyFilter(); 