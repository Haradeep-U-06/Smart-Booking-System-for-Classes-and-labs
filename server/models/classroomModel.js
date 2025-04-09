const mongoose = require('mongoose')

const classroomSchema = new mongoose.Schema({
    name:{
        type : String 
    }, 
    capacity:{
        type : Number 
    }, 
    type:{
        type : String 
    }, 
    timetable:[
        {
            day:{
                type : String 
            }, 
            slots: [
                {
                    startTime : {
                        type : String 
                    }, endTime : {
                        type : String
                    }, section : {
                        type : String 
                    }, facultyId : {
                        type : String 
                    }, facultyName : {
                        type : String 
                    }, subject : {
                        type : String 
                    }
                }, 

            ]
        }
    ], 
    canceledSlots:[
        {
            date:{
                type : String 
            }, startTime:{
                type : String 
            }, endTime:{
                type : String 
            }
        }
    ]
}, {"strict":"throw"});

const Classroom = mongoose.model('classroom', classroomSchema)

module.exports = Classroom