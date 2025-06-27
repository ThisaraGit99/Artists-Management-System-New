const { executeQuery } = require('./backend/config/database');

async function setupPaymentSystem() {
    console.log('Setting up payment system database schema...\n');
    
    try {
        // Check current bookings table structure
        console.log('1. Checking current bookings table structure...');
        const currentStructure = await executeQuery('DESCRIBE bookings');
        const currentColumns = currentStructure.data.map(col => col.Field);
        console.log('Current columns:', currentColumns);
        
        // Add payment-related columns if they don't exist
        const paymentColumns = [
            { name: 'payment_status', sql: "ALTER TABLE bookings ADD COLUMN payment_status ENUM('pending', 'paid', 'released', 'refunded') DEFAULT 'pending'" },
            { name: 'payment_date', sql: "ALTER TABLE bookings ADD COLUMN payment_date DATETIME NULL" },
            { name: 'completion_date', sql: "ALTER TABLE bookings ADD COLUMN completion_date DATETIME NULL" },
            { name: 'platform_fee', sql: "ALTER TABLE bookings ADD COLUMN platform_fee DECIMAL(10,2) DEFAULT 0" },
            { name: 'net_amount', sql: "ALTER TABLE bookings ADD COLUMN net_amount DECIMAL(10,2)" }
        ];
        
        console.log('\n2. Adding payment columns to bookings table...');
        for (const column of paymentColumns) {
            if (!currentColumns.includes(column.name)) {
                console.log(`Adding column: ${column.name}`);
                const result = await executeQuery(column.sql);
                if (result.success) {
                    console.log(`✅ ${column.name} added successfully`);
                } else {
                    console.log(`❌ Failed to add ${column.name}:`, result.error);
                }
            } else {
                console.log(`✓ ${column.name} already exists`);
            }
        }
        
        // Create payments table
        console.log('\n3. Creating payments table...');
        const createPaymentsTable = `
            CREATE TABLE IF NOT EXISTS payments (
                id INT PRIMARY KEY AUTO_INCREMENT,
                booking_id INT NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                platform_fee DECIMAL(10,2) NOT NULL,
                net_amount DECIMAL(10,2) NOT NULL,
                status ENUM('pending', 'completed', 'refunded') DEFAULT 'completed',
                payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (booking_id) REFERENCES bookings(id)
            )
        `;
        
        const paymentsResult = await executeQuery(createPaymentsTable);
        if (paymentsResult.success) {
            console.log('✅ Payments table created successfully');
        } else {
            console.log('❌ Failed to create payments table:', paymentsResult.error);
        }
        
        // Create disputes table
        console.log('\n4. Creating disputes table...');
        const createDisputesTable = `
            CREATE TABLE IF NOT EXISTS disputes (
                id INT PRIMARY KEY AUTO_INCREMENT,
                booking_id INT NOT NULL,
                reported_by_id INT NOT NULL,
                issue_description TEXT,
                artist_response TEXT,
                artist_response_date DATETIME,
                status ENUM('pending', 'resolved_refund', 'resolved_release') DEFAULT 'pending',
                admin_notes TEXT,
                resolved_date DATETIME,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (booking_id) REFERENCES bookings(id),
                FOREIGN KEY (reported_by_id) REFERENCES users(id)
            )
        `;
        
        const disputesResult = await executeQuery(createDisputesTable);
        if (disputesResult.success) {
            console.log('✅ Disputes table created successfully');
        } else {
            console.log('❌ Failed to create disputes table:', disputesResult.error);
        }
        
        // Add indexes
        console.log('\n5. Adding database indexes...');
        const indexes = [
            "CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status)",
            "CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status)",
            "CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id)"
        ];
        
        for (const index of indexes) {
            const result = await executeQuery(index);
            if (result.success) {
                console.log('✅ Index created successfully');
            } else {
                console.log('❌ Failed to create index:', result.error);
            }
        }
        
        console.log('\n🎉 Payment system setup completed successfully!');
        
        // Verify final structure
        console.log('\n6. Final bookings table structure:');
        const finalStructure = await executeQuery('DESCRIBE bookings');
        finalStructure.data.forEach(col => {
            console.log(`- ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
        });
        
    } catch (error) {
        console.error('Setup failed:', error.message);
    }
}

setupPaymentSystem(); 