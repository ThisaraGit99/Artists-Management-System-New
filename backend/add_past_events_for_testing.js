const mysql = require('mysql2/promise');

async function addPastEvents() {
    try {
        const db = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '1234',
            database: 'artist_management_system'
        });

        console.log('📅 Adding past events to test "Upcoming Only" toggle...\n');

        const pastEvents = [
            {
                title: 'New Year 2024 Celebration',
                description: 'Big New Year party with live music and fireworks (past event for testing)',
                event_type: 'Party',
                event_date: '2024-01-01',
                start_time: '20:00:00',
                end_time: '02:00:00',
                venue_name: 'Downtown Plaza',
                venue_city: 'New York',
                venue_state: 'NY',
                budget_min: 3000,
                budget_max: 5000,
                organizer_id: 2
            },
            {
                title: 'Halloween 2024 Spooky Night',
                description: 'Halloween costume party with themed entertainment (past event for testing)',
                event_type: 'Party',
                event_date: '2024-10-31',
                start_time: '19:00:00',
                end_time: '01:00:00',
                venue_name: 'Haunted Mansion',
                venue_city: 'Salem',
                venue_state: 'MA',
                budget_min: 2000,
                budget_max: 4000,
                organizer_id: 2
            },
            {
                title: 'Summer 2024 Music Festival',
                description: 'Outdoor music festival from last summer (past event for testing)',
                event_type: 'Festival',
                event_date: '2024-07-15',
                start_time: '14:00:00',
                end_time: '23:00:00',
                venue_name: 'Riverside Park',
                venue_city: 'Chicago',
                venue_state: 'IL',
                budget_min: 8000,
                budget_max: 12000,
                organizer_id: 2
            }
        ];

        for (const event of pastEvents) {
            const query = `
                INSERT INTO events (
                    title, description, event_type, event_date, start_time, end_time,
                    venue_name, venue_city, venue_state, budget_min, budget_max,
                    organizer_id, status, is_public, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', 1, NOW(), NOW())
            `;

            const values = [
                event.title, event.description, event.event_type, event.event_date,
                event.start_time, event.end_time, event.venue_name, event.venue_city,
                event.venue_state, event.budget_min, event.budget_max, event.organizer_id
            ];

            await db.execute(query, values);
            console.log(`✅ Added: ${event.title} (${event.event_date})`);
        }

        console.log(`\n🎉 Successfully added ${pastEvents.length} past events!`);
        console.log('\n🔍 Testing Instructions:');
        console.log('1. Go to Artist Dashboard → Find Events');
        console.log('2. By default, you should see ALL events (both past and upcoming)');
        console.log('3. Toggle "Upcoming Only" ON → should only show 2025 events');
        console.log('4. Toggle "Upcoming Only" OFF → should show all events again');

        await db.end();

    } catch (error) {
        console.error('❌ Error adding past events:', error.message);
    }
}

addPastEvents(); 