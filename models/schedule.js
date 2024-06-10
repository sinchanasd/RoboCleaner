const mongoose = require('mongoose');

const scheduleSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    schedules: [
        {
            date: { 
                type: Date 
            },
            timings: [ 
                { 
                    time: {
                        type: String 
                    },
                    cronid: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'agendaJobs'
                    }
                } 
            ]
        }
    ]
}, {
    timestamps: true
})

module.exports = mongoose.model('Schedule', scheduleSchema);