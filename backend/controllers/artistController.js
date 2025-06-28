const { body, validationResult } = require('express-validator');
const { executeQuery } = require('../config/database');
const { formatArtistProfile, formatForDatabase, validateJsonData, migrateArtistData } = require('../utils/dataFormatters');

const artistController = {
    // Dashboard Statistics
    async getDashboardStats(req, res) {
        try {
            const userId = req.user.id;
            
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
            
            const artistDbId = artistResult.data[0].id;
            
            // Get booking statistics
            let bookingStats = {
                activeBookings: 0,
                completedBookings: 0,
                totalBookings: 0,
                pendingBookings: 0
            };
            
            try {
                const bookingStatsResult = await executeQuery(
                    `SELECT 
                        COUNT(*) as total_bookings,
                        SUM(CASE WHEN status IN ('confirmed', 'in_progress') THEN 1 ELSE 0 END) as active_bookings,
                        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_bookings,
                        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_bookings
                     FROM bookings 
                     WHERE artist_id = ?`,
                    [artistDbId]
                );
                
                if (bookingStatsResult.success && bookingStatsResult.data.length > 0) {
                    const stats = bookingStatsResult.data[0];
                    bookingStats = {
                        activeBookings: stats.active_bookings || 0,
                        completedBookings: stats.completed_bookings || 0,
                        totalBookings: stats.total_bookings || 0,
                        pendingBookings: stats.pending_bookings || 0
                    };
                }
            } catch (error) {
                console.log('Booking stats calculation failed:', error.message);
            }
            
            // Get package statistics
            let packageStats = {
                totalPackages: 0,
                activePackages: 0
            };
            
            try {
                const packageStatsResult = await executeQuery(
                    `SELECT 
                        COUNT(*) as total_packages,
                        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_packages
                     FROM packages 
                     WHERE artist_id = ?`,
                    [artistDbId]
                );
                
                if (packageStatsResult.success && packageStatsResult.data.length > 0) {
                    const stats = packageStatsResult.data[0];
                    packageStats = {
                        totalPackages: stats.total_packages || 0,
                        activePackages: stats.active_packages || 0
                    };
                }
            } catch (error) {
                console.log('Package stats calculation failed:', error.message);
            }
            
            // Get earnings statistics
            let earningsStats = {
                totalEarnings: 0,
                monthlyEarnings: 0,
                averageBookingValue: 0
            };
            
            try {
                const earningsResult = await executeQuery(
                    `SELECT 
                        COALESCE(SUM(total_amount), 0) as total_earnings,
                        COALESCE(AVG(total_amount), 0) as avg_booking_value
                     FROM bookings 
                     WHERE artist_id = ? AND status = 'completed'`,
                    [artistDbId]
                );
                
                const monthlyEarningsResult = await executeQuery(
                    `SELECT COALESCE(SUM(total_amount), 0) as monthly_earnings
                     FROM bookings 
                     WHERE artist_id = ? 
                     AND status = 'completed'
                     AND MONTH(created_at) = MONTH(CURRENT_DATE()) 
                     AND YEAR(created_at) = YEAR(CURRENT_DATE())`,
                    [artistDbId]
                );
                
                if (earningsResult.success && earningsResult.data.length > 0) {
                    const earnings = earningsResult.data[0];
                    earningsStats.totalEarnings = parseFloat(earnings.total_earnings) || 0;
                    earningsStats.averageBookingValue = parseFloat(earnings.avg_booking_value) || 0;
                }
                
                if (monthlyEarningsResult.success && monthlyEarningsResult.data.length > 0) {
                    const monthly = monthlyEarningsResult.data[0];
                    earningsStats.monthlyEarnings = parseFloat(monthly.monthly_earnings) || 0;
                }
            } catch (error) {
                console.log('Earnings stats calculation failed:', error.message);
            }
            
            // Get rating statistics from reviews table and users table
            let ratingStats = {
                averageRating: 0,
                totalReviews: 0
            };
            
            try {
                // Get rating stats directly from reviews table for now (simpler approach)
                const calculatedStatsResult = await executeQuery(
                    `SELECT 
                        COUNT(*) as total_reviews,
                        AVG(overall_rating) as average_rating
                     FROM reviews 
                     WHERE reviewee_id = ? 
                     AND is_approved = 1 
                     AND is_public = 1`,
                    [userId]
                );
                
                if (calculatedStatsResult.success && calculatedStatsResult.data.length > 0) {
                    const calcStats = calculatedStatsResult.data[0];
                    ratingStats = {
                        averageRating: parseFloat(calcStats.average_rating) || 0,
                        totalReviews: calcStats.total_reviews || 0
                    };
                }
            } catch (error) {
                console.log('Rating stats calculation failed:', error.message);
            }
            
            // Get recent activity (last 10 bookings)
            let recentActivity = [];
            try {
                const activityResult = await executeQuery(
                    `SELECT 
                        b.id,
                        b.event_name,
                        b.event_date,
                        b.status,
                        b.total_amount,
                        b.created_at,
                        o.name as organizer_name
                     FROM bookings b
                     JOIN organizers org ON b.organizer_id = org.id
                     JOIN users o ON org.user_id = o.id
                     WHERE b.artist_id = ?
                     ORDER BY b.created_at DESC
                     LIMIT 10`,
                    [artistDbId]
                );
                
                recentActivity = activityResult.success ? activityResult.data : [];
            } catch (error) {
                console.log('Recent activity fetch failed:', error.message);
            }
            
            // Get notifications (recent bookings and status changes)
            let notifications = [];
            try {
                const notificationResult = await executeQuery(
                    `SELECT 
                        b.id,
                        b.event_name,
                        b.status,
                        b.created_at,
                        b.updated_at,
                        o.name as organizer_name,
                        CASE 
                            WHEN b.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 'new_booking'
                            WHEN b.updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND b.updated_at > b.created_at THEN 'status_update'
                            ELSE 'old'
                        END as notification_type
                     FROM bookings b
                     JOIN organizers org ON b.organizer_id = org.id
                     JOIN users o ON org.user_id = o.id
                     WHERE b.artist_id = ?
                     AND (
                         b.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                         OR (b.updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND b.updated_at > b.created_at)
                     )
                     ORDER BY GREATEST(b.created_at, b.updated_at) DESC
                     LIMIT 5`,
                    [artistDbId]
                );
                
                notifications = notificationResult.success ? notificationResult.data : [];
            } catch (error) {
                console.log('Notifications fetch failed:', error.message);
            }
            
            // Get artist verification status
            const artistInfoResult = await executeQuery(
                'SELECT id, is_verified FROM artists WHERE user_id = ?',
                [userId]
            );

            const artistInfo = artistInfoResult.success && artistInfoResult.data.length > 0 
                ? artistInfoResult.data[0] 
                : { is_verified: false };

            res.json({
                success: true,
                data: {
                    artist: artistInfo,
                    bookingStats,
                    packageStats,
                    earningsStats,
                    ratingStats,
                    recentActivity,
                    notifications,
                    lastUpdated: new Date().toISOString()
                }
            });
            
        } catch (error) {
            console.error('Get artist dashboard stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch dashboard statistics',
                error: error.message
            });
        }
    },

    // Profile Management
    async getProfile(req, res) {
        try {
            const artistId = req.user.id;
            
            const artistResult = await executeQuery(
                `SELECT a.*, u.name, u.email, u.phone, u.created_at 
                 FROM artists a 
                 JOIN users u ON a.user_id = u.id 
                 WHERE a.user_id = ?`,
                [artistId]
            );
            
            if (!artistResult.success || artistResult.data.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Artist profile not found' 
                });
            }
            
            const artist = artistResult.data[0];
            
            // Auto-migrate data if needed (future-proof)
            await migrateArtistData(executeQuery, artist.id);
            
            // Get skills
            const skillsResult = await executeQuery(
                'SELECT * FROM artist_skills WHERE artist_id = ?',
                [artist.id]
            );
            
            artist.skills = skillsResult.success ? skillsResult.data : [];
            
            // Format data for frontend consumption
            const formattedArtist = formatArtistProfile(artist);
            
            res.json({
                success: true,
                data: formattedArtist
            });
            
        } catch (error) {
            console.error('Get artist profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    },

    async updateProfile(req, res) {
        try {
            const artistId = req.user.id;
            const { bio, nic, genres, experience_years, hourly_rate, location, website, social_links } = req.body;
            
            console.log('Received profile update request:', {
                userId: artistId,
                nic,
                bio: bio?.substring(0, 20) + '...' // Log just the start of bio for brevity
            });
            
            // Validate data
            const validation = validateJsonData({ genres, social_links });
            if (!validation.isValid) {
                console.log('Validation failed:', validation.errors);
                return res.status(400).json({
                    success: false,
                    message: 'Invalid data format',
                    errors: validation.errors
                });
            }
            
            // Format data for database storage
            const formattedData = formatForDatabase({
                bio, nic, genres, experience_years, hourly_rate, location, website, social_links
            });
            
            console.log('Formatted data for database:', {
                nic: formattedData.nic,
                bio: formattedData.bio?.substring(0, 20) + '...' // Log just the start of bio for brevity
            });

            // First check if artist exists
            const checkResult = await executeQuery(
                'SELECT id FROM artists WHERE user_id = ?',
                [artistId]
            );

            console.log('Check if artist exists:', checkResult);

            if (!checkResult.success || checkResult.data.length === 0) {
                console.log('Artist not found, creating new profile');
                // If artist doesn't exist, create new profile
                const createResult = await executeQuery(
                    `INSERT INTO artists (user_id, bio, nic, genres, experience_years, hourly_rate, location, website, social_links, profile_complete)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,
                        CASE 
                            WHEN (? IS NOT NULL AND ? != '' AND ? IS NOT NULL AND ? != '') THEN 1
                            ELSE 0
                        END)`,
                    [
                        artistId,
                        formattedData.bio,
                        formattedData.nic,
                        formattedData.genres,
                        formattedData.experience_years,
                        formattedData.hourly_rate,
                        formattedData.location,
                        formattedData.website,
                        formattedData.social_links,
                        formattedData.bio,
                        formattedData.bio,
                        formattedData.nic,
                        formattedData.nic
                    ]
                );
                console.log('Create result:', createResult);
            } else {
                console.log('Artist found, updating profile');
                // If artist exists, update profile
                const updateResult = await executeQuery(
                    `UPDATE artists SET 
                     bio = ?, nic = ?, genres = ?, experience_years = ?, 
                     hourly_rate = ?, location = ?, website = ?, 
                     social_links = ?, updated_at = NOW(),
                     profile_complete = CASE 
                         WHEN (? IS NOT NULL AND ? != '' AND ? IS NOT NULL AND ? != '') THEN 1
                         ELSE 0
                     END
                     WHERE user_id = ?`,
                    [
                        formattedData.bio,
                        formattedData.nic,
                        formattedData.genres,
                        formattedData.experience_years,
                        formattedData.hourly_rate,
                        formattedData.location,
                        formattedData.website,
                        formattedData.social_links,
                        formattedData.bio,
                        formattedData.bio,
                        formattedData.nic,
                        formattedData.nic,
                        artistId
                    ]
                );
                console.log('Update result:', updateResult);
            }

            // Verify the update
            const verifyResult = await executeQuery(
                'SELECT id, bio, nic, profile_complete FROM artists WHERE user_id = ?',
                [artistId]
            );
            console.log('Verification after update:', verifyResult.data[0]);

            res.json({
                success: true,
                message: 'Profile updated successfully'
            });
            
        } catch (error) {
            console.error('Update artist profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    },

    async completeProfile(req, res) {
        try {
            const userId = req.user.id;
            const { bio, nic, genres, experience_years, hourly_rate, location, website, social_links } = req.body;
            
            // Check if artist profile already exists
            const existingResult = await executeQuery(
                'SELECT id FROM artists WHERE user_id = ?',
                [userId]
            );
            
            if (existingResult.success && existingResult.data.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Artist profile already exists'
                });
            }
            
            // Validate data
            const validation = validateJsonData({ genres, social_links });
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid data format',
                    errors: validation.errors
                });
            }
            
            // Format data for database storage
            const formattedData = formatForDatabase({
                bio, nic, genres, experience_years, hourly_rate, location, website, social_links
            });
            
            // Create artist profile with automatic profile_complete calculation
            const result = await executeQuery(
                `INSERT INTO artists (user_id, bio, nic, genres, experience_years, hourly_rate, location, website, social_links, profile_complete) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 
                     CASE 
                         WHEN (? IS NOT NULL AND ? != '' AND ? IS NOT NULL AND ? != '') THEN 1
                         ELSE 0
                     END
                 )`,
                [
                    userId, 
                    formattedData.bio,
                    formattedData.nic, 
                    formattedData.genres, 
                    formattedData.experience_years, 
                    formattedData.hourly_rate, 
                    formattedData.location, 
                    formattedData.website, 
                    formattedData.social_links,
                    // Parameters for profile_complete calculation
                    formattedData.bio,
                    formattedData.bio,
                    formattedData.nic,
                    formattedData.nic
                ]
            );
            
            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to create artist profile'
                });
            }
            
            res.json({
                success: true,
                message: 'Artist profile created successfully'
            });
            
        } catch (error) {
            console.error('Complete artist profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    },

    // Skills Management
    async getSkills(req, res) {
        try {
            const artistId = req.user.id;
            
            // Get artist ID from user ID
            const artistResult = await executeQuery(
                'SELECT id FROM artists WHERE user_id = ?',
                [artistId]
            );
            
            if (!artistResult.success || artistResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Artist not found'
                });
            }
            
            const artistDbId = artistResult.data[0].id;
            
            const skillsResult = await executeQuery(
                'SELECT * FROM artist_skills WHERE artist_id = ? ORDER BY created_at DESC',
                [artistDbId]
            );
            
            res.json({
                success: true,
                data: skillsResult.success ? skillsResult.data : []
            });
            
        } catch (error) {
            console.error('Get skills error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    },

    async addSkill(req, res) {
        try {
            const artistId = req.user.id;
            const { skill_name, proficiency_level, description } = req.body;
            
            // Get artist ID from user ID
            const artistResult = await executeQuery(
                'SELECT id FROM artists WHERE user_id = ?',
                [artistId]
            );
            
            if (!artistResult.success || artistResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Artist not found'
                });
            }
            
            const artistDbId = artistResult.data[0].id;
            
            const result = await executeQuery(
                'INSERT INTO artist_skills (artist_id, skill_name, proficiency_level, description) VALUES (?, ?, ?, ?)',
                [artistDbId, skill_name, proficiency_level, description]
            );
            
            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to add skill'
                });
            }
            
            res.json({
                success: true,
                message: 'Skill added successfully'
            });
            
        } catch (error) {
            console.error('Add skill error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    },

    async removeSkill(req, res) {
        try {
            const artistId = req.user.id;
            const { skillId } = req.params;
            
            // Get artist ID from user ID
            const artistResult = await executeQuery(
                'SELECT id FROM artists WHERE user_id = ?',
                [artistId]
            );
            
            if (!artistResult.success || artistResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Artist not found'
                });
            }
            
            const artistDbId = artistResult.data[0].id;
            
            const result = await executeQuery(
                'DELETE FROM artist_skills WHERE id = ? AND artist_id = ?',
                [skillId, artistDbId]
            );
            
            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to remove skill'
                });
            }
            
            res.json({
                success: true,
                message: 'Skill removed successfully'
            });
            
        } catch (error) {
            console.error('Remove skill error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    },

    // Availability Management
    async getAvailability(req, res) {
        try {
            const artistId = req.user.id;
            
            // Get artist ID from user ID
            const artistResult = await executeQuery(
                'SELECT id FROM artists WHERE user_id = ?',
                [artistId]
            );
            
            if (!artistResult.success || artistResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Artist not found'
                });
            }
            
            const artistDbId = artistResult.data[0].id;
            
            const availabilityResult = await executeQuery(
                'SELECT * FROM artist_availability WHERE artist_id = ? ORDER BY date_from ASC',
                [artistDbId]
            );
            
            res.json({
                success: true,
                data: availabilityResult.success ? availabilityResult.data : []
            });
            
        } catch (error) {
            console.error('Get availability error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    },

    async setAvailability(req, res) {
        try {
            const artistId = req.user.id;
            const { date_from, date_to, time_from, time_to, is_available, notes } = req.body;
            
            // Get artist ID from user ID
            const artistResult = await executeQuery(
                'SELECT id FROM artists WHERE user_id = ?',
                [artistId]
            );
            
            if (!artistResult.success || artistResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Artist not found'
                });
            }
            
            const artistDbId = artistResult.data[0].id;
            
            const result = await executeQuery(
                'INSERT INTO artist_availability (artist_id, date_from, date_to, time_from, time_to, is_available, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [artistDbId, date_from, date_to, time_from, time_to, is_available, notes]
            );
            
            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to set availability'
                });
            }
            
            res.json({
                success: true,
                message: 'Availability set successfully'
            });
            
        } catch (error) {
            console.error('Set availability error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    },

    async updateAvailability(req, res) {
        try {
            const artistId = req.user.id;
            const { availabilityId } = req.params;
            const { date_from, date_to, time_from, time_to, is_available, notes } = req.body;
            
            // Get artist ID from user ID
            const artistResult = await executeQuery(
                'SELECT id FROM artists WHERE user_id = ?',
                [artistId]
            );
            
            if (!artistResult.success || artistResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Artist not found'
                });
            }
            
            const artistDbId = artistResult.data[0].id;
            
            const result = await executeQuery(
                'UPDATE artist_availability SET date_from = ?, date_to = ?, time_from = ?, time_to = ?, is_available = ?, notes = ?, updated_at = NOW() WHERE id = ? AND artist_id = ?',
                [date_from, date_to, time_from, time_to, is_available, notes, availabilityId, artistDbId]
            );
            
            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update availability'
                });
            }
            
            res.json({
                success: true,
                message: 'Availability updated successfully'
            });
            
        } catch (error) {
            console.error('Update availability error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    },

    async removeAvailability(req, res) {
        try {
            const artistId = req.user.id;
            const { availabilityId } = req.params;
            
            // Get artist ID from user ID
            const artistResult = await executeQuery(
                'SELECT id FROM artists WHERE user_id = ?',
                [artistId]
            );
            
            if (!artistResult.success || artistResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Artist not found'
                });
            }
            
            const artistDbId = artistResult.data[0].id;
            
            const result = await executeQuery(
                'DELETE FROM artist_availability WHERE id = ? AND artist_id = ?',
                [availabilityId, artistDbId]
            );
            
            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to remove availability'
                });
            }
            
            res.json({
                success: true,
                message: 'Availability removed successfully'
            });
            
        } catch (error) {
            console.error('Remove availability error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    },

    // Portfolio Management
    async getPortfolio(req, res) {
        try {
            const artistId = req.user.id;
            
            // Get artist ID from user ID
            const artistResult = await executeQuery(
                'SELECT id FROM artists WHERE user_id = ?',
                [artistId]
            );
            
            if (!artistResult.success || artistResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Artist not found'
                });
            }
            
            const artistDbId = artistResult.data[0].id;
            
            const portfolioResult = await executeQuery(
                'SELECT * FROM artist_portfolio WHERE artist_id = ? ORDER BY created_at DESC',
                [artistDbId]
            );
            
            res.json({
                success: true,
                data: portfolioResult.success ? portfolioResult.data : []
            });
            
        } catch (error) {
            console.error('Get portfolio error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    },

    async addPortfolioItem(req, res) {
        try {
            const artistId = req.user.id;
            const { title, description, media_type, media_url, project_date } = req.body;
            
            // Get artist ID from user ID
            const artistResult = await executeQuery(
                'SELECT id FROM artists WHERE user_id = ?',
                [artistId]
            );
            
            if (!artistResult.success || artistResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Artist not found'
                });
            }
            
            const artistDbId = artistResult.data[0].id;
            
            const result = await executeQuery(
                'INSERT INTO artist_portfolio (artist_id, title, description, media_type, media_url, project_date) VALUES (?, ?, ?, ?, ?, ?)',
                [artistDbId, title, description, media_type, media_url, project_date]
            );
            
            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to add portfolio item'
                });
            }
            
            res.json({
                success: true,
                message: 'Portfolio item added successfully'
            });
            
        } catch (error) {
            console.error('Add portfolio item error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    },

    async updatePortfolioItem(req, res) {
        try {
            const artistId = req.user.id;
            const { itemId } = req.params;
            const { title, description, media_type, media_url, project_date } = req.body;
            
            // Get artist ID from user ID
            const artistResult = await executeQuery(
                'SELECT id FROM artists WHERE user_id = ?',
                [artistId]
            );
            
            if (!artistResult.success || artistResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Artist not found'
                });
            }
            
            const artistDbId = artistResult.data[0].id;
            
            const result = await executeQuery(
                'UPDATE artist_portfolio SET title = ?, description = ?, media_type = ?, media_url = ?, project_date = ?, updated_at = NOW() WHERE id = ? AND artist_id = ?',
                [title, description, media_type, media_url, project_date, itemId, artistDbId]
            );
            
            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update portfolio item'
                });
            }
            
            res.json({
                success: true,
                message: 'Portfolio item updated successfully'
            });
            
        } catch (error) {
            console.error('Update portfolio item error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    },

    async removePortfolioItem(req, res) {
        try {
            const artistId = req.user.id;
            const { itemId } = req.params;
            
            // Get artist ID from user ID
            const artistResult = await executeQuery(
                'SELECT id FROM artists WHERE user_id = ?',
                [artistId]
            );
            
            if (!artistResult.success || artistResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Artist not found'
                });
            }
            
            const artistDbId = artistResult.data[0].id;
            
            const result = await executeQuery(
                'DELETE FROM artist_portfolio WHERE id = ? AND artist_id = ?',
                [itemId, artistDbId]
            );
            
            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to remove portfolio item'
                });
            }
            
            res.json({
                success: true,
                message: 'Portfolio item removed successfully'
            });
            
        } catch (error) {
            console.error('Remove portfolio item error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    },

    // Package Management
    async getPackages(req, res) {
        try {
            const userId = req.user.id;
            
            // Get artist ID from user ID
            const artistResult = await executeQuery(
                'SELECT id FROM artists WHERE user_id = ?',
                [userId]
            );
            
            if (!artistResult.success || artistResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Artist not found'
                });
            }
            
            const artistDbId = artistResult.data[0].id;
            
            const packagesResult = await executeQuery(
                'SELECT * FROM packages WHERE artist_id = ? ORDER BY created_at DESC',
                [artistDbId]
            );
            
            res.json({
                success: true,
                data: packagesResult.success ? packagesResult.data : []
            });
            
        } catch (error) {
            console.error('Get packages error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    },

    async addPackage(req, res) {
        try {
            const userId = req.user.id;
            const { title, description, price, duration, category, includes } = req.body;
            
            // Validation
            if (!title || !price || !duration || !category) {
                return res.status(400).json({
                    success: false,
                    message: 'Title, price, duration, and category are required'
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
                    message: 'Artist not found'
                });
            }
            
            const artistDbId = artistResult.data[0].id;
            
            // Process includes array
            const includesJson = Array.isArray(includes) ? JSON.stringify(includes) : includes;
            
            const result = await executeQuery(
                `INSERT INTO packages (artist_id, title, description, price, duration, category, includes, is_active)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [artistDbId, title, description || '', parseFloat(price), duration, category, includesJson, true]
            );
            
            if (result.success) {
                res.status(201).json({
                    success: true,
                    message: 'Package created successfully',
                    data: { id: result.insertId }
                });
            } else {
                throw new Error('Failed to create package');
            }
            
        } catch (error) {
            console.error('Add package error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create package'
            });
        }
    },

    async updatePackage(req, res) {
        try {
            const userId = req.user.id;
            const { packageId } = req.params;
            const { title, description, price, duration, category, includes, is_active } = req.body;
            
            // Add debug logging
            console.log('Update package request:', {
                userId,
                packageId,
                body: req.body
            });
            
            // Get artist ID from user ID
            const artistResult = await executeQuery(
                'SELECT id FROM artists WHERE user_id = ?',
                [userId]
            );
            
            if (!artistResult.success || artistResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Artist not found'
                });
            }
            
            const artistDbId = artistResult.data[0].id;
            
            // Verify package belongs to artist
            const packageResult = await executeQuery(
                'SELECT * FROM packages WHERE id = ? AND artist_id = ?',
                [packageId, artistDbId]
            );
            
            if (!packageResult.success || packageResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Package not found'
                });
            }
            
            // Process includes array
            const includesJson = Array.isArray(includes) ? JSON.stringify(includes) : includes;
            
            // Use existing is_active value if not provided
            const activeStatus = is_active !== undefined ? is_active : packageResult.data[0].is_active;
            
            console.log('Update parameters:', {
                title,
                description: description || '',
                price: parseFloat(price),
                duration,
                category,
                includesJson,
                activeStatus,
                packageId,
                artistDbId
            });
            
            const result = await executeQuery(
                `UPDATE packages 
                 SET title = ?, description = ?, price = ?, duration = ?, category = ?, includes = ?, is_active = ?
                 WHERE id = ? AND artist_id = ?`,
                [title, description || '', parseFloat(price), duration, category, includesJson, activeStatus, packageId, artistDbId]
            );
            
            console.log('Update result:', result);
            
            if (result.success) {
                res.json({
                    success: true,
                    message: 'Package updated successfully'
                });
            } else {
                throw new Error('Failed to update package in database');
            }
            
        } catch (error) {
            console.error('Update package error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update package',
                error: error.message
            });
        }
    },

    async deletePackage(req, res) {
        try {
            const userId = req.user.id;
            const { packageId } = req.params;
            
            // Get artist ID from user ID
            const artistResult = await executeQuery(
                'SELECT id FROM artists WHERE user_id = ?',
                [userId]
            );
            
            if (!artistResult.success || artistResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Artist not found'
                });
            }
            
            const artistDbId = artistResult.data[0].id;
            
            // Verify package belongs to artist
            const packageResult = await executeQuery(
                'SELECT * FROM packages WHERE id = ? AND artist_id = ?',
                [packageId, artistDbId]
            );
            
            if (!packageResult.success || packageResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Package not found'
                });
            }
            
            const result = await executeQuery(
                'DELETE FROM packages WHERE id = ? AND artist_id = ?',
                [packageId, artistDbId]
            );
            
            if (result.success) {
                res.json({
                    success: true,
                    message: 'Package deleted successfully'
                });
            } else {
                throw new Error('Failed to delete package');
            }
            
        } catch (error) {
            console.error('Delete package error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete package'
            });
        }
    },

    async togglePackageStatus(req, res) {
        try {
            const userId = req.user.id;
            const { packageId } = req.params;
            
            // Get artist ID from user ID
            const artistResult = await executeQuery(
                'SELECT id FROM artists WHERE user_id = ?',
                [userId]
            );
            
            if (!artistResult.success || artistResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Artist not found'
                });
            }
            
            const artistDbId = artistResult.data[0].id;
            
            // Get current package status
            const packageResult = await executeQuery(
                'SELECT is_active FROM packages WHERE id = ? AND artist_id = ?',
                [packageId, artistDbId]
            );
            
            if (!packageResult.success || packageResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Package not found'
                });
            }
            
            const currentStatus = packageResult.data[0].is_active;
            const newStatus = !currentStatus;
            
            const result = await executeQuery(
                'UPDATE packages SET is_active = ? WHERE id = ? AND artist_id = ?',
                [newStatus, packageId, artistDbId]
            );
            
            if (result.success) {
                res.json({
                    success: true,
                    message: `Package ${newStatus ? 'activated' : 'deactivated'} successfully`,
                    data: { is_active: newStatus }
                });
            } else {
                throw new Error('Failed to toggle package status');
            }
            
        } catch (error) {
            console.error('Toggle package status error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to toggle package status'
            });
        }
    },

    // Booking Management
    async getBookings(req, res) {
        try {
            const userId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const status = req.query.status;
            const search = req.query.search;
            const sortBy = req.query.sortBy || 'created_at';
            const sortOrder = req.query.sortOrder || 'DESC';
            const offset = (page - 1) * limit;
            
            // Get artist ID from user ID
            const artistResult = await executeQuery(
                'SELECT id FROM artists WHERE user_id = ?',
                [userId]
            );
            
            if (!artistResult.success || artistResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Artist not found'
                });
            }
            
            const artistDbId = artistResult.data[0].id;
            
            let whereClause = 'WHERE b.artist_id = ?';
            let queryParams = [artistDbId];
            
            // Build filters
            if (status && status !== 'all') {
                whereClause += ' AND b.status = ?';
                queryParams.push(status);
            }
            
            if (search) {
                whereClause += ' AND (b.event_name LIKE ? OR o.name LIKE ?)';
                queryParams.push(`%${search}%`, `%${search}%`);
            }
            
            // Get total count
            const countQuery = `
                SELECT COUNT(*) as total 
                FROM bookings b
                JOIN organizers org ON b.organizer_id = org.id
                JOIN users o ON org.user_id = o.id
                ${whereClause}
            `;
            const countResult = await executeQuery(countQuery, queryParams);
            const total = countResult.success ? (countResult.data[0]?.total || 0) : 0;
            
            // Get bookings with pagination
            const query = `
                SELECT 
                    b.*,
                    o.name as organizer_name,
                    o.email as organizer_email,
                    o.phone as organizer_phone,
                    org.organization_name,
                    org.location as organizer_location
                FROM bookings b
                JOIN organizers org ON b.organizer_id = org.id
                JOIN users o ON org.user_id = o.id
                ${whereClause}
                ORDER BY b.${sortBy} ${sortOrder}
                LIMIT ${limit} OFFSET ${offset}
            `;
            
            const bookingsResult = await executeQuery(query, queryParams);
            const bookings = bookingsResult.success ? bookingsResult.data : [];
            
            res.json({
                success: true,
                data: bookings,
                pagination: {
                    current_page: page,
                    per_page: limit,
                    total: total,
                    total_pages: Math.ceil(total / limit)
                }
            });
            
        } catch (error) {
            console.error('Get artist bookings error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch bookings',
                error: error.message
            });
        }
    },

    async getBookingDetails(req, res) {
        try {
            const userId = req.user.id;
            const { bookingId } = req.params;
            
            // Get artist ID from user ID
            const artistResult = await executeQuery(
                'SELECT id FROM artists WHERE user_id = ?',
                [userId]
            );
            
            if (!artistResult.success || artistResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Artist not found'
                });
            }
            
            const artistDbId = artistResult.data[0].id;
            
            const query = `
                SELECT 
                    b.*,
                    o.name as organizer_name,
                    o.email as organizer_email,
                    o.phone as organizer_phone,
                    org.organization_name,
                    org.location as organizer_location
                FROM bookings b
                JOIN organizers org ON b.organizer_id = org.id
                JOIN users o ON org.user_id = o.id
                WHERE b.id = ? AND b.artist_id = ?
            `;
            
            const bookingsResult = await executeQuery(query, [bookingId, artistDbId]);
            
            if (!bookingsResult.success || bookingsResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Booking not found'
                });
            }
            
            const booking = bookingsResult.data[0];
            
            // Get booking messages (if they exist)
            let messages = [];
            try {
                const messagesQuery = `
                    SELECT 
                        m.*,
                        u.name as sender_name
                    FROM booking_messages m
                    JOIN users u ON m.sender_id = u.id
                    WHERE m.booking_id = ?
                    ORDER BY m.created_at ASC
                `;
                const messageResults = await executeQuery(messagesQuery, [bookingId]);
                messages = messageResults.success ? messageResults.data : [];
            } catch (error) {
                console.log('Messages table might not exist:', error.message);
            }
            
            res.json({
                success: true,
                data: {
                    booking: booking,
                    messages: messages
                }
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

    async respondToBooking(req, res) {
        try {
            const userId = req.user.id;
            const { bookingId } = req.params;
            const { action, message } = req.body; // action: 'accept' or 'decline'
            
            if (!['accept', 'decline'].includes(action)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid action. Must be "accept" or "decline"'
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
                    message: 'Artist not found'
                });
            }
            
            const artistDbId = artistResult.data[0].id;
            
            // Verify booking belongs to artist and is pending
            const bookingResult = await executeQuery(
                'SELECT * FROM bookings WHERE id = ? AND artist_id = ? AND status = "pending"',
                [bookingId, artistDbId]
            );
            
            if (!bookingResult.success || bookingResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Booking not found or not in pending status'
                });
            }
            
            // Update booking status
            const newStatus = action === 'accept' ? 'confirmed' : 'cancelled';
            const updateQuery = 'UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
            
            const result = await executeQuery(updateQuery, [newStatus, bookingId]);
            
            if (result.success) {
                // Add system message if provided
                if (message) {
                    try {
                        await executeQuery(
                            'INSERT INTO booking_messages (booking_id, sender_id, sender_type, message, message_type) VALUES (?, ?, ?, ?, ?)',
                            [bookingId, userId, 'artist', message, 'system']
                        );
                    } catch (error) {
                        console.log('Failed to save message:', error.message);
                    }
                }
                
                res.json({
                    success: true,
                    message: `Booking ${action}ed successfully`,
                    data: { status: newStatus }
                });
            } else {
                throw new Error('Failed to update booking status');
            }
            
        } catch (error) {
            console.error('Respond to booking error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to respond to booking',
                error: error.message
            });
        }
    },

    async updateBookingStatus(req, res) {
        try {
            const userId = req.user.id;
            const { bookingId } = req.params;
            const { status, notes } = req.body;
            
            const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'in_progress'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
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
                    message: 'Artist not found'
                });
            }
            
            const artistDbId = artistResult.data[0].id;
            
            // Verify booking belongs to artist
            const bookingResult = await executeQuery(
                'SELECT * FROM bookings WHERE id = ? AND artist_id = ?',
                [bookingId, artistDbId]
            );
            
            if (bookingResult.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Booking not found'
                });
            }
            
            const result = await executeQuery(
                'UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND artist_id = ?',
                [status, bookingId, artistDbId]
            );
            
            if (result.success) {
                // Add notes as a message if provided
                if (notes) {
                    try {
                        await executeQuery(
                            'INSERT INTO booking_messages (booking_id, sender_id, sender_type, message, message_type) VALUES (?, ?, ?, ?, ?)',
                            [bookingId, userId, 'artist', `Status updated to "${status}". Notes: ${notes}`, 'system']
                        );
                    } catch (error) {
                        console.log('Failed to save notes:', error.message);
                    }
                }
                
                res.json({
                    success: true,
                    message: 'Booking status updated successfully'
                });
            } else {
                throw new Error('Failed to update booking status');
            }
            
        } catch (error) {
            console.error('Update booking status error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update booking status',
                error: error.message
            });
        }
    },

    // Public Routes for Organizers
    async browseArtists(req, res) {
        try {
            const { genre, location, min_rate, max_rate, experience_years, search } = req.query;
            
            // Current strict filter - only shows verified artists with complete profiles
            let query = `
                SELECT 
                    a.*,
                    u.name,
                    u.email,
                    u.phone,
                    COALESCE(AVG(r.overall_rating), 0) as average_rating,
                    COUNT(r.id) as total_ratings
                FROM artists a 
                JOIN users u ON a.user_id = u.id 
                LEFT JOIN reviews r ON u.id = r.reviewee_id 
                    AND r.is_approved = 1 
                    AND r.is_public = 1
                WHERE a.profile_complete = 1 
                AND a.is_verified = 1
            `;
            
            const params = [];
            
            if (genre) {
                query += ' AND JSON_SEARCH(a.genres, "one", ?) IS NOT NULL';
                params.push(genre);
            }
            
            if (location) {
                query += ' AND a.location LIKE ?';
                params.push(`%${location}%`);
            }
            
            if (min_rate) {
                query += ' AND a.hourly_rate >= ?';
                params.push(min_rate);
            }
            
            if (max_rate) {
                query += ' AND a.hourly_rate <= ?';
                params.push(max_rate);
            }
            
            if (experience_years) {
                query += ' AND a.experience_years >= ?';
                params.push(experience_years);
            }
            
            if (search) {
                query += ' AND (u.name LIKE ? OR a.bio LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
            }
            
            query += ' GROUP BY a.id, u.id';
            query += ' ORDER BY average_rating DESC, a.created_at DESC LIMIT 50';
            
            const result = await executeQuery(query, params);
            
            res.json({
                success: true,
                data: result.success ? result.data : []
            });
            
        } catch (error) {
            console.error('Browse artists error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    },

    async getArtistDetails(req, res) {
        try {
            const { artistId } = req.params;
            
            // Get artist details (only verified artists)
            const artistResult = await executeQuery(
                `SELECT a.*, u.name, u.email, u.phone 
                 FROM artists a 
                 JOIN users u ON a.user_id = u.id 
                 WHERE a.id = ? AND a.profile_complete = 1 AND a.is_verified = 1`,
                [artistId]
            );
            
            if (!artistResult.success || artistResult.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Verified artist not found'
                });
            }
            
            const artist = artistResult.data[0];
            
            // Get skills
            const skillsResult = await executeQuery(
                'SELECT * FROM artist_skills WHERE artist_id = ?',
                [artistId]
            );
            
            // Get portfolio
            const portfolioResult = await executeQuery(
                'SELECT * FROM artist_portfolio WHERE artist_id = ? ORDER BY created_at DESC',
                [artistId]
            );
            
            // Get packages
            const packagesResult = await executeQuery(
                'SELECT * FROM packages WHERE artist_id = ? AND is_active = 1 ORDER BY price ASC',
                [artistId]
            );
            
            // Get availability
            const availabilityResult = await executeQuery(
                'SELECT * FROM artist_availability WHERE artist_id = ? ORDER BY date_from, time_from',
                [artistId]
            );
            
            artist.skills = skillsResult.success ? skillsResult.data : [];
            artist.portfolio = portfolioResult.success ? portfolioResult.data : [];
            artist.packages = packagesResult.success ? packagesResult.data : [];
            artist.availability = availabilityResult.success ? availabilityResult.data : [];
            
            res.json({
                success: true,
                data: artist
            });
            
        } catch (error) {
            console.error('Get artist details error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    },

    getArtistRatings: async (req, res) => {
        try {
            const artistId = req.params.artistId || req.user.id;
            
            // Get average rating and count
            const ratingStats = await executeQuery(`
                SELECT 
                    COUNT(*) as total_ratings,
                    AVG(rating) as average_rating,
                    COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
                    COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
                    COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
                    COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
                    COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
                FROM artist_ratings 
                WHERE artist_id = ?
            `, [artistId]);

            // Get recent reviews with organizer names
            const recentReviews = await executeQuery(`
                SELECT 
                    ar.*,
                    u.name as organizer_name,
                    e.name as event_name,
                    b.event_date
                FROM artist_ratings ar
                JOIN users u ON ar.organizer_id = u.id
                JOIN bookings b ON ar.booking_id = b.id
                JOIN events e ON b.event_id = e.id
                WHERE ar.artist_id = ?
                ORDER BY ar.created_at DESC
                LIMIT 10
            `, [artistId]);

            res.json({
                success: true,
                data: {
                    stats: ratingStats.data[0],
                    recentReviews: recentReviews.data
                }
            });
        } catch (error) {
            console.error('Error fetching artist ratings:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch ratings' });
        }
    },

    getArtistRatingBrief: async (req, res) => {
        try {
            const artistId = req.params.artistId;
            
            // Get average rating and total count only
            const ratingStats = await executeQuery(`
                SELECT 
                    COUNT(*) as total_ratings,
                    AVG(rating) as average_rating
                FROM artist_ratings 
                WHERE artist_id = ?
            `, [artistId]);

            res.json({
                success: true,
                data: ratingStats.data[0]
            });
        } catch (error) {
            console.error('Error fetching artist rating brief:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch rating' });
        }
    },

    handleReviewVote: async (req, res) => {
        try {
            const { reviewId } = req.params;
            const { vote_type } = req.body;
            const userId = req.user.id;

            // Validate vote type
            if (!['helpful', 'unhelpful'].includes(vote_type)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid vote type'
                });
            }

            // Check if user has already voted
            const existingVote = await executeQuery(
                'SELECT id, vote_type FROM review_votes WHERE review_id = ? AND user_id = ?',
                [reviewId, userId]
            );

            if (existingVote.data.length > 0) {
                // Update existing vote if different
                if (existingVote.data[0].vote_type !== vote_type) {
                    await executeQuery(
                        'UPDATE review_votes SET vote_type = ? WHERE id = ?',
                        [vote_type, existingVote.data[0].id]
                    );
                }
            } else {
                // Create new vote
                await executeQuery(
                    'INSERT INTO review_votes (review_id, user_id, vote_type) VALUES (?, ?, ?)',
                    [reviewId, userId, vote_type]
                );
            }

            // Update vote counts
            const voteCounts = await executeQuery(`
                SELECT 
                    COUNT(CASE WHEN vote_type = 'helpful' THEN 1 END) as helpful_votes,
                    COUNT(CASE WHEN vote_type = 'unhelpful' THEN 1 END) as unhelpful_votes
                FROM review_votes 
                WHERE review_id = ?
            `, [reviewId]);

            // Update review with new vote counts
            await executeQuery(
                'UPDATE reviews SET helpful_votes = ?, unhelpful_votes = ? WHERE id = ?',
                [
                    voteCounts.data[0].helpful_votes,
                    voteCounts.data[0].unhelpful_votes,
                    reviewId
                ]
            );

            res.json({
                success: true,
                message: 'Vote recorded successfully',
                data: {
                    helpful_votes: voteCounts.data[0].helpful_votes,
                    unhelpful_votes: voteCounts.data[0].unhelpful_votes
                }
            });
        } catch (error) {
            console.error('Error handling review vote:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to record vote'
            });
        }
    }
};

module.exports = artistController; 