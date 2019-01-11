const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { ensureAuthenticated } = require("../helpers/auth");

//loading users collection
require("../models/users");
const User = mongoose.model("users");

require("../models/communities");
const Community = mongoose.model("communities");

router.get("/joincommunity/:id", ensureAuthenticated, function (req, res) {
    User.findOne({ _id: req.user.id }).then(function (result) {
        result.communitiesjoinedaccess.push(req.params.id);
        result.save().then(function () {
            req.flash("success_msg", "Successfully updated");
            res.redirect("/community/communitypanel");
        });
    });
});

router.get("/leavecommunity/:id", ensureAuthenticated, function (req, res) {
    User.findOne({ _id: req.user.id }).then(function (result) {
        for (let i = 0; i < result.communitiesjoinedaccess.length; i++) {
            if (result.communitiesjoinedaccess[i] == req.params.id) {
                result.communitiesjoinedaccess.splice(i, 1);
                i--;
            }
        }
        result.save().then(function () {
            req.flash("success_msg", "Successfully left");
            res.redirect("/community/communitypanel");
        });
    });
});

router.get("/asktojoincommunity/:id", ensureAuthenticated, function(req,res){
    User.findOne({_id: req.user.id}).then(function (result) {
        result.pendingcommunitiesaccess.push(req.params.id);
        result.save().then(function () {
            Community.findOne({_id:req.params.id}).then(function(result2){
                result2.usersrequests.push(req.user.id);
                result2.save().then(function(){
                    req.flash("success_msg", "Successfully updated");
                    res.redirect("/community/communitypanel");
                });
            });
        });
    });
});

router.get("/cancelrequest/:id", ensureAuthenticated, function (req, res) {
    User.findOne({ _id: req.user.id }).then(function (result) {
        for (let i = 0; i < result.pendingcommunitiesaccess.length; i++) {
            if (req.params.id == result.pendingcommunitiesaccess[i]) {
                result.pendingcommunitiesaccess.splice(i, 1);
                i--;
                result.save().then(function () {
                    Community.findOne({ _id: req.params.id }).then(function (result2) {
                        for (let j = 0; j < result2.usersrequests.length; j++) {
                            if (req.user.id == result2.usersrequests[j]) {
                                result2.usersrequests.splice(j, 1);
                                j--;
                                result2.save().then(function () {
                                    req.flash("success_msg", "Successfully Cancelled");
                                    res.redirect("/community/communitypanel");
                                });
                            }
                        }
                    });
                });
            }
        }
    });
});
module.exports = router;