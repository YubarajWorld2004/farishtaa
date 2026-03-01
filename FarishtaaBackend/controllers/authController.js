const {validationResult}=require('express-validator');
const User=require('../model/User');
const bcrypt=require('bcryptjs');
const {firstNameValidation,lastNameValidation,emailValidation,passwordValidation}=require('./validations');
const jwt=require('jsonwebtoken');

exports.postSignup=[
    firstNameValidation,
    lastNameValidation,
    emailValidation,
    passwordValidation,

    
    ,async (req,res,next)=>{
        const errors=validationResult(req);
        console.log('Validation Errors : ',errors);
    console.log("User body : ",req.body);
    const {firstName,lastName,email,password,userType,age,gender}=req.body;
      if(!errors.isEmpty()){
      return res.status(422).json({errorMessages : errors.array().map(err=>err.msg)});
      }
    try{
    const hashedPassword = await bcrypt.hash(password, 12);
     const user=new User({firstName,lastName,email,password : hashedPassword,userType,age,gender});
     await user.save();
     res.status(201).json({message : 'user created' , Details : user});
    }catch(error){
res.status(500).json({message : error.message});
    }
}]


exports.postLogin=async (req,res,next)=>{
    console.log('Request body',req.body);
      const {email,password}=req.body;
    try {
        const user=await User.findOne({email});
        if(!user)
            return res.status(401).json({errorMessages : ["Invalid email or password"]});
        const isPasswordCorrect=await bcrypt.compare(password,user.password);
        if(!isPasswordCorrect)
            return res.status(401).json({errorMessages : ["Invalid email or password"]});

        const token=jwt.sign({userId : user._id , userType : user.userType},process.env.JWT_SECRET,{expiresIn : "1h"});

        res.status(200).json({token ,userType : user.userType , userId : user._id, firstName : user.firstName});
    }catch(error){
         res.status(500).json({errorMessages : [error.message]});
    }

}
