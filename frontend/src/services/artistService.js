import axios from 'axios';
import api from './api';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const artistAPI = axios.create({
    baseURL: `${API_URL}/artists`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
artistAPI.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const artistService = {
    // Dashboard Statistics
    getDashboardStats: () => artistAPI.get('/dashboard/stats'),

    // Profile Management
    getProfile: () => artistAPI.get('/profile'),
    updateProfile: (data) => artistAPI.put('/profile', data),
    completeProfile: (data) => artistAPI.post('/profile/complete', data),

    // Skills Management
    getSkills: () => artistAPI.get('/skills'),
    addSkill: (data) => artistAPI.post('/skills', data),
    removeSkill: (skillId) => artistAPI.delete(`/skills/${skillId}`),

    // Availability Management
    getAvailability: () => artistAPI.get('/availability'),
    setAvailability: (data) => artistAPI.post('/availability', data),
    updateAvailability: (availabilityId, data) => artistAPI.put(`/availability/${availabilityId}`, data),
    removeAvailability: (availabilityId) => artistAPI.delete(`/availability/${availabilityId}`),

    // Portfolio Management
    getPortfolio: () => artistAPI.get('/portfolio'),
    addPortfolioItem: (data) => artistAPI.post('/portfolio', data),
    updatePortfolioItem: (itemId, data) => artistAPI.put(`/portfolio/${itemId}`, data),
    removePortfolioItem: (itemId) => artistAPI.delete(`/portfolio/${itemId}`),

    // Package Management
    getPackages: () => artistAPI.get('/packages'),
    addPackage: (data) => artistAPI.post('/packages', data),
    updatePackage: (packageId, data) => artistAPI.put(`/packages/${packageId}`, data),
    deletePackage: (packageId) => artistAPI.delete(`/packages/${packageId}`),
    togglePackageStatus: (packageId) => artistAPI.patch(`/packages/${packageId}/toggle`),

    // Booking Management
    getBookings: (params) => artistAPI.get('/bookings', { params }),
    getBookingDetails: (bookingId) => artistAPI.get(`/bookings/${bookingId}`),
    respondToBooking: (bookingId, data) => artistAPI.post(`/bookings/${bookingId}/respond`, data),
    updateBookingStatus: (bookingId, data) => artistAPI.put(`/bookings/${bookingId}/status`, data),

    // Public Browse (for organizers)
    browseArtists: (filters) => artistAPI.get('/browse', { params: filters }),
    getArtistDetails: (artistId) => artistAPI.get(`/browse/${artistId}`),

    // Rating Management
    getArtistRatings: (artistId = null) => 
        artistId ? artistAPI.get(`/ratings/${artistId}`) : artistAPI.get('/ratings'),
    
    getArtistRatingBrief: (artistId) => 
        artistAPI.get(`/ratings/${artistId}/brief`),

    // Get artist's average rating for display in lists
    getArtistRatingBrief: async (artistId) => {
        return await api.get(`/artist/ratings/${artistId}/brief`);
    }
};

export default artistService;
