const express=require('express');
const patientRouter=express.Router();
const patientController=require('../controllers/patientController');
const appointmentController = require('../controllers/appointmentController');
const telemedicineController = require('../controllers/telemedicineController');
const prescriptionController = require('../controllers/prescriptionController');
const notificationController = require('../controllers/notificationController');
const { uploadTelemedicineFiles } = require('../middleware/upload');

// Session management
patientRouter.get('/sessions/:userId', patientController.getSessions);
patientRouter.post('/sessions/:userId', patientController.createSession);
patientRouter.delete('/sessions/:userId/:sessionId', patientController.deleteSession);

// Chat within a session
patientRouter.post('/symptoms/:userId/:sessionId', patientController.postSymptomChecker);
patientRouter.get('/symptoms/:userId/:sessionId', patientController.getPreviousChats);

// Appointment booking and status
patientRouter.get('/appointments/doctor/:doctorId/slots', appointmentController.getDoctorSlots);
patientRouter.post('/appointments/payment/order', appointmentController.createAppointmentPaymentOrder);
patientRouter.post('/appointments/payment/verify-and-book', appointmentController.verifyAppointmentPaymentAndBook);
patientRouter.post('/appointments/book', appointmentController.bookAppointment);
patientRouter.get('/appointments', appointmentController.getPatientAppointments);
patientRouter.patch('/appointments/:appointmentId/cancel', appointmentController.cancelPatientAppointment);

// Patient notifications
patientRouter.get('/notifications', notificationController.getPatientNotifications);
patientRouter.patch('/notifications/read-all', notificationController.markAllPatientNotificationsRead);
patientRouter.patch('/notifications/:notificationId/read', notificationController.markPatientNotificationRead);

// Telemedicine sessions and messages
patientRouter.get('/telemedicine/sessions', telemedicineController.getPatientTelemedicineSessions);
patientRouter.get('/telemedicine/sessions/:sessionId/messages', telemedicineController.getPatientTelemedicineMessages);
patientRouter.post(
    '/telemedicine/sessions/:sessionId/messages',
    uploadTelemedicineFiles.array('files', 5),
    telemedicineController.sendPatientTelemedicineMessage
);

// Prescription management (patient side)
patientRouter.get('/prescriptions', prescriptionController.getPatientPrescriptions);
patientRouter.get('/prescriptions/:prescriptionId', prescriptionController.getPatientPrescriptionById);

    module.exports=patientRouter;