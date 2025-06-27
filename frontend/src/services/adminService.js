import apiClient from './api';

const adminService = {
  // Dashboard Statistics
  getDashboardStats: async () => {
    try {
      const response = await apiClient.get('/admin/dashboard/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // User Management
  getAllUsers: async (page = 1, limit = 10, filters = {}) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });
      
      const response = await apiClient.get(`/admin/users?${params}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getUserDetails: async (userId) => {
    try {
      const response = await apiClient.get(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  updateUser: async (userId, userData) => {
    try {
      const response = await apiClient.put(`/admin/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  deleteUser: async (userId) => {
    try {
      const response = await apiClient.delete(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  updateUserRole: async (userId, role) => {
    try {
      const response = await apiClient.put(`/admin/users/${userId}/role`, { role });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  updateUserStatus: async (userId, status) => {
    try {
      const response = await apiClient.put(`/admin/users/${userId}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Verification Management
  getVerificationRequests: async () => {
    try {
      const response = await apiClient.get('/admin/verification-requests');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  verifyUser: async (userId, verified = true) => {
    try {
      const response = await apiClient.put(`/admin/users/${userId}/verify`, { verified });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Booking Management (placeholders for future implementation)
  getAllBookings: async (page = 1, limit = 10, filters = {}) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });
      
      const response = await apiClient.get(`/admin/bookings?${params}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getBookingDetails: async (bookingId) => {
    try {
      const response = await apiClient.get(`/admin/bookings/${bookingId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  updateBookingStatus: async (bookingId, status, notes) => {
    try {
      const response = await apiClient.put(`/admin/bookings/${bookingId}/status`, { status, notes });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Payment Management
  releasePayment: async (bookingId, notes) => {
    try {
      const response = await apiClient.post(`/admin/bookings/${bookingId}/release-payment`, { notes });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  processRefund: async (bookingId, notes) => {
    try {
      const response = await apiClient.post(`/admin/bookings/${bookingId}/refund`, { notes });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Dispute Resolution
  resolveDispute: async (bookingId, resolution, notes) => {
    try {
      const response = await apiClient.post(`/admin/bookings/${bookingId}/resolve-dispute`, { 
        resolution, 
        notes 
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Messaging
  sendBookingMessage: async (bookingId, recipient, message) => {
    try {
      const response = await apiClient.post(`/admin/bookings/${bookingId}/send-message`, { 
        recipient, 
        message 
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Booking Deletion
  deleteBooking: async (bookingId) => {
    try {
      const response = await apiClient.delete(`/admin/bookings/${bookingId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Event Management
  getAllEvents: async (page = 1, limit = 10, filters = {}) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });
      
      const response = await apiClient.get(`/admin/events?${params}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getEventDetails: async (eventId) => {
    try {
      const response = await apiClient.get(`/admin/events/${eventId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  updateEventStatus: async (eventId, status) => {
    try {
      const response = await apiClient.put(`/admin/events/${eventId}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  deleteEvent: async (eventId) => {
    try {
      const response = await apiClient.delete(`/admin/events/${eventId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Analytics (placeholders for future implementation)
  getAnalyticsOverview: async () => {
    try {
      const response = await apiClient.get('/admin/analytics/overview');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getRevenueAnalytics: async (startDate, endDate) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await apiClient.get(`/admin/analytics/revenue?${params}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getUserAnalytics: async () => {
    try {
      const response = await apiClient.get('/admin/analytics/users');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // System Settings (placeholders for future implementation)
  getSystemSettings: async () => {
    try {
      const response = await apiClient.get('/admin/settings');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  updateSystemSettings: async (settings) => {
    try {
      const response = await apiClient.put('/admin/settings', settings);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default adminService; 