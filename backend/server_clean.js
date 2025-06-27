const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import database configuration
const { testConnection } = require('./config/database');

// Import routes
const authRoutes = require('./routes/authRoutes');
const artistRoutes = require('./routes/artistRoutes');
const eventRoutes = require('./routes/eventRoutes');
const adminRoutes = require('./routes/adminRoutes');
const organizerRoutes = require('./routes/organizerRoutes');
const disputeRoutes = require('./routes/disputeRoutes');

// Import task processor
const taskProcessor = require('./utils/taskProcessor');

// Initialize express app
const app = express();

// Port configuration
const PORT = process.env.PORT || 5000;

// Middleware setup
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Security headers
app.use((req, res, next) => {
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    next();
});

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Static files middleware
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Artist Management System API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/organizers', organizerRoutes);
app.use('/api/disputes', disputeRoutes);

// Additional routes will be added here
// app.use('/api/bookings', bookingRoutes);
// app.use('/api/feedback', feedbackRoutes);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Global Error Handler:', error);

    // Default error response
    let statusCode = error.statusCode || 500;
    let message = error.message || 'Internal Server Error';

    // Handle specific error types
    if (error.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation Error';
    } else if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    } else if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    } else if (error.code === 'ER_DUP_ENTRY') {
        statusCode = 409;
        message = 'Duplicate entry';
    }

    // Send error response
    res.status(statusCode).json({
        success: false,
        message: message,
        error: process.env.NODE_ENV === 'development' ? {
            stack: error.stack,
            details: error
        } : undefined
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    if (global.server) {
        global.server.close(() => {
            console.log('Process terminated');
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    if (global.server) {
        global.server.close(() => {
            console.log('Process terminated');
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
});

// Start server function
const startServer = async () => {
    try {
        // Test database connection
        const dbConnected = await testConnection();
        
        if (!dbConnected) {
            console.error('❌ Failed to connect to database. Server not started.');
            process.exit(1);
        }

        // Start the task processor
        taskProcessor.start();

        // Start the server
        const server = app.listen(PORT, () => {
            console.log('');
            console.log('🚀 ===================================');
            console.log('   Artist Management System API');
            console.log('🚀 ===================================');
            console.log(`   Server running on port ${PORT}`);
            console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`   Database: Connected ✅`);
            console.log(`   Task Processor: Started ✅`);
            console.log(`   Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
            console.log('🚀 ===================================');
            console.log('');
        });

        // Store server instance for graceful shutdown
        global.server = server;

    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

// Start the server
startServer();

module.exports = app; 