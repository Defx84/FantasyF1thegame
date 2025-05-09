const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { auth } = require('../middleware/auth');

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
router.get('/', auth, announcementController.getAllAnnouncements);
router.post('/', auth, announcementController.createAnnouncement);
router.put('/:id', auth, announcementController.updateAnnouncement);
router.delete('/:id', auth, announcementController.deleteAnnouncement);

module.exports = router; 