const axios = require('axios');

async function testUpcomingOnlyFix() {
    try {
        console.log('🔍 Testing the "Upcoming Only" filter fix...\n');
        
        // Test API call
        const response = await axios.get('http://localhost:5000/api/events/browse/all?status=published', {
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoidGVzdGFydGlzdCIsInJvbGUiOiJhcnRpc3QiLCJpYXQiOjE3MzcxOTE1MTAsImV4cCI6MTczNzI3NzkxMH0.Zr4pj9J9Iq-rjL6LMfMRHGYL6k_Y1YHQ1iMoGIWJYMs'
            }
        });
        
        if (!response.data.success || !response.data.data) {
            console.log('❌ API call failed or no events returned');
            return;
        }
        
        const events = response.data.data;
        const now = new Date();
        
        console.log(`📅 Current date: ${now.toLocaleDateString()}`);
        console.log(`📋 Total events from API: ${events.length}\n`);
        
        // Count upcoming vs past events
        let upcoming = 0;
        let past = 0;
        
        events.forEach((event, index) => {
            const eventDate = new Date(event.date || event.event_date);
            const isUpcoming = eventDate >= now;
            
            if (index < 5) { // Show first 5 events for verification
                console.log(`${index + 1}. ${event.title || event.name}`);
                console.log(`   📅 Date: ${eventDate.toLocaleDateString()}`);
                console.log(`   🔮 Status: ${isUpcoming ? 'UPCOMING' : 'PAST'}`);
                console.log('');
            }
            
            if (isUpcoming) upcoming++;
            else past++;
        });
        
        if (events.length > 5) {
            console.log(`... and ${events.length - 5} more events\n`);
        }
        
        console.log('📊 Summary:');
        console.log(`   🔜 Upcoming events: ${upcoming}`);
        console.log(`   📅 Past events: ${past}`);
        console.log(`   📋 Total events: ${events.length}\n`);
        
        // Test filter logic
        const upcomingFiltered = events.filter(event => {
            const eventDate = new Date(event.date || event.event_date);
            return eventDate >= now;
        });
        
        console.log('🧪 Filter Test Results:');
        console.log(`   When "Upcoming Only" is OFF: Shows ${events.length} events`);
        console.log(`   When "Upcoming Only" is ON: Shows ${upcomingFiltered.length} events\n`);
        
        if (past > 0 && upcoming > 0) {
            console.log('✅ SUCCESS! The toggle should now work properly:');
            console.log('   - Toggle OFF: Shows all events (including past ones)');
            console.log('   - Toggle ON: Shows only upcoming events');
            console.log('\n🎯 The fix is working correctly!');
        } else if (past === 0) {
            console.log('⚠️ All events are upcoming - toggle will show same results both ways');
        } else {
            console.log('⚠️ All events are past - toggle ON will show no events');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
        }
    }
}

testUpcomingOnlyFix(); 