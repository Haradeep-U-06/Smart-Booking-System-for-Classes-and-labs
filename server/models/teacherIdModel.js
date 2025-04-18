const mongoose = require('mongoose')

const teacherIdSchema = new mongoose.Schema({
    id:{
        type:Number
    },
    name:{
        type : String 
    }, 
    email:{
        type : String,
        unique : true
    }
}, {"strict":"throw"});

const TeacherId = mongoose.model('teacherid', teacherIdSchema)

module.exports = TeacherId