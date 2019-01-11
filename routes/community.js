const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const exphbs = require("express-handlebars");
const bcrypt = require("bcryptjs");
const path = require("path");
const multer = require("multer");
const crypto = require("crypto");
const { ensureAuthenticated } = require("../helpers/auth");
const { ifcond, idorrolecheck, find, notmatch, findpendingcommunities} = require("../helpers/hbs");

//loading community schema
require("../models/communities");
const Community = mongoose.model("communities");
require("../models/users");
const User = mongoose.model("users");

require("../models/comments");
const Comment = mongoose.model("comments");

//loading discussion schema
require("../models/discussions");
const Discussion = mongoose.model("discussions");

//Set storage engine for multer
const storage = multer.diskStorage({
    destination: "./public/upload/community",
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
}).single("communityphoto");


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

//not joined communities list
router.get("/list", ensureAuthenticated, function (req, res) {
    if (profilecheck(req.user)) {
        User.findOne({ _id: req.user.id }).then(function (result) {
            Community.find().then(function (result2) {
                res.render("community/list", {
                    communities: result2,
                    communitiesjoined: result.communitiesjoinedaccess,
                    pendingcommunities: result.pendingcommunitiesaccess
                });
            });
        });
    }
    else {
        req.flash("error_msg", "Please fill your profile first");
        res.redirect("/addprofile");
    }
});

router.get("/communitypanel", ensureAuthenticated, function (req, res) {
    if (profilecheck(req.user)) {
        Community.find().then(function (result) {
            res.render("community/communitypanel", {
                communities: result,
                userid: req.user.id,
                communitiesjoined: req.user.communitiesjoinedaccess,
                pendingcommunities: req.user.pendingcommunitiesaccess
            });
        });
    }
    else {
        req.flash("error_msg", "Please fill your profile first");
        res.redirect("/addprofile");
    }
});

router.get("/addcommunity", ensureAuthenticated, function (req, res) {
    if (profilecheck(req.user)) {
        res.render("community/addcommunity");
    }
    else {
        req.flash("error_msg", "Please fill your profile first");
        res.redirect("/addprofile");
    }
});

router.get("/editcommunity/:id", ensureAuthenticated, function (req, res) {
    if (profilecheck(req.user)) {
        Community.findOne({ _id: req.params.id }).then(function (result) {
            res.render("community/editcommunity", {
                communities: result
            });
        });
    }
    else {
        req.flash("error_msg", "Please fill your profile first");
        res.redirect("/addprofile");
    }

});

router.get("/managecommunity/:id", ensureAuthenticated, function (req, res) {
    if (profilecheck(req.user)) {
        //joined user finding
        let joinedusersmembersid = [];
        let joinedadminmembersid = [];
        User.find().then(function (result4) {
            for (let i = 0; i < result4.length; i++) {
                for (let j = 0; j < result4[i].communitiesjoinedaccess.length; j++) {
                    if (result4[i].communitiesjoinedaccess[j] == req.params.id) {
                        if ((result4[i].role == "admin") || (result4[i].role == "communitybuilder")) {
                            joinedadminmembersid.push(result4[i].id);
                        }
                        else {
                            joinedusersmembersid.push(result4[i].id);
                        }
                    }
                }
            }
            //ending of finding
            User.find({ _id: joinedadminmembersid }).then(function (result) {
                User.find({ _id: joinedusersmembersid }).then(function (result2) {
                    Community.findOne({_id:req.params.id}).then(function(result3){
                        res.render("community/managecommunity", {
                            joinedmembers: result2,
                            joinedadmins: result,
                            memberscount: joinedusersmembersid.length+joinedadminmembersid.length,
                            communities:result3
                        });
                    });
                });
            });
        });
    }
    else {
        req.flash("error_msg", "Please fill your profile first");
        res.redirect("/addprofile");
    }
});

