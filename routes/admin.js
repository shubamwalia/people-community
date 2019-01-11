const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const {ensureAuthenticated} = require("../helpers/auth");
const nodemailer = require("nodemailer");
const {ifcond,idorrolecheck,find,notmatch,findname} = require("../helpers/hbs");

//loading users collection
require("../models/users");
const User = mongoose.model("users");
require("../models/communities");
const Community = mongoose.model("communities");

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

//routing adduser
router.get("/adduser",ensureAuthenticated,function(req,res){
    if(profilecheck(req.user)){
    if(req.user.role=="admin"){
        res.render("admin/adduser");
    }
    else{
        req.flash("error_msg","Not Authorized");
        res.redirect("/profile/"+req.user.id);
    }
    }
    else {
        req.flash("error_msg", "Please fill your profile first");
        res.redirect("/addprofile");
    }
});

router.get("/userlist",ensureAuthenticated,function(req,res){
    if(profilecheck(req.user)){
    if(req.user.role=="admin"){
        User.find().then(function(result){
            res.render("admin/userlist",{
                users:result
            });
        });
    }
    else{
        req.flash("error_msg","Not Authorized");
        res.redirect("/profile/"+req.user.id);
    }
}
else {
    req.flash("error_msg", "Please fill your profile first");
    res.redirect("/addprofile");
}
});

//Get request to deleteuser from userlist
router.get("/deleteuser/:id",ensureAuthenticated,function(req,res){
    if(profilecheck(req.user)){
        User.findOneAndRemove({_id:req.params.id}).then(function(){
            req.flash("success_msg","Successfully removed");
            res.redirect("/admin/userlist");
        });
    }
    else {
        req.flash("error_msg", "Please fill your profile first");
        res.redirect("/addprofile");
    }
});

router.get("/switch",ensureAuthenticated,function(req,res){
    if(req.user.switchuser){
        User.findOneAndUpdate({_id:req.user.id},{
            switchuser:false
        }).then(function(){
            res.redirect("/");
        });
    }
    else{
        User.findOneAndUpdate({_id:req.user.id},{
            switchuser:true
        }).then(function(){
            res.redirect("/");
        });
    }
});

router.put("/editusermodal/:id",ensureAuthenticated,function(req,res){
    User.findOneAndUpdate({_id:req.params.id},{
        email: req.body.email,
        city: req.body.city,
        phone:req.body.phone,
        role:req.body.role,
        status:req.body.status
    }).then(function(){
        req.flash("success_msg","Successfully updated");
        res.redirect("/admin/userlist");
    });
});

//Put request from edituserlist
router.put("/edituser/:id",ensureAuthenticated,function(req,res){
        User.findOneAndUpdate({_id:req.params.id},{
            name: req.body.name,
            dob: req.body.dob,
            gender: req.body.gender,
            email: req.body.email,
            city: req.body.city,
            phone:req.body.phone,
            role:req.body.role,
            status:req.body.status
        }).then(function(){
            req.flash("success_msg","Successfully updated");
            res.redirect("/admin/userlist");
        });
});

router.get("/communitylist",ensureAuthenticated,function(req,res){
    if(profilecheck(req.user)){
    if(req.user.role=="admin"){
        Community.find().then(function(result){
            User.find().then(function(result2){
                res.render("admin/communitylist",{
                    communities:result,
                    users:result2
                });
            });
        });
    }
    else{
        req.flash("error_msg","Not Authorized");
        res.redirect("/profile/"+req.user.id);
    }
}
else {
    req.flash("error_msg", "Please fill your profile first");
    res.redirect("/addprofile");
}
});

