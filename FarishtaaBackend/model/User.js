

const mongoose=require('mongoose');


const userSchema=new mongoose.Schema({
firstName : {type : String, required : true},
lastName : {type : String, required : true},
email : {type : String, required : true , unique : true},
password : {type : String, required : true},
userType : {type : String, required : true, enum : ['Doctor', 'Patient', 'Hospital'] },
age  : {type : Number},
gender : {type : String, enum : ['Male','Female','Others']},
chats : [{type : mongoose.Schema.Types.ObjectId, ref : 'Chats'}],
// Doctor-specific fields (only used when userType === 'Doctor')
specialist : {type : String},
experience : {type : Number},
degree : {type : String},
languages : {type : [String]},
about : {type : String},
address : {type : String},
photoUrl : {type : String},
availability : [{
  day : {type : String, enum : ['All Days','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']},
  startTime : {type : String},
  endTime : {type : String}
}],
location : {
  type : {
    type : String,
    enum : ["Point"]
  },
  coordinates : {
    type : [Number]
  }
},
doctorReviews : [{type : mongoose.Schema.Types.ObjectId, ref : 'Review'}],
profileCompleted : {type : Boolean, default : false},
// Hospital-specific fields (only used when userType === 'Hospital')
hospitalName : {type : String},
hospitalAddress : {type : String},
hospitalPhone : {type : String},
hospitalAbout : {type : String},
doctors : [{type : mongoose.Schema.Types.ObjectId, ref : 'User'}]
});

userSchema.index({location : "2dsphere"});

module.exports=mongoose.model('User',userSchema);

 
 
 
 
