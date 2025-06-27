const { executeQuery } = require('../config/database');
const { safeJsonParse, formatJsonFields, validateAndFormatData } = require('../utils/dataFormatters');

const eventController = {
  // Get all events for logged-in organizer
  getOrganizerEvents: async (req, res) => {
    try {
      const organizerId = req.user.id;
      
      const query = `
        SELECT e.*
        FROM events e
        WHERE e.organizer_id = ?
        ORDER BY e.event_date DESC
      `;
      
      const result = await executeQuery(query, [organizerId]);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      // Format JSON fields and add placeholder booking counts
      const formattedEvents = result.data.map(event => ({
        ...event,
        requirements: safeJsonParse(event.requirements, []),
        venue_details: safeJsonParse(event.venue_details, {}),
        contact_info: safeJsonParse(event.contact_info, {}),
        total_bookings: 0,
        confirmed_bookings: 0,
        pending_bookings: 0
      }));
      
      res.json({
        success: true,
        events: formattedEvents
      });
    } catch (error) {
      console.error('Get organizer events error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch events'
      });
    }
  },

  // Create new event
  createEvent: async (req, res) => {
    try {
      const organizerId = req.user.id;
      const {
        title,
        description,
        event_type,
        event_date,
        start_time,
        end_time,
        venue_name,
        venue_address,
        venue_city,
        venue_state,
        venue_country,
        venue_details,
        budget_min,
        budget_max,
        currency,
        requirements,
        contact_info,
        is_public
      } = req.body;

      // Validate required fields
      if (!title || !event_type || !event_date || !start_time || !venue_name) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: title, event_type, event_date, start_time, venue_name'
        });
      }

      // Format JSON fields
      const formattedRequirements = validateAndFormatData(requirements, 'array');
      const formattedVenueDetails = validateAndFormatData(venue_details, 'object');
      const formattedContactInfo = validateAndFormatData(contact_info, 'object');

      const query = `
        INSERT INTO events (
          organizer_id, title, description, event_type, event_date, start_time, end_time,
          venue_name, venue_address, venue_city, venue_state, venue_country, venue_details,
          budget_min, budget_max, currency, requirements, contact_info, is_public, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'planning')
      `;

      const result = await executeQuery(query, [
        organizerId, title, description, event_type, event_date, start_time, end_time,
        venue_name, venue_address, venue_city, venue_state, venue_country, 
        JSON.stringify(formattedVenueDetails),
        budget_min, budget_max, currency, 
        JSON.stringify(formattedRequirements),
        JSON.stringify(formattedContactInfo),
        is_public || false
      ]);

      if (!result.success) {
        throw new Error(result.error);
      }

      res.status(201).json({
        success: true,
        message: 'Event created successfully',
        eventId: result.insertId
      });
    } catch (error) {
      console.error('Create event error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create event'
      });
    }
  },

  // Get single event details (organizer access)
  getEventDetails: async (req, res) => {
    try {
      const { eventId } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      let query = `
        SELECT e.*, u.name as organizer_name, u.email as organizer_email
        FROM events e
        LEFT JOIN users u ON e.organizer_id = u.id
        WHERE e.id = ?
      `;

      // Only organizers can see their own events, admins can see all
      if (userRole !== 'admin') {
        query += ` AND e.organizer_id = ?`;
      }

      const queryParams = userRole === 'admin' ? [eventId] : [eventId, userId];
      const result = await executeQuery(query, queryParams);

      if (!result.success || result.data.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      const event = result.data[0];
      
      // Format JSON fields and add placeholder booking counts
      const formattedEvent = {
        ...event,
        requirements: safeJsonParse(event.requirements, []),
        venue_details: safeJsonParse(event.venue_details, {}),
        contact_info: safeJsonParse(event.contact_info, {}),
        total_bookings: 0,
        confirmed_bookings: 0
      };

      res.json({
        success: true,
        event: formattedEvent
      });
    } catch (error) {
      console.error('Get event details error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch event details'
      });
    }
  },

  // Update event
  updateEvent: async (req, res) => {
    try {
      const { eventId } = req.params;
      const organizerId = req.user.id;
      const updateData = req.body;

      // Check if event exists and belongs to organizer
      const existingEventResult = await executeQuery(
        'SELECT id FROM events WHERE id = ? AND organizer_id = ?',
        [eventId, organizerId]
      );

      if (!existingEventResult.success || existingEventResult.data.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Event not found or access denied'
        });
      }

      // Build dynamic update query
      const allowedFields = [
        'title', 'description', 'event_type', 'event_date', 'start_time', 'end_time',
        'venue_name', 'venue_address', 'venue_city', 'venue_state', 'venue_country',
        'budget_min', 'budget_max', 'currency', 'is_public', 'status'
      ];

      const jsonFields = ['requirements', 'venue_details', 'contact_info'];
      
      const updateFields = [];
      const updateValues = [];

      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key)) {
          updateFields.push(`${key} = ?`);
          updateValues.push(updateData[key]);
        } else if (jsonFields.includes(key)) {
          updateFields.push(`${key} = ?`);
          const formattedData = validateAndFormatData(
            updateData[key], 
            key === 'requirements' ? 'array' : 'object'
          );
          updateValues.push(JSON.stringify(formattedData));
        }
      });

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields to update'
        });
      }

      updateFields.push('updated_at = NOW()');
      updateValues.push(eventId);

      const query = `UPDATE events SET ${updateFields.join(', ')} WHERE id = ?`;
      const result = await executeQuery(query, updateValues);

      if (!result.success) {
        throw new Error(result.error);
      }

      res.json({
        success: true,
        message: 'Event updated successfully'
      });
    } catch (error) {
      console.error('Update event error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update event'
      });
    }
  },

  // Delete event
  deleteEvent: async (req, res) => {
    try {
      const { eventId } = req.params;
      const organizerId = req.user.id;

      // Since bookings table doesn't have event_id column, we'll just delete the event
      // In a real system, you might want to check for related bookings differently

      // Delete event
      const deleteResult = await executeQuery(
        'DELETE FROM events WHERE id = ? AND organizer_id = ?',
        [eventId, organizerId]
      );

      if (!deleteResult.success) {
        throw new Error(deleteResult.error);
      }

      if (deleteResult.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Event not found or access denied'
        });
      }

      res.json({
        success: true,
        message: 'Event deleted successfully'
      });
    } catch (error) {
      console.error('Delete event error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete event'
      });
    }
  },

  // Browse public events (for artists)
  browseEvents: async (req, res) => {
    try {
      const {
        event_type,
        city,
        state,
        country,
        date_from,
        date_to,
        budget_min,
        budget_max,
        page = 1,
        limit = 10,
        status
      } = req.query;

      let whereConditions = ['e.is_public = 1'];
      let queryParams = [];

      // Filter by status - default to 'published' for public browsing
      const eventStatus = status || 'published';
      whereConditions.push('e.status = ?');
      queryParams.push(eventStatus);

      // Add filters
      if (event_type) {
        whereConditions.push('e.event_type = ?');
        queryParams.push(event_type);
      }
      if (city) {
        whereConditions.push('e.venue_city LIKE ?');
        queryParams.push(`%${city}%`);
      }
      if (state) {
        whereConditions.push('e.venue_state LIKE ?');
        queryParams.push(`%${state}%`);
      }
      if (country) {
        whereConditions.push('e.venue_country LIKE ?');
        queryParams.push(`%${country}%`);
      }
      if (date_from) {
        whereConditions.push('e.event_date >= ?');
        queryParams.push(date_from);
      }
      if (date_to) {
        whereConditions.push('e.event_date <= ?');
        queryParams.push(date_to);
      }
      if (budget_min) {
        whereConditions.push('e.budget_min >= ?');
        queryParams.push(budget_min);
      }
      if (budget_max) {
        whereConditions.push('e.budget_max <= ?');
        queryParams.push(budget_max);
      }

      const offset = (page - 1) * limit;

      const query = `
        SELECT e.id, e.title as name, e.description, e.event_type, e.event_date as date, e.start_time,
               e.end_time, e.venue_name as location, e.venue_city, e.venue_state, e.venue_country,
               e.budget_min, e.budget_max, e.currency, e.requirements,
               u.name as organizer_name
        FROM events e
        LEFT JOIN users u ON e.organizer_id = u.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY e.event_date ASC
        LIMIT ${parseInt(limit)} OFFSET ${offset}
      `;

      const eventsResult = await executeQuery(query, queryParams);

      if (!eventsResult.success) {
        throw new Error(eventsResult.error || 'Database query failed');
      }

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM events e
        WHERE ${whereConditions.join(' AND ')}
      `;
      const countResult = await executeQuery(countQuery, queryParams);

      // Format events
      const formattedEvents = eventsResult.success ? eventsResult.data.map(event => ({
        ...event,
        // name already aliased in SQL
        // date already aliased in SQL
        // location already aliased in SQL  
        budget: event.budget_max || event.budget_min || 0,  // Add budget field
        requirements: safeJsonParse(event.requirements, [])
      })) : [];

      const total = countResult.success && countResult.data.length > 0 ? countResult.data[0].total : 0;

      res.json({
        success: true,
        data: formattedEvents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('❌ Browse events error:', error);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Request query:', req.query);
      res.status(500).json({
        success: false,
        message: 'Failed to browse events',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Get public event details (for artists)
  getPublicEventDetails: async (req, res) => {
    try {
      const { eventId } = req.params;

      const query = `
        SELECT e.id, e.title, e.description, e.event_type, e.event_date, e.start_time, e.end_time,
               e.venue_name, e.venue_address, e.venue_city, e.venue_state, e.venue_country,
               e.venue_details, e.budget_min, e.budget_max, e.currency, e.requirements,
               e.contact_info, u.name as organizer_name
        FROM events e
        LEFT JOIN users u ON e.organizer_id = u.id
        WHERE e.id = ? AND e.is_public = 1 AND e.status = 'planning'
      `;

      const eventsResult = await executeQuery(query, [eventId]);

      if (!eventsResult.success || eventsResult.data.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      const event = eventsResult.data[0];
      
      // Format JSON fields
      const formattedEvent = {
        ...event,
        requirements: safeJsonParse(event.requirements, []),
        venue_details: safeJsonParse(event.venue_details, {}),
        contact_info: safeJsonParse(event.contact_info, {})
      };

      res.json({
        success: true,
        event: formattedEvent
      });
    } catch (error) {
      console.error('Get public event details error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch event details'
      });
    }
  },

  // Get event statistics
  getEventStats: async (req, res) => {
    try {
      const { eventId } = req.params;
      const organizerId = req.user.id;

      // Verify event ownership
      const eventCheck = await executeQuery(
        'SELECT id FROM events WHERE id = ? AND organizer_id = ?',
        [eventId, organizerId]
      );

      if (!eventCheck.success || eventCheck.data.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      // Return placeholder statistics since bookings table doesn't have event_id column
      const stats = {
        total_applications: 0,
        pending_applications: 0,
        confirmed_bookings: 0,
        rejected_applications: 0,
        completed_bookings: 0
      };

      res.json({
        success: true,
        stats: stats
      });
    } catch (error) {
      console.error('Get event stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch event statistics'
      });
    }
  }
};

module.exports = eventController; 