router.post("/sendmessage/:id",ensureAuthenticated,function(req,res){
    User.findOne({_id:req.params.id}).then(function(result){
        let transporter = nodemailer.createTransport({
            service:'gmail',
            auth: {
                type: 'OAuth2',
                user: 'noreply.people.community@gmail.com',
                clientId: '349849454393-gsso9rjis4b1390l0h4cmvobo1h1mppo.apps.googleusercontent.com',
                clientSecret: 'BdWKFoooVl-W2mqID4JKD0Oi',
                refreshToken: '1/ckOGxZ-CNomy4B_kYpZ6et-LjV1BXQ8KF13HWDtQmYI',
                accessToken: 'ya29.GluJBu4iHmtCG0jqinxDEflgdzlRYNEfnwx4IB7JDnWrb3IOuNp1UdwJml9SpVEjRygtTNPN5bDE1CAETKcMhJ7z8GOUzf7hQUK7-25zF0996QL0EvaTx1jU_n9Q',
            }
        });
    
        // setup email data with unicode symbols
        let mailOptions = {
            from: '"People-Community" <noreply.people.community@gmail.com>', // sender address
            to: result.email, // list of receivers
            subject: 'Reminder:People Community', // Subject line
            text: '', // plain text body
            html: req.body.message // html body
        };
    
        // send mail with defined transport object
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                req.flash("error_msg","Mail not sent");
            }
            else{
            console.log('Message sent: %s', info.messageId);
            req.flash("success_msg","Successfully Sent");
            }
            res.redirect("/admin/userlist");
        });
    });
});

//Post request from adduser
router.post("/adduser",ensureAuthenticated,function(req,res){
        let credentialsoutput =  `<b>This mail is from People-Community.</b>
        <br><br>
        </b>Please login using the provided credentials</b>
        <br>
        <i>Email :</i> ${req.body.email}
        <br>
        <i>Password :</i> ${req.body.password}
        <br><br>
        <hr>
        <b>Thanks for being part of People Community</b>
        <br>
        Team People
        `;
        let error = [];
        if(req.body.password != req.body.confirmpassword){
            error.push({text:"Passwords do not match"});
        }
        if(error.length > 0){
        res.render("admin/adduser",{
            errors:error,
            email:req.body.email,
            password:req.body.password,
            confirmpassword:req.body.confirmpassword,
        });
        }
        else{
            User.findOne({email:req.body.email}).then(function(result){
                if(result){
                    req.flash("error_msg","Email already exists");
                    res.redirect("/admin/adduser");
                }
                else{
                    let user = {
                        name:req.body.name,
                        email:req.body.email,
                        password:req.body.password,
                        phone:req.body.phone,
                        city:req.body.city,
                        role:req.body.role
                    };
                    bcrypt.genSalt(10,function(err,salt){
                        bcrypt.hash(user.password,salt,function(err,hash){
                            if(err){
                                throw err;
                            }
                            user.password = hash;
                            new User(user).save().then(function(){
                                let transporter = nodemailer.createTransport({
                                    service:'gmail',
                                    auth: {
                                        type: 'OAuth2',
                                        user: 'noreply.people.community@gmail.com',
                                        clientId: '349849454393-gsso9rjis4b1390l0h4cmvobo1h1mppo.apps.googleusercontent.com',
                                        clientSecret: 'BdWKFoooVl-W2mqID4JKD0Oi',
                                        refreshToken: '1/ckOGxZ-CNomy4B_kYpZ6et-LjV1BXQ8KF13HWDtQmYI',
                                        accessToken: 'ya29.GluJBu4iHmtCG0jqinxDEflgdzlRYNEfnwx4IB7JDnWrb3IOuNp1UdwJml9SpVEjRygtTNPN5bDE1CAETKcMhJ7z8GOUzf7hQUK7-25zF0996QL0EvaTx1jU_n9Q',
                                    }
                                });
                            
                                // setup email data with unicode symbols
                                let mailOptions = {
                                    from: '"People-Community" <noreply.people.community@gmail.com>', // sender address
                                    to: `${req.body.email}`, // list of receivers
                                    subject: "Login Credentials - People Community", // Subject line
                                    text: '', // plain text body
                                    html: credentialsoutput // html body
                                };
                            
                                // send mail with defined transport object
                                transporter.sendMail(mailOptions, (error, info) => {
                                    if (error) {
                                        req.flash("success_msg","Successfully registered but mail can't sent ");
                                    }
                                    else{
                                    console.log('Message sent: %s', info.messageId);
                                    req.flash("success_msg","Successfully registered and mail sent");
                                    }
                                    res.redirect("/admin/adduser");
                                });
                            }).catch(function(err){
                                console.log(err);
                            });
                        });
                    });
                }
            });
        }
});


module.exports = router;