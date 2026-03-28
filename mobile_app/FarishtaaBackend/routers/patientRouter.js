const express=require('express');
const patientRouter=express.Router();
const patientController=require('../controllers/patientController');

// Session management
patientRouter.get('/sessions/:userId', patientController.getSessions);
patientRouter.post('/sessions/:userId', patientController.createSession);
patientRouter.delete('/sessions/:userId/:sessionId', patientController.deleteSession);

// Chat within a session
patientRouter.post('/symptoms/:userId/:sessionId', patientController.postSymptomChecker);
patientRouter.get('/symptoms/:userId/:sessionId', patientController.getPreviousChats);

    module.exports=patientRouter;