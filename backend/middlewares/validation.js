const { body, param, query, validationResult } = require('express-validator');

// Helper function to handle validation results
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(error => ({
                field: error.path,
                message: error.msg,
                value: error.value
            }))
        });
    }
    next();
};

// User registration validation
const validateRegistration = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    
    body('role')
        .isIn(['artist', 'organizer'])
        .withMessage('Role must be either artist or organizer'),
    
    body('phone')
        .optional()
        .isMobilePhone()
        .withMessage('Please provide a valid phone number'),
    
    handleValidationErrors
];

// User login validation
const validateLogin = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    
    handleValidationErrors
];

// Artist profile validation
const validateArtistProfile = [
    body('genre')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Genre must be between 2 and 100 characters'),
    
    body('bio')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Bio must not exceed 1000 characters'),
    
    body('experience_years')
        .optional()
        .isInt({ min: 0, max: 50 })
        .withMessage('Experience years must be between 0 and 50'),
    
    body('hourly_rate')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Hourly rate must be a positive number'),
    
    body('location')
        .optional()
        .trim()
        .isLength({ max: 255 })
        .withMessage('Location must not exceed 255 characters'),
    
    handleValidationErrors
];

// Package validation
const validatePackage = [
    body('title')
        .trim()
        .isLength({ min: 3, max: 255 })
        .withMessage('Package title must be between 3 and 255 characters'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must not exceed 1000 characters'),
    
    body('price')
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
    
    body('duration')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Duration is required and must not exceed 100 characters'),
    
    body('category')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Category must not exceed 100 characters'),
    
    handleValidationErrors
];

// Booking validation
const validateBooking = [
    body('artist_id')
        .isInt({ min: 1 })
        .withMessage('Valid artist ID is required'),
    
    body('event_name')
        .trim()
        .isLength({ min: 3, max: 255 })
        .withMessage('Event name must be between 3 and 255 characters'),
    
    body('event_date')
        .isISO8601()
        .toDate()
        .custom((value) => {
            if (value < new Date()) {
                throw new Error('Event date must be in the future');
            }
            return true;
        }),
    
    body('event_time')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Event time must be in HH:MM format'),
    
    body('venue_address')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Venue address must not exceed 500 characters'),
    
    body('total_amount')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Total amount must be a positive number'),
    
    handleValidationErrors
];

// Feedback validation
const validateFeedback = [
    body('rating')
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be between 1 and 5'),
    
    body('comment')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Comment must not exceed 1000 characters'),
    
    handleValidationErrors
];

// ID parameter validation
const validateId = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Valid ID is required'),
    
    handleValidationErrors
];

// Pagination validation
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    
    query('sort')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Sort must be either asc or desc'),
    
    handleValidationErrors
];

// Search validation
const validateSearch = [
    query('q')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Search query must be between 1 and 100 characters'),
    
    query('genre')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Genre filter must not exceed 100 characters'),
    
    query('location')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Location filter must not exceed 100 characters'),
    
    query('min_price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Minimum price must be a positive number'),
    
    query('max_price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Maximum price must be a positive number'),
    
    handleValidationErrors
];

// Organizer profile validation
const validateOrganizerProfile = [
    body('organization_name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 255 })
        .withMessage('Organization name must be between 2 and 255 characters'),
    
    body('organization_type')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Organization type must not exceed 100 characters'),
    
    body('website')
        .optional()
        .isURL()
        .withMessage('Please provide a valid website URL'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must not exceed 1000 characters'),
    
    body('location')
        .optional()
        .trim()
        .isLength({ max: 255 })
        .withMessage('Location must not exceed 255 characters'),
    
    handleValidationErrors
];

module.exports = {
    validateRegistration,
    validateLogin,
    validateArtistProfile,
    validatePackage,
    validateBooking,
    validateFeedback,
    validateId,
    validatePagination,
    validateSearch,
    validateOrganizerProfile,
    handleValidationErrors
}; 