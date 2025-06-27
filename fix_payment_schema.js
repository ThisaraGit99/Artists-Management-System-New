const { executeQuery } = require('./backend/config/database');

async function fixPaymentSchema() {
    console.log('=== Fixing Payment Schema ===\n');
    
    try {
        // 1. Update payment_status enum to include 'released'
        console.log('1. Updating payment_status enum...');
        const updateEnum = "ALTER TABLE bookings MODIFY COLUMN payment_status ENUM('pending', 'paid', 'released', 'refunded') DEFAULT 'pending'";
        const enumResult = await executeQuery(updateEnum);
        
        if (enumResult.success) {
            console.log('✅ Payment status enum updated successfully');
        } else {
            console.log('❌ Failed to update enum:', enumResult.error);
        }
        
        // 2. Add platform_fee column if it doesn't exist
        console.log('\n2. Adding platform_fee column...');
        const addPlatformFee = "ALTER TABLE bookings ADD COLUMN platform_fee DECIMAL(10,2) DEFAULT 0";
        const platformFeeResult = await executeQuery(addPlatformFee);
        
        if (platformFeeResult.success) {
            console.log('✅ Platform fee column added successfully');
        } else {
            console.log('❌ Platform fee column may already exist:', platformFeeResult.error);
        }
        
        // 3. Add net_amount column if it doesn't exist
        console.log('\n3. Adding net_amount column...');
        const addNetAmount = "ALTER TABLE bookings ADD COLUMN net_amount DECIMAL(10,2)";
        const netAmountResult = await executeQuery(addNetAmount);
        
        if (netAmountResult.success) {
            console.log('✅ Net amount column added successfully');
        } else {
            console.log('❌ Net amount column may already exist:', netAmountResult.error);
        }
        
        // 4. Verify the final structure
        console.log('\n4. Verifying final table structure...');
        const finalStructure = await executeQuery('DESCRIBE bookings');
        
        if (finalStructure.success) {
            console.log('Final bookings table structure:');
            finalStructure.data.forEach(col => {
                if (col.Field.includes('payment') || col.Field.includes('platform') || col.Field.includes('net')) {
                    console.log(`✓ ${col.Field}: ${col.Type}`);
                }
            });
        }
        
        // 5. Test a sample booking update
        console.log('\n5. Testing payment status update...');
        const testBooking = await executeQuery('SELECT id FROM bookings WHERE status = "confirmed" LIMIT 1');
        
        if (testBooking.success && testBooking.data.length > 0) {
            const bookingId = testBooking.data[0].id;
            console.log(`Testing with booking ID: ${bookingId}`);
            
            // Test setting payment status to 'paid'
            const testUpdate = await executeQuery(
                'UPDATE bookings SET payment_status = ?, platform_fee = ?, net_amount = ? WHERE id = ?',
                ['paid', 10.00, 90.00, bookingId]
            );
            
            if (testUpdate.success) {
                console.log('✅ Payment status update test successful');
                
                // Check the updated booking
                const updatedBooking = await executeQuery('SELECT payment_status, platform_fee, net_amount FROM bookings WHERE id = ?', [bookingId]);
                if (updatedBooking.success) {
                    const booking = updatedBooking.data[0];
                    console.log(`Payment Status: ${booking.payment_status}`);
                    console.log(`Platform Fee: ${booking.platform_fee}`);
                    console.log(`Net Amount: ${booking.net_amount}`);
                }
            } else {
                console.log('❌ Payment status update test failed:', testUpdate.error);
            }
        } else {
            console.log('⚠️ No confirmed bookings found for testing');
        }
        
        console.log('\n🎉 Payment schema fix completed!');
        
    } catch (error) {
        console.error('Schema fix failed:', error.message);
    }
}

fixPaymentSchema(); 