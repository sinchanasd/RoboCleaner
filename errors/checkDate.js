function isInCurrentWeek(checkDate) {
    const currentDate = new Date();

    const startOfWeek = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate() - currentDate.getDay() + (currentDate.getDay() === 0 ? -6 : 1)
    );
    startOfWeek.setHours(0, 0, 0, 0);
  
    const endOfWeek = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate() + (6 - currentDate.getDay()) + (currentDate.getDay() === 0 ? 0 : 1)
    );
    endOfWeek.setHours(23, 59, 59, 999);
  
    return checkDate >= startOfWeek && checkDate <= endOfWeek;
}

module.exports = (date) => {
    const isValidDateFormat = /^\d{4}-\d{2}-\d{2}$/.test(date)
    
    if(!isValidDateFormat){
        return "Invalid date format. Please provide date in YYYY-MM-DD format."
    }

    const newDate = new Date(date)
    const today = new Date()
    today.setUTCHours(0,0,0,0)

    if(today>newDate){
        return "Please provide a date in the future"
    }

    if(!isInCurrentWeek(newDate)){
        return "Please provide a date in the current week"
    }
    return null
}
