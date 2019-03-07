if(process.env.NODE_ENV === "production"){
    module.exports = {
        //replace it with production URI
        mongoURI:" "
    }
}
else{
    module.exports = {
        mongoURI:"mongodb://localhost/people"
    }
}