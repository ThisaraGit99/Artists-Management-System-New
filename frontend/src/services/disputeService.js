import api from './api';

class DisputeService {
  async reportNonDelivery(bookingId, disputeData) {
    try {
      const response = await api.post(`/disputes/bookings/${bookingId}/report-non-delivery`, disputeData);
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
      console.error('Error reporting non-delivery:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to report non-delivery'
      };
    }
  }

  async requestCancellation(bookingId, cancellationData) {
    try {
      const response = await api.post(`/disputes/bookings/${bookingId}/cancel`, cancellationData);
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
      console.error('Error requesting cancellation:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to request cancellation'
      };
    }
  }

  calculateCancellationPolicy(eventDate, userType = 'organizer') {
    try {
      const now = new Date();
      const eventDateTime = new Date(eventDate);
      const timeDiff = eventDateTime.getTime() - now.getTime();
      const daysUntilEvent = Math.ceil(timeDiff / (1000 * 3600 * 24));

      if (userType === 'organizer') {
        if (daysUntilEvent > 14) {
          return { daysUntilEvent, refundPercentage: 100, canCancel: true };
        } else if (daysUntilEvent >= 7) {
          return { daysUntilEvent, refundPercentage: 50, canCancel: true };
        } else {
          return { daysUntilEvent, refundPercentage: 0, canCancel: true };
        }
      }
      return { daysUntilEvent, refundPercentage: 0, canCancel: false };
    } catch (error) {
      console.error('Error calculating cancellation policy:', error);
      return { daysUntilEvent: 0, refundPercentage: 0, canCancel: false };
    }
  }
}

export default new DisputeService(); 