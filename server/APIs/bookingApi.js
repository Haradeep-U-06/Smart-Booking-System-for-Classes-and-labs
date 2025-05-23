const exp = require('express')
const bookingApp = exp.Router()
const Booking = require('../models/bookingModel')
const expressAsyncHandler = require('express-async-handler');
const Classroom = require('../models/classroomModel');
const LeaveApplication = require('../models/leaveModel');

// Get all bookings
bookingApp.get('/booking', expressAsyncHandler(async(req, res) => {
    try {
        const bookings = await Booking.find();
        res.status(200).send({message:"Bookings", payload:bookings});
    } catch (error) {
        res.status(500).send({error:error.message});
    }
}));

// Book a classroom
bookingApp.post('/bookings', expressAsyncHandler(async(req, res) => {
    const {facultyId, facultyName, email, classroomId, date, startTime, endTime} = req.body;

    try {
        const classroom = await Classroom.findById(classroomId);
        if (!classroom) return res.status(404).send({error:"Classroom not found"});

        // Check if the slot is in timetable or already booked
        const weekday = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });

        // check for overlapping
        let existingSlots = [];
        // Adding scheduled slots for the weekday
        const daySchedule = classroom.timetable.find(d => d.day === weekday);
        if (daySchedule && daySchedule.slots) {
            daySchedule.slots.forEach(slot => {
                const isCancelled = classroom.canceledSlots?.some(cs => cs.date === date && cs.startTime === slot.startTime && cs.endTime === slot.endTime);
                if (!isCancelled) {
                    existingSlots.push(slot)
                }
            });
        }

        const isScheduled = existingSlots.some(slot => slot.startTime === startTime && slot.endTime === endTime);
        const isBooked = await Booking.findOne({classroomId, date, startTime, endTime});

        // // check for overlapping
        const bookings = await Booking.find({classroomId, date});
        existingSlots = [...existingSlots, ...bookings];
        const toMinutes = t => parseInt(t.split(':')[0])*60 + parseInt(t.split(':')[1]);
        const requestedStart = toMinutes(startTime);
        const requestedEnd = toMinutes(endTime);
        const isOverlapping = existingSlots.some(slot => {
            const slotStart = toMinutes(slot.startTime);
            const slotEnd = toMinutes(slot.endTime);
            return requestedStart < slotEnd && requestedEnd > slotStart;
        });

        if (isScheduled || isBooked) {
            return res.status(400).send({error:"Slot is already scheduled/booked"});
        }

        if (isOverlapping) {
            return res.status(400).send({error:"Time slot overlaps with an existing schedule or booking"});
        }

        // Save the booking
        const booking = new Booking({facultyId, facultyName, email, classroomId, date, startTime, endTime});
        await booking.save();

        res.send({message: "Classroom booked successfully", booking});
    } catch (error) {
        res.status(500).send({error:error.message});
    }
}));

// Unbook a faculty-booked slot
bookingApp.delete('/unbook/:bookingId', expressAsyncHandler(async(req, res) => {
    try {
        const booking = await Booking.findById(req.params.bookingId);
        if (!booking) return res.status(404).send({error: "Booking not found"});

        await Booking.findByIdAndDelete(req.params.bookingId);
        res.json({message:"Booking canceled, slot is now available"});
    } catch (error) {
        res.status(500).send({error:error.message});
    }
}));

// Get available slots
const getAvailableSlots = expressAsyncHandler(async (req, res) => {
    try {
        const { date, buildingId, roomId } = req.query;
        
        // Get faculty on leave for this date
        const leavesResponse = await axios.get('http://localhost:4000/leave-api/on-leave', {
            params: { date }
        });
        
        const facultyOnLeave = leavesResponse.data.payload;
        const facultyOnLeaveIds = facultyOnLeave.map(f => f.facultyId);
        
        // Get existing bookings
        const bookings = await Booking.find({
            date,
            buildingId,
            roomId
        }).populate('facultyId'); // Ensure you populate faculty info
        
        // Process slots
        const slots = getAllTimeSlots(); // Your function to generate all time slots
        
        const processedSlots = slots.map(slot => {
            const existingBooking = bookings.find(b => 
                b.startTime === slot.startTime && b.endTime === slot.endTime
            );
            
            if (!existingBooking) {
                return { ...slot, available: true };
            }
            
            // If faculty is on leave, mark as available but with information
            if (facultyOnLeaveIds.includes(existingBooking.facultyId)) {
                return { 
                    ...slot, 
                    available: true,
                    availableDueToLeave: true,
                    originalFaculty: {
                        id: existingBooking.facultyId,
                        name: existingBooking.facultyName
                    },
                    leaveInfo: facultyOnLeave.find(f => f.facultyId === existingBooking.facultyId)
                };
            }
            
            // Otherwise it's booked and not available
            return { 
                ...slot, 
                available: false,
                bookedBy: existingBooking.facultyName
            };
        });
        
        res.status(200).send({
            message: "Available slots retrieved",
            payload: processedSlots,
            facultyOnLeave
        });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

module.exports = bookingApp;