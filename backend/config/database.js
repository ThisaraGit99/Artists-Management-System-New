const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_NAME || 'artist_management_system',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
};

// Execute query with error handling
const executeQuery = async (query, params = []) => {
    try {
        // Log the query and parameters
        console.log('Executing SQL Query:', {
            query,
            params: params.map(p => p === null ? 'NULL' : p.toString())
        });
        
        const [results] = await pool.execute(query, params);
        
        // Log the results
        console.log('Query Results:', {
            affectedRows: results.affectedRows,
            insertId: results.insertId,
            changedRows: results.changedRows
        });
        
        return { success: true, data: results };
    } catch (error) {
        console.error('Database query error:', error.message);
        return { success: false, error: error.message };
    }
};

// Get connection from pool
const getConnection = async () => {
    try {
        return await pool.getConnection();
    } catch (error) {
        throw new Error('Failed to get database connection: ' + error.message);
    }
};

module.exports = {
    pool,
    testConnection,
    executeQuery,
    getConnection
}; 