const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/doctorDashboardController');
const appointmentController = require('../controllers/appointmentController');
const telemedicineController = require('../controllers/telemedicineController');
const prescriptionController = require('../controllers/prescriptionController');
const notificationController = require('../controllers/notificationController');
const { uploadTelemedicineFiles, uploadPrescriptionFile } = require('../middleware/upload');

router.get('/profile', dashboardController.getDoctorProfile);
router.put('/profile', dashboardController.updateDoctorProfile);
router.get('/stats', dashboardController.getDoctorStats);
router.get('/reviews', dashboardController.getDoctorReviews);

// Appointment workflow (doctor side)
router.get('/appointments', appointmentController.getDoctorAppointments);
router.patch('/appointments/:appointmentId/status', appointmentController.updateAppointmentStatus);

// Telemedicine sessions/messages (doctor side)
router.get('/telemedicine/sessions', telemedicineController.getDoctorTelemedicineSessions);
router.get('/telemedicine/sessions/:sessionId/messages', telemedicineController.getDoctorTelemedicineMessages);
router.post(
	'/telemedicine/sessions/:sessionId/messages',
	uploadTelemedicineFiles.array('files', 5),
	telemedicineController.sendDoctorTelemedicineMessage
);

// Digital prescriptions
router.get('/prescriptions', prescriptionController.getDoctorPrescriptions);
router.post('/prescriptions', uploadPrescriptionFile.single('file'), prescriptionController.createPrescription);

// Doctor notifications
router.get('/notifications', notificationController.getMyNotifications);
router.patch('/notifications/read-all', notificationController.markAllMyNotificationsRead);
router.patch('/notifications/:notificationId/read', notificationController.markMyNotificationRead);

module.exports = router;
