import api from './api';

const eventApplicationService = {
  // Apply to an event
  applyToEvent: async (eventId, applicationData) => {
    try {
      const response = await api.post(`/event-applications/apply/${eventId}`, applicationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to apply to event' };
    }
  },

  // Get artist's applications
  getMyApplications: async () => {
    try {
      const response = await api.get('/event-applications/my-applications');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch applications' };
    }
  },

  // Get application details
  getApplicationDetails: async (applicationId) => {
    try {
      const response = await api.get(`/event-applications/${applicationId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch application details' };
    }
  },

  // Cancel application (if still pending)
  cancelApplication: async (applicationId) => {
    try {
      const response = await api.delete(`/event-applications/${applicationId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to cancel application' };
    }
  },

  // ORGANIZER METHODS
  // Get applications for organizer's event
  getEventApplications: async (eventId, status = 'all') => {
    try {
      const response = await api.get(`/event-applications/${eventId}/applications?status=${status}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch event applications' };
    }
  },

  // Approve an application
  approveApplication: async (eventId, applicationId, organizerResponse = '') => {
    try {
      const response = await api.post(`/event-applications/${eventId}/applications/${applicationId}/approve`, {
        organizer_response: organizerResponse
      });
      
      // Log the response for debugging
      console.log('📡 API Response:', response.data);
      
      // Check if the response indicates success
      if (response.data.success) {
        return response.data;
      } else {
        // If success is false, throw the error
        throw response.data;
      }
    } catch (error) {
      console.error('🚨 API Error:', error);
      
      // If it's a network error or response error, handle appropriately
      if (error.response) {
        // Server responded with error status
        throw error.response.data || { message: 'Failed to approve application' };
      } else if (error.success === false) {
        // Our custom error from above
        throw error;
      } else {
        // Network error or other issue
        throw { message: error.message || 'Failed to approve application' };
      }
    }
  },

  // Reject an application
  rejectApplication: async (eventId, applicationId, organizerResponse = '') => {
    try {
      const response = await api.post(`/event-applications/${eventId}/applications/${applicationId}/reject`, {
        organizer_response: organizerResponse
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to reject application' };
    }
  }
};

export default eventApplicationService;