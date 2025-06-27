const { executeQuery } = require('../config/database');

const organizerController = {
    // Create a new booking request
    async createBooking(req, res) {
        try {
            const userId = req.user.id;
            const {
                artist_id,
                package_id,
                event_name,
                event_description,
                event_date,
                event_time,
                duration,
                venue_address,
                total_amount,
                special_requirements
            } = req.body;

            // Validate required fields
            if (!artist_id || !event_name || !event_date || !event_time) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: artist_id, event_name, event_date, event_time'
                });
            }

            // Get organizer ID from user ID
            const organizerResult = await executeQuery(
                'SELECT id FROM organizers WHERE user_id = ?',
                [userId]
            );

            if (!organizerResult.success || organizerResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Organizer profile not found'
                });
            }

            const organizerDbId = organizerResult.data[0].id;

            // Verify artist exists
            const artistResult = await executeQuery(
                'SELECT id FROM artists WHERE id = ?',
                [artist_id]
            );

            if (!artistResult.success || artistResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Artist not found'
                });
            }

            // Verify package exists if provided
            if (package_id) {
                const packageResult = await executeQuery(
                    'SELECT id, price FROM packages WHERE id = ? AND artist_id = ? AND is_active = 1',
                    [package_id, artist_id]
                );

                if (!packageResult.success || packageResult.data.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'Package not found or not available'
                    });
                }

                // Use package price if total_amount not provided
                if (!total_amount) {
                    total_amount = packageResult.data[0].price;
                }
            }

            // Create booking
            const result = await executeQuery(
                `INSERT INTO bookings (
                    artist_id, organizer_id, package_id, event_name, event_description,
                    event_date, event_time, duration, venue_address, total_amount,
                    special_requirements, status, payment_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending')`,
                [
                    artist_id, organizerDbId, package_id, event_name, event_description,
                    event_date, event_time, duration, venue_address, total_amount,
                    special_requirements
                ]
            );

            if (result.success) {
                res.status(201).json({
                    success: true,
                    message: 'Booking request sent successfully',
                    bookingId: result.data.insertId
                });
            } else {
                throw new Error('Failed to create booking');
            }

        } catch (error) {
            console.error('Create booking error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create booking request',
                error: error.message
            });
        }
    },

    // Get all bookings for organizer
    async getOrganizerBookings(req, res) {
        try {
            const userId = req.user.id;
            const { 
                status, 
                payment_status,
                artist_name,
                date_from,
                date_to,
                sort_by = 'newest',
                page = 1, 
                limit = 10 
            } = req.query;

            console.log('Get organizer bookings - User ID:', userId, 'Filters:', req.query);

            // Get organizer ID with detailed error logging
            let organizerResult;
            try {
                organizerResult = await executeQuery(
                    'SELECT id FROM organizers WHERE user_id = ?',
                    [userId]
                );
                console.log('Organizer query result:', organizerResult);
            } catch (queryError) {
                console.error('Database query error for organizers:', queryError);
                return res.status(500).json({
                    success: false,
                    message: 'Database connection error',
                    error: queryError.message
                });
            }

            if (!organizerResult.success) {
                console.error('Organizer query failed:', organizerResult.error);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to query organizer profile',
                    error: organizerResult.error
                });
            }

            if (organizerResult.data.length === 0) {
                console.log('No organizer profile found for user:', userId);
                return res.json({
                    success: true,
                    data: [],
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: 0,
                        totalPages: 0
                    },
                    message: 'No organizer profile found. Please complete your organizer profile first.'
                });
            }

            const organizerDbId = organizerResult.data[0].id;
            console.log('Organizer DB ID:', organizerDbId);

            // Query including payment status for proper status display
            let query = `SELECT 
                b.id, 
                b.artist_id, 
                b.organizer_id,
                b.event_name, 
                b.event_date, 
                b.event_time,
                b.venue_address,
                b.total_amount, 
                b.status,
                b.payment_status,
                b.platform_fee,
                b.net_amount,
                b.payment_date,
                b.created_at,
                u.name as artist_name, 
                u.email as artist_email
                FROM bookings b 
                JOIN artists a ON b.artist_id = a.id 
                JOIN users u ON a.user_id = u.id 
                WHERE b.organizer_id = ?`;

            const params = [organizerDbId];

            // Add filters
            if (status && status.trim() !== '') {
                query += ' AND b.status = ?';
                params.push(status.trim());
            }

            if (payment_status && payment_status.trim() !== '') {
                query += ' AND b.payment_status = ?';
                params.push(payment_status.trim());
            }

            if (artist_name && artist_name.trim() !== '') {
                query += ' AND u.name LIKE ?';
                params.push(`%${artist_name.trim()}%`);
            }

            if (date_from && date_from.trim() !== '') {
                query += ' AND DATE(b.event_date) >= ?';
                params.push(date_from.trim());
            }

            if (date_to && date_to.trim() !== '') {
                query += ' AND DATE(b.event_date) <= ?';
                params.push(date_to.trim());
            }

            // Add sorting
            switch (sort_by) {
                case 'oldest':
                    query += ' ORDER BY b.created_at ASC';
                    break;
                case 'event_date':
                    query += ' ORDER BY b.event_date ASC';
                    break;
                case 'amount_high':
                    query += ' ORDER BY b.total_amount DESC';
                    break;
                case 'amount_low':
                    query += ' ORDER BY b.total_amount ASC';
                    break;
                case 'newest':
                default:
                    query += ' ORDER BY b.created_at DESC';
            }

            // Get total count for pagination
            const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM');
            const countResult = await executeQuery(countQuery, params);
            const total = countResult.data[0].total;

            // Add pagination
            const offset = (parseInt(page) - 1) * parseInt(limit);
            query += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;

            console.log('Final query:', query);
            console.log('Query parameters:', params);

            const result = await executeQuery(query, params);

            if (result.success) {
                const totalPages = Math.ceil(total / parseInt(limit));

                res.json({
                    success: true,
                    data: result.data,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        totalPages
                    }
                });
            } else {
                throw new Error('Failed to fetch bookings');
            }

        } catch (error) {
            console.error('Get bookings error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch bookings',
                error: error.message
            });
        }
    },

    // Get booking details
    async getBookingDetails(req, res) {
        try {
            const userId = req.user.id;
            const { bookingId } = req.params;

            // Get organizer ID
            const organizerResult = await executeQuery(
                'SELECT id FROM organizers WHERE user_id = ?',
                [userId]
            );

            if (!organizerResult.success || organizerResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Organizer profile not found'
                });
            }

            const organizerDbId = organizerResult.data[0].id;

            // Get booking details with explicit column selection
            const result = await executeQuery(`
                SELECT 
                    b.id, b.artist_id, b.organizer_id, b.package_id, b.event_name, b.event_description,
                    b.event_date, b.event_time, b.duration, b.venue_address, b.total_amount, b.status, 
                    b.special_requirements, b.created_at, b.updated_at,
                    b.payment_status, b.payment_date, b.completion_date, b.platform_fee, b.net_amount,
                    a.user_id as artist_user_id, u.name as artist_name, u.email as artist_email, u.phone as artist_phone, 
                    a.bio as artist_bio, a.hourly_rate as artist_hourly_rate, a.location as artist_location, 
                    p.title as package_title, p.description as package_description, p.price as package_price, p.duration as package_duration 
                    FROM bookings b 
                    JOIN artists a ON b.artist_id = a.id 
                    JOIN users u ON a.user_id = u.id 
                    LEFT JOIN packages p ON b.package_id = p.id 
                    WHERE b.id = ? AND b.organizer_id = ?`,
                [bookingId, organizerDbId]
            );

            if (!result.success || result.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Booking not found'
                });
            }

            res.json({
                success: true,
                data: result.data[0]
            });

        } catch (error) {
            console.error('Get booking details error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch booking details',
                error: error.message
            });
        }
    },

    // Cancel booking
    async cancelBooking(req, res) {
        try {
            const userId = req.user.id;
            const { bookingId } = req.params;
            const { reason } = req.body;

            // Get organizer ID
            const organizerResult = await executeQuery(
                'SELECT id FROM organizers WHERE user_id = ?',
                [userId]
            );

            if (!organizerResult.success || organizerResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Organizer profile not found'
                });
            }

            const organizerDbId = organizerResult.data[0].id;

            // Verify booking exists and belongs to organizer
            const bookingResult = await executeQuery(
                'SELECT * FROM bookings WHERE id = ? AND organizer_id = ?',
                [bookingId, organizerDbId]
            );

            if (!bookingResult.success || bookingResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Booking not found'
                });
            }

            const booking = bookingResult.data[0];

            // Check if booking can be cancelled
            if (booking.status === 'cancelled') {
                return res.status(400).json({
                    success: false,
                    message: 'Booking is already cancelled'
                });
            }

            if (booking.status === 'completed') {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot cancel completed booking'
                });
            }

            // Update booking status to cancelled
            const result = await executeQuery(
                'UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND organizer_id = ?',
                ['cancelled', bookingId, organizerDbId]
            );

            if (result.success) {
                // Add cancellation note if reason provided
                if (reason) {
                    try {
                        await executeQuery(
                            'INSERT INTO booking_messages (booking_id, sender_id, sender_type, message, message_type) VALUES (?, ?, ?, ?, ?)',
                            [bookingId, userId, 'organizer', `Booking cancelled by organizer. Reason: ${reason}`, 'system']
                        );
                    } catch (error) {
                        console.log('Failed to save cancellation reason:', error.message);
                    }
                }

                res.json({
                    success: true,
                    message: 'Booking cancelled successfully'
                });
            } else {
                throw new Error('Failed to cancel booking');
            }

        } catch (error) {
            console.error('Cancel booking error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to cancel booking',
                error: error.message
            });
        }
    },

    // Get organizer profile
    async getProfile(req, res) {
        try {
            const userId = req.user.id;

            const result = await executeQuery(
                `SELECT u.*, o.organization_name, o.organization_type, o.website, 
                        o.description, o.location, o.is_verified
                 FROM users u
                 LEFT JOIN organizers o ON u.id = o.user_id
                 WHERE u.id = ?`,
                [userId]
            );

            if (!result.success || result.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Organizer not found'
                });
            }

            const organizer = result.data[0];
            delete organizer.password; // Remove password from response

            res.json({
                success: true,
                data: organizer
            });

        } catch (error) {
            console.error('Get organizer profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch profile',
                error: error.message
            });
        }
    },

    // Update organizer profile
    async updateProfile(req, res) {
        try {
            const userId = req.user.id;
            const {
                name,
                phone,
                organization_name,
                organization_type,
                website,
                description,
                location
            } = req.body;

            // Update users table
            if (name || phone) {
                const userFields = [];
                const userParams = [];

                if (name) {
                    userFields.push('name = ?');
                    userParams.push(name);
                }
                if (phone) {
                    userFields.push('phone = ?');
                    userParams.push(phone);
                }

                userParams.push(userId);

                await executeQuery(
                    `UPDATE users SET ${userFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                    userParams
                );
            }

            // Update organizers table
            if (organization_name || organization_type || website || description || location) {
                // Check if organizer record exists
                const organizerCheck = await executeQuery(
                    'SELECT id FROM organizers WHERE user_id = ?',
                    [userId]
                );

                if (organizerCheck.success && organizerCheck.data.length > 0) {
                    // Update existing record
                    const orgFields = [];
                    const orgParams = [];

                    if (organization_name) {
                        orgFields.push('organization_name = ?');
                        orgParams.push(organization_name);
                    }
                    if (organization_type) {
                        orgFields.push('organization_type = ?');
                        orgParams.push(organization_type);
                    }
                    if (website) {
                        orgFields.push('website = ?');
                        orgParams.push(website);
                    }
                    if (description) {
                        orgFields.push('description = ?');
                        orgParams.push(description);
                    }
                    if (location) {
                        orgFields.push('location = ?');
                        orgParams.push(location);
                    }

                    orgParams.push(userId);

                    await executeQuery(
                        `UPDATE organizers SET ${orgFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
                        orgParams
                    );
                } else {
                    // Create new organizer record
                    await executeQuery(
                        'INSERT INTO organizers (user_id, organization_name, organization_type, website, description, location) VALUES (?, ?, ?, ?, ?, ?)',
                        [userId, organization_name, organization_type, website, description, location]
                    );
                }
            }

            res.json({
                success: true,
                message: 'Profile updated successfully'
            });

        } catch (error) {
            console.error('Update organizer profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update profile',
                error: error.message
            });
        }
    },

    // Get dashboard statistics
    async getDashboardStats(req, res) {
        try {
            const userId = req.user.id;

            // Get organizer ID and verification status
            const organizerResult = await executeQuery(
                'SELECT id, is_verified FROM organizers WHERE user_id = ?',
                [userId]
            );

            if (!organizerResult.success || organizerResult.data.length === 0) {
                return res.json({
                    success: true,
                    data: {
                        organizer: { is_verified: false },
                        totalBookings: 0,
                        pendingBookings: 0,
                        confirmedBookings: 0,
                        completedBookings: 0,
                        totalSpent: 0,
                        upcomingEvents: 0
                    }
                });
            }

            const organizerData = organizerResult.data[0];
            const organizerDbId = organizerData.id;

            // Get booking statistics
            const statsResult = await executeQuery(
                `SELECT 
                    COUNT(*) as total_bookings,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings,
                    COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
                    COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as total_spent,
                    COUNT(CASE WHEN status IN ('pending', 'confirmed') AND event_date >= CURDATE() THEN 1 END) as upcoming_events
                 FROM bookings 
                 WHERE organizer_id = ?`,
                [organizerDbId]
            );

            const stats = statsResult.success ? statsResult.data[0] : {
                total_bookings: 0,
                pending_bookings: 0,
                confirmed_bookings: 0,
                completed_bookings: 0,
                total_spent: 0,
                upcoming_events: 0
            };

            res.json({
                success: true,
                data: {
                    organizer: { 
                        id: organizerData.id, 
                        is_verified: organizerData.is_verified 
                    },
                    totalBookings: stats.total_bookings,
                    pendingBookings: stats.pending_bookings,
                    confirmedBookings: stats.confirmed_bookings,
                    completedBookings: stats.completed_bookings,
                    totalSpent: parseFloat(stats.total_spent),
                    upcomingEvents: stats.upcoming_events
                }
            });

        } catch (error) {
            console.error('Get dashboard stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch dashboard statistics',
                error: error.message
            });
        }
    },

    // Payment Methods
    async makePayment(req, res) {
        try {
            const { bookingId } = req.params;
            const userId = req.user.id;

            // Get organizer ID
            const organizerResult = await executeQuery(
                'SELECT id FROM organizers WHERE user_id = ?',
                [userId]
            );

            if (!organizerResult.success || organizerResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Organizer not found'
                });
            }

            const organizerId = organizerResult.data[0].id;

            // Get booking details
            const bookingResult = await executeQuery(
                'SELECT * FROM bookings WHERE id = ? AND organizer_id = ? AND status = "confirmed"',
                [bookingId, organizerId]
            );

            if (!bookingResult.success || bookingResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Booking not found or not confirmed'
                });
            }

            const booking = bookingResult.data[0];

            // Check if payment already made
            if (booking.payment_status === 'paid' || booking.payment_status === 'released') {
                return res.status(400).json({
                    success: false,
                    message: 'Payment has already been made for this booking'
                });
            }

            // Calculate platform fee (10% platform fee)
            const totalAmount = parseFloat(booking.total_amount);
            const platformFee = totalAmount * 0.10;
            const netAmount = totalAmount - platformFee;

            // Update booking with payment info
            const updateResult = await executeQuery(`
                UPDATE bookings 
                SET payment_status = 'paid',
                    platform_fee = ?,
                    net_amount = ?,
                    payment_date = NOW()
                WHERE id = ?
            `, [platformFee, netAmount, bookingId]);

            if (!updateResult.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to process payment'
                });
            }

            // Create payment record
            try {
                await executeQuery(`
                    INSERT INTO payments 
                    (booking_id, amount, platform_fee, net_amount, status)
                    VALUES (?, ?, ?, ?, 'completed')
                `, [bookingId, totalAmount, platformFee, netAmount]);
            } catch (error) {
                // If payments table doesn't exist yet, ignore this error
                console.log('Payment record creation skipped (table may not exist):', error.message);
            }

            res.json({
                success: true,
                message: 'Payment processed successfully! Funds are now held in escrow.',
                data: {
                    totalAmount,
                    platformFee,
                    netAmount,
                    paymentStatus: 'paid'
                }
            });

        } catch (error) {
            console.error('Make payment error:', error);
            res.status(500).json({
                success: false,
                message: 'Payment processing failed',
                error: error.message
            });
        }
    },

    async getPaymentDetails(req, res) {
        try {
            const { bookingId } = req.params;
            const userId = req.user.id;

            // Get organizer ID
            const organizerResult = await executeQuery(
                'SELECT id FROM organizers WHERE user_id = ?',
                [userId]
            );

            if (!organizerResult.success || organizerResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Organizer not found'
                });
            }

            const organizerId = organizerResult.data[0].id;

            // Get booking with payment details
            const bookingResult = await executeQuery(`
                SELECT 
                    b.*,
                    a.name as artist_name,
                    u.email as artist_email
                FROM bookings b
                JOIN artists art ON b.artist_id = art.id
                JOIN users a ON art.user_id = a.id
                JOIN users u ON art.user_id = u.id
                WHERE b.id = ? AND b.organizer_id = ?
            `, [bookingId, organizerId]);

            if (!bookingResult.success || bookingResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Booking not found'
                });
            }

            const booking = bookingResult.data[0];

            // Calculate payment details
            const totalAmount = parseFloat(booking.total_amount);
            const platformFee = totalAmount * 0.03;
            const paymentAmount = totalAmount + platformFee; // Organizer pays total + fee
            const netToArtist = totalAmount - platformFee; // Artist receives total - fee

            res.json({
                success: true,
                data: {
                    booking,
                    paymentBreakdown: {
                        originalAmount: totalAmount,
                        platformFee: platformFee,
                        totalToPay: paymentAmount,
                        netToArtist: netToArtist
                    }
                }
            });

        } catch (error) {
            console.error('Get payment details error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    },

    async markEventCompleted(req, res) {
        try {
            const { bookingId } = req.params;
            const userId = req.user.id;

            // Get organizer ID
            const organizerResult = await executeQuery(
                'SELECT id FROM organizers WHERE user_id = ?',
                [userId]
            );

            if (!organizerResult.success || organizerResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Organizer not found'
                });
            }

            const organizerId = organizerResult.data[0].id;

            // Get booking details
            const bookingResult = await executeQuery(
                'SELECT * FROM bookings WHERE id = ? AND organizer_id = ?',
                [bookingId, organizerId]
            );

            if (!bookingResult.success || bookingResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Booking not found'
                });
            }

            const booking = bookingResult.data[0];

            // Check if payment was made
            if (booking.payment_status !== 'paid') {
                return res.status(400).json({
                    success: false,
                    message: 'Payment must be completed before confirming performance'
                });
            }

            // Release payment to artist
            const updateResult = await executeQuery(`
                UPDATE bookings 
                SET payment_status = 'released',
                    status = 'completed',
                    completion_date = NOW()
                WHERE id = ?
            `, [bookingId]);

            if (!updateResult.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to confirm performance'
                });
            }

            res.json({
                success: true,
                message: 'Performance confirmed! Payment has been released to the artist.',
                data: {
                    paymentStatus: 'released',
                    bookingStatus: 'completed'
                }
            });

        } catch (error) {
            console.error('Mark event completed error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to confirm performance',
                error: error.message
            });
        }
    },

    async disputePayment(req, res) {
        try {
            const { bookingId } = req.params;
            const { description } = req.body;
            const userId = req.user.id;

            // Get organizer ID
            const organizerResult = await executeQuery(
                'SELECT id FROM organizers WHERE user_id = ?',
                [userId]
            );

            if (!organizerResult.success || organizerResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Organizer not found'
                });
            }

            const organizerId = organizerResult.data[0].id;

            // Get booking details
            const bookingResult = await executeQuery(
                'SELECT * FROM bookings WHERE id = ? AND organizer_id = ?',
                [bookingId, organizerId]
            );

            if (!bookingResult.success || bookingResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Booking not found'
                });
            }

            const booking = bookingResult.data[0];

            // Check if payment was made
            if (booking.payment_status !== 'paid') {
                return res.status(400).json({
                    success: false,
                    message: 'Can only dispute bookings where payment has been made'
                });
            }

            // Update booking status to disputed
            const updateResult = await executeQuery(`
                UPDATE bookings 
                SET status = 'disputed'
                WHERE id = ?
            `, [bookingId]);

            if (!updateResult.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to create dispute'
                });
            }

            // Create dispute record
            try {
                await executeQuery(`
                    INSERT INTO disputes 
                    (booking_id, reported_by_id, issue_description)
                    VALUES (?, ?, ?)
                `, [bookingId, userId, description]);
            } catch (error) {
                // If disputes table doesn't exist yet, ignore this error
                console.log('Dispute record creation skipped (table may not exist):', error.message);
            }

            res.json({
                success: true,
                message: 'Issue reported successfully. An admin will review your case.',
                data: {
                    bookingStatus: 'disputed',
                    description
                }
            });

        } catch (error) {
            console.error('Dispute payment error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to report issue',
                error: error.message
            });
        }
    },

    // Debug method to test database connectivity
    async debugBookings(req, res) {
        try {
            const userId = req.user.id;
            console.log('Debug - User ID:', userId);

            // Test 1: Check if organizers table exists and has data
            const organizerTest = await executeQuery('SELECT id, user_id FROM organizers LIMIT 5');
            console.log('Organizer test result:', organizerTest);

            // Test 2: Check specific organizer for this user
            const userOrganizerTest = await executeQuery('SELECT id FROM organizers WHERE user_id = ?', [userId]);
            console.log('User organizer test:', userOrganizerTest);

            // Test 3: Check bookings table
            const bookingsTest = await executeQuery('SELECT id, artist_id, organizer_id, event_name FROM bookings LIMIT 5');
            console.log('Bookings test:', bookingsTest);

            // Test 4: Check if organizer_id column exists and has non-null values
            const organizerIdTest = await executeQuery('SELECT COUNT(*) as total, COUNT(organizer_id) as with_organizer_id FROM bookings');
            console.log('Organizer ID test:', organizerIdTest);

            res.json({
                success: true,
                debug: {
                    userId,
                    organizerTest: organizerTest.success ? organizerTest.data : organizerTest.error,
                    userOrganizerTest: userOrganizerTest.success ? userOrganizerTest.data : userOrganizerTest.error,
                    bookingsTest: bookingsTest.success ? bookingsTest.data : bookingsTest.error,
                    organizerIdTest: organizerIdTest.success ? organizerIdTest.data : organizerIdTest.error
                }
            });

        } catch (error) {
            console.error('Debug error:', error);
            res.status(500).json({
                success: false,
                message: 'Debug failed',
                error: error.message
            });
        }
    },

    submitArtistRating: async (req, res) => {
        try {
            console.log('Received rating submission:', req.body);
            const { 
                booking_id, 
                overall_rating, 
                review_title, 
                review_text, 
                communication_rating, 
                professionalism_rating, 
                punctuality_rating,
                quality_rating, 
                would_recommend 
            } = req.body;
            const user_id = req.user.id;

            console.log('Getting organizer ID for user:', user_id);
            const organizerResult = await executeQuery(
                'SELECT id FROM organizers WHERE user_id = ?',
                [user_id]
            );

            if (!organizerResult.success || organizerResult.data.length === 0) {
                console.error('Failed to get organizer ID:', organizerResult.error);
                return res.status(404).json({
                    success: false,
                    message: 'Organizer profile not found'
                });
            }

            const organizer_id = organizerResult.data[0].id;
            console.log('Found organizer ID:', organizer_id);

            // Validate rating values
            if (!booking_id) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Booking ID is required' 
                });
            }

            if (!overall_rating || overall_rating < 1 || overall_rating > 5) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Overall rating must be between 1 and 5' 
                });
            }

            // Verify the booking exists and is completed
            console.log('Checking booking:', booking_id, organizer_id);
            const bookingResult = await executeQuery(
                'SELECT b.*, a.user_id as artist_user_id FROM bookings b JOIN artists a ON b.artist_id = a.id WHERE b.id = ? AND b.organizer_id = ?',
                [booking_id, organizer_id]
            );
            console.log('Booking result:', bookingResult);

            if (!bookingResult.success) {
                console.error('Database error checking booking:', bookingResult.error);
                return res.status(500).json({ 
                    success: false,
                    message: 'Error checking booking',
                    error: bookingResult.error
                });
            }

            if (bookingResult.data.length === 0) {
                return res.status(404).json({ 
                    success: false,
                    message: 'Booking not found' 
                });
            }

            const booking = bookingResult.data[0];

            if (booking.status !== 'completed') {
                return res.status(400).json({ 
                    success: false,
                    message: 'Can only rate completed bookings' 
                });
            }

            // Check if rating already exists
            console.log('Checking existing rating');
            const existingRatingResult = await executeQuery(
                'SELECT id FROM reviews WHERE booking_id = ? AND reviewer_id = ?',
                [booking_id, user_id]
            );
            console.log('Existing rating result:', existingRatingResult);

            if (!existingRatingResult.success) {
                console.error('Database error checking existing rating:', existingRatingResult.error);
                return res.status(500).json({ 
                    success: false,
                    message: 'Error checking existing rating',
                    error: existingRatingResult.error
                });
            }

            if (existingRatingResult.data.length > 0) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Rating already submitted for this booking' 
                });
            }

            // Insert the review
            console.log('Inserting review');
            const insertResult = await executeQuery(
                `INSERT INTO reviews (
                    booking_id, reviewer_id, reviewer_type, reviewee_id,
                    overall_rating, review_title, review_text,
                    communication_rating, professionalism_rating, punctuality_rating, quality_rating,
                    would_recommend, is_public, is_approved
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    booking_id, user_id, 'organizer', booking.artist_user_id,
                    overall_rating, review_title, review_text,
                    communication_rating || null, professionalism_rating || null, 
                    punctuality_rating || null, quality_rating || null,
                    would_recommend || false, true, true
                ]
            );
            console.log('Insert result:', insertResult);

            if (!insertResult.success) {
                console.error('Database error inserting review:', insertResult.error);
                return res.status(500).json({ 
                    success: false,
                    message: 'Error inserting review',
                    error: insertResult.error
                });
            }

            // Update user's average rating
            try {
                await updateUserRatingStats(booking.artist_user_id);
        } catch (error) {
                console.error('Error updating user rating stats:', error);
                // Don't fail the request if stats update fails
            }

            res.status(201).json({ 
                success: true,
                message: 'Rating submitted successfully'
            });
        } catch (error) {
            console.error('Error in submitArtistRating:', error);
            res.status(500).json({ 
                success: false,
                message: 'Error submitting rating',
                error: error.message,
                stack: error.stack
            });
        }
    },

    getSubmittedRatings: async (req, res) => {
        try {
            const organizer_id = req.user.id;

            const [ratings] = await executeQuery(
                `SELECT r.*, b.event_name, u.name as artist_name, 
                        b.event_date, b.venue_address
                 FROM reviews r
                 JOIN bookings b ON r.booking_id = b.id
                 JOIN users u ON r.reviewee_id = u.id
                 WHERE r.reviewer_id = ? AND r.reviewer_type = 'organizer'
                 ORDER BY r.created_at DESC`,
                [organizer_id]
            );

            res.json({
                success: true,
                data: ratings
            });
        } catch (error) {
            console.error('Error fetching ratings:', error);
            res.status(500).json({ message: 'Error fetching ratings' });
        }
    },

    updateArtistRating: async (req, res) => {
        try {
            const { rating_id } = req.params;
            const { 
                overall_rating, 
                review_title, 
                review_text, 
                communication_rating, 
                professionalism_rating, 
                punctuality_rating,
                quality_rating, 
                would_recommend 
            } = req.body;
            const organizer_id = req.user.id;

            // Validate rating values
            if (overall_rating && (overall_rating < 1 || overall_rating > 5)) {
                return res.status(400).json({ message: 'Overall rating must be between 1 and 5' });
            }

            // Verify the rating exists and belongs to this organizer
            const [existingRating] = await executeQuery(
                'SELECT id, reviewee_id FROM reviews WHERE id = ? AND reviewer_id = ? AND reviewer_type = "organizer"',
                [rating_id, organizer_id]
            );

            if (!existingRating.length) {
                return res.status(404).json({ message: 'Rating not found' });
            }

            // Update the rating
            await executeQuery(
                `UPDATE reviews SET
                    overall_rating = ?,
                    review_title = ?,
                    review_text = ?,
                    communication_rating = ?,
                    professionalism_rating = ?,
                    punctuality_rating = ?,
                    quality_rating = ?,
                    would_recommend = ?,
                    updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [overall_rating, review_title, review_text, communication_rating, professionalism_rating, punctuality_rating, quality_rating, would_recommend, rating_id]
            );

            // Update user's average rating
            await updateUserRatingStats(existingRating[0].reviewee_id);

            res.json({ 
                message: 'Rating updated successfully',
                success: true 
            });
        } catch (error) {
            console.error('Error updating rating:', error);
            res.status(500).json({ message: 'Error updating rating' });
        }
    },

    getArtistRatings: async (req, res) => {
        try {
            const { artist_id } = req.params;

            // Get artist user details with rating stats
            const [artist] = await executeQuery(
                `SELECT u.id, u.name, u.average_rating, u.total_reviews
                 FROM users u
                 JOIN artists a ON u.id = a.user_id
                 WHERE a.id = ?`,
                [artist_id]
            );

            if (!artist.length) {
                return res.status(404).json({ message: 'Artist not found' });
            }

            // Get detailed reviews
            const [reviews] = await executeQuery(
                `SELECT r.*, u.name as organizer_name, b.event_name,
                        b.event_date, b.venue_address
                 FROM reviews r
                 JOIN bookings b ON r.booking_id = b.id
                 JOIN users u ON r.reviewer_id = u.id
                 WHERE r.reviewee_id = ?
                 AND r.is_public = true AND r.is_approved = true
                 ORDER BY r.created_at DESC
                 LIMIT 20`,
                [artist[0].id]
            );

            // Get rating distribution
            const [distribution] = await executeQuery(
                `SELECT 
                    COUNT(CASE WHEN overall_rating >= 4.5 THEN 1 END) as five_star,
                    COUNT(CASE WHEN overall_rating >= 3.5 AND overall_rating < 4.5 THEN 1 END) as four_star,
                    COUNT(CASE WHEN overall_rating >= 2.5 AND overall_rating < 3.5 THEN 1 END) as three_star,
                    COUNT(CASE WHEN overall_rating >= 1.5 AND overall_rating < 2.5 THEN 1 END) as two_star,
                    COUNT(CASE WHEN overall_rating < 1.5 THEN 1 END) as one_star
                 FROM reviews 
                 WHERE reviewee_id = ? AND is_public = true AND is_approved = true`,
                [artist[0].id]
            );

            res.json({
                success: true,
                data: {
                artist: artist[0],
                    reviews,
                    rating_distribution: distribution[0] || {}
                }
            });
        } catch (error) {
            console.error('Error fetching artist ratings:', error);
            res.status(500).json({ message: 'Error fetching artist ratings' });
        }
    },

    // Helper function to update user rating stats
    async updateUserRatingStats(userId) {
        try {
            const statsResult = await executeQuery(
                `SELECT 
                    AVG(overall_rating) as avg_rating,
                    COUNT(*) as total_reviews,
                    SUM(CASE WHEN would_recommend = 1 THEN 1 ELSE 0 END) as recommendations
                FROM reviews 
                WHERE reviewee_id = ? AND is_approved = 1`,
                [userId]
            );

            if (!statsResult.success) {
                throw new Error('Failed to calculate rating stats');
            }

            const stats = statsResult.data[0];
            
            await executeQuery(
                `UPDATE users 
                SET average_rating = ?, 
                    total_reviews = ?, 
                    total_recommendations = ?
                WHERE id = ?`,
                [
                    stats.avg_rating || 0,
                    stats.total_reviews || 0,
                    stats.recommendations || 0,
                    userId
                ]
            );
        } catch (error) {
            console.error('Error updating user rating stats:', error);
            // Don't throw error - just log it
        }
    },

    // Get rating for a specific booking
    getBookingRating: async (req, res) => {
        try {
            const organizer_id = req.user.id;
            const { bookingId } = req.params;

            // Find the rating for this booking by this organizer
            const result = await executeQuery(
                `SELECT r.*, u.name as artist_name, b.event_name
                 FROM reviews r
                 JOIN users u ON r.reviewee_id = u.id
                 JOIN bookings b ON r.booking_id = b.id
                 WHERE r.booking_id = ? 
                 AND r.reviewer_id = ? 
                 AND r.reviewer_type = 'organizer'`,
                [bookingId, organizer_id]
            );

            if (!result.success || result.data.length === 0) {
                return res.status(404).json({ 
                    success: false,
                    message: 'No rating found for this booking',
                    hasRated: false
                });
            }

            res.json({ 
                success: true, 
                data: result.data[0],
                hasRated: true
            });
        } catch (error) {
            console.error('Error fetching booking rating:', error);
            res.status(500).json({ 
                success: false,
                message: 'Error fetching booking rating',
                error: error.message 
            });
        }
    }
};

module.exports = organizerController; 