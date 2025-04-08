const mongoose = require('mongoose')

const teacherSchema = new mongoose.Schema({
    name:{
        type : String 
    }, 
    email:{
        type : String,
        unique : true
    }
}, {"strict":"throw"});

const Teacher = mongoose.model('teacher', teacherSchema)

module.exports = Teacher