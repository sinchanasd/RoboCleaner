const mongoose   = require('mongoose');
const User       = require('../models/user');
const Schedule   = require('../models/schedule')
const bcrypt     = require('bcrypt');
const jwt        = require('jsonwebtoken');
const Queue      = require('bull');
const Agenda     = require('agenda')
const checkDate = require('../errors/checkDate')
const checkTime = require('../errors/checkTime')

const agenda = new Agenda({ 
    db: { address: process.env.MONGOOSE_CONNECTION_STRING } 
});

const mailQueue = new Queue('mailQueue', {
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD,
        username: process.env.REDIS_USERNAME
    }
})

// Already signed up Unverified users directed to otp directly
module.exports.signup = (req,res) => {
    User.find({ email: req.body.email })
    .exec()
    .then(user => {
        if(user.length>=1) {
            const verification = user[0].verification

            if(!verification){
                return res.status(409).json({
                    message: "Email already exits, complete verification."
                })
            } 

            return res.status(409).json({
                message: "User already exits, try logging in."
            })

        } else {
            bcrypt.hash(req.body.password, 10, (err, hash) => {
                if(err){
                    return res.status(500).json({
                        error: err
                    })
                } else {
                    const user = new User({
                        _id: new mongoose.Types.ObjectId,
                        userName: req.body.userName,
                        email: req.body.email,
                        password: hash,
                    })
                    user
                    .save()
                    .then(async result => {
                        const key = req.body.email
                        await mailQueue.add({ key })
                        return res.status(201).json({
                            action: "User created and OTP Sent",
                            message: "Please check your mailbox for the OTP verification code."
                        })
                    })
                    .catch(err => {
                        console.log(err);
                        res.status(500).json({
                            error: err
                        })
                    })
                }
            })
        }
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            error: err
        })
    })
}

module.exports.login = (req,res) => {
    User.find({ email: req.body.email })
    .exec()
    .then(user => {
        if(user.length<1){
            return res.status(401).json({
                message: "Please provide a valid email address and password"
            })
        }

        const verification = user[0].verification
        if(!verification) {
            return res.status(409).json({
                message: "Email is not verified, please complete verification"
            })
        }

        bcrypt.compare(req.body.password, user[0].password, (err, result) => {
            if(err) {
                return res.status(401).json({
                    error: err
                })
            } 
            if(result) {
                const token = jwt.sign({
                    email: user[0].email,
                    userid: user[0]._id,
                    username: user[0].userName
                }, process.env.TOKEN_SECRET, {
                    expiresIn: "30 days"
                })
                return res.status(200).json({
                    message: "Authentication successful",
                    token: token
                })
            }
            return res.status(401).json({
                message: "Auth failed"
            })
        })
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            error: err
        })
    })
}

module.exports.scheduleCleaning = (req,res) => {
    const userid = req.userData.userid
    const date = req.body.date
    const time = req.body.time
    const newDate = new Date(date)

    Schedule.find({ user: userid, 'schedules.date': newDate })
    .exec()
    .then(async schedule => {

        if(schedule.length>0) {
            // schedule for a day already exists
            return res.status(400).json({
                message: "Schedule already exists"
            })
        } else {
            // schedule for a day doesn't exist
            let timeArray = []

            for (let i = 0; i < time.length; i++) {
                const element = time[i];

                const executionDate = new Date(`${date}T${element}`)
                const jobData = {
                    userid: userid,
                    date: newDate,
                    time: element
                }
                const job = await agenda.schedule(executionDate, 'CleaningJob', jobData);
                timeArray.push({
                    time: element,
                    cronid: job.attrs._id
                })
            }

            Schedule.findOneAndUpdate({ user: userid }, {
                $push: {
                    schedules: {
                        date: newDate,
                        timings: timeArray
                    }
                }
            }, { upsert: true })
            .exec()
            .then(async result => {
                return res.status(201).json({
                    message: "Schedule Added Successfully",
                })
            })
            .catch(err => {
                console.log(err);
                return res.status(500).json({
                    error: err
                })
            })
        }
    })
    .catch(err => {
        console.log(err);
        return res.status(500).json({
            error: err
        })
    })
}

module.exports.scheduleCleanings = async (req,res) => {
    const userid = req.userData.userid
    const scheduleArray = req.body.schedule
    let newScheduleArray = []

    // Check the entire schedule array for Invalid preferences
    for (let i = 0; i < scheduleArray.length; i++) {
        const element = scheduleArray[i];

        // date error checks
        const dateErrorCheck = checkDate(element.date)
        if(dateErrorCheck!=null){
            return res.status(400).json({
                message: dateErrorCheck
            })
        }

        // time error checks
        const timeErrorCheck = checkTime(element.date, element.time)

        if(timeErrorCheck!=null){
            return res.status(400).json({
                message: timeErrorCheck
            })
        }

    }

    // Schedule the jobs and build the final array
    for (let i = 0; i < scheduleArray.length; i++) {
        const element = scheduleArray[i];

        let newTimeArray = []
        for (let j = 0; j < element.time.length; j++) {
            const timeElement = element.time[j];

            const newDate = new Date(element.date)
            const executionDate = new Date(`${element.date}T${timeElement}`)
            const jobData = {
                userid: userid,
                date: newDate,
                time: timeElement
            }
            const job = await agenda.schedule(executionDate, 'CleaningJob', jobData);

            newTimeArray.push({
                time: timeElement,
                cronid: job.attrs._id
            })
        }

        newScheduleArray.push({
            date: element.date,
            timings: newTimeArray
        })
    }

    Schedule.updateOne({ user: userid }, {
        $push: {
            schedules: {
                $each: newScheduleArray,
            },
        }
    })
    .exec()
    .then(result => {
        return res.status(201).json({
            result: "Schedules added successfully"
        })
    })
    .catch(err => {
        console.log(err);
        return res.status(500).json({
            error: err
        })
    })

}

const cancelJobById = async (jobId) => {
    try {
        const job = await agenda.jobs({ _id: new mongoose.Types.ObjectId(jobId) });
    
        if (job.length > 0) {
            await job[0].remove();
        } 
    } catch (error) {
        console.error(`Error cancelling job: ${error}`);
    }
};

module.exports.updateCleaningSchedule = async (req,res) => {
    const userid = req.userData.userid
    const date = req.body.date
    const time = req.body.time
    const newDate = new Date(date)

    let timeArray = []

    for (let i = 0; i < time.length; i++) {
        const element = time[i];

        const executionDate = new Date(`${date}T${element}`)
        const jobData = {
            userid: userid,
            date: newDate,
            time: element
        }

        const job = await agenda.schedule(executionDate, 'CleaningJob', jobData);
        timeArray.push({
            time: element,
            cronid: job.attrs._id
        })
    }

    Schedule.find({ user: userid, 'schedules.date': newDate })
    .exec()
    .then(async result => {
        const timingsArray = result[0].schedules[0].timings

        const updation = await Schedule.updateOne(
            { 
                user: userid, 
                'schedules.date': newDate 
            },
            {
                $set: {
                    'schedules.$.timings': timeArray
                }
            },
        )
        .exec()
        if(updation.modifiedCount===0) {
            res.status(404).json({
                message: "Schedule not found"
            })
        }
        res.status(200).json({
            message: "Schedule updated successfully"
        })

        for (let i = 0; i < timingsArray.length; i++) {
            const element = timingsArray[i];
            const cronid = element.cronid
    
            await cancelJobById(cronid)
        }
    })
    .catch(err => {
        console.log(err);
        return res.status(500).json({
            error: err
        })
    })
}
