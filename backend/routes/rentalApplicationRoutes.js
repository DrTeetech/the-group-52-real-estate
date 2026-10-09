const express = require('express');
const { createApplication, getMyApplications, getAllApplications, updateApplication, withdrawMyApplication } = require('../controllers/rentalApplicationController');
const { protect } = require('../middleware/auth');
const authorize = require('../middleware/roles');
const router = express.Router();
const staffRoles = ['agent', 'property_manager', 'admin', 'super_admin'];

router.get('/me', protect, authorize('customer'), getMyApplications);
router.post('/properties/:id', protect, authorize('customer'), createApplication);
router.post('/:id/withdraw', protect, authorize('customer'), withdrawMyApplication);
router.get('/', protect, authorize(...staffRoles), getAllApplications);
router.patch('/:id', protect, authorize('property_manager', 'admin', 'super_admin'), updateApplication);

module.exports = router;