router.get("/deletecommunity/:id", ensureAuthenticated, function (req, res) {
    if (profilecheck(req.user)) {
        Discussion.remove({ communityaccess: req.params.id }).then(function () {
            Community.findOneAndRemove({ _id: req.params.id }).then(function () {
                User.find().then(function (result) {
                    for (let i = 0; i < result.length; i++) {
                        for (let j = 0; j < result[i].pendingcommunitiesaccess.length; j++) {
                            if (result[i].pendingcommunitiesaccess[j] == req.params.id) {
                                result[i].pendingcommunitiesaccess.splice(j, 1);
                                j--;
                            }
                        }
                        for (let j = 0; j < result[i].communitiesjoinedaccess.length; j++) {
                            if (result[i].communitiesjoinedaccess[j] == req.params.id) {
                                result[i].communitiesjoinedaccess.splice(j, 1);
                                j--;
                            }
                        }
                        result[i].save();
                    }
                }).then(function () {
                    req.flash("success_msg", "Successfully removed");
                    if(req.user.role == "admin"){
                        res.redirect("/admin/communitylist");
                    }
                    else{
                    res.redirect("/community/communitypanel");
                    }
                });
            });
        });
    }
    else {
        req.flash("error_msg", "Please fill your profile first");
        res.redirect("/addprofile");
    }
});


router.get("/discussions/:id", ensureAuthenticated, function (req, res) {
    let discussionsid = [];
    if (profilecheck(req.user)) {
        Discussion.find({ communityaccess: req.params.id }).then(function (result) {
           for(let i = 0; i < result.length; i++){
               discussionsid.push(result[i].id);
           }
           Comment.find({discussionaccess:discussionsid}).then(function(result2){
                    Community.findOne({_id:req.params.id}).then(function(result3){
                        res.render("community/discussions", {
                            discussions: result,
                            community: req.params.id,
                            userid: req.user.id,
                            userrole: req.user.role,
                            comments:result2,
                            communities:result3
                        });
                    });
           });
        });
    }
    else {
        req.flash("error_msg", "Please fill your profile first");
        res.redirect("/addprofile");
    }
});

router.get("/deletediscussion/:id", ensureAuthenticated, function (req, res) {
    if (profilecheck(req.user)) {
        Discussion.findOneAndRemove({ _id: req.params.id }).then(function (result) {
            req.flash("success_msg", "Successfully removed");
            res.redirect("/community/discussions/" + result.communityaccess);
        });
    }
    else {
        req.flash("error_msg", "Please fill your profile first");
        res.redirect("/addprofile");
    }
});


router.get("/communityprofile/:id", ensureAuthenticated, function (req, res) {
    if (profilecheck(req.user)) {
        let joinedusers = [];
        Community.findOne({ _id: req.params.id }).then(function (result) {
            User.findOne({ _id: result.useraccess }).then(function (result2) {
                Discussion.find({ useraccess: result2.id, communityaccess: req.params.id }).then(function (result3) {
                    //joined user finding
                    User.find().then(function (result4) {
                        for (let i = 0; i < result4.length; i++) {
                            for (let j = 0; j < result4[i].communitiesjoinedaccess.length; j++) {
                                if (result4[i].communitiesjoinedaccess[j] == req.params.id) {
                                    joinedusers.push(result4[i].id);
                                }
                            }
                        }
                        //ending of finding
                        res.render("community/communityprofile", {
                            communities: result,
                            users: result2,
                            discussions: result3,
                            usercount: joinedusers.length
                        });
                    });
                });
            });
        });
    }
    else {
        req.flash("error_msg", "Please fill your profile first");
        res.redirect("/addprofile");
    }
});

