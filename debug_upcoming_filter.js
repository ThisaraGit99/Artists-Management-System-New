const axios = require('axios');

async function debugUpcomingFilter() {
    try {
        console.log('🔍 Debugging "Upcoming Only" filter...\n');
        
        const response = await axios.get('http://localhost:5000/api/events/browse/all?status=published', {
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoidGVzdGFydGlzdCIsInJvbGUiOiJhcnRpc3QiLCJpYXQiOjE3MzcxOTE1MTAsImV4cCI6MTczNzI3NzkxMH0.Zr4pj9J9Iq-rjL6LMfMRHGYL6k_Y1YHQ1iMoGIWJYMs'
            }
        });
        
        const events = response.data.data || [];
        const now = new Date();
        
        console.log(`📅 Current date: ${now.toLocaleDateString()}`);
        console.log(`📋 Total events: ${events.length}\n`);
        
        let upcoming = 0;
        let past = 0;
        
        events.forEach((event, i) => {
            const dateField = event.date || event.event_date;
            const eventDate = new Date(dateField);
            const isUpcoming = eventDate >= now;
            
            console.log(`${i+1}. ${event.title || event.name}`);
            console.log(`   Date: ${eventDate.toLocaleDateString()}`);
            console.log(`   Status: ${isUpcoming ? 'UPCOMING' : 'PAST'}\n`);
            
            if (isUpcoming) upcoming++;
            else past++;
        });
        
        console.log(`✅ Results: ${upcoming} upcoming, ${past} past events`);
        
        // Test the exact filter logic
        const filtered = events.filter(event => {
            const eventDate = new Date(event.date || event.event_date);
            return eventDate >= now;
        });
        
        console.log(`🔍 Filter test: ${filtered.length} events would show with "Upcoming Only" ON`);
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

debugUpcomingFilter(); 