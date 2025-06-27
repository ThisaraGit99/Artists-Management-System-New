const { executeQuery } = require('./config/database');

async function setupDashboardData() {
    try {
        // First, let's clean up any existing test data in the correct order
        await executeQuery('DELETE FROM reviews WHERE reviewer_id = 2');
        await executeQuery('DELETE FROM messages WHERE sender_id = 1 AND receiver_id = 2');
        await executeQuery('DELETE FROM artist_skills WHERE artist_id = 1');
        await executeQuery('DELETE FROM artist_portfolio WHERE artist_id = 1');
        await executeQuery('DELETE FROM artist_performances WHERE artist_id = 1');
        await executeQuery('DELETE FROM payments WHERE booking_id IN (SELECT id FROM bookings WHERE artist_id = 1)');
        await executeQuery('DELETE FROM bookings WHERE artist_id = 1');
        await executeQuery('DELETE FROM packages WHERE artist_id = 1');

        // Add packages first
        await executeQuery(`
            INSERT INTO packages (artist_id, title, description, price, duration, category, includes, is_active)
            VALUES (1, 'Premium Wedding Package', 'Full wedding ceremony and reception coverage with live band', 2000.00, '6 hours', 'Wedding', '{"ceremony_music": true, "reception_music": true, "first_dance": true, "sound_system": true}', TRUE)
        `);

        await executeQuery(`
            INSERT INTO packages (artist_id, title, description, price, duration, category, includes, is_active)
            VALUES (1, 'Acoustic Solo Performance', 'Intimate acoustic performance perfect for small venues', 400.00, '2 hours', 'Restaurant', '{"background_music": true, "taking_requests": true}', TRUE)
        `);

        await executeQuery(`
            INSERT INTO packages (artist_id, title, description, price, duration, category, includes, is_active)
            VALUES (1, 'Full Band Experience', 'High-energy full band performance for large events', 1500.00, '4 hours', 'Corporate', '{"full_band": true, "sound_system": true, "lighting": true}', TRUE)
        `);

        // Get package IDs
        const packagesResult = await executeQuery('SELECT id FROM packages WHERE artist_id = 1 ORDER BY id ASC');
        const packages = packagesResult.data;

        // Add bookings using package IDs
        await executeQuery(`
            INSERT INTO bookings (artist_id, organizer_id, package_id, event_name, event_description, event_date, event_time, duration, venue_address, total_amount, status, payment_status)
            VALUES (1, 1, ?, 'Wedding Reception', 'Live band performance for wedding reception', DATE_ADD(CURRENT_DATE(), INTERVAL 14 DAY), '18:00:00', '4 hours', '123 Wedding Venue, New York, NY', 1200.00, 'confirmed', 'paid')
        `, [packages[0].id]);

        await executeQuery(`
            INSERT INTO bookings (artist_id, organizer_id, package_id, event_name, event_description, event_date, event_time, duration, venue_address, total_amount, status, payment_status)
            VALUES (1, 1, ?, 'Corporate Party', 'Background music for corporate event', DATE_ADD(CURRENT_DATE(), INTERVAL 21 DAY), '19:00:00', '3 hours', '456 Office Building, Manhattan, NY', 600.00, 'pending', 'pending')
        `, [packages[2].id]);

        await executeQuery(`
            INSERT INTO bookings (artist_id, organizer_id, package_id, event_name, event_description, event_date, event_time, duration, venue_address, total_amount, status, payment_status)
            VALUES (1, 1, ?, 'Birthday Celebration', 'Live performance for 50th birthday', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY), '20:00:00', '3 hours', '789 Party Hall, Brooklyn, NY', 900.00, 'completed', 'paid')
        `, [packages[0].id]);

        await executeQuery(`
            INSERT INTO bookings (artist_id, organizer_id, package_id, event_name, event_description, event_date, event_time, duration, venue_address, total_amount, status, payment_status)
            VALUES (1, 1, ?, 'Restaurant Gig', 'Live music night', DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY), '19:00:00', '4 hours', '321 Fine Dining, Queens, NY', 700.00, 'completed', 'paid')
        `, [packages[1].id]);

        await executeQuery(`
            INSERT INTO bookings (artist_id, organizer_id, package_id, event_name, event_description, event_date, event_time, duration, venue_address, total_amount, status, payment_status)
            VALUES (1, 1, ?, 'Charity Event', 'Fundraiser performance', DATE_SUB(CURRENT_DATE(), INTERVAL 21 DAY), '17:00:00', '2 hours', '654 Community Center, Bronx, NY', 500.00, 'completed', 'paid')
        `, [packages[1].id]);

        // Get the booking IDs
        const bookingsResult = await executeQuery('SELECT id FROM bookings WHERE artist_id = 1 ORDER BY event_date DESC');
        const bookings = bookingsResult.data;

        // Add reviews for completed bookings
        await executeQuery(`
            INSERT INTO reviews (booking_id, reviewer_id, reviewee_id, reviewer_type, overall_rating, communication_rating, professionalism_rating, quality_rating, review_title, review_text, would_recommend)
            VALUES (?, 2, 1, 'organizer', 5.0, 5.0, 5.0, 5.0, 'Outstanding Performance!', 'Absolutely amazing performance at our birthday celebration. The artist was professional, punctual, and incredibly talented. Everyone loved the music!', TRUE)
        `, [bookings[2].id]);

        await executeQuery(`
            INSERT INTO reviews (booking_id, reviewer_id, reviewee_id, reviewer_type, overall_rating, communication_rating, professionalism_rating, quality_rating, review_title, review_text, would_recommend)
            VALUES (?, 2, 1, 'organizer', 4.5, 4.0, 5.0, 4.5, 'Great Restaurant Performance', 'Perfect atmosphere music for our restaurant. Very professional and accommodating to our guests\' requests.', TRUE)
        `, [bookings[3].id]);

        await executeQuery(`
            INSERT INTO reviews (booking_id, reviewer_id, reviewee_id, reviewer_type, overall_rating, communication_rating, professionalism_rating, quality_rating, review_title, review_text, would_recommend)
            VALUES (?, 2, 1, 'organizer', 4.8, 5.0, 4.5, 5.0, 'Wonderful Charity Event', 'Made our fundraiser special with beautiful music. Very easy to work with and highly professional.', TRUE)
        `, [bookings[4].id]);

        // Update artist ratings
        await executeQuery(`
            UPDATE artists SET 
                rating = 4.8,
                total_ratings = 3
            WHERE id = 1
        `);

        // Add messages
        await executeQuery(`
            INSERT INTO messages (sender_id, receiver_id, booking_id, subject, message, is_read)
            VALUES (1, 2, ?, 'New Booking Request', 'You have a new booking request for Corporate Party', FALSE)
        `, [bookings[1].id]);

        await executeQuery(`
            INSERT INTO messages (sender_id, receiver_id, booking_id, subject, message, is_read)
            VALUES (1, 2, ?, 'Payment Received', 'Payment received for Wedding Reception', FALSE)
        `, [bookings[0].id]);

        await executeQuery(`
            INSERT INTO messages (sender_id, receiver_id, booking_id, subject, message, is_read)
            VALUES (1, 2, ?, 'New Review', 'You received a 5-star review for Birthday Celebration', TRUE)
        `, [bookings[2].id]);

        // Add artist skills
        await executeQuery(`
            INSERT INTO artist_skills (artist_id, skill_name, proficiency_level, description)
            VALUES 
            (1, 'Guitar', 'Expert', 'Professional guitar playing with 10+ years experience'),
            (1, 'Vocals', 'Advanced', 'Lead and backing vocals, multiple genres'),
            (1, 'Songwriting', 'Advanced', 'Original song composition and lyrics'),
            (1, 'Live Performance', 'Expert', 'Extensive live performance experience')
        `);

        // Add artist portfolio
        await executeQuery(`
            INSERT INTO artist_portfolio (artist_id, title, description, media_type, media_url, project_date, is_featured)
            VALUES 
            (1, 'Live Concert at City Hall', 'Acoustic performance for 500+ audience', 'video', 'https://youtube.com/watch?v=sample1', '2023-12-01', TRUE),
            (1, 'Studio Recording Session', 'Latest single "Moonlight Dreams"', 'audio', 'https://soundcloud.com/sample-track', '2023-11-15', TRUE),
            (1, 'Wedding Performance', 'Romantic acoustic set for wedding ceremony', 'image', 'https://example.com/wedding-photo.jpg', '2023-10-20', FALSE)
        `);

        // Add artist performances
        await executeQuery(`
            INSERT INTO artist_performances (artist_id, title, venue, location, performance_date, description, audience_size, fee_earned, rating)
            VALUES 
            (1, 'Summer Music Festival', 'Central Park Amphitheater', 'New York, NY', '2023-07-15 20:00:00', 'Main stage performance at summer festival', 2000, 1500.00, 4.8),
            (1, 'Coffee House Session', 'The Bean Café', 'Brooklyn, NY', '2023-08-22 19:30:00', 'Intimate acoustic performance', 50, 300.00, 4.9),
            (1, 'Corporate Event', 'Tech Company HQ', 'Manhattan, NY', '2023-09-10 18:00:00', 'Background music for corporate networking event', 100, 800.00, 4.5)
        `);

        console.log('✅ Dashboard data setup completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error setting up dashboard data:', error);
        process.exit(1);
    }
}

setupDashboardData(); 