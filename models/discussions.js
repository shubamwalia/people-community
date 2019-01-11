const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const DiscussionSchema = new Schema({
    title:{
        type:String,
        required:true
    },
    details:{
        type:String,
        required:true
    },
    author:{
        type:String,
        required:true
    },
    communityaccess:{
        type:String,
        required:true
    },
    useraccess:{
        type:String,
        required:true
    },
    date:{
        type:String,
        default:new Date().toDateString()
    }
}); 

mongoose.model("discussions",DiscussionSchema);