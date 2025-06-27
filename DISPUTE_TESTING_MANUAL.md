# 🧪 DISPUTE RESOLUTION SYSTEM - TESTING MANUAL

## 📊 **Current System Status**

### **✅ Available Test Users:**
- **ADMIN**: admin@artistmgmt.com (Password: admin123)
- **ORGANIZER**: jane.organizer@email.com (Verified) 
- **ARTIST**: john.artist@email.com (Verified)
- **ORGANIZER**: test01@mail.com (Verified)

### **📋 Existing Bookings:**
- **Booking #7**: "asdsd" - Status: completed, Payment: released ($50)
- **Booking #6**: "asdsd" - Status: confirmed, Payment: paid ($333)

---

## 🎯 **TESTING SCENARIOS**

### **Scenario 1: Test Non-Delivery Dispute (Using Existing Data)**

#### **Step 1: Login as Organizer**
1. Go to: `http://localhost:3000/login`
2. Email: `jane.organizer@email.com`
3. Password: `organizer123` (or whatever password was set)

#### **Step 2: Report Non-Delivery**
1. Navigate to "My Bookings" or "Booking Management"
2. Find Booking #7 (completed booking)
3. Click "Report Non-Delivery" or similar button
4. Fill in the dispute form:
   - **Reason**: "Artist did not show up for the event"
   - **Evidence**: "Event photos show no artist performance"
5. Submit the report

#### **Expected Result:**
- ✅ Dispute created in database
- ✅ Artist gets notification (2-day timer starts)
- ✅ Booking status changes to "not_delivered"

---

### **Scenario 2: Test Artist Response to Dispute**

#### **Step 1: Login as Artist**
1. Go to: `http://localhost:3000/login`
2. Email: `john.artist@email.com`
3. Password: `artist123` (or whatever password was set)

#### **Step 2: Respond to Dispute**
1. Navigate to artist dashboard
2. Look for dispute notification
3. Choose response:
   - **Option A**: Acknowledge non-delivery → Auto-refund
   - **Option B**: Dispute with evidence → Admin review

#### **Expected Results:**
- **Option A**: Immediate refund to organizer
- **Option B**: Case escalated to admin investigation

---

### **Scenario 3: Test Admin Dispute Resolution**

#### **Step 1: Login as Admin**
1. Go to: `http://localhost:3000/login`
2. Email: `admin@artistmgmt.com`
3. Password: `admin123`

#### **Step 2: Investigate Dispute**
1. Go to Admin Dashboard
2. Click "Dispute Management"
3. Review dispute details:
   - Organizer's complaint
   - Artist's response
   - Evidence from both parties
4. Make decision:
   - Favor Organizer (refund)
   - Favor Artist (release payment)
   - Partial refund

#### **Expected Result:**
- ✅ Decision recorded
- ✅ Payment processed accordingly
- ✅ Both parties notified

---

### **Scenario 4: Test Cancellation Policies**

#### **Step 1: Test Organizer Cancellation**
1. Login as organizer
2. Find an upcoming booking
3. Request cancellation
4. System calculates refund:
   - **>14 days**: 100% refund
   - **7-14 days**: 50% refund
   - **<7 days**: 0% refund

#### **Step 2: Test Artist Cancellation**
1. Login as artist
2. Try to cancel booking <7 days → Should be blocked
3. Try to cancel booking ≥7 days → Should work with 100% refund to organizer

---

## 🔧 **API Testing (Advanced)**

### **Test Dispute API Endpoints:**

```bash
# 1. Report Non-Delivery (Organizer)
curl -X POST http://localhost:5000/api/disputes/bookings/7/report-non-delivery \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Artist did not perform", "evidence": []}'

# 2. Artist Response
curl -X POST http://localhost:5000/api/disputes/disputes/1/respond \
  -H "Authorization: Bearer ARTIST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"response": "I performed as agreed", "action": "dispute", "evidence": "Photo proof"}'

# 3. Admin Get Disputes
curl -X GET http://localhost:5000/api/disputes/admin/disputes \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 4. Request Cancellation
curl -X POST http://localhost:5000/api/disputes/bookings/6/cancel \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Event cancelled due to weather"}'
```

---

## 🕒 **Automated Testing (2-Day Timer)**

### **Test Auto-Resolution:**
1. Create a dispute
2. Don't respond as artist for 2 days
3. System should automatically:
   - Resolve dispute in favor of organizer
   - Process refund
   - Send notifications

### **Note**: For testing purposes, you can modify the timer in `taskProcessor.js` to 2 minutes instead of 2 days.

---

## 📱 **Frontend Testing Checklist**

### **Organizer Interface:**
- [ ] Can report non-delivery
- [ ] Can request cancellation
- [ ] Sees refund policy preview
- [ ] Receives dispute status updates

### **Artist Interface:**
- [ ] Receives dispute notifications
- [ ] Can respond with evidence
- [ ] Cannot cancel <7 days before event
- [ ] Can cancel ≥7 days before event

### **Admin Interface:**
- [ ] Can view all disputes
- [ ] Can investigate with evidence
- [ ] Can make decisions
- [ ] Can see dispute statistics

---

## 🎯 **Quick Test Commands**

### **Create Test Booking for Disputes:**
```javascript
// Run in backend directory
node -e "
const { pool } = require('./config/database');
async function createTestBooking() {
  await pool.execute(\`
    INSERT INTO bookings (organizer_id, artist_id, event_name, event_date, 
                         event_time, total_amount, status, payment_status)
    VALUES (1, 1, 'Test Event for Dispute', '2024-12-15', '19:00:00', 
            100.00, 'completed', 'paid')
  \`);
  console.log('Test booking created for dispute testing');
  process.exit(0);
}
createTestBooking();
"
```

### **Reset Dispute Tables:**
```javascript
// Run in backend directory
node -e "
const { pool } = require('./config/database');
async function resetDisputes() {
  await pool.execute('DELETE FROM disputes');
  await pool.execute('DELETE FROM cancellation_requests');
  await pool.execute('DELETE FROM automated_tasks');
  console.log('Dispute tables reset');
  process.exit(0);
}
resetDisputes();
"
```

---

## 🚀 **Start Testing Now!**

1. **Backend**: Running on `http://localhost:5000`
2. **Frontend**: Running on `http://localhost:3000`
3. **Login Credentials**: Use the existing verified users above
4. **Test Data**: 7 existing bookings available for testing

### **Recommended Testing Order:**
1. ✅ Login with different user roles
2. ✅ Test non-delivery dispute reporting
3. ✅ Test artist responses
4. ✅ Test admin investigation
5. ✅ Test cancellation policies
6. ✅ Test automated features

**Happy Testing! 🎉** 