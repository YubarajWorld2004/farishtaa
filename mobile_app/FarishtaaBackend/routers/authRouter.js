const express=require('express');
const authRouter=express.Router();
const authController=require('../controllers/authController');

authRouter.post('/signup',authController.postSignup);
authRouter.post('/login',authController.postLogin);


    module.exports=authRouter;