const mongoose = require('mongoose')
const fb = require('../config/firebase')
const User = require('../models/user')
const { getMessaging } = require('firebase-admin/messaging')

module.exports.sendNotification = async (userid, date, time) => {
    User.find({ _id: userid })
    .exec()
    .then(result => {
        if(result.length>0){
            const fcm_token = result[0].fcm_token

            const message = {
                notification: {
                    title: "Robot 🤖 cleaning commencing...",
                    body: `Scheduled cleaning on ${date.toDateString()} at ${time} has started`
                },
                token: fcm_token
            }

            getMessaging()
            .send(message)
            .then(result => {})
            .catch(err => {
                console.log(err);
            })
        } else {
            console.log("No user found");
        }
    })
    .catch(err => {
        console.log("Notification not sent!");
    })
}
