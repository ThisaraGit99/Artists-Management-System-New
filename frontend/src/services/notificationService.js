import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const notificationAPI = axios.create({
    baseURL: `${API_URL}`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
notificationAPI.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const notificationService = {
    // Get notifications for current user
    getNotifications: (params) => notificationAPI.get('/notifications', { params }),
    
    // Mark notification as read
    markAsRead: (notificationId) => notificationAPI.put(`/notifications/${notificationId}/read`),
    
    // Mark all notifications as read
    markAllAsRead: () => notificationAPI.put('/notifications/mark-all-read'),
    
    // Get unread count
    getUnreadCount: () => notificationAPI.get('/notifications/unread-count'),
};

export default notificationService; 