router.get("/viewmembers/:id", ensureAuthenticated, function (req, res) {
    if (profilecheck(req.user)) {
        //joined user finding
        let joinedusersmembersid = [];
        let joinedadminmembersid = [];
        User.find().then(function (result4) {
            for (let i = 0; i < result4.length; i++) {
                for (let j = 0; j < result4[i].communitiesjoinedaccess.length; j++) {
                    if (result4[i].communitiesjoinedaccess[j] == req.params.id) {
                        if ((result4[i].role == "admin") || (result4[i].role == "communitybuilder")) {
                            joinedadminmembersid.push(result4[i].id);
                        }
                        else {
                            joinedusersmembersid.push(result4[i].id);
                        }
                    }
                }
            }
            //ending of finding
            User.find({ _id: joinedadminmembersid }).then(function (result) {
                User.find({ _id: joinedusersmembersid }).then(function (result2) {
                    Community.findOne({_id: req.params.id}).then(function(result3){
                        res.render("community/viewmembers", {
                            joinedmembers: result2,
                            joinedadmins: result,
                            communities:result3,
                            memberscount:joinedadminmembersid.length+joinedusersmembersid.length
                        });
                    })
                });
            });
        });
    }
    else {
        req.flash("error_msg", "Please fill your profile first");
        res.redirect("/addprofile");
    }
});

router.get("/requests/:id", ensureAuthenticated, function (req, res) {
    if (profilecheck(req.user)) {
        Community.findOne({ _id: req.params.id }).then(function (result) {
            User.find({ _id: result.usersrequests }).then(function (result2) {
                res.render("community/requests", {
                    users: result2,
                    communityid: req.params.id,
                    communities:result
                });
            });
        });
    }
    else {
        req.flash("error_msg", "Please fill your profile first");
        res.redirect("/addprofile");
    }
});

router.get("/acceptrequest/:id/:id2", ensureAuthenticated, function (req, res) {
    if (profilecheck(req.user)) {
        User.findOne({ _id: req.params.id }).then(function (result) {
            for (let i = 0; i < result.pendingcommunitiesaccess.length; i++) {
                if (req.params.id2 == result.pendingcommunitiesaccess[i]) {
                    result.communitiesjoinedaccess.push(req.params.id2);
                    result.pendingcommunitiesaccess.splice(i, 1);
                    i--;
                    result.save().then(function () {
                        Community.findOne({ _id: req.params.id2 }).then(function (result2) {
                            for (let j = 0; j < result2.usersrequests.length; j++) {
                                if (req.params.id == result2.usersrequests[j]) {
                                    result2.usersrequests.splice(j, 1);
                                    j--;
                                    result2.save().then(function () {
                                        req.flash("success_msg", "Successfully Accepted");
                                        res.redirect("/community/requests/" + req.params.id2);
                                    });
                                }
                            }
                        });
                    });
                }
            }
        });
    }
    else {
        req.flash("error_msg", "Please fill your profile first");
        res.redirect("/addprofile");
    }
});


router.get("/rejectrequest/:id/:id2", ensureAuthenticated, function (req, res) {
    if (profilecheck(req.user)) {
        User.findOne({ _id: req.params.id }).then(function (result) {
            for (let i = 0; i < result.pendingcommunitiesaccess.length; i++) {
                if (req.params.id2 == result.pendingcommunitiesaccess[i]) {
                    result.pendingcommunitiesaccess.splice(i, 1);
                    i--;
                    result.save().then(function () {
                        Community.findOne({ _id: req.params.id2 }).then(function (result2) {
                            for (let j = 0; j < result2.usersrequests.length; j++) {
                                if (req.params.id == result2.usersrequests[j]) {
                                    result2.usersrequests.splice(j, 1);
                                    j--;
                                    result2.save().then(function () {
                                        req.flash("success_msg", "Successfully Rejected");
                                        res.redirect("/community/requests/" + req.params.id2);
                                    });
                                }
                            }
                        });
                    });
                }
            }
        });
    }
    else {
        req.flash("error_msg", "Please fill your profile first");
        res.redirect("/addprofile");
    }
});

