const mysql = require('mysql2/promise');

async function checkEventDates() {
    try {
        const db = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'artists_management'
        });

        console.log('🔍 Checking event dates in database...\n');

        const [rows] = await db.query(`
            SELECT id, title, event_date, status, is_public 
            FROM events 
            WHERE status = 'published' AND is_public = 1
            ORDER BY event_date
        `);

        const now = new Date();
        console.log(`📅 Current date: ${now.toLocaleDateString()}\n`);

        let upcoming = 0;
        let past = 0;

        console.log('📋 Published & Public Events:');
        console.log('=============================');

        rows.forEach((row, index) => {
            const eventDate = new Date(row.event_date);
            const isUpcoming = eventDate >= now;
            const daysDiff = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));

            console.log(`${index + 1}. ${row.title}`);
            console.log(`   ID: ${row.id}`);
            console.log(`   Date: ${eventDate.toLocaleDateString()}`);
            console.log(`   Status: ${isUpcoming ? 'UPCOMING' : 'PAST'}`);
            console.log(`   Days: ${daysDiff > 0 ? `${daysDiff} days away` : `${Math.abs(daysDiff)} days ago`}`);
            console.log('');

            if (isUpcoming) upcoming++;
            else past++;
        });

        console.log('📊 Summary:');
        console.log(`   🔜 Upcoming events: ${upcoming}`);
        console.log(`   📅 Past events: ${past}`);
        console.log(`   📋 Total events: ${rows.length}`);

        await db.end();

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkEventDates(); 