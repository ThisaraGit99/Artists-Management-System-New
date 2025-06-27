const { executeQuery } = require('./config/database');

async function fixBookingsTable() {
    console.log('Fixing bookings table structure...');

    try {
        // 1. Add organizer_id column if it doesn't exist
        console.log('1. Adding organizer_id column...');
        try {
            await executeQuery(`
                ALTER TABLE bookings 
                ADD COLUMN organizer_id INT NOT NULL AFTER artist_id
            `);
            console.log('✓ Added organizer_id column');
        } catch (error) {
            if (error.message.includes('Duplicate column name')) {
                console.log('✓ organizer_id column already exists');
            } else {
                console.log('✗ Error adding organizer_id:', error.message);
            }
        }

        // 2. Update payment_status enum to include new values
        console.log('2. Updating payment_status enum...');
        try {
            await executeQuery(`
                ALTER TABLE bookings 
                MODIFY COLUMN payment_status ENUM(
                    'pending_payment',
                    'paid',
                    'funds_held', 
                    'payment_released',
                    'refunded',
                    'pending',
                    'confirmed'
                ) DEFAULT 'pending_payment'
            `);
            console.log('✓ Updated payment_status enum');
        } catch (error) {
            console.log('✗ Error updating payment_status:', error.message);
        }

        // 3. Add event_status column
        console.log('3. Adding event_status column...');
        try {
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
            console.log('✓ Added event_status column');
        } catch (error) {
            if (error.message.includes('Duplicate column name')) {
                console.log('✓ event_status column already exists');
            } else {
                console.log('✗ Error adding event_status:', error.message);
            }
        }

        // 4. Add payment tracking columns
        const paymentColumns = [
            { name: 'platform_fee', definition: 'DECIMAL(10,2) DEFAULT 0' },
            { name: 'net_amount', definition: 'DECIMAL(10,2) DEFAULT 0' },
            { name: 'payment_receipt', definition: 'TEXT NULL' },
            { name: 'payment_date', definition: 'DATETIME NULL' },
            { name: 'auto_release_date', definition: 'DATETIME NULL' }
        ];

        for (const column of paymentColumns) {
            console.log(`4. Adding ${column.name} column...`);
            try {
                await executeQuery(`
                    ALTER TABLE bookings 
                    ADD COLUMN ${column.name} ${column.definition}
                `);
                console.log(`✓ Added ${column.name} column`);
            } catch (error) {
                if (error.message.includes('Duplicate column name')) {
                    console.log(`✓ ${column.name} column already exists`);
                } else {
                    console.log(`✗ Error adding ${column.name}:`, error.message);
                }
            }
        }

        // 5. Add message column if it doesn't exist
        console.log('5. Adding message column...');
        try {
            await executeQuery(`
                ALTER TABLE bookings 
                ADD COLUMN message TEXT NULL AFTER special_requirements
            `);
            console.log('✓ Added message column');
        } catch (error) {
            if (error.message.includes('Duplicate column name')) {
                console.log('✓ message column already exists');
            } else {
                console.log('✗ Error adding message:', error.message);
            }
        }

        // 6. Set default organizer_id for existing bookings (assuming organizer with id 1 exists)
        console.log('6. Setting default organizer_id for existing bookings...');
        try {
            const result = await executeQuery(`
                UPDATE bookings 
                SET organizer_id = 1 
                WHERE organizer_id IS NULL OR organizer_id = 0
            `);
            console.log('✓ Updated existing bookings with default organizer_id');
        } catch (error) {
            console.log('✗ Error updating organizer_id:', error.message);
        }

        // 7. Show final table structure
        console.log('7. Final table structure:');
        const describeResult = await executeQuery('DESCRIBE bookings');
        if (describeResult.success) {
            describeResult.data.forEach(col => {
                console.log(`  ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
            });
        }

        console.log('\n✅ Bookings table fix completed!');

    } catch (error) {
        console.error('❌ Error fixing bookings table:', error);
    }
}

fixBookingsTable(); 