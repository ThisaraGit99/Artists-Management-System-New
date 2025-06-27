const { executeQuery } = require('./config/database');

async function columnExists(tableName, columnName) {
    try {
        const result = await executeQuery(`
            SELECT COUNT(*) as count 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = ? 
            AND COLUMN_NAME = ?
        `, [tableName, columnName]);
        
        return result.success && result.data[0].count > 0;
    } catch (error) {
        return false;
    }
}

async function setupPaymentSchema() {
    console.log('Setting up payment schema...');

    try {
        // Add payment status columns to bookings table
        if (!(await columnExists('bookings', 'payment_status'))) {
            console.log('Adding payment_status column...');
            await executeQuery(`
                ALTER TABLE bookings 
                ADD COLUMN payment_status ENUM(
                    'pending_payment',
                    'paid', 
                    'funds_held',
                    'payment_released',
                    'refunded'
                ) DEFAULT 'pending_payment' AFTER status
            `);
        } else {
            console.log('payment_status column already exists');
        }

        if (!(await columnExists('bookings', 'event_status'))) {
            console.log('Adding event_status column...');
            await executeQuery(`
                ALTER TABLE bookings 
                ADD COLUMN event_status ENUM(
                    'pending',
                    'confirmed', 
                    'in_progress',
                    'event_completed',
                    'completed',
                    'disputed',
                    'cancelled'
                ) DEFAULT 'pending' AFTER payment_status
            `);
        } else {
            console.log('event_status column already exists');
        }

        const columnsToAdd = [
            { name: 'auto_release_date', definition: 'DATETIME NULL', after: 'event_status' },
            { name: 'platform_fee', definition: 'DECIMAL(10,2) DEFAULT 0', after: 'auto_release_date' },
            { name: 'net_amount', definition: 'DECIMAL(10,2) DEFAULT 0', after: 'platform_fee' },
            { name: 'payment_receipt', definition: 'TEXT NULL', after: 'net_amount' },
            { name: 'payment_date', definition: 'DATETIME NULL', after: 'payment_receipt' }
        ];

        for (const column of columnsToAdd) {
            if (!(await columnExists('bookings', column.name))) {
                console.log(`Adding ${column.name} column...`);
                await executeQuery(`
                    ALTER TABLE bookings 
                    ADD COLUMN ${column.name} ${column.definition} AFTER ${column.after}
                `);
            } else {
                console.log(`${column.name} column already exists`);
            }
        }

        // Create payment transactions table
        console.log('Creating payment_transactions table...');
        await executeQuery(`
            CREATE TABLE IF NOT EXISTS payment_transactions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                booking_id INT NOT NULL,
                transaction_type ENUM('payment', 'release', 'refund') NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                platform_fee DECIMAL(10,2) NOT NULL,
                net_amount DECIMAL(10,2) NOT NULL,
                status ENUM('pending', 'completed') DEFAULT 'pending',
                notes TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
            )
        `);

        // Create notifications table
        console.log('Creating notifications table...');
        await executeQuery(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                type ENUM('booking', 'payment', 'event', 'system') NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                booking_id INT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
            )
        `);

        console.log('Payment schema setup completed successfully!');
        console.log('\nNew columns added to bookings table:');
        console.log('- payment_status (pending_payment, paid, funds_held, payment_released, refunded)');
        console.log('- event_status (pending, confirmed, in_progress, event_completed, completed, disputed, cancelled)');
        console.log('- auto_release_date (DATETIME)');
        console.log('- platform_fee (DECIMAL)');
        console.log('- net_amount (DECIMAL)');
        console.log('- payment_receipt (TEXT)');
        console.log('- payment_date (DATETIME)');
        console.log('\nNew tables created:');
        console.log('- payment_transactions');
        console.log('- notifications');

    } catch (error) {
        console.error('Error setting up payment schema:', error);
    }
}

setupPaymentSchema(); 