router.get("/commentdelete/:id/:id2", ensureAuthenticated, function (req, res) {
    if (profilecheck(req.user)) {
        Comment.findOneAndRemove({_id:req.params.id}).then(function(){
            res.redirect("/community/discussions/"+req.params.id2);
        });
    }
    else {
        req.flash("error_msg", "Please fill your profile first");
        res.redirect("/addprofile");
    }
});

router.get("/removemember/:id/:id2", ensureAuthenticated, function (req, res) {
    if (profilecheck(req.user)) {
       User.findOne({_id:req.params.id}).then(function(result){
            for(let i = 0; i < result.communitiesjoinedaccess.length; i++){
                if(result.communitiesjoinedaccess[i] == req.params.id2){
                    result.communitiesjoinedaccess.splice(i,1);
                    result.save().then(function(){
                        req.flash("success_msg", "Successfully Removed");
                        res.redirect("/community/managecommunity/"+req.params.id2);
                    });
                }
            }
       });
    }
    else {
        req.flash("error_msg", "Please fill your profile first");
        res.redirect("/addprofile");
    }
});

router.put("/editcommunity/:id", function (req, res) {
    Community.findOneAndUpdate({ _id: req.params.id }, {
        name: req.body.name,
        description: req.body.description
    }).then(function () {
        req.flash("success_msg", "Successfully updated");
        if(req.user.role == "admin"){
            res.redirect("/admin/communitylist");
        }
        else{
            res.redirect("/community/communitypanel");
        }
    });
});

router.put("/editdiscussion/:id", function (req, res) {
    Discussion.findOneAndUpdate({ _id: req.params.id }, {
        title: req.body.title,
        details: req.body.details
    }).then(function (result) {
        req.flash("success_msg", "Successfully updated");
        res.redirect("/community/discussions/" + result.communityaccess);
    });
});

router.post("/addcommunity", function (req, res) {
    let community = {
        name: req.body.name,
        description: req.body.description,
        useraccess: req.user.id,
        rule: req.body.rule,
    };
    new Community(community).save().then(function (result) {
        User.findOne({ _id: req.user.id }).then(function (result2) {
            result2.communitiesjoinedaccess.push(result.id);
            result2.save().then(function () {
                req.flash("success_msg", "Successfully Created");
                res.redirect("/community/communitypanel");
            });
        });
    });
});

router.post("/adddiscussion/:id", function (req, res) {
    let discussion = {
        title: req.body.title,
        details: req.body.details,
        author: req.user.name,
        communityaccess: req.params.id,
        useraccess: req.user.id
    };
    new Discussion(discussion).save().then(function () {
        req.flash("success_msg", "Successfully Posted");
        res.redirect("/community/discussions/" + req.params.id);
    });
});

router.post("/addcomment/:id/:id2", function (req, res) {
    let comment = {
        usercomment:req.body.comment,
        discussionaccess: req.params.id,
        useraccess:req.user.id,
        author:req.user.name,
        userphoto:req.user.profilephoto
    };
    new Comment(comment).save().then(function () {
        req.flash("success_msg", "Successfully Posted");
        res.redirect("/community/discussions/" + req.params.id2);
    });
});

router.post("/communityphoto/:id", function (req, res) {
    Community.findOne({_id:req.params.id}).then(function(result){
        upload(req, res, function (err) {
            if (err) {
                req.flash("error_msg", err.message);
                res.render("community/managecommunity",{
                    communities:result
                });
            }
            else {
                if (req.file != undefined) {
                    result.communityphoto=`/upload/community/${req.file.filename}`;
                    result.save().then(function(result2){
                        req.flash("success_msg", "File uploaded");
                        res.render("community/managecommunity",{
                            communities:result2
                        });
                    });
                }
                else{
                    req.flash("error_msg", "No file selected");
                    res.render("community/managecommunity",{
                       communities:result 
                    });
                }
            }
        });
    });
});

module.exports = router;