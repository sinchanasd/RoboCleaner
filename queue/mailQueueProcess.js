const { default: mongoose, model } = require('mongoose');
const mailController = require('../mail/mailController')

mongoose.connect(process.env.MONGOOSE_CONNECTION_STRING)

const mailQueueProcess = async (job, done) => {
    const key = job.data.key
    
    try {
        await mailController.sendMail(key)
        done()
    } catch (error) {
        console.log(error);
        done(error)
    }
}

module.exports = mailQueueProcess
