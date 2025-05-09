const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const checkSystemAdmin = require('../middleware/checkSystemAdmin');
const {
    getSystemAdminStatus,
    addSystemAdmin,
    updateSystemAdminPermissions,
    removeSystemAdmin
} = require('../controllers/systemAdminController');

// All routes require authentication and system admin privileges
router.use(authenticate);
router.use(checkSystemAdmin);

// Get current user's system admin status
router.get('/status', getSystemAdminStatus);

// System admin management routes
router.post('/', addSystemAdmin);
router.put('/:adminId/permissions', updateSystemAdminPermissions);
router.delete('/:adminId', removeSystemAdmin);

module.exports = router; 