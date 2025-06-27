const { executeQuery } = require('../config/database');

const eventApplicationController = {
    // Artist applies to an event
    async applyToEvent(req, res) {
        try {
            const { eventId } = req.params;
            const userId = req.user.id;
            const { proposed_budget, message } = req.body;

            // Validate required fields
            if (!proposed_budget || proposed_budget <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid proposed budget is required'
                });
            }

            // Get artist ID from user ID
            const artistResult = await executeQuery(
                'SELECT id FROM artists WHERE user_id = ?',
                [userId]
            );

            if (!artistResult.success || artistResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Artist profile not found'
                });
            }

            const artistId = artistResult.data[0].id;

            // Verify event exists and is open for applications
            const eventResult = await executeQuery(
                'SELECT id, title, status, application_deadline FROM events WHERE id = ? AND status IN ("planning", "published")',
                [eventId]
            );

            if (!eventResult.success || eventResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Event not found or not open for applications'
                });
            }

            const event = eventResult.data[0];

            // Check if application deadline has passed
            if (event.application_deadline && new Date() > new Date(event.application_deadline)) {
                return res.status(400).json({
                    success: false,
                    message: 'Application deadline has passed'
                });
            }

            // Check if artist has already applied
            const existingApplicationResult = await executeQuery(
                'SELECT id FROM event_applications WHERE event_id = ? AND artist_id = ?',
                [eventId, artistId]
            );

            if (existingApplicationResult.success && existingApplicationResult.data.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'You have already applied to this event'
                });
            }

            // Create application
            const applicationResult = await executeQuery(
                'INSERT INTO event_applications (event_id, artist_id, proposed_budget, message) VALUES (?, ?, ?, ?)',
                [eventId, artistId, proposed_budget, message || '']
            );

            if (!applicationResult.success) {
                throw new Error('Failed to create application');
            }

            // Update event application count
            await executeQuery(
                'UPDATE events SET total_applications = total_applications + 1 WHERE id = ?',
                [eventId]
            );

            res.status(201).json({
                success: true,
                message: 'Application submitted successfully',
                data: {
                    applicationId: applicationResult.insertId,
                    eventTitle: event.title
                }
            });

        } catch (error) {
            console.error('Apply to event error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to submit application'
            });
        }
    },

    // Get artist's applications
    async getMyApplications(req, res) {
        try {
            const userId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const status = req.query.status;
            const offset = (page - 1) * limit;

            // Get artist ID
            const artistResult = await executeQuery(
                'SELECT id FROM artists WHERE user_id = ?',
                [userId]
            );

            if (!artistResult.success || artistResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Artist profile not found'
                });
            }

            const artistId = artistResult.data[0].id;

            let whereClause = 'WHERE ea.artist_id = ?';
            let queryParams = [artistId];

            if (status && status !== 'all') {
                whereClause += ' AND ea.application_status = ?';
                queryParams.push(status);
            }

            // Get applications with event details
            const applicationsQuery = `
                SELECT 
                    ea.id,
                    ea.proposed_budget,
                    ea.message,
                    ea.application_status,
                    ea.organizer_response,
                    ea.applied_at,
                    ea.responded_at,
                    e.id as event_id,
                    e.title as event_title,
                    e.description as event_description,
                    e.event_type,
                    e.event_date,
                    e.start_time,
                    e.venue_name,
                    e.venue_city,
                    e.venue_state,
                    e.budget_min,
                    e.budget_max,
                    u.name as organizer_name
                FROM event_applications ea
                JOIN events e ON ea.event_id = e.id
                JOIN users u ON e.organizer_id = u.id
                ${whereClause}
                ORDER BY ea.applied_at DESC
                LIMIT ? OFFSET ?
            `;

            queryParams.push(limit, offset);

            const applicationsResult = await executeQuery(applicationsQuery, queryParams);

            // Get total count
            const countQuery = `
                SELECT COUNT(*) as total
                FROM event_applications ea
                JOIN events e ON ea.event_id = e.id
                ${whereClause}
            `;

            const countResult = await executeQuery(countQuery, queryParams.slice(0, -2)); // Remove limit and offset
            const total = countResult.success ? countResult.data[0].total : 0;

            res.json({
                success: true,
                data: {
                    applications: applicationsResult.success ? applicationsResult.data : [],
                    pagination: {
                        page,
                        limit,
                        total,
                        pages: Math.ceil(total / limit)
                    }
                }
            });

        } catch (error) {
            console.error('Get my applications error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch applications'
            });
        }
    },

    // Organizer gets applications for their event
    async getEventApplications(req, res) {
        try {
            const { eventId } = req.params;
            const userId = req.user.id;
            const status = req.query.status;

            // Verify event belongs to organizer
            const eventResult = await executeQuery(
                'SELECT id, title FROM events WHERE id = ? AND organizer_id = ?',
                [eventId, userId]
            );

            if (!eventResult.success || eventResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Event not found or access denied'
                });
            }

            let whereClause = 'WHERE ea.event_id = ?';
            let queryParams = [eventId];

            if (status && status !== 'all') {
                whereClause += ' AND ea.application_status = ?';
                queryParams.push(status);
            }

            // Get applications with artist details
            const applicationsQuery = `
                SELECT 
                    ea.id,
                    ea.proposed_budget,
                    ea.message,
                    ea.application_status,
                    ea.organizer_response,
                    ea.applied_at,
                    ea.responded_at,
                    a.id as artist_id,
                    u.name as artist_name,
                    u.email as artist_email,
                    u.phone as artist_phone,
                    a.genre,
                    a.bio,
                    a.experience_years,
                    a.location,
                    a.rating,
                    a.total_ratings,
                    a.is_verified
                FROM event_applications ea
                JOIN artists a ON ea.artist_id = a.id
                JOIN users u ON a.user_id = u.id
                ${whereClause}
                ORDER BY ea.applied_at ASC
            `;

            const applicationsResult = await executeQuery(applicationsQuery, queryParams);

            res.json({
                success: true,
                data: {
                    event: eventResult.data[0],
                    applications: applicationsResult.success ? applicationsResult.data : []
                }
            });

        } catch (error) {
            console.error('Get event applications error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch event applications'
            });
        }
    },

    // Organizer approves an application
    async approveApplication(req, res) {
        let responseSent = false;
        
        try {
            const { eventId, applicationId } = req.params;
            const userId = req.user.id;
            const { organizer_response } = req.body;

            console.log('🎯 Approve application request:', { eventId, applicationId, userId });

            // Verify event belongs to organizer
            const eventResult = await executeQuery(
                'SELECT id, title, event_date, start_time, end_time FROM events WHERE id = ? AND organizer_id = ?',
                [eventId, userId]
            );

            if (!eventResult.success || eventResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Event not found or access denied'
                });
            }

            const event = eventResult.data[0];

            // Get application details
            const applicationResult = await executeQuery(
                'SELECT ea.*, a.user_id, u.name as artist_name FROM event_applications ea JOIN artists a ON ea.artist_id = a.id JOIN users u ON a.user_id = u.id WHERE ea.id = ? AND ea.event_id = ?',
                [applicationId, eventId]
            );

            if (!applicationResult.success || applicationResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Application not found'
                });
            }

            const application = applicationResult.data[0];

            if (application.application_status !== 'pending') {
                return res.status(400).json({
                    success: false,
                    message: 'Application has already been processed'
                });
            }

            // Get organizer DB ID
            const organizerDbId = await eventApplicationController.getOrganizerDbId(userId);
            console.log('📋 Organizer DB ID:', organizerDbId);
            
            if (!organizerDbId) {
                console.error('❌ Organizer not found in organizers table for user ID:', userId);
                return res.status(400).json({
                    success: false,
                    message: 'Organizer profile not found. Please contact support.'
                });
            }

            // Update application status first
            console.log('📝 Updating application status...');
            const updateResult = await executeQuery(
                'UPDATE event_applications SET application_status = "approved", organizer_response = ?, responded_at = NOW() WHERE id = ?',
                [organizer_response || 'Application approved', applicationId]
            );

            if (!updateResult.success) {
                console.error('❌ Failed to update application status:', updateResult.error);
                throw new Error('Failed to update application status');
            }

            // Update event approved count
            console.log('📊 Updating event approved count...');
            await executeQuery(
                'UPDATE events SET approved_applications = approved_applications + 1 WHERE id = ?',
                [eventId]
            );

            console.log('✅ Application approved successfully');

            // Send response first - don't let booking creation failure affect the approval
            responseSent = true;
            res.json({
                success: true,
                message: 'Application approved successfully',
                data: {
                    applicationId,
                    artistName: application.artist_name
                }
            });

            // Try to create booking record (optional - log errors but don't fail the approval)
            try {
                console.log('📅 Creating booking record...');
                const bookingResult = await executeQuery(
                    `INSERT INTO bookings (
                        artist_id, organizer_id, event_id, application_id, 
                        event_name, event_date, event_time, 
                        total_amount, status, payment_status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', 'pending')`,
                    [
                        application.artist_id,
                        organizerDbId,
                        eventId,
                        applicationId,
                        event.title,
                        event.event_date,
                        event.start_time || '19:00:00',
                        application.proposed_budget
                    ]
                );

                if (bookingResult.success) {
                    console.log('✅ Booking record created successfully:', bookingResult.insertId);
                } else {
                    console.error('⚠️ Failed to create booking record (approval still successful):', bookingResult.error);
                }
            } catch (bookingError) {
                console.error('⚠️ Booking creation error (approval still successful):', bookingError);
            }

        } catch (error) {
            console.error('❌ Approve application error:', error);
            
            // Only send error response if we haven't already sent a success response
            if (!responseSent) {
                res.status(500).json({
                    success: false,
                    message: 'Failed to approve application',
                    details: error.message
                });
            } else {
                console.error('❌ Error occurred after successful response was sent');
            }
        }
    },

    // Organizer rejects an application
    async rejectApplication(req, res) {
        try {
            const { eventId, applicationId } = req.params;
            const userId = req.user.id;
            const { organizer_response } = req.body;

            // Verify event belongs to organizer
            const eventResult = await executeQuery(
                'SELECT id FROM events WHERE id = ? AND organizer_id = ?',
                [eventId, userId]
            );

            if (!eventResult.success || eventResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Event not found or access denied'
                });
            }

            // Verify application exists and is pending
            const applicationResult = await executeQuery(
                'SELECT id, application_status FROM event_applications WHERE id = ? AND event_id = ?',
                [applicationId, eventId]
            );

            if (!applicationResult.success || applicationResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Application not found'
                });
            }

            const application = applicationResult.data[0];

            if (application.application_status !== 'pending') {
                return res.status(400).json({
                    success: false,
                    message: 'Application has already been processed'
                });
            }

            // Update application status
            const updateResult = await executeQuery(
                'UPDATE event_applications SET application_status = "rejected", organizer_response = ?, responded_at = NOW() WHERE id = ?',
                [organizer_response || 'Application rejected', applicationId]
            );

            if (!updateResult.success) {
                throw new Error('Failed to update application status');
            }

            res.json({
                success: true,
                message: 'Application rejected successfully'
            });

        } catch (error) {
            console.error('Reject application error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to reject application'
            });
        }
    },

    // Admin - Get all applications
    async getAllApplications(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const status = req.query.status;
            const eventType = req.query.event_type;
            const offset = (page - 1) * limit;

            let whereConditions = [];
            let queryParams = [];

            if (status && status !== 'all') {
                whereConditions.push('ea.application_status = ?');
                queryParams.push(status);
            }

            if (eventType && eventType !== 'all') {
                whereConditions.push('e.event_type = ?');
                queryParams.push(eventType);
            }

            const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

            const applicationsQuery = `
                SELECT 
                    ea.id,
                    ea.proposed_budget,
                    ea.application_status,
                    ea.applied_at,
                    ea.responded_at,
                    e.id as event_id,
                    e.title as event_title,
                    e.event_type,
                    e.event_date,
                    u_artist.name as artist_name,
                    u_organizer.name as organizer_name
                FROM event_applications ea
                JOIN events e ON ea.event_id = e.id
                JOIN artists a ON ea.artist_id = a.id
                JOIN users u_artist ON a.user_id = u_artist.id
                JOIN users u_organizer ON e.organizer_id = u_organizer.id
                ${whereClause}
                ORDER BY ea.applied_at DESC
                LIMIT ? OFFSET ?
            `;

            queryParams.push(limit, offset);

            const applicationsResult = await executeQuery(applicationsQuery, queryParams);

            // Get total count
            const countQuery = `
                SELECT COUNT(*) as total
                FROM event_applications ea
                JOIN events e ON ea.event_id = e.id
                ${whereClause}
            `;

            const countResult = await executeQuery(countQuery, queryParams.slice(0, -2));
            const total = countResult.success ? countResult.data[0].total : 0;

            res.json({
                success: true,
                data: {
                    applications: applicationsResult.success ? applicationsResult.data : [],
                    pagination: {
                        page,
                        limit,
                        total,
                        pages: Math.ceil(total / limit)
                    }
                }
            });

        } catch (error) {
            console.error('Get all applications error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch applications'
            });
        }
    },

    // Get application details
    async getApplicationDetails(req, res) {
        try {
            const { applicationId } = req.params;
            const userId = req.user.id;

            // Get application with event and artist details
            const applicationQuery = `
                SELECT 
                    ea.*,
                    e.id as event_id,
                    e.title as event_title,
                    e.description as event_description,
                    e.event_type,
                    e.event_date,
                    e.start_time,
                    e.venue_name,
                    e.venue_city,
                    e.venue_state,
                    u_artist.name as artist_name,
                    u_organizer.name as organizer_name
                FROM event_applications ea
                JOIN events e ON ea.event_id = e.id
                JOIN artists a ON ea.artist_id = a.id
                JOIN users u_artist ON a.user_id = u_artist.id
                JOIN users u_organizer ON e.organizer_id = u_organizer.id
                WHERE ea.id = ?
            `;

            const applicationResult = await executeQuery(applicationQuery, [applicationId]);

            if (!applicationResult.success || applicationResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Application not found'
                });
            }

            const application = applicationResult.data[0];

            // Check if user is authorized to view this application
            const artistId = await eventApplicationController.getUserArtistId(userId);
            const isArtist = artistId && artistId === application.artist_id;
            const isOrganizer = userId === application.organizer_id;

            if (!isArtist && !isOrganizer) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            res.json({
                success: true,
                data: application
            });

        } catch (error) {
            console.error('Get application details error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch application details'
            });
        }
    },

    // Cancel application (artist only, if still pending)
    async cancelApplication(req, res) {
        try {
            const { applicationId } = req.params;
            const userId = req.user.id;

            // Get artist ID
            const artistId = await eventApplicationController.getUserArtistId(userId);
            if (!artistId) {
                return res.status(404).json({
                    success: false,
                    message: 'Artist profile not found'
                });
            }

            // Get application details
            const applicationResult = await executeQuery(
                'SELECT * FROM event_applications WHERE id = ? AND artist_id = ?',
                [applicationId, artistId]
            );

            if (!applicationResult.success || applicationResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Application not found'
                });
            }

            const application = applicationResult.data[0];

            if (application.application_status !== 'pending') {
                return res.status(400).json({
                    success: false,
                    message: 'Can only cancel pending applications'
                });
            }

            // Delete the application
            const deleteResult = await executeQuery(
                'DELETE FROM event_applications WHERE id = ?',
                [applicationId]
            );

            if (!deleteResult.success) {
                throw new Error('Failed to cancel application');
            }

            // Update event application count
            await executeQuery(
                'UPDATE events SET total_applications = total_applications - 1 WHERE id = ?',
                [application.event_id]
            );

            res.json({
                success: true,
                message: 'Application cancelled successfully'
            });

        } catch (error) {
            console.error('Cancel application error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to cancel application'
            });
        }
    },

    // Helper function to get artist ID from user ID
    async getUserArtistId(userId) {
        const result = await executeQuery(
            'SELECT id FROM artists WHERE user_id = ?',
            [userId]
        );
        return result.success && result.data.length > 0 ? result.data[0].id : null;
    },

    // Helper function to get organizer DB ID
    async getOrganizerDbId(userId) {
        const result = await executeQuery(
            'SELECT id FROM organizers WHERE user_id = ?',
            [userId]
        );
        return result.success && result.data.length > 0 ? result.data[0].id : null;
    }
};

module.exports = eventApplicationController;
