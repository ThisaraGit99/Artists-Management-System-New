import api from './api';

const eventService = {
  // Organizer event management
  getOrganizerEvents: async () => {
    try {
      const response = await api.get('/events');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch events' };
    }
  },

  createEvent: async (eventData) => {
    try {
      const response = await api.post('/events', eventData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create event' };
    }
  },

  getEventDetails: async (eventId) => {
    try {
      const response = await api.get(`/events/${eventId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch event details' };
    }
  },

  updateEvent: async (eventId, updateData) => {
    try {
      const response = await api.put(`/events/${eventId}`, updateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update event' };
    }
  },

  deleteEvent: async (eventId) => {
    try {
      const response = await api.delete(`/events/${eventId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete event' };
    }
  },

  getEventStats: async (eventId) => {
    try {
      const response = await api.get(`/events/${eventId}/stats`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch event statistics' };
    }
  },

  // Artist event browsing
  browseEvents: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== '') {
          queryParams.append(key, filters[key]);
        }
      });
      
      const response = await api.get(`/events/browse/all?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to browse events' };
    }
  },

  getPublicEventDetails: async (eventId) => {
    try {
      const response = await api.get(`/events/browse/${eventId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch event details' };
    }
  }
};

export default eventService; 