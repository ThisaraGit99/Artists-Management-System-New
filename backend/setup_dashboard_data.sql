-- Setup realistic dashboard data for artists

-- First, let's update some sample bookings
UPDATE bookings 
SET status = 'confirmed', 
    payment_status = 'paid',
    total_amount = 800.00,
    event_date = DATE_ADD(CURRENT_DATE(), INTERVAL 7 DAY),
    event_time = '19:00:00'
WHERE id = 1;

-- Add more sample bookings for the artist
INSERT INTO bookings (artist_id, organizer_id, package_id, event_name, event_description, event_date, event_time, duration, venue_address, total_amount, status, payment_status) VALUES
-- Upcoming confirmed booking
(1, 1, 1, 'Wedding Reception', 'Live band performance for wedding reception', DATE_ADD(CURRENT_DATE(), INTERVAL 14 DAY), '18:00:00', '4 hours', '123 Wedding Venue, New York, NY', 1200.00, 'confirmed', 'paid'),

-- Pending booking
(1, 1, 2, 'Corporate Party', 'Background music for corporate event', DATE_ADD(CURRENT_DATE(), INTERVAL 21 DAY), '19:00:00', '3 hours', '456 Office Building, Manhattan, NY', 600.00, 'pending', 'pending'),

-- Completed bookings with good ratings
(1, 1, 1, 'Birthday Celebration', 'Live performance for 50th birthday', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY), '20:00:00', '3 hours', '789 Party Hall, Brooklyn, NY', 900.00, 'completed', 'payment_released'),
(1, 1, 2, 'Restaurant Gig', 'Live music night', DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY), '19:00:00', '4 hours', '321 Fine Dining, Queens, NY', 700.00, 'completed', 'payment_released'),
(1, 1, 1, 'Charity Event', 'Fundraiser performance', DATE_SUB(CURRENT_DATE(), INTERVAL 21 DAY), '17:00:00', '2 hours', '654 Community Center, Bronx, NY', 500.00, 'completed', 'payment_released');

-- Add reviews for completed bookings
INSERT INTO reviews (booking_id, reviewer_id, reviewee_id, reviewer_type, overall_rating, communication_rating, professionalism_rating, quality_rating, review_title, review_text, would_recommend) VALUES
(3, 2, 1, 'organizer', 5.0, 5.0, 5.0, 5.0, 'Outstanding Performance!', 'Absolutely amazing performance at our birthday celebration. The artist was professional, punctual, and incredibly talented. Everyone loved the music!', TRUE),
(4, 2, 1, 'organizer', 4.5, 4.0, 5.0, 4.5, 'Great Restaurant Performance', 'Perfect atmosphere music for our restaurant. Very professional and accommodating to our guests\' requests.', TRUE),
(5, 2, 1, 'organizer', 4.8, 5.0, 4.5, 5.0, 'Wonderful Charity Event', 'Made our fundraiser special with beautiful music. Very easy to work with and highly professional.', TRUE);

-- Update artist's packages
UPDATE packages SET is_active = TRUE WHERE artist_id = 1;

-- Add more packages for variety
INSERT INTO packages (artist_id, title, description, price, duration, category, includes, is_active) VALUES
(1, 'Premium Wedding Package', 'Full wedding ceremony and reception coverage with live band', 2000.00, '6 hours', 'Wedding', '{"ceremony_music": true, "reception_music": true, "first_dance": true, "sound_system": true}', TRUE),
(1, 'Acoustic Solo Performance', 'Intimate acoustic performance perfect for small venues', 400.00, '2 hours', 'Restaurant', '{"background_music": true, "taking_requests": true}', TRUE),
(1, 'Full Band Experience', 'High-energy full band performance for large events', 1500.00, '4 hours', 'Corporate', '{"full_band": true, "sound_system": true, "lighting": true}', TRUE);

-- Calculate and update earnings
UPDATE artists SET 
    rating = 4.8,
    total_ratings = 3
WHERE id = 1;

-- Insert recent activity notifications
INSERT INTO notifications (user_id, type, title, message, booking_id, is_read) VALUES
(2, 'booking', 'New Booking Request', 'You have a new booking request for Corporate Party', 2, FALSE),
(2, 'payment', 'Payment Received', 'Payment received for Wedding Reception', 1, FALSE),
(2, 'system', 'New Review', 'You received a 5-star review for Birthday Celebration', 3, TRUE); 