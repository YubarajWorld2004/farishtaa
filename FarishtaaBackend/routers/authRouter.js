const express=require('express');
const authRouter=express.Router();
const authController=require('../controllers/authController');
const { isLoggedIn } = require('../middleware/auth');

authRouter.post('/signup',authController.postSignup);
authRouter.post('/login',authController.postLogin);
authRouter.post('/push-token', isLoggedIn, authController.registerFcmToken);
authRouter.delete('/push-token', isLoggedIn, authController.removeFcmToken);


    module.exports=authRouter;