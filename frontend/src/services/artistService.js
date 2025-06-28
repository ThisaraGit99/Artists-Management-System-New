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
    updateProfile: async (data) => {
        console.log('Sending profile update request with FormData');
        
        try {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            };
            
            const response = await artistAPI.put('/profile', data, config);
            console.log('Profile update response:', response.data);
            
            // Immediately verify the update
            const verifyResponse = await artistAPI.get('/profile');
            console.log('Profile after update:', {
                profile_image: verifyResponse.data.data?.profile_image,
                bio: verifyResponse.data.data?.bio?.substring(0, 20) + '...',
                genres: verifyResponse.data.data?.genres
            });
            
            return response;
        } catch (error) {
            console.error('Profile update error:', error.response?.data || error.message);
            throw error;
        }
    },
    completeProfile: async (data) => {
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        };
        return artistAPI.post('/profile/complete', data, config);
    },

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
