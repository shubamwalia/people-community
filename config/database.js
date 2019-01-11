if(process.env.NODE_ENV === "production"){
    module.exports = {
        mongoURI:"mongodb://shubamwalia:shubhwalia1@ds255364.mlab.com:55364/people-prod"
    }
}
else{
    module.exports = {
        mongoURI:"mongodb://localhost/people"
    }
}