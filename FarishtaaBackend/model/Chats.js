
const mongoose=require('mongoose');
const chatsSchema=new mongoose.Schema({
   role : {type :String ,required : true , enum : ["assistant" , "patient"]},
   content : {type : String ,required : true},
   createdAt : {type : Date , default : Date.now()},
   user : {type : mongoose.Schema.Types.ObjectId, ref : 'User'},
},
);

 
module.exports=mongoose.model('Chats',chatsSchema);

 
 
 
 
