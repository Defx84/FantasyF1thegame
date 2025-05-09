const SystemAdmin = require('../models/SystemAdmin');
const User = require('../models/User');
const { handleError } = require('../utils/errorHandler');

/**
 * Get system admin status for a user
 */
const getSystemAdminStatus = async (req, res) => {
    try {
        const systemAdmin = await SystemAdmin.findOne({ user: req.user._id })
            .populate('user', 'username email');
        
        if (!systemAdmin) {
            return res.status(404).json({ 
                message: 'User is not a system administrator' 
            });
        }

        res.json(systemAdmin);
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * Add a new system administrator
 */
const addSystemAdmin = async (req, res) => {
    try {
        const { userId, permissions } = req.body;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if user is already a system admin
        const existingAdmin = await SystemAdmin.findOne({ user: userId });
        if (existingAdmin) {
            return res.status(400).json({ 
                message: 'User is already a system administrator' 
            });
        }

        // Create new system admin
        const systemAdmin = await SystemAdmin.create({
            user: userId,
            permissions: permissions || {
                systemMonitoring: true,
                userManagement: true,
                leagueManagement: true,
                systemSettings: true
            }
        });

        res.status(201).json(systemAdmin);
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * Update system admin permissions
 */
const updateSystemAdminPermissions = async (req, res) => {
    try {
        const { adminId } = req.params;
        const { permissions } = req.body;

        const systemAdmin = await SystemAdmin.findByIdAndUpdate(
            adminId,
            { permissions },
            { new: true }
        );

        if (!systemAdmin) {
            return res.status(404).json({ 
                message: 'System administrator not found' 
            });
        }

        res.json(systemAdmin);
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * Remove system admin privileges
 */
const removeSystemAdmin = async (req, res) => {
    try {
        const { adminId } = req.params;

        const systemAdmin = await SystemAdmin.findByIdAndDelete(adminId);

        if (!systemAdmin) {
            return res.status(404).json({ 
                message: 'System administrator not found' 
            });
        }

        res.json({ message: 'System administrator privileges removed' });
    } catch (error) {
        handleError(res, error);
    }
};

module.exports = {
    getSystemAdminStatus,
    addSystemAdmin,
    updateSystemAdminPermissions,
    removeSystemAdmin
}; 