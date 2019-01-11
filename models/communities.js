const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CommunitySchema = new Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    rule:{
        type:String,
        required:true
    },
    usersrequests:[String],
    useraccess:{
        type:String,
        required:true
    },
    communityphoto:{
        type:String,
        default:"/upload/community/defaultcommunity.png"
    },
    date:{
        type:String,
        default:new Date().toDateString()
    }
}); 

mongoose.model("communities",CommunitySchema);