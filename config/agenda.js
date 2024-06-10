const Agenda = require('agenda')
const notificationController = require('../controllers/notificationController')
const Schedule = require('../models/schedule')
const mongoose = require('mongoose')

const agenda = new Agenda({ 
    db: { address: process.env.MONGOOSE_CONNECTION_STRING } 
});

agenda.on("ready", async () => {
    console.log("Connected to Agenda");
    const AgendaModel = mongoose.connection.collection('agendaJobs')
    
    agenda.define('CleaningJob', async (job) => {
        const userid = job.attrs.data.userid;
        const date = job.attrs.data.date
        const time = job.attrs.data.time
        
        // 1. Send notification
        try {
            await notificationController.sendNotification(userid, date, time)
        } catch (error) {
            console.log("Error while sending notification");
        }

        // 2. Delete the data from agenda
        const objectId = new mongoose.Types.ObjectId(job.attrs._id);
        AgendaModel.deleteOne({ _id: objectId })
        .then(async result => {
            // 3. Delete the data from schedule
            await Schedule.updateOne({ user: userid, 'schedules.date': date }, {
                $pull: {
                    'schedules.$.timings': {
                        cronid: job.attrs._id
                    }
                }
            })
            .exec()
            return result
        })
        .then(async result => {
            // 4. If timings array for a date is empty, pull it out
            await Schedule.updateOne(
                { 
                    user: userid, 
                    'schedules.date': date, 
                    'schedules.timings': { 
                        $size: 0 
                    } 
                }, 
                { 
                    $pull: { 
                        schedules: { 
                            date: date 
                        } 
                    } 
                }
            )
            .exec()
            return result
        })
        .then(result => {
            // 5. Final step
            console.log("Cleaning commenced");
        })
        .catch(err => {
            console.log("Error while deleting agenda or schedule");
        })
        
    });
    
    await agenda.start();

})