import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

// Create Auth Context
const AuthContext = createContext();

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true;

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Set up axios interceptor for token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check if user is logged in on app load
  useEffect(() => {
    checkAuth();
  }, []);

  // Check authentication status
  const checkAuth = async () => {
    try {
      const storedToken = localStorage.getItem('token');
      
      if (storedToken) {
        setToken(storedToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        
        // Verify token with backend
        const response = await axios.get('/auth/profile');
        
        if (response.data.success) {
          setUser(response.data.data);
        } else {
          throw new Error('Invalid token');
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (credentials) => {
    try {
      setLoading(true);
      
      const response = await axios.post('/auth/login', credentials);
      
      if (response.data.success) {
        const { user, token } = response.data.data;
        
        // Store token and user data
        localStorage.setItem('token', token);
        setToken(token);
        setUser(user);
        
        // Set axios header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        toast.success('Login successful!');
        return { success: true, user };
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      toast.error(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      
      const response = await axios.post('/auth/register', userData);
      
      if (response.data.success) {
        const { user, token } = response.data.data;
        
        // Store token and user data
        localStorage.setItem('token', token);
        setToken(token);
        setUser(user);
        
        // Set axios header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        toast.success('Registration successful!');
        return { success: true, user };
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      toast.error(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Call logout endpoint
      await axios.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage and state
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      delete axios.defaults.headers.common['Authorization'];
      toast.success('Logged out successfully');
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put('/auth/profile', profileData);
      
      if (response.data.success) {
        setUser(response.data.data);
        toast.success('Profile updated successfully!');
        return { success: true, user: response.data.data };
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Profile update failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Change password
  const changePassword = async (passwordData) => {
    try {
      const response = await axios.put('/auth/change-password', passwordData);
      
      if (response.data.success) {
        toast.success('Password changed successfully!');
        return { success: true };
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Password change failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Refresh token
  const refreshToken = async () => {
    try {
      const response = await axios.post('/auth/refresh-token');
      
      if (response.data.success) {
        const { token, user } = response.data.data;
        localStorage.setItem('token', token);
        setToken(token);
        setUser(user);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        return { success: true };
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return { success: false };
    }
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return user && user.role === role;
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    return user && roles.includes(user.role);
  };

  // Get user's dashboard route based on role
  const getDashboardRoute = () => {
    if (!user) return '/';
    
    switch (user.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'artist':
        return '/artist/dashboard';
      case 'organizer':
        return '/organizer/dashboard';
      default:
        return '/';
    }
  };

  // Auth context value
  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshToken,
    checkAuth,
    hasRole,
    hasAnyRole,
    getDashboardRoute,
    isAuthenticated: !!user && !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext; 