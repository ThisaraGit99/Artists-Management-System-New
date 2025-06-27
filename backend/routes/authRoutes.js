const express = require('express');
const router = express.Router();

// Import controllers
const {
    register,
    login,
    logout,
    getProfile,
    updateProfile,
    changePassword,
    refreshToken,
    verifyEmail,
    forgotPassword,
    requestVerification,
    getVerificationStatus
} = require('../controllers/authController');

// Import middleware
const { authenticateToken } = require('../middlewares/auth');
const {
    validateRegistration,
    validateLogin,
    handleValidationErrors
} = require('../middlewares/validation');

// Import validation
const { body } = require('express-validator');

// Custom validation for password change
const validatePasswordChange = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
    
    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error('Password confirmation does not match new password');
            }
            return true;
        }),
    
    handleValidationErrors
];

// Custom validation for profile update
const validateProfileUpdate = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    
    body('phone')
        .optional()
        .isMobilePhone()
        .withMessage('Please provide a valid phone number'),
    
    handleValidationErrors
];

// Custom validation for forgot password
const validateForgotPassword = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    
    handleValidationErrors
];

// Auth Routes

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateRegistration, register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateLogin, login);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authenticateToken, logout);

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticateToken, getProfile);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, validateProfileUpdate, updateProfile);

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', authenticateToken, validatePasswordChange, changePassword);

// @route   POST /api/auth/refresh-token
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh-token', authenticateToken, refreshToken);

// @route   POST /api/auth/verify-email
// @desc    Verify email address
// @access  Private
router.post('/verify-email', authenticateToken, verifyEmail);

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', validateForgotPassword, forgotPassword);

// @route   POST /api/auth/request-verification
// @desc    Request account verification
// @access  Private
router.post('/request-verification', authenticateToken, requestVerification);

// @route   GET /api/auth/verification-status
// @desc    Get user verification status
// @access  Private
router.get('/verification-status', authenticateToken, getVerificationStatus);

// @route   GET /api/auth/check
// @desc    Check if user is authenticated
// @access  Private
router.get('/check', authenticateToken, (req, res) => {
    res.status(200).json({
        success: true,
        message: 'User is authenticated',
        data: {
            user: req.user
        }
    });
});

// Health check route
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Auth service is running',
        timestamp: new Date().toISOString()
    });
});

module.exports = router; 