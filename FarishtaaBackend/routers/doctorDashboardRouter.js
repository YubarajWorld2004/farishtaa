const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/doctorDashboardController');

router.get('/profile', dashboardController.getDoctorProfile);
router.put('/profile', dashboardController.updateDoctorProfile);
router.get('/stats', dashboardController.getDoctorStats);
router.get('/reviews', dashboardController.getDoctorReviews);

module.exports = router;
