const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

// Generate JWT token
const generateToken = (payload) => {
    try {
        return jwt.sign(payload, JWT_SECRET, {
            expiresIn: JWT_EXPIRE,
            issuer: 'artist-management-system'
        });
    } catch (error) {
        throw new Error('Token generation failed: ' + error.message);
    }
};

// Verify JWT token
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Token has expired');
        } else if (error.name === 'JsonWebTokenError') {
            throw new Error('Invalid token');
        } else {
            throw new Error('Token verification failed: ' + error.message);
        }
    }
};

// Decode token without verification (for debugging)
const decodeToken = (token) => {
    try {
        return jwt.decode(token);
    } catch (error) {
        throw new Error('Token decode failed: ' + error.message);
    }
};

module.exports = {
    generateToken,
    verifyToken,
    decodeToken,
    JWT_SECRET,
    JWT_EXPIRE
}; 