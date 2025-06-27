const { executeQuery } = require('./config/database');

async function autoDetectCompletedEvents() {
    console.log('Checking for completed events...');
    
    try {
        // Find bookings where:
        // 1. Payment status is 'paid'
        // 2. Event status is 'confirmed'
        // 3. Event date + duration has passed
        const result = await executeQuery(`
            SELECT 
                id, 
                event_name, 
                event_date, 
                duration,
                artist_id,
                organizer_id,
                total_amount,
                platform_fee,
                net_amount
            FROM bookings 
            WHERE payment_status = 'paid' 
            AND event_status = 'confirmed' 
            AND TIMESTAMP(event_date, COALESCE(duration, '03:00:00')) < NOW()
        `);

        if (result.success && result.data.length > 0) {
            console.log(`Found ${result.data.length} events to mark as completed`);

            for (const booking of result.data) {
                // Calculate auto-release date (3 days from now)
                const autoReleaseDate = new Date();
                autoReleaseDate.setDate(autoReleaseDate.getDate() + 3);

                // Update booking status
                const updateResult = await executeQuery(`
                    UPDATE bookings 
                    SET event_status = 'event_completed',
                        payment_status = 'funds_held',
                        auto_release_date = ?
                    WHERE id = ?
                `, [autoReleaseDate, booking.id]);

                if (updateResult.success) {
                    console.log(`✓ Marked booking ${booking.id} (${booking.event_name}) as completed`);

                    // Send notification to artist
                    const artistResult = await executeQuery(
                        'SELECT u.id as user_id FROM artists a JOIN users u ON a.user_id = u.id WHERE a.id = ?',
                        [booking.artist_id]
                    );

                    if (artistResult.success && artistResult.data.length > 0) {
                        await executeQuery(`
                            INSERT INTO notifications 
                            (user_id, type, title, message, booking_id)
                            VALUES (?, 'event', 'Event Auto-Completed', 'Your event has been automatically marked as completed. Payment will be released in 3 days unless disputed.', ?)
                        `, [artistResult.data[0].user_id, booking.id]);
                    }

                    // Send notification to organizer
                    const organizerResult = await executeQuery(
                        'SELECT u.id as user_id FROM organizers o JOIN users u ON o.user_id = u.id WHERE o.id = ?',
                        [booking.organizer_id]
                    );

                    if (organizerResult.success && organizerResult.data.length > 0) {
                        await executeQuery(`
                            INSERT INTO notifications 
                            (user_id, type, title, message, booking_id)
                            VALUES (?, 'event', 'Event Completed', 'Your event has been completed. Payment will be released to the artist in 3 days. If there were any issues, please dispute within this time.', ?)
                        `, [organizerResult.data[0].user_id, booking.id]);
                    }
                } else {
                    console.log(`✗ Failed to update booking ${booking.id}`);
                }
            }
        } else {
            console.log('No events found to mark as completed');
        }

    } catch (error) {
        console.error('Error in auto event detection:', error);
    }
}

async function autoReleasePayments() {
    console.log('Checking for payments to auto-release...');
    
    try {
        // Find bookings where auto-release date has passed
        const result = await executeQuery(`
            SELECT 
                id, 
                event_name, 
                auto_release_date,
                artist_id,
                organizer_id,
                total_amount,
                platform_fee,
                net_amount
            FROM bookings 
            WHERE payment_status = 'funds_held' 
            AND event_status = 'event_completed' 
            AND auto_release_date <= NOW()
        `);

        if (result.success && result.data.length > 0) {
            console.log(`Found ${result.data.length} payments to auto-release`);

            for (const booking of result.data) {
                // Update booking status to completed and release payment
                const updateResult = await executeQuery(`
                    UPDATE bookings 
                    SET event_status = 'completed',
                        payment_status = 'payment_released'
                    WHERE id = ?
                `, [booking.id]);

                if (updateResult.success) {
                    console.log(`✓ Auto-released payment for booking ${booking.id}`);

                    // Create payment transaction record
                    await executeQuery(`
                        INSERT INTO payment_transactions 
                        (booking_id, transaction_type, amount, platform_fee, net_amount, status, notes)
                        VALUES (?, 'release', ?, ?, ?, 'completed', 'Payment auto-released after 3-day period')
                    `, [booking.id, booking.total_amount, booking.platform_fee, booking.net_amount]);

                    // Send notifications...
                    const artistResult = await executeQuery(
                        'SELECT u.id as user_id FROM artists a JOIN users u ON a.user_id = u.id WHERE a.id = ?',
                        [booking.artist_id]
                    );

                    if (artistResult.success && artistResult.data.length > 0) {
                        await executeQuery(`
                            INSERT INTO notifications 
                            (user_id, type, title, message, booking_id)
                            VALUES (?, 'payment', 'Payment Released', 'Your payment has been released!', ?)
                        `, [artistResult.data[0].user_id, booking.id]);
                    }
                }
            }
        } else {
            console.log('No payments found for auto-release');
        }

    } catch (error) {
        console.error('Error in auto payment release:', error);
    }
}

async function runAutoPaymentSystem() {
    console.log('=== Running Auto Payment System ===');
    await autoDetectCompletedEvents();
    await autoReleasePayments();
    console.log('=== Auto Payment System Complete ===\n');
}

// Run immediately if called directly
if (require.main === module) {
    runAutoPaymentSystem();
}

module.exports = {
    autoDetectCompletedEvents,
    autoReleasePayments,
    runAutoPaymentSystem
}; 