
const mongoose=require('mongoose');


const doctorSchema=new mongoose.Schema({
name : {type : String, required : true},
photoUrl : {type : String, required : true},
specialist : {type : String, required : true},
experience  : {type : Number, required : true},
degree : {type : String, required : true},
languages : {type : [String],required : true},
address : {type : String,required : true},
about : {type : String , required : true}, 
location : {
    type : {
        type : String,
        enum : ["Point"]
    },
    coordinates : {
        type : [Number] ,
        required : true
    }
},
reviews : [{type : mongoose.Schema.Types.ObjectId, ref : 'Review' }]
});
doctorSchema.index({location : "2dsphere"});

module.exports=mongoose.model('Doctor',doctorSchema);
