const exp = require('express')
const classroomApp = exp.Router()
const Classroom = require('../models/classroomModel')
const expressAsyncHandler = require('express-async-handler')

// Get all classrooms with their schedules
classroomApp.get('/classroom', expressAsyncHandler(async(req, res) => {
    try {
        const classroomsList = await Classroom.find()
        // res.json(classroomsList)
        res.status(200).send({message:"Classrooms", payload:classroomsList})
    } catch(error) {
        res.status(500).send({error:error.message})
    }
}))

// Cancel a pre-scheduled class (Only assigned faculty can cancel)
classroomApp.put('/cancel-class/:classroomId', expressAsyncHandler(async(req, res) => {
    const {classroomId} = req.params;
    const {facultyId, date, startTime, endTime} = req.body;
    try {
        const classroom = await Classroom.findById(classroomId);
        if (!classroom) return res.status(404).send({error:"Classroom not found"})

            // Find the class and check faculty authorization
            let slotRemoved = false;
            classroom.timetable.forEach((day) => {
                day.slots = day.slots.filter(slot => {
                    if (slot.startTime === startTime && slot.endTime === endTime && slot.facultyId === facultyId) {
                        slotRemoved = true;
                        return false;
                    }
                    return true;
                });
            });

            if (!slotRemoved) return res.status(403).send({error: "Unauthorized or slot not found"});

            // Add the canceled slot
            classroom.canceledSlots.push({date, startTime, endTime});
            await classroom.save();

            res.send({message:"Class canceled, slot is now available"});
    } catch(error) {
        res.status(500).send({error:error.message});
    }
}))

module.exports = classroomApp