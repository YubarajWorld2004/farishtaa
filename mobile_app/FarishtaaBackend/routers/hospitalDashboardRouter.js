const express = require('express');
const router = express.Router();
const hospitalController = require('../controllers/hospitalDashboardController');

router.get('/profile', hospitalController.getHospitalProfile);
router.put('/profile', hospitalController.updateHospitalProfile);
router.get('/stats', hospitalController.getHospitalStats);
router.get('/doctors', hospitalController.getDoctors);
router.post('/doctors', hospitalController.addDoctor);
router.delete('/doctors/:doctorId', hospitalController.removeDoctor);
router.get('/doctors/:doctorId', hospitalController.getDoctorDetail);
router.get('/doctors/:doctorId/reviews', hospitalController.getDoctorReviews);

module.exports = router;
