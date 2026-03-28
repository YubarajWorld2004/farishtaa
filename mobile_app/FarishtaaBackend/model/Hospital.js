
const mongoose=require('mongoose');


const hospitalSchema=new mongoose.Schema({
name : {type : String, required : true},
type : {type : String,  default: "hospital"},
specialists : {type : [String],default : ["general hospital"],lowercase : true},
address : {
    street: String,
      district: String,
     state: String,
      postcode: String
},
about : {type : String}, 
location : {
    type :{
        type : String,
        enum : ["Point"],
        required : true
    },
 coordinates : {type : [Number] , required : true } 
},
reviews : [{type : mongoose.Schema.Types.ObjectId, ref : 'Review' }],
ratings : {type : Number , default : 0}
});
hospitalSchema.index({location : "2dsphere"});
hospitalSchema.index({name :1 ,"location.coordinates" : 1},{unique : true});

module.exports=mongoose.model('Hospital',hospitalSchema);
