
const mongoose=require('mongoose');


const reviewSchema=new mongoose.Schema({
targetId : {type : mongoose.Schema.Types.ObjectId, ref : 'targetModel' , required : true},
targetModel : {type :String,enum : ["Doctor","Hospital"] , required : true},
patientId : {type : mongoose.Schema.Types.ObjectId, ref : 'User' , required : true},
rating : {type :  Number , min : 1 , max : 5 , required  : true},
review : {type : String},
createdAt : {type : Date , default : Date.now},

});


module.exports=mongoose.model('Review',reviewSchema);
