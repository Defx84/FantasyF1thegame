const Announcement = require('../models/Announcement');
const { handleError } = require('../utils/errorHandler');

/**
 * Get active announcements
 */
const getActiveAnnouncements = async (req, res) => {
    try {
        const now = new Date();
        
        const announcements = await Announcement.find({
            status: 'published',
            $or: [
                { endDate: { $exists: false } },
                { endDate: { $gt: now } }
            ]
        })
        .sort({ isPinned: -1, startDate: -1 })
        .populate('createdBy', 'username')
        .populate('lastUpdatedBy', 'username');

        res.json(announcements);
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * Create a new announcement
 */
const createAnnouncement = async (req, res) => {
    try {
        const announcement = await Announcement.create({
            ...req.body,
            createdBy: req.user._id,
            lastUpdatedBy: req.user._id
        });

        res.status(201).json(announcement);
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * Update an announcement
 */
const updateAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        
        const announcement = await Announcement.findByIdAndUpdate(
            id,
            {
                ...req.body,
                lastUpdatedBy: req.user._id
            },
            { new: true }
        );

        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        res.json(announcement);
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * Delete an announcement
 */
const deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        
        const announcement = await Announcement.findByIdAndDelete(id);

        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        res.json({ message: 'Announcement deleted successfully' });
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * Get all announcements (for system admins)
 */
const getAllAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find()
            .sort({ status: 1, startDate: -1 })
            .populate('createdBy', 'username')
            .populate('lastUpdatedBy', 'username');

        res.json(announcements);
    } catch (error) {
        handleError(res, error);
    }
};

exports.getActiveAnnouncements = getActiveAnnouncements;
exports.createAnnouncement = createAnnouncement;
exports.updateAnnouncement = updateAnnouncement;
exports.deleteAnnouncement = deleteAnnouncement;
exports.getAllAnnouncements = getAllAnnouncements; 