const mongoose = require('mongoose')

const bookingSchema = new mongoose.Schema({
    facultyId:{
        type : String 
    }, 
    facultyName:{
        type : String 
    }, 
    email:{
        type : String 
    }, 
    classroomId:{
        type : mongoose.Schema.Types.ObjectId 
    }, 
    date:{
        type : String 
    }, 
    startTime:{
        type : String 
    }, 
    endTime:{
        type:String 
    }
}, {"strict":"throw"});

const Booking = mongoose.model('booking', bookingSchema)

module.exports = Booking