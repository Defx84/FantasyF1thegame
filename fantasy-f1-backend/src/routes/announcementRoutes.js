const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { auth } = require('../middleware/auth');
const isAppAdmin = require('../middleware/isAppAdmin');

// Debug logging
console.log({
  getActiveAnnouncements: typeof announcementController.getActiveAnnouncements,
  getAllAnnouncements: typeof announcementController.getAllAnnouncements,
  createAnnouncement: typeof announcementController.createAnnouncement,
  updateAnnouncement: typeof announcementController.updateAnnouncement,
  deleteAnnouncement: typeof announcementController.deleteAnnouncement
});

// Public routes
router.get('/active', auth, announcementController.getActiveAnnouncements);

// System admin routes
router.get('/', auth, isAppAdmin, announcementController.getAllAnnouncements);
router.post('/', auth, isAppAdmin, announcementController.createAnnouncement);
router.put('/:id', auth, isAppAdmin, announcementController.updateAnnouncement);
router.delete('/:id', auth, isAppAdmin, announcementController.deleteAnnouncement);

module.exports = router; 