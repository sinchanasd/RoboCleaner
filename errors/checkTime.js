module.exports = (date, time) => {
    if(time.length===0){
        return "Time array should not be empty"
    }

    if(time.length>2){
        return "You can set at max two frequencies for a day"
    }

    for (let i = 0; i < time.length; i++) {
        const element = time[i];
        const isValidTimeFormat = /^([01]\d|2[0-3]):([0-5]\d)$/.test(element)

        if(!isValidTimeFormat){
            return "Invalid time format. Please provide time(s) in HH:MM format."
        }

        const newDateWithTime = new Date(`${date}T${element}`)
        const today = new Date()

        if(today>newDateWithTime){
            return "Please provide a time in the future"
        }
    }

    if(time.length===2 && time[0]===time[1]){
        return "Same time values are not allowed"
    }
    return null
}
