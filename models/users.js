const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    name:{
        type:String,
        required:false
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true  
    },
    dob:{
        type:String,
        required:false
    },
    gender:{
        type:String,
        required:false
    },
    date:{
        type:Date,
        default:Date.now
    },
    phone:{
        type:String,
        required:true
    },
    city:{
        type:String,
        required:true
    },
    role:{
        type:String,
        required:true
    },
    journeydetails:{
        type:String,
        required:false
    },
    expectationdetails:{
        type:String,
        required:false
    },
    status:{
        type:String,
        default:"pending"
    },
    switchuser:{
        type:Boolean,
        default:false
    },
    communitiesjoinedaccess:[String],
    pendingcommunitiesaccess:[String],
    profilephoto:{
        type:String,
        default:"/upload/profile/default.png"
    },
    access:{
        type:String,
        required:false
    }
}); 

mongoose.model("users",UserSchema);