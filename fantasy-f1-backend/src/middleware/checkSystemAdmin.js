const SystemAdmin = require('../models/SystemAdmin');

const checkSystemAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const systemAdmin = await SystemAdmin.findOne({ user: req.user._id });
        
        if (!systemAdmin) {
            return res.status(403).json({ 
                message: 'Access denied. System administrator privileges required.' 
            });
        }

        // Update last access time
        systemAdmin.lastAccess = new Date();
        await systemAdmin.save();

        // Add system admin info to request
        req.systemAdmin = systemAdmin;
        next();
    } catch (error) {
        console.error('System admin check error:', error);
        res.status(500).json({ message: 'Error checking system admin status' });
    }
};

module.exports = checkSystemAdmin; 