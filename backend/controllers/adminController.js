const { pool } = require('../config/database');
const User = require('../models/User');

const adminController = {
  // Get Dashboard Statistics
  getDashboardStats: async (req, res) => {
    try {
      // Get total users count
      const [totalUsersResult] = await pool.execute(
        'SELECT COUNT(*) as total FROM users'
      );
      const totalUsers = totalUsersResult[0].total;

      // Get active artists count
      const [activeArtistsResult] = await pool.execute(
        'SELECT COUNT(*) as total FROM users WHERE role = "artist"'
      );
      const activeArtists = activeArtistsResult[0].total;

      // Get active bookings count (assuming we have a bookings table)
      let activeBookings = 0;
      try {
        const [activeBookingsResult] = await pool.execute(
          'SELECT COUNT(*) as total FROM bookings WHERE status IN ("pending", "confirmed")'
        );
        activeBookings = activeBookingsResult[0].total;
      } catch (error) {
        // Table might not exist yet, default to 0
        console.log('Bookings table not found, defaulting to 0');
      }

      // Get monthly revenue (assuming we have a payments/bookings table with amounts)
      let monthlyRevenue = 0;
      try {
        const [revenueResult] = await pool.execute(`
          SELECT COALESCE(SUM(total_amount), 0) as total 
          FROM bookings 
          WHERE status = "confirmed" 
          AND MONTH(created_at) = MONTH(CURRENT_DATE()) 
          AND YEAR(created_at) = YEAR(CURRENT_DATE())
        `);
        monthlyRevenue = revenueResult[0].total;
      } catch (error) {
        // Table might not exist yet, default to 0
        console.log('Revenue calculation failed, defaulting to 0');
      }

      // Get user registration trend (last 7 days)
      const [registrationTrendResult] = await pool.execute(`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM users 
        WHERE created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `);

      // Get user role distribution
      const [roleDistributionResult] = await pool.execute(`
        SELECT role, COUNT(*) as count
        FROM users 
        GROUP BY role
      `);

      res.json({
        success: true,
        data: {
          totalUsers,
          activeArtists,
          activeBookings,
          monthlyRevenue: parseFloat(monthlyRevenue || 0),
          registrationTrend: registrationTrendResult,
          roleDistribution: roleDistributionResult,
          lastUpdated: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard statistics',
        error: error.message
      });
    }
  },

  // Get All Users with pagination and filters
  getAllUsers: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const role = req.query.role;
      const search = req.query.search;
      const sortBy = req.query.sortBy || 'created_at';
      const sortOrder = req.query.sortOrder || 'DESC';

      const filters = {};
      if (role && role !== 'all') filters.role = role;
      if (search) filters.search = search;
      filters.sortBy = sortBy;
      filters.sortOrder = sortOrder;

      const result = await User.getAll(page, limit, filters);

      res.json({
        success: true,
        data: result.users,
        pagination: result.pagination
      });

    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
        error: error.message
      });
    }
  },

  // Get User Details
  getUserDetails: async (req, res) => {
    try {
      const { userId } = req.params;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get additional user statistics
      let userStats = {};
      try {
        if (user.role === 'artist') {
          const [artistStatsResult] = await pool.execute(`
            SELECT 
              (SELECT COUNT(*) FROM bookings WHERE artist_id = ?) as total_bookings,
              (SELECT COUNT(*) FROM bookings WHERE artist_id = ? AND status = 'completed') as completed_bookings,
              (SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE artist_id = ? AND status = 'completed') as total_earnings
          `, [userId, userId, userId]);
          userStats = artistStatsResult[0] || {};
        } else if (user.role === 'organizer') {
          const [organizerStatsResult] = await pool.execute(`
            SELECT 
              (SELECT COUNT(*) FROM events WHERE organizer_id = ?) as total_events,
              (SELECT COUNT(*) FROM bookings b JOIN events e ON b.event_id = e.id WHERE e.organizer_id = ?) as total_bookings,
              (SELECT COALESCE(SUM(b.total_amount), 0) FROM bookings b JOIN events e ON b.event_id = e.id WHERE e.organizer_id = ? AND b.status = 'completed') as total_spent
          `, [userId, userId, userId]);
          userStats = organizerStatsResult[0] || {};
        }
      } catch (error) {
        console.log('User stats calculation failed:', error.message);
      }

      res.json({
        success: true,
        data: {
          user,
          stats: userStats
        }
      });

    } catch (error) {
      console.error('Get user details error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user details',
        error: error.message
      });
    }
  },

  // Update User
  updateUser: async (req, res) => {
    try {
      const { userId } = req.params;
      const updateData = req.body;

      // Remove sensitive fields that shouldn't be updated via admin
      delete updateData.password;
      delete updateData.id;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const updatedUser = await User.update(userId, updateData);

      res.json({
        success: true,
        message: 'User updated successfully',
        data: updatedUser
      });

    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user',
        error: error.message
      });
    }
  },

  // Delete User
  deleteUser: async (req, res) => {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Prevent admin from deleting themselves
      if (userId == req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete your own account'
        });
      }

      await User.delete(userId);

      res.json({
        success: true,
        message: 'User deleted successfully'
      });

    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user',
        error: error.message
      });
    }
  },

  // Update User Role - DISABLED for security
  updateUserRole: async (req, res) => {
    try {
      // Role changes are disabled for security reasons
      return res.status(403).json({
        success: false,
        message: 'Role changes are disabled for security reasons. User roles are fixed after registration.'
      });

    } catch (error) {
      console.error('Update user role error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user role',
        error: error.message
      });
    }
  },

  // Update User Status
  updateUserStatus: async (req, res) => {
    try {
      const { userId } = req.params;
      const { status } = req.body;

      const validStatuses = ['active', 'inactive', 'suspended'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Admin users cannot be suspended or made inactive
      if (user.role === 'admin' && status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Admin users must remain active'
        });
      }

      // Prevent admin from changing their own status
      if (userId == req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Cannot change your own status'
        });
      }

      // Update status in users table
      await pool.execute(
        'UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, userId]
      );

      // If user is suspended, we might want to cancel their active bookings
      if (status === 'suspended') {
        try {
          // Cancel pending bookings for suspended artists
          if (user.role === 'artist') {
            await pool.execute(`
              UPDATE bookings b 
              JOIN artists a ON b.artist_id = a.id 
              SET b.status = 'cancelled', b.updated_at = CURRENT_TIMESTAMP
              WHERE a.user_id = ? AND b.status = 'pending'
            `, [userId]);
          }
          // Cancel pending bookings for suspended organizers
          else if (user.role === 'organizer') {
            await pool.execute(`
              UPDATE bookings b 
              JOIN organizers o ON b.organizer_id = o.id 
              SET b.status = 'cancelled', b.updated_at = CURRENT_TIMESTAMP
              WHERE o.user_id = ? AND b.status = 'pending'
            `, [userId]);
          }
        } catch (bookingError) {
          console.log('Note: Could not cancel bookings (bookings table may not exist):', bookingError.message);
        }
      }

      res.json({
        success: true,
        message: `User status updated to ${status} successfully`
      });

    } catch (error) {
      console.error('Update user status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user status',
        error: error.message
      });
    }
  },

  // Get All Bookings
  getAllBookings: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const status = req.query.status;
      const search = req.query.search;
      const sortBy = req.query.sortBy || 'created_at';
      const sortOrder = req.query.sortOrder || 'DESC';
      const offset = (page - 1) * limit;

      let whereClause = '';
      let queryParams = [];

      // Build filters
      if (status && status !== 'all') {
        whereClause += ' WHERE b.status = ?';
        queryParams.push(status);
      }

      if (search) {
        const searchCondition = whereClause ? ' AND' : ' WHERE';
        whereClause += `${searchCondition} (b.event_name LIKE ? OR a.name LIKE ? OR o.name LIKE ?)`;
        queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      // Get total count - Phase 1 schema compatibility
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM bookings b
        JOIN artists ar ON b.artist_id = ar.id
        JOIN organizers org ON b.organizer_id = org.id
        JOIN users a ON ar.user_id = a.id
        JOIN users o ON org.user_id = o.id
        ${whereClause}
      `;
      const [countResult] = await pool.execute(countQuery, queryParams);
      const total = countResult[0].total;

      // Get bookings with pagination - Phase 1 schema compatibility
      // Use string interpolation for LIMIT due to MySQL 8.0.39 prepared statement limitation
      const query = `
        SELECT 
          b.*,
          b.event_name as event_title,
          b.event_date as performance_date,
          b.duration as performance_duration,
          b.venue_address as venue_name,
          'General Event' as event_type,
          a.name as artist_name,
          a.email as artist_email,
          o.name as organizer_name,
          o.email as organizer_email
        FROM bookings b
        JOIN artists ar ON b.artist_id = ar.id
        JOIN organizers org ON b.organizer_id = org.id
        JOIN users a ON ar.user_id = a.id
        JOIN users o ON org.user_id = o.id
        ${whereClause}
        ORDER BY b.${sortBy} ${sortOrder}
        LIMIT ${limit} OFFSET ${offset}
      `;

      const [bookings] = await pool.execute(query, queryParams);

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
      console.error('Get all bookings error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch bookings',
        error: error.message
      });
    }
  },

  getBookingDetails: async (req, res) => {
    try {
      const { bookingId } = req.params;

      const query = `
        SELECT 
          b.*,
          b.event_name as event_title,
          b.event_description as event_description,
          b.event_date as performance_date,
          b.event_time as start_time,
          b.duration as performance_duration,
          b.venue_address as location,
          b.venue_address,
          b.total_amount as budget_min,
          b.total_amount as budget_max,
          b.platform_fee,
          b.net_amount,
          b.created_at,
          b.updated_at,
          'General Event' as event_type,
          a.name as artist_name,
          a.email as artist_email,
          a.phone as artist_phone,
          o.name as organizer_name,
          o.email as organizer_email,
          o.phone as organizer_phone,
          p.title as package_title,
          p.description as package_description
        FROM bookings b
        JOIN artists ar ON b.artist_id = ar.id
        JOIN organizers org ON b.organizer_id = org.id
        JOIN users a ON ar.user_id = a.id
        JOIN users o ON org.user_id = o.id
        LEFT JOIN packages p ON b.package_id = p.id
        WHERE b.id = ?
      `;

      const [bookings] = await pool.execute(query, [bookingId]);

      if (bookings.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      // Get booking messages (if table exists)
      let messages = [];
      try {
        const messagesQuery = `
          SELECT 
            m.*,
            u.name as sender_name
          FROM messages m
          JOIN users u ON m.sender_id = u.id
          WHERE m.booking_id = ?
          ORDER BY m.created_at ASC
        `;
        const [messageResults] = await pool.execute(messagesQuery, [bookingId]);
        messages = messageResults || [];
      } catch (error) {
        console.log('Messages table might not exist or have different structure:', error.message);
        messages = [];
      }

      const bookingData = bookings[0];
      
      // Ensure all expected fields have values
      if (!bookingData.platform_fee) bookingData.platform_fee = 0;
      if (!bookingData.net_amount) bookingData.net_amount = bookingData.total_amount;
      if (!bookingData.location) bookingData.location = bookingData.venue_address || 'Not specified';

      res.json({
        success: true,
        data: {
          booking: bookingData,
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

  updateBookingStatus: async (req, res) => {
    try {
      const { bookingId } = req.params;
      const { status, notes } = req.body;

      const validStatuses = ['pending', 'confirmed', 'rejected', 'cancelled', 'in_progress', 'completed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
        });
      }

      // Check if booking exists
      const [existingBooking] = await pool.execute(
        'SELECT * FROM bookings WHERE id = ?',
        [bookingId]
      );

      if (existingBooking.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      // Update booking status
      let updateQuery = 'UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP';
      let updateParams = [status];

      // Add confirmed_at timestamp if confirming
      if (status === 'confirmed') {
        updateQuery += ', confirmed_at = CURRENT_TIMESTAMP';
      }

      // Add completed_at timestamp if completing
      if (status === 'completed') {
        updateQuery += ', completed_at = CURRENT_TIMESTAMP';
      }

      // Add admin notes if provided
      if (notes) {
        updateQuery += ', organizer_notes = ?';
        updateParams.push(notes);
      }

      updateQuery += ' WHERE id = ?';
      updateParams.push(bookingId);

      await pool.execute(updateQuery, updateParams);

      // Add system message for status change
      if (notes) {
        await pool.execute(
          `INSERT INTO booking_messages (booking_id, sender_id, sender_type, message, message_type)
           VALUES (?, ?, 'organizer', ?, 'system')`,
          [bookingId, req.user.id, `Admin updated booking status to "${status}". Notes: ${notes}`]
        );
      } else {
        await pool.execute(
          `INSERT INTO booking_messages (booking_id, sender_id, sender_type, message, message_type)
           VALUES (?, ?, 'organizer', ?, 'system')`,
          [bookingId, req.user.id, `Admin updated booking status to "${status}"`]
        );
      }

      res.json({
        success: true,
        message: 'Booking status updated successfully'
      });

    } catch (error) {
      console.error('Update booking status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update booking status',
        error: error.message
      });
    }
  },

  getAnalyticsOverview: async (req, res) => {
    try {
      // Get date range for analytics (default to last 30 days)
      const startDate = req.query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate || new Date();

      // User growth analytics
      const [userGrowthResult] = await pool.execute(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as new_users,
          SUM(CASE WHEN role = 'artist' THEN 1 ELSE 0 END) as new_artists,
          SUM(CASE WHEN role = 'organizer' THEN 1 ELSE 0 END) as new_organizers
        FROM users 
        WHERE created_at BETWEEN ? AND ?
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `, [startDate, endDate]);

      // Booking analytics
      let bookingAnalytics = {};
      try {
        const [bookingStatsResult] = await pool.execute(`
          SELECT 
            COUNT(*) as total_bookings,
            SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_bookings,
            SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings,
            AVG(total_amount) as avg_booking_value
          FROM bookings
          WHERE created_at BETWEEN ? AND ?
        `, [startDate, endDate]);

        bookingAnalytics = bookingStatsResult[0] || {};
      } catch (error) {
        console.log('Booking analytics failed:', error.message);
      }

      // Revenue analytics
      let revenueAnalytics = {};
      try {
        const [revenueResult] = await pool.execute(`
          SELECT 
            SUM(total_amount) as total_revenue,
            COUNT(DISTINCT artist_id) as active_artists,
            COUNT(DISTINCT organizer_id) as active_organizers
          FROM bookings
          WHERE status = 'completed' AND created_at BETWEEN ? AND ?
        `, [startDate, endDate]);

        revenueAnalytics = revenueResult[0] || {};
      } catch (error) {
        console.log('Revenue analytics failed:', error.message);
      }

      // Popular event types
      let eventTypeAnalytics = [];
      try {
        const [eventTypesResult] = await pool.execute(`
          SELECT 
            e.event_type,
            COUNT(*) as event_count,
            COUNT(b.id) as booking_count
          FROM events e
          -- No events table in Phase 1
          WHERE e.created_at BETWEEN ? AND ?
          GROUP BY e.event_type
          ORDER BY event_count DESC
        `, [startDate, endDate]);

        eventTypeAnalytics = eventTypesResult;
      } catch (error) {
        console.log('Event type analytics failed:', error.message);
      }

      // Platform performance metrics
      const [performanceResult] = await pool.execute(`
        SELECT 
          (SELECT COUNT(*) FROM users WHERE role = 'artist') as total_artists,
          (SELECT COUNT(*) FROM users WHERE role = 'organizer') as total_organizers,
          (SELECT COUNT(*) FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as weekly_signups,
          (SELECT COUNT(*) FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as monthly_signups
      `);

      res.json({
        success: true,
        data: {
          userGrowth: userGrowthResult,
          bookingAnalytics: bookingAnalytics,
          revenueAnalytics: revenueAnalytics,
          eventTypeAnalytics: eventTypeAnalytics,
          platformMetrics: performanceResult[0] || {},
          dateRange: { startDate, endDate }
        }
      });

    } catch (error) {
      console.error('Analytics overview error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics overview',
        error: error.message
      });
    }
  },

  getRevenueAnalytics: async (req, res) => {
    try {
      const startDate = req.query.startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate || new Date();

      // Monthly revenue breakdown
      let monthlyRevenue = [];
      try {
        const [monthlyResult] = await pool.execute(`
          SELECT 
            YEAR(completed_at) as year,
            MONTH(completed_at) as month,
            SUM(total_amount) as revenue,
            COUNT(*) as completed_bookings,
            AVG(total_amount) as avg_booking_value
          FROM bookings
          WHERE status = 'completed' AND created_at BETWEEN ? AND ?
          GROUP BY YEAR(completed_at), MONTH(completed_at)
          ORDER BY year ASC, month ASC
        `, [startDate, endDate]);

        monthlyRevenue = monthlyResult;
      } catch (error) {
        console.log('Monthly revenue failed:', error.message);
      }

      // Top earning artists
      let topArtists = [];
      try {
        const [topArtistsResult] = await pool.execute(`
          SELECT 
            u.name as artist_name,
            u.email as artist_email,
            COUNT(b.id) as total_bookings,
            SUM(b.total_amount) as total_earnings
          FROM users u
          JOIN artists ar ON u.id = ar.user_id JOIN bookings b ON ar.id = b.artist_id WHERE u.role = 'artist' AND b.status = 'completed' AND b.created_at BETWEEN ? AND ?
          GROUP BY u.id, u.name, u.email
          ORDER BY total_earnings DESC
          LIMIT 10
        `, [startDate, endDate]);

        topArtists = topArtistsResult;
      } catch (error) {
        console.log('Top artists failed:', error.message);
      }

      // Top spending organizers
      let topOrganizers = [];
      try {
        const [topOrganizersResult] = await pool.execute(`
          SELECT 
            u.name as organizer_name,
            u.email as organizer_email,
            COUNT(b.id) as total_bookings,
            SUM(b.total_amount) as total_spent
          FROM users u
          JOIN organizers org ON u.id = org.user_id JOIN bookings b ON org.id = b.organizer_id WHERE u.role = 'organizer' AND b.status = 'completed' AND b.created_at BETWEEN ? AND ?
          GROUP BY u.id, u.name, u.email
          ORDER BY total_spent DESC
          LIMIT 10
        `, [startDate, endDate]);

        topOrganizers = topOrganizersResult;
      } catch (error) {
        console.log('Top organizers failed:', error.message);
      }

      res.json({
        success: true,
        data: {
          monthlyRevenue,
          topArtists,
          topOrganizers,
          dateRange: { startDate, endDate }
        }
      });

    } catch (error) {
      console.error('Revenue analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch revenue analytics',
        error: error.message
      });
    }
  },

  getUserAnalytics: async (req, res) => {
    try {
      // User registration trends
      const [registrationTrendResult] = await pool.execute(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as total_registrations,
          SUM(CASE WHEN role = 'artist' THEN 1 ELSE 0 END) as artist_registrations,
          SUM(CASE WHEN role = 'organizer' THEN 1 ELSE 0 END) as organizer_registrations
        FROM users 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `);

      // User activity metrics
      let activityMetrics = {};
      try {
        const [activityResult] = await pool.execute(`
          SELECT 
            (SELECT COUNT(DISTINCT artist_id) FROM bookings WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as active_artists_month,
            (SELECT COUNT(DISTINCT organizer_id) FROM bookings WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as active_organizers_month,
            (SELECT COUNT(DISTINCT artist_id) FROM bookings WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as active_artists_week,
            (SELECT COUNT(DISTINCT organizer_id) FROM bookings WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as active_organizers_week
        `);

        activityMetrics = activityResult[0] || {};
      } catch (error) {
        console.log('Activity metrics failed:', error.message);
      }

      // User engagement stats
      const [engagementResult] = await pool.execute(`
        SELECT 
          role,
          COUNT(*) as total_users,
          SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as new_users_week,
          SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as new_users_month
        FROM users
        GROUP BY role
      `);

      res.json({
        success: true,
        data: {
          registrationTrend: registrationTrendResult,
          activityMetrics: activityMetrics,
          engagementStats: engagementResult
        }
      });

    } catch (error) {
      console.error('User analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user analytics',
        error: error.message
      });
    }
  },

  getSystemSettings: async (req, res) => {
    try {
      // Create settings table if it doesn't exist
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS system_settings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          setting_key VARCHAR(100) UNIQUE NOT NULL,
          setting_value TEXT,
          setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      // Default settings
      const defaultSettings = [
        { key: 'platform_name', value: 'Artist Management System', type: 'string', description: 'Platform display name' },
        { key: 'commission_rate', value: '10', type: 'number', description: 'Platform commission rate (%)' },
        { key: 'allow_public_registration', value: 'true', type: 'boolean', description: 'Allow public user registration' },
        { key: 'booking_auto_approval', value: 'false', type: 'boolean', description: 'Automatically approve bookings' },
        { key: 'max_file_upload_size', value: '10', type: 'number', description: 'Maximum file upload size (MB)' },
        { key: 'supported_file_types', value: '["jpg","jpeg","png","pdf","mp3","mp4"]', type: 'json', description: 'Supported file types for uploads' },
        { key: 'email_notifications', value: 'true', type: 'boolean', description: 'Enable email notifications' },
        { key: 'maintenance_mode', value: 'false', type: 'boolean', description: 'Put platform in maintenance mode' },
        { key: 'contact_email', value: 'admin@artistmanagement.com', type: 'string', description: 'Platform contact email' },
        { key: 'terms_of_service_url', value: '', type: 'string', description: 'Terms of service URL' },
        { key: 'privacy_policy_url', value: '', type: 'string', description: 'Privacy policy URL' }
      ];

      // Insert default settings if they don't exist
      for (const setting of defaultSettings) {
        await pool.execute(`
          INSERT IGNORE INTO system_settings (setting_key, setting_value, setting_type, description)
          VALUES (?, ?, ?, ?)
        `, [setting.key, setting.value, setting.type, setting.description]);
      }

      // Get all settings
      const [settings] = await pool.execute(`
        SELECT setting_key, setting_value, setting_type, description
        FROM system_settings
        ORDER BY setting_key ASC
      `);

      // Convert settings to key-value object with proper types
      const settingsObject = {};
      settings.forEach(setting => {
        let value = setting.setting_value;
        
        // Convert value based on type
        switch (setting.setting_type) {
          case 'number':
            value = parseFloat(value) || 0;
            break;
          case 'boolean':
            value = value === 'true';
            break;
          case 'json':
            try {
              value = JSON.parse(value);
            } catch (e) {
              value = value; // Keep as string if invalid JSON
            }
            break;
          default:
            // Keep as string
            break;
        }

        settingsObject[setting.setting_key] = {
          value: value,
          type: setting.setting_type,
          description: setting.description
        };
      });

      res.json({
        success: true,
        data: settingsObject
      });

    } catch (error) {
      console.error('Get system settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch system settings',
        error: error.message
      });
    }
  },

  updateSystemSettings: async (req, res) => {
    try {
      const updates = req.body; // Object of setting_key: value pairs

      if (!updates || Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No settings provided to update'
        });
      }

      // Validate and update each setting
      const validationErrors = [];
      const updatePromises = [];

      for (const [key, value] of Object.entries(updates)) {
        // Get current setting to check type
        const [currentSetting] = await pool.execute(
          'SELECT setting_type FROM system_settings WHERE setting_key = ?',
          [key]
        );

        if (currentSetting.length === 0) {
          validationErrors.push(`Setting '${key}' does not exist`);
          continue;
        }

        const settingType = currentSetting[0].setting_type;
        let processedValue = value;

        // Validate and process value based on type
        switch (settingType) {
          case 'number':
            if (isNaN(value)) {
              validationErrors.push(`Setting '${key}' must be a number`);
              continue;
            }
            processedValue = value.toString();
            break;
          case 'boolean':
            if (typeof value !== 'boolean') {
              validationErrors.push(`Setting '${key}' must be a boolean`);
              continue;
            }
            processedValue = value.toString();
            break;
          case 'json':
            try {
              processedValue = JSON.stringify(value);
            } catch (e) {
              validationErrors.push(`Setting '${key}' must be valid JSON`);
              continue;
            }
            break;
          default:
            processedValue = value.toString();
            break;
        }

        // Add to update promises
        updatePromises.push(
          pool.execute(
            'UPDATE system_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?',
            [processedValue, key]
          )
        );
      }

      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: validationErrors
        });
      }

      // Execute all updates
      await Promise.all(updatePromises);

      res.json({
        success: true,
        message: 'System settings updated successfully'
      });

    } catch (error) {
      console.error('Update system settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update system settings',
        error: error.message
      });
    }
  },

  // Verify User Account
  verifyUser: async (req, res) => {
    try {
      const { userId } = req.params;
      const { verified } = req.body;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update verification status based on user role
      if (user.role === 'artist') {
        await pool.execute(
          'UPDATE artists SET is_verified = ? WHERE user_id = ?',
          [verified, userId]
        );
      } else if (user.role === 'organizer') {
        await pool.execute(
          'UPDATE organizers SET is_verified = ? WHERE user_id = ?',
          [verified, userId]
        );
      }

      // Update user status based on verification
      const newStatus = verified ? 'active' : 'inactive';
      await pool.execute(
        'UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newStatus, userId]
      );

      // Clean up verification requests
      await pool.execute(
        'DELETE FROM system_settings WHERE setting_key LIKE ?',
        [`verification_request_${userId}%`]
      );

      res.json({
        success: true,
        message: `User ${verified ? 'verified' : 'unverified'} successfully`
      });

    } catch (error) {
      console.error('Verify user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify user',
        error: error.message
      });
    }
  },

  // Get Verification Requests
  getVerificationRequests: async (req, res) => {
    try {
      // Get verification requests from system_settings
      const [requests] = await pool.execute(
        `SELECT setting_key, setting_value, created_at 
         FROM system_settings 
         WHERE setting_key LIKE 'verification_request_%' 
         ORDER BY created_at DESC`
      );

      const verificationRequests = [];
      
      for (const request of requests) {
        try {
          const requestData = JSON.parse(request.setting_value);
          const user = await User.getWithRoleDetails(requestData.userId);
          
          if (user) {
            verificationRequests.push({
              id: request.setting_key,
              user: user,
              requestDate: requestData.requestDate,
              status: requestData.status,
              created_at: request.created_at
            });
          }
        } catch (parseError) {
          console.error('Error parsing verification request:', parseError);
        }
      }

      res.json({
        success: true,
        data: verificationRequests
      });

    } catch (error) {
      console.error('Get verification requests error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch verification requests',
        error: error.message
      });
    }
  },

  // Get All Events (Admin)
  getAllEvents: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const status = req.query.status;
      const event_type = req.query.event_type;
      const search = req.query.search;
      const sortBy = req.query.sortBy || 'created_at';
      const sortOrder = req.query.sortOrder || 'DESC';
      const offset = (page - 1) * limit;

      let whereClause = '';
      let queryParams = [];

      // Build filters
      if (status && status !== 'all') {
        whereClause += ' WHERE e.status = ?';
        queryParams.push(status);
      }

      if (event_type && event_type !== 'all') {
        const condition = whereClause ? ' AND' : ' WHERE';
        whereClause += `${condition} e.event_type = ?`;
        queryParams.push(event_type);
      }

      if (search) {
        const searchCondition = whereClause ? ' AND' : ' WHERE';
        whereClause += `${searchCondition} (e.title LIKE ? OR e.description LIKE ? OR u.name LIKE ?)`;
        queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM events e
        JOIN users u ON e.organizer_id = u.id
        ${whereClause}
      `;
      const [countResult] = await pool.execute(countQuery, queryParams);
      const total = countResult[0].total;

      // Get events with pagination
      const validSortFields = ['created_at', 'title', 'event_date', 'status', 'event_type'];
      const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
      const safeSortOrder = ['ASC', 'DESC'].includes(sortOrder) ? sortOrder : 'DESC';

      const query = `
        SELECT 
          e.*,
          u.name as organizer_name,
          u.email as organizer_email,
          u.phone as organizer_phone,
          (SELECT COUNT(*) FROM bookings b WHERE b.event_name = e.title AND b.status = 'pending') as pending_bookings,
          (SELECT COUNT(*) FROM bookings b WHERE b.event_name = e.title AND b.status = 'confirmed') as confirmed_bookings,
          (SELECT COUNT(*) FROM bookings b WHERE b.event_name = e.title) as total_bookings
        FROM events e
        JOIN users u ON e.organizer_id = u.id
        ${whereClause}
        ORDER BY e.${safeSortBy} ${safeSortOrder}
        LIMIT ${limit} OFFSET ${offset}
      `;

      const [events] = await pool.execute(query, queryParams);

      // Format JSON fields
      const formattedEvents = events.map(event => {
        let requirements = [];
        let venue_details = {};
        let contact_info = {};

        try {
          requirements = event.requirements ? JSON.parse(event.requirements) : [];
        } catch (e) {
          console.log('Invalid requirements JSON for event:', event.id, event.requirements);
        }

        try {
          venue_details = event.venue_details ? JSON.parse(event.venue_details) : {};
        } catch (e) {
          console.log('Invalid venue_details JSON for event:', event.id, event.venue_details);
        }

        try {
          contact_info = event.contact_info ? JSON.parse(event.contact_info) : {};
        } catch (e) {
          console.log('Invalid contact_info JSON for event:', event.id, event.contact_info);
        }

        return {
          ...event,
          requirements,
          venue_details,
          contact_info
        };
      });

      res.json({
        success: true,
        data: formattedEvents,
        pagination: {
          current_page: page,
          per_page: limit,
          total: total,
          total_pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('Get all events error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch events',
        error: error.message
      });
    }
  },

  // Get Event Details (Admin)
  getEventDetails: async (req, res) => {
    try {
      const { eventId } = req.params;

      const query = `
        SELECT 
          e.*,
          u.name as organizer_name,
          u.email as organizer_email,
          u.phone as organizer_phone,
          o.organization_name,
          o.organization_type,
          o.website as organizer_website
        FROM events e
        JOIN users u ON e.organizer_id = u.id
        LEFT JOIN organizers o ON u.id = o.user_id
        WHERE e.id = ?
      `;

      const [events] = await pool.execute(query, [eventId]);

      if (events.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      const event = events[0];

      // Get event bookings
      let bookings = [];
      try {
        const bookingsQuery = `
          SELECT 
            b.*,
            a.name as artist_name,
            a.email as artist_email,
            au.phone as artist_phone
          FROM bookings b
          JOIN artists ar ON b.artist_id = ar.id
          JOIN users a ON ar.user_id = a.id
          LEFT JOIN users au ON ar.user_id = au.id
          WHERE b.event_name = ?
          ORDER BY b.created_at DESC
        `;
        const [bookingResults] = await pool.execute(bookingsQuery, [event.title]);
        bookings = bookingResults || [];
      } catch (error) {
        console.log('Could not fetch event bookings:', error.message);
      }

      // Format JSON fields
      let requirements = [];
      let venue_details = {};
      let contact_info = {};

      try {
        requirements = event.requirements ? JSON.parse(event.requirements) : [];
      } catch (e) {
        console.log('Invalid requirements JSON for event:', event.id, event.requirements);
      }

      try {
        venue_details = event.venue_details ? JSON.parse(event.venue_details) : {};
      } catch (e) {
        console.log('Invalid venue_details JSON for event:', event.id, event.venue_details);
      }

      try {
        contact_info = event.contact_info ? JSON.parse(event.contact_info) : {};
      } catch (e) {
        console.log('Invalid contact_info JSON for event:', event.id, event.contact_info);
      }

      const formattedEvent = {
        ...event,
        requirements,
        venue_details,
        contact_info,
        bookings: bookings
      };

      res.json({
        success: true,
        data: formattedEvent
      });

    } catch (error) {
      console.error('Get event details error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch event details',
        error: error.message
      });
    }
  },

  // Update Event Status (Admin)
  updateEventStatus: async (req, res) => {
    try {
      const { eventId } = req.params;
      const { status, notes } = req.body;

      const validStatuses = ['planning', 'published', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
        });
      }

      // Check if event exists
      const [existingEvent] = await pool.execute(
        'SELECT * FROM events WHERE id = ?',
        [eventId]
      );

      if (existingEvent.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      // Update event status
      let updateQuery = 'UPDATE events SET status = ?, updated_at = CURRENT_TIMESTAMP';
      let updateParams = [status];

      updateQuery += ' WHERE id = ?';
      updateParams.push(eventId);

      await pool.execute(updateQuery, updateParams);

      res.json({
        success: true,
        message: `Event status updated to ${status} successfully`
      });

    } catch (error) {
      console.error('Update event status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update event status',
        error: error.message
      });
    }
  },

  // Delete Event (Admin)
  deleteEvent: async (req, res) => {
    try {
      const { eventId } = req.params;

      // Check if event exists
      const [existingEvent] = await pool.execute(
        'SELECT title FROM events WHERE id = ?',
        [eventId]
      );

      if (existingEvent.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      // Cancel related bookings first
      try {
        await pool.execute(
          'UPDATE bookings SET status = "cancelled", updated_at = CURRENT_TIMESTAMP WHERE event_name = ?',
          [existingEvent[0].title]
        );
      } catch (error) {
        console.log('Could not cancel related bookings:', error.message);
      }

      // Delete the event
      await pool.execute('DELETE FROM events WHERE id = ?', [eventId]);

      res.json({
        success: true,
        message: 'Event deleted successfully'
      });

    } catch (error) {
      console.error('Delete event error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete event',
        error: error.message
      });
    }
  },

  // Payment Management Functions

  // Release Payment to Artist
  releasePayment: async (req, res) => {
    try {
      const { bookingId } = req.params;
      const { notes } = req.body;

      // Check if booking exists and payment is in correct state
      const [bookings] = await pool.execute(
        'SELECT * FROM bookings WHERE id = ? AND payment_status = "paid"',
        [bookingId]
      );

      if (bookings.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found or payment not in paid status'
        });
      }

      const booking = bookings[0];

      // Update payment status to released
      await pool.execute(
        'UPDATE bookings SET payment_status = "released", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [bookingId]
      );

      // TODO: Integrate with actual payment processor to release funds
      console.log(`Payment released for booking ${bookingId}:`, {
        amount: booking.net_amount,
        artistId: booking.artist_id,
        notes
      });

      res.json({
        success: true,
        message: 'Payment released to artist successfully'
      });

    } catch (error) {
      console.error('Release payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to release payment',
        error: error.message
      });
    }
  },

  // Process Refund
  processRefund: async (req, res) => {
    try {
      const { bookingId } = req.params;
      const { refundAmount, reason } = req.body;

      // Check if booking exists and payment can be refunded
      const [bookings] = await pool.execute(
        'SELECT * FROM bookings WHERE id = ? AND payment_status IN ("paid", "released")',
        [bookingId]
      );

      if (bookings.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found or payment cannot be refunded'
        });
      }

      const booking = bookings[0];
      const maxRefundAmount = parseFloat(booking.total_amount) - parseFloat(booking.platform_fee || 0);

      if (refundAmount && parseFloat(refundAmount) > maxRefundAmount) {
        return res.status(400).json({
          success: false,
          message: `Refund amount cannot exceed ${maxRefundAmount} (total minus platform fee)`
        });
      }

      const finalRefundAmount = refundAmount || maxRefundAmount;

      // Update booking status and payment status
      await pool.execute(
        'UPDATE bookings SET payment_status = "refunded", status = "cancelled", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [bookingId]
      );

      // TODO: Integrate with actual payment processor to process refund
      console.log(`Refund processed for booking ${bookingId}:`, {
        refundAmount: finalRefundAmount,
        reason,
        originalAmount: booking.total_amount
      });

      res.json({
        success: true,
        message: 'Refund processed successfully',
        data: {
          refundAmount: finalRefundAmount,
          reason
        }
      });

    } catch (error) {
      console.error('Process refund error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process refund',
        error: error.message
      });
    }
  },

  // Dispute Resolution Functions

  // Resolve Dispute
  resolveDispute: async (req, res) => {
    try {
      const { bookingId } = req.params;
      const { resolution, notes } = req.body;

      const validResolutions = [
        'favor_artist', 'favor_organizer', 'partial_refund', 
        'full_refund', 'escalate', 'request_info'
      ];

      if (!validResolutions.includes(resolution)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid resolution type'
        });
      }

      // Check if booking exists and is disputed
      const [bookings] = await pool.execute(
        'SELECT * FROM bookings WHERE id = ? AND status = "disputed"',
        [bookingId]
      );

      if (bookings.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found or not in disputed status'
        });
      }

      const booking = bookings[0];
      let newStatus = 'disputed';
      let newPaymentStatus = booking.payment_status;

      // Handle different resolution types
      switch (resolution) {
        case 'favor_artist':
          newStatus = 'completed';
          if (booking.payment_status === 'paid') {
            newPaymentStatus = 'released';
          }
          break;
        case 'favor_organizer':
          newStatus = 'cancelled';
          if (booking.payment_status === 'paid') {
            newPaymentStatus = 'refunded';
          }
          break;
        case 'partial_refund':
        case 'full_refund':
          newStatus = 'cancelled';
          newPaymentStatus = 'refunded';
          break;
        case 'escalate':
          // Keep current status but add escalation flag
          break;
        case 'request_info':
          // Keep current status but request more info
          break;
      }

      // Update booking
      await pool.execute(
        'UPDATE bookings SET status = ?, payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newStatus, newPaymentStatus, bookingId]
      );

      // TODO: Send notifications to involved parties
      console.log(`Dispute resolved for booking ${bookingId}:`, {
        resolution,
        notes,
        newStatus,
        newPaymentStatus
      });

      res.json({
        success: true,
        message: 'Dispute resolved successfully',
        data: {
          resolution,
          newStatus,
          newPaymentStatus
        }
      });

    } catch (error) {
      console.error('Resolve dispute error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to resolve dispute',
        error: error.message
      });
    }
  },

  // Messaging Functions

  // Send Message to Booking Participants
  sendBookingMessage: async (req, res) => {
    try {
      const { bookingId } = req.params;
      const { recipient, message } = req.body;

      const validRecipients = ['artist', 'organizer', 'both'];
      if (!validRecipients.includes(recipient)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid recipient type'
        });
      }

      // Get booking details with participant info
      const query = `
        SELECT 
          b.*,
          a.name as artist_name,
          au.email as artist_email,
          o.name as organizer_name,
          ou.email as organizer_email
        FROM bookings b
        JOIN artists ar ON b.artist_id = ar.id
        JOIN users au ON ar.user_id = au.id
        LEFT JOIN events e ON b.event_name = e.title
        LEFT JOIN users ou ON e.organizer_id = ou.id
        LEFT JOIN users o ON e.organizer_id = o.id
        WHERE b.id = ?
      `;

      const [bookings] = await pool.execute(query, [bookingId]);

      if (bookings.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      const booking = bookings[0];

      // TODO: Implement actual messaging/notification system
      console.log(`Admin message sent for booking ${bookingId}:`, {
        recipient,
        message,
        artistEmail: booking.artist_email,
        organizerEmail: booking.organizer_email
      });

      res.json({
        success: true,
        message: 'Message sent successfully',
        data: {
          recipient,
          sentTo: recipient === 'both' ? 
            [booking.artist_email, booking.organizer_email] :
            recipient === 'artist' ? [booking.artist_email] : [booking.organizer_email]
        }
      });

    } catch (error) {
      console.error('Send booking message error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send message',
        error: error.message
      });
    }
  },

  // Enhanced Booking Management

  // Delete Booking (Admin)
  deleteBooking: async (req, res) => {
    try {
      const { bookingId } = req.params;

      // Check if booking exists and is in a deletable state
      const [bookings] = await pool.execute(
        'SELECT * FROM bookings WHERE id = ? AND status IN ("cancelled", "rejected")',
        [bookingId]
      );

      if (bookings.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found or cannot be deleted (must be cancelled or rejected)'
        });
      }

      // Delete the booking
      await pool.execute('DELETE FROM bookings WHERE id = ?', [bookingId]);

      res.json({
        success: true,
        message: 'Booking deleted successfully'
      });

    } catch (error) {
      console.error('Delete booking error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete booking',
        error: error.message
      });
    }
  },

  // Force Status Update (Admin override)
  forceStatusUpdate: async (req, res) => {
    try {
      const { bookingId } = req.params;
      const { status, paymentStatus, notes, override } = req.body;

      if (!override) {
        return res.status(400).json({
          success: false,
          message: 'Override confirmation required for force status update'
        });
      }

      // Check if booking exists
      const [bookings] = await pool.execute(
        'SELECT * FROM bookings WHERE id = ?',
        [bookingId]
      );

      if (bookings.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      const booking = bookings[0];
      let updateFields = [];
      let updateValues = [];

      if (status) {
        updateFields.push('status = ?');
        updateValues.push(status);
      }

      if (paymentStatus) {
        updateFields.push('payment_status = ?');
        updateValues.push(paymentStatus);
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(bookingId);

      const updateQuery = `UPDATE bookings SET ${updateFields.join(', ')} WHERE id = ?`;
      await pool.execute(updateQuery, updateValues);

      // Log the admin override
      console.log(`Admin force update for booking ${bookingId}:`, {
        adminId: req.user.id,
        oldStatus: booking.status,
        newStatus: status,
        oldPaymentStatus: booking.payment_status,
        newPaymentStatus: paymentStatus,
        notes
      });

      res.json({
        success: true,
        message: 'Booking status force updated successfully'
      });

    } catch (error) {
      console.error('Force status update error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to force update booking status',
        error: error.message
      });
    }
  },

  // Payment Management Functions

  // Release Payment to Artist
  releasePayment: async (req, res) => {
    try {
      const { bookingId } = req.params;
      const { notes } = req.body;

      // Check if booking exists and payment is in correct state
      const [bookings] = await pool.execute(
        'SELECT * FROM bookings WHERE id = ? AND payment_status = "paid"',
        [bookingId]
      );

      if (bookings.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found or payment not in paid status'
        });
      }

      const booking = bookings[0];

      // Update payment status to released
      await pool.execute(
        'UPDATE bookings SET payment_status = "released", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [bookingId]
      );

      // TODO: Integrate with actual payment processor to release funds
      console.log(`Payment released for booking ${bookingId}:`, {
        amount: booking.net_amount,
        artistId: booking.artist_id,
        notes
      });

      res.json({
        success: true,
        message: 'Payment released to artist successfully'
      });

    } catch (error) {
      console.error('Release payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to release payment',
        error: error.message
      });
    }
  },

  // Process Refund
  processRefund: async (req, res) => {
    try {
      const { bookingId } = req.params;
      const { refundAmount, reason } = req.body;

      // Check if booking exists and payment can be refunded
      const [bookings] = await pool.execute(
        'SELECT * FROM bookings WHERE id = ? AND payment_status IN ("paid", "released")',
        [bookingId]
      );

      if (bookings.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found or payment cannot be refunded'
        });
      }

      const booking = bookings[0];
      const maxRefundAmount = parseFloat(booking.total_amount) - parseFloat(booking.platform_fee || 0);

      if (refundAmount && parseFloat(refundAmount) > maxRefundAmount) {
        return res.status(400).json({
          success: false,
          message: `Refund amount cannot exceed ${maxRefundAmount} (total minus platform fee)`
        });
      }

      const finalRefundAmount = refundAmount || maxRefundAmount;

      // Update booking status and payment status
      await pool.execute(
        'UPDATE bookings SET payment_status = "refunded", status = "cancelled", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [bookingId]
      );

      // TODO: Integrate with actual payment processor to process refund
      console.log(`Refund processed for booking ${bookingId}:`, {
        refundAmount: finalRefundAmount,
        reason,
        originalAmount: booking.total_amount
      });

      res.json({
        success: true,
        message: 'Refund processed successfully',
        data: {
          refundAmount: finalRefundAmount,
          reason
        }
      });

    } catch (error) {
      console.error('Process refund error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process refund',
        error: error.message
      });
    }
  },

  // Dispute Resolution Functions

  // Resolve Dispute
  resolveDispute: async (req, res) => {
    try {
      const { bookingId } = req.params;
      const { resolution, notes } = req.body;

      const validResolutions = [
        'favor_artist', 'favor_organizer', 'partial_refund', 
        'full_refund', 'escalate', 'request_info'
      ];

      if (!validResolutions.includes(resolution)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid resolution type'
        });
      }

      // Check if booking exists and is disputed
      const [bookings] = await pool.execute(
        'SELECT * FROM bookings WHERE id = ? AND status = "disputed"',
        [bookingId]
      );

      if (bookings.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found or not in disputed status'
        });
      }

      const booking = bookings[0];
      let newStatus = 'disputed';
      let newPaymentStatus = booking.payment_status;

      // Handle different resolution types
      switch (resolution) {
        case 'favor_artist':
          newStatus = 'completed';
          if (booking.payment_status === 'paid') {
            newPaymentStatus = 'released';
          }
          break;
        case 'favor_organizer':
          newStatus = 'cancelled';
          if (booking.payment_status === 'paid') {
            newPaymentStatus = 'refunded';
          }
          break;
        case 'partial_refund':
        case 'full_refund':
          newStatus = 'cancelled';
          newPaymentStatus = 'refunded';
          break;
        case 'escalate':
          // Keep current status but add escalation flag
          break;
        case 'request_info':
          // Keep current status but request more info
          break;
      }

      // Update booking
      await pool.execute(
        'UPDATE bookings SET status = ?, payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newStatus, newPaymentStatus, bookingId]
      );

      // TODO: Send notifications to involved parties
      console.log(`Dispute resolved for booking ${bookingId}:`, {
        resolution,
        notes,
        newStatus,
        newPaymentStatus
      });

      res.json({
        success: true,
        message: 'Dispute resolved successfully',
        data: {
          resolution,
          newStatus,
          newPaymentStatus
        }
      });

    } catch (error) {
      console.error('Resolve dispute error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to resolve dispute',
        error: error.message
      });
    }
  },

  // Messaging Functions

  // Send Message to Booking Participants
  sendBookingMessage: async (req, res) => {
    try {
      const { bookingId } = req.params;
      const { recipient, message } = req.body;

      const validRecipients = ['artist', 'organizer', 'both'];
      if (!validRecipients.includes(recipient)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid recipient type'
        });
      }

      // Get booking details with participant info
      const query = `
        SELECT 
          b.*,
          a.name as artist_name,
          au.email as artist_email,
          o.name as organizer_name,
          ou.email as organizer_email
        FROM bookings b
        JOIN artists ar ON b.artist_id = ar.id
        JOIN users au ON ar.user_id = au.id
        LEFT JOIN events e ON b.event_name = e.title
        LEFT JOIN users ou ON e.organizer_id = ou.id
        LEFT JOIN users o ON e.organizer_id = o.id
        WHERE b.id = ?
      `;

      const [bookings] = await pool.execute(query, [bookingId]);

      if (bookings.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      const booking = bookings[0];

      // TODO: Implement actual messaging/notification system
      console.log(`Admin message sent for booking ${bookingId}:`, {
        recipient,
        message,
        artistEmail: booking.artist_email,
        organizerEmail: booking.organizer_email
      });

      res.json({
        success: true,
        message: 'Message sent successfully',
        data: {
          recipient,
          sentTo: recipient === 'both' ? 
            [booking.artist_email, booking.organizer_email] :
            recipient === 'artist' ? [booking.artist_email] : [booking.organizer_email]
        }
      });

    } catch (error) {
      console.error('Send booking message error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send message',
        error: error.message
      });
    }
  },

  // Enhanced Booking Management

  // Delete Booking (Admin)
  deleteBooking: async (req, res) => {
    try {
      const { bookingId } = req.params;

      // Check if booking exists and is in a deletable state
      const [bookings] = await pool.execute(
        'SELECT * FROM bookings WHERE id = ? AND status IN ("cancelled", "rejected")',
        [bookingId]
      );

      if (bookings.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found or cannot be deleted (must be cancelled or rejected)'
        });
      }

      // Delete the booking
      await pool.execute('DELETE FROM bookings WHERE id = ?', [bookingId]);

      res.json({
        success: true,
        message: 'Booking deleted successfully'
      });

    } catch (error) {
      console.error('Delete booking error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete booking',
        error: error.message
      });
    }
  }
};

module.exports = adminController; 