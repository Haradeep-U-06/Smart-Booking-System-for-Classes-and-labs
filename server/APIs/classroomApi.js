const exp = require('express')
const classroomApp = exp.Router()
const Classroom = require('../models/classroomModel')
const Booking = require('../models/bookingModel')
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

// Post a classroom data with its schedule
classroomApp.post('/classrooms', expressAsyncHandler(async(req, res) => {
    const classroom = req.body;
    let newClassroom = new Classroom(classroom);
    let newClassroomDoc = await newClassroom.save();
    res.status(201).send({message:"New Classroom Added", payload:newClassroomDoc});
}))

// Cancel a pre-scheduled class (Only assigned faculty can cancel)
// const getDayFromDate = (dateString) => {
//     return new Date(dateString).toLocaleDateString('en-US', { weekday: 'long' });
// };

classroomApp.put('/cancel-class/:classroomId', expressAsyncHandler(async (req, res) => {
    const { classroomId } = req.params;
    const { facultyId, date, startTime, endTime } = req.body;

    try {
        const classroom = await Classroom.findById(classroomId);
        if (!classroom) return res.status(404).send({ error: "Classroom not found" });

        const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }); // Convert date to "Monday", etc.

        let slotRemoved = false;

        classroom.timetable.forEach((day) => {
            if (day.day === dayName) {
                day.slots = day.slots.filter(slot => {
                    if (
                        slot.startTime === startTime &&
                        slot.endTime === endTime &&
                        String(slot.facultyId) === String(facultyId) // Ensures match even if one is number, one is string
                    ) {
                        slotRemoved = true;
                        return false; // Remove this slot
                    }
                    return true; // Keep other slots
                });
            }
        });

        if (!slotRemoved) {
            return res.status(403).send({ error: "Unauthorized or slot not found for given day" });
        }

        classroom.canceledSlots.push({ date, startTime, endTime });
        await classroom.save();

        res.send({ message: "Class canceled, slot is now available" });

    } catch (error) {
        res.status(500).send({ error: error.message });
    }
}));

// Fetch schedules and bookings for a specific date
classroomApp.get('/schedule/:date', expressAsyncHandler(async(req, res) => {
    const {date} = req.params;
    try {
        const weekDay = new Date(date).toLocaleDateString('en-US', {weekday:'long'})
        const classrooms = await Classroom.find();
        const bookings = await Booking.find({date});
        const schedule = classrooms.map(room => {
            // Extract scheduled classes for the given date
            const scheduledClasses = [];
            const timetableForDay = room.timetable.find(entry => entry.day === weekDay);
            if (timetableForDay) {
                timetableForDay.slots.forEach(slot => {
                    const isCancelled = room.canceledSlots?.some(cs =>
                        cs.date === date &&
                        cs.startTime === slot.startTime &&
                        cs.endTime === slot.endTime
                    );
                    if (!isCancelled) {
                        scheduledClasses.push({
                            startTime: slot.startTime,
                            endTime: slot.endTime,
                            section: slot.section,
                            facultyName: slot.facultyName,
                            subject: slot.subject,
                            type: "Scheduled"
                        });
                    }
                });
            }

            // Extract bookings for this room on the given date
            const roomBookings = bookings
            .filter(booking => booking.classroomId.toString() == room._id.toString())
            .map(booking => ({
                startTime: booking.startTime,
                endTime: booking.endTime,
                facultyName: booking.facultyName,
                type: "Booked"
            }));

            return {
                roomId: room._id,
                roomName: room.name, 
                capacity: room.capacity,
                type: room.type,
                schedule: [...scheduledClasses, ...roomBookings]
            };
        });
        res.status(200).send({payload:schedule});
    } catch(error) {
        res.status(500).send({message: "Error fetching schedule", error})
    }
}));


module.exports = classroomApp