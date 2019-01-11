const express = require("express");
const app = express();
const exphbs = require("express-handlebars");
const mongoose = require("mongoose");
const session = require("express-session");
const flash = require("connect-flash");
const bodyParser = require("body-parser");
const passport = require("passport");
const methodOverride = require("method-override");
const path = require("path");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const crypto = require("crypto");
const { ensureAuthenticated } = require("./helpers/auth");
const { ifcond, idorrolecheck, find, notmatch, findname, checkrole, findpendingcommunities, not } = require("./helpers/hbs");
const port = 8000;

//Including static css and js files
app.use(express.static(path.join(__dirname + '/public')));

//Set storage engine for multer
const storage = multer.diskStorage({
    destination: "./public/upload/profile",
    filename: function (req, file, cb) {
        crypto.randomBytes(16, function (err, buf) {
            if (err) {
                console.log(err);
            }
            else {
                cb(null, buf.toString("hex")
                    + path.extname(file.originalname));
            }
        });
    }
});

//checkfiletype
function checkfiletype(file, cb) {
    //Allowed ext
    const filetypes = /jpeg|jpg|png|gif/;
    //check ext
    const extname = filetypes.test(path.extname
        (file.originalname).toLowerCase());
    //check mime
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    }
    else {
        cb("Error:Images Only");
    }
}

//init upload
const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        checkfiletype(file, cb);
    }
}).single("profilephoto");

//setting global promise for mongoose
mongoose.Promise = global.Promise;

//mongoose connection
mongoose.connect("mongodb://localhost/people", {
    useNewUrlParser: true
}).then(function () {
    console.log("mongodb connected...");
}).catch(function (err) {
    console.log(err);
});

//loading users
require("./models/users");
const User = mongoose.model("users");

//loading admin resources
const admin = require("./routes/admin");

//loading community resources
const community = require("./routes/community");

//loading user resources
const user = require("./routes/user");

//configuring passport
require("./config/passport")(passport);

//Handlebars middleware
app.engine("handlebars", exphbs(
    {
        helpers: {
            ifcond: ifcond,
            idorrolecheck: idorrolecheck,
            find: find,
            notmatch: notmatch,
            findname: findname,
            checkrole: checkrole,
            findpendingcommunities: findpendingcommunities,
            not:not
        },
        defaultLayout: "main"
    }
));
app.set("view engine", "handlebars");


//Body-parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


//Express-session middleware
app.use(session({
    secret: "secret",
    resave: true,
    saveUninitialized: true
}));

//Flash middleware
app.use(flash());

//Passport middleware
app.use(passport.initialize());
app.use(passport.session());

//Method override middleware
app.use(methodOverride("_method"));

//Setting variable for flash by creating own middleware
app.use(function (req, res, next) {
    res.locals.success_msg = req.flash("success_msg");
    res.locals.error_msg = req.flash("error_msg");
    res.locals.error = req.flash("error");
    if (req.user) {
        res.locals.user = req.user;
    }
    else {
        res.locals.user = null;
    }
    next();
});

function profilecheck(user) {
    if (user.role == "admin") {
        if ((user.email != undefined) && (user.name != undefined) && (user.dob != undefined) && (user.phone != undefined) && (user.gender != undefined) && (user.city != undefined)) {
            return true;
        }
        else {
            return false;
        }
    }
    else {
        if ((user.email != undefined) && (user.name != undefined) && (user.dob != undefined) && (user.phone != undefined) && (user.gender != undefined) && (user.city != undefined) && (user.journeydetails != undefined) && (user.expectationdetails != undefined)) {
            return true;
        }
        else {
            return false;
        }
    }
}

//Post request from login page
app.post('/', function (req, res, next) {
    passport.authenticate("local", function (err, user, info) {
        if (err) {
            req.flash("error_msg", info.message);
        }
        if (!user) {
            req.flash("error_msg", info.message);
            return res.redirect("/");
        }
        req.logIn(user, function (err) {
            if (err) { return next(err); }
            if (profilecheck(user)) {
                return res.redirect("/profile/" + user.id);
            }
            else {
                return res.redirect("/addProfile");
            }
        });
    })(req, res, next);
});

//Routing for admin resources
app.use("/admin", admin);

//Routing for community resources
app.use("/community", community);


//Routing for user resources
app.use("/user", user);



//Routing Login page
app.get("/", function (req, res) {
    if(req.user){
        res.redirect("/profile/"+req.user.id);
    }
    else{
        res.render("users/login");
    }
   
});

//Routing profile page
app.get("/profile/:id", ensureAuthenticated, function (req, res) {
    if (profilecheck(req.user)) {
        User.findOne({ _id: req.params.id }).then(function (result) {
            res.render("profile", {
                users: result
            });
        });
    }
    else {
        req.flash("error_msg", "Please fill your profile first");
        res.redirect("/addprofile");
    }

});

//Routing add profile page
app.get("/addprofile", ensureAuthenticated, function (req, res) {
    User.findOne({ _id: req.user.id }).then(function (result) {
        res.render("addprofile", {
            users: result
        });
    });
});


//Routing edit profile page
app.get("/editprofile", ensureAuthenticated, function (req, res) {
    if (profilecheck(req.user)) {
        User.findOne({ _id: req.user.id }).then(function (result) {
            res.render("editprofile", {
                users: result
            });
        });
    }
    else {
        req.flash("error_msg", "Please fill your profile first");
        res.redirect("/addprofile");
    }
});

//Routing to changepassword
app.get("/changepassword", ensureAuthenticated, function (req, res) {
    User.findOne({ _id: req.user.id }).then(function () {
        res.render("users/changepassword");
    });
});

//Routing to logout
app.get("/logout", function (req, res) {
    req.logOut();
    res.redirect("/");
});

//Put request from add profile
app.put("/addprofile", ensureAuthenticated, function (req, res) {
    User.findOneAndUpdate({ _id: req.user.id }, {
        name: req.body.name,
        dob: req.body.dob,
        gender: req.body.gender,
        access: req.user.id,
        email: req.user.email,
        city: req.user.city,
        phone: req.user.phone,
        expectationdetails: req.body.expectationdetails,
        journeydetails: req.body.journeydetails,
    }).then(function () {
        req.flash("success_msg", "Successfully updated");
        res.redirect("/profile/" + req.user.id);
    });
});

app.post("/profilephoto", function (req, res) {
    User.findOne({_id:req.user.id}).then(function(result){
        upload(req, res, function (err) {
            if (err) {
                req.flash("error_msg", err.message);
                res.render("addprofile",{
                    users:result
                });
            }
            else {
                if (req.file != undefined) {
                    result.profilephoto=`/upload/profile/${req.file.filename}`;
                    result.save().then(function(result2){
                        req.flash("success_msg", "File uploaded");
                        res.render("addprofile",{
                            users:result2
                        });
                    });
                }
                else{
                    req.flash("error_msg", "No file selected");
                    res.render("addprofile",{
                       users:result 
                    });
                }
            }
        });
    });
});

//Put request from edit profile
app.put("/editprofile", ensureAuthenticated, function (req, res) {
    User.findOneAndUpdate({ _id: req.user.id }, {
        name: req.body.name,
        dob: req.body.dob,
        gender: req.body.gender,
        access: req.user.id,
        email: req.user.email,
        city: req.body.city,
        phone: req.body.phone,
        expectationdetails:req.body.expectationdetails,
        journeydetails:req.body.journeydetails
    }).then(function () {
        req.flash("success_msg", "Successfully updated");
        res.redirect("/profile/" + req.user.id);
    });
});

app.post("/editprofilephoto", function (req, res) {
    User.findOne({_id:req.user.id}).then(function(result){
        upload(req, res, function (err) {
            if (err) {
                req.flash("error_msg", err.message);
                res.render("editprofile",{
                    users:result
                });
            }
            else {
                if (req.file != undefined) {
                    result.profilephoto=`/upload/profile/${req.file.filename}`;
                    result.save().then(function(result2){
                        req.flash("success_msg", "File uploaded");
                        res.render("editprofile",{
                            users:result2
                        });
                    });
                }
                else{
                    req.flash("error_msg", "No file selected");
                    res.render("editprofile",{
                       users:result 
                    });
                }
            }
        });
    });
});

//Put request from change password
app.put("/changepassword", ensureAuthenticated, function (req, res) {
    User.findOne({ _id: req.user.id }).then(function (result) {

        bcrypt.compare(req.body.oldpassword, result.password, function (err, isMatch) {
            if (err) {
                throw err;
            }
            if (isMatch) {
                bcrypt.genSalt(10, function (err, salt) {
                    bcrypt.hash(req.body.newpassword, salt, function (err, hash) {
                        if (err) {
                            throw err;
                        }
                        User.findOneAndUpdate({ _id: req.user.id }, {
                            password: hash
                        }).then(function () {
                            req.flash("success_msg", "Successfully Updated");
                            res.redirect("/changepassword");
                        }).catch(function (err) {
                            console.log(err);
                            return;
                        });
                    });
                });
            }
            else {
                req.flash("error_msg", "Old Password Incorrect");
                res.redirect("/changepassword");
            }
        });
    });
});

app.get("*", function (req, res) {
    res.render("error404");
});
//Listening Port
app.listen(port, function () {
    console.log(`Starting at ${port}`);
});