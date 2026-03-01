const express=require('express');
const doctorRouter=express.Router();
const doctorController=require('../controllers/doctorController');
const { isLoggedIn, isPatient } = require('../middleware/auth');

doctorRouter.post('/add-doctor',doctorController.postAddDoctor);
doctorRouter.post('/add-review',isLoggedIn,isPatient,doctorController.postAddReview);
doctorRouter.post('/nearby-search/:category',doctorController.searchNearbyBySpecialist);
doctorRouter.get('/categories',doctorController.getCategories);
doctorRouter.get('/view-profile/:doctorId',doctorController.getDoctorById);
    module.exports=doctorRouter;