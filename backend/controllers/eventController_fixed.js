// Quick fix for the browseEvents method - copy this into eventController.js

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

      let whereConditions = ['e.is_public = true'];
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

      // FIXED: Use template literals for LIMIT and OFFSET instead of parameters
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

      console.log('🔍 Browse events query:', query);
      console.log('🔍 Parameters:', queryParams);

      const eventsResult = await executeQuery(query, queryParams);

      if (!eventsResult.success) {
        console.error('❌ Database query failed:', eventsResult.error);
        throw new Error(eventsResult.error || 'Database query failed');
      }

      console.log('✅ Query successful, found', eventsResult.data.length, 'events');

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM events e
        WHERE ${whereConditions.join(' AND ')}
      `;
      const countResult = await executeQuery(countQuery, queryParams);

      // Format events
      const formattedEvents = eventsResult.data.map(event => ({
        ...event,
        requirements: safeJsonParse(event.requirements, []),
        budget: event.budget_max || event.budget_min || 0
      }));

      const total = countResult.success && countResult.data.length > 0 ? countResult.data[0].total : 0;

      const response = {
        success: true,
        data: formattedEvents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          totalPages: Math.ceil(total / limit)
        }
      };

      console.log('📤 Sending response with', formattedEvents.length, 'events');
      res.json(response);
    } catch (error) {
      console.error('Browse events error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to browse events'
      });
    }
  }, 