const checkDate = require('../errors/checkDate')
const checkTime = require('../errors/checkTime')

module.exports = async (req,res,next) => {
    const date = req.body.date
    const time = req.body.time
    const dateError = checkDate(date)

    if(dateError!=null){
        return res.status(400).json({
            message: dateError
        })
    }

    const timeError = checkTime(date, time)

    if(timeError!=null){
        return res.status(400).json({
            message: timeError
        })
    }

    next()
}