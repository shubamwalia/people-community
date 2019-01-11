const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const CommentSchema = new Schema({
    usercomment:{
        type:String,
        required:true
    },
    discussionaccess:{
        type:String,
        required:true
    },
    useraccess:{
        type:String,
        required:true
    },
    author:{
        type:String,
        required:true
    },
    userphoto:{
        type:String,
        required:true
    },
    date:{
        type:String,
        default:new Date().toDateString()
    }
}); 

mongoose.model("comments",CommentSchema);