import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const organizerAPI = axios.create({
    baseURL: `${API_URL}/organizers`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
organizerAPI.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const organizerService = {
    // Dashboard Statistics
    getDashboardStats: () => organizerAPI.get('/dashboard/stats'),

    // Profile Management
    getProfile: () => organizerAPI.get('/profile'),
    updateProfile: (data) => organizerAPI.put('/profile', data),

    // Booking Management
    createBooking: (data) => organizerAPI.post('/bookings', data),
    getBookings: (params) => organizerAPI.get('/bookings', { params }),
    getBookingDetails: (bookingId) => organizerAPI.get(`/bookings/${bookingId}`),
    cancelBooking: (bookingId, data) => organizerAPI.put(`/bookings/${bookingId}/cancel`, data),

    // Payment Management
    makePayment: (bookingId, data) => organizerAPI.post(`/bookings/${bookingId}/payment`, data),
    getPaymentDetails: (bookingId) => organizerAPI.get(`/bookings/${bookingId}/payment`),
    markEventCompleted: (bookingId) => organizerAPI.post(`/bookings/${bookingId}/complete`),
    disputePayment: (bookingId, data) => organizerAPI.post(`/bookings/${bookingId}/dispute`, data),

    // Rating Management
    submitArtistRating: (bookingId, formData) => 
        organizerAPI.post('/ratings', {
            booking_id: bookingId,
            ...formData
        }),
    checkBookingRating: (bookingId) => 
        organizerAPI.get(`/ratings/${bookingId}`)
};

export default organizerService; 