const express = require('express');
const { createPaymentRecord, verifyMyPayment, paystackWebhook, getMyPayments, getAllPayments } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const authorize = require('../middleware/roles');
const router = express.Router();

// Webhook signature is verified against the raw request bytes preserved by index.js.
router.post('/webhook/paystack', paystackWebhook);
router.get('/me', protect, authorize('customer'), getMyPayments);
router.post('/', protect, authorize('customer'), createPaymentRecord);
router.get('/verify/:reference', protect, authorize('customer'), verifyMyPayment);
router.get('/', protect, authorize('property_manager', 'admin', 'super_admin'), getAllPayments);

module.exports = router;
