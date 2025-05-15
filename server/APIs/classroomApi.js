const exp = require('express')
const classroomApp = exp.Router()
const Classroom = require('../models/classroomModel')
// const Schedule = require('../models/scheduleModel')
const Booking = require('../models/bookingModel')
// const axios = require('axios')
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

// Post a classroom data with its schedule - with duplicate check
classroomApp.post('/classrooms', expressAsyncHandler(async(req, res) => {
    const classroom = req.body;
    
    try {
        // Check if a classroom with the same name already exists
        const existingClassroom = await Classroom.findOne({ name: classroom.name });
        
        if (existingClassroom) {
            // Update the existing classroom's timetable
            // Combine the timetables, keeping unique days
            const updatedTimetable = [...existingClassroom.timetable];
            
            // For each day in the new request
            classroom.timetable.forEach(newDaySchedule => {
                const existingDayIndex = updatedTimetable.findIndex(
                    day => day.day === newDaySchedule.day
                );
                
                // If day already exists in timetable, update the slots
                if (existingDayIndex !== -1) {
                    // Combine the existing and new slots
                    updatedTimetable[existingDayIndex].slots = [
                        ...updatedTimetable[existingDayIndex].slots,
                        ...newDaySchedule.slots
                    ];
                } else {
                    // If day doesn't exist, add the new day to timetable
                    updatedTimetable.push(newDaySchedule);
                }
            });
            
            // Update the classroom with new combined timetable
            existingClassroom.timetable = updatedTimetable;
            
            // Handle canceledSlots if they exist in the request
            if (classroom.canceledSlots && classroom.canceledSlots.length > 0) {
                existingClassroom.canceledSlots = [
                    ...existingClassroom.canceledSlots,
                    ...classroom.canceledSlots
                ];
            }
            
            const updatedClassroom = await existingClassroom.save();
            return res.status(200).send({
                message: "Classroom schedule updated",
                payload: updatedClassroom
            });
        } else {
            // If no existing classroom found, create a new one
            let newClassroom = new Classroom(classroom);
            let newClassroomDoc = await newClassroom.save();
            return res.status(201).send({
                message: "New Classroom Added", 
                payload: newClassroomDoc
            });
        }
    } catch (error) {
        return res.status(500).send({
            error: error.message
        });
    }
}));

// Add a dedicated update endpoint for more controlled updates
classroomApp.put('/classrooms/:classroomId', expressAsyncHandler(async(req, res) => {
    const { classroomId } = req.params;
    const updates = req.body;
    
    try {
        const classroom = await Classroom.findById(classroomId);
        if (!classroom) return res.status(404).send({ error: "Classroom not found" });
        
        // Apply the updates
        if (updates.name) classroom.name = updates.name;
        if (updates.capacity) classroom.capacity = updates.capacity;
        if (updates.type) classroom.type = updates.type;
        
        // Handle timetable updates with merging logic
        if (updates.timetable && updates.timetable.length > 0) {
            updates.timetable.forEach(newDaySchedule => {
                const existingDayIndex = classroom.timetable.findIndex(
                    day => day.day === newDaySchedule.day
                );
                
                if (existingDayIndex !== -1) {
                    // Merge slots for existing day
                    classroom.timetable[existingDayIndex].slots = [
                        ...classroom.timetable[existingDayIndex].slots,
                        ...newDaySchedule.slots
                    ];
                } else {
                    // Add new day
                    classroom.timetable.push(newDaySchedule);
                }
            });
        }
        
        // Handle canceledSlots updates
        if (updates.canceledSlots && updates.canceledSlots.length > 0) {
            classroom.canceledSlots = [
                ...classroom.canceledSlots,
                ...updates.canceledSlots
            ];
        }
        
        const updatedClassroom = await classroom.save();
        res.send({ message: "Classroom updated successfully", payload: updatedClassroom });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
}));

// Cancel a pre-scheduled class (Only assigned faculty can cancel)
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
                        return true; // no need to Remove this slot
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
                            facultyId: slot.facultyId,
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
                facultyId: booking.facultyId,
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

// Add these helper functions before the available-slots route

// Helper function to find section for a booking
function getBookingSection(booking, dayOfWeek, timetable) {
  const daySchedule = timetable.find(d => d.day === dayOfWeek);
  if (!daySchedule || !daySchedule.slots) return null;
  
  const matchingSlot = daySchedule.slots.find(slot => {
    // Convert times to minutes for comparison
    const toMinutes = t => {
      const [hours, minutes] = t.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    const bookingStart = toMinutes(booking.startTime);
    const bookingEnd = toMinutes(booking.endTime);
    const slotStart = toMinutes(slot.startTime);
    const slotEnd = toMinutes(slot.endTime);
    
    // Check if times overlap
    return (bookingStart < slotEnd && bookingEnd > slotStart);
  });
  
  return matchingSlot?.section || null;
}

// Helper function to find subject for a booking
function getBookingSubject(booking, dayOfWeek, timetable) {
  const daySchedule = timetable.find(d => d.day === dayOfWeek);
  if (!daySchedule || !daySchedule.slots) return null;
  
  const matchingSlot = daySchedule.slots.find(slot => {
    const toMinutes = t => {
      const [hours, minutes] = t.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    const bookingStart = toMinutes(booking.startTime);
    const bookingEnd = toMinutes(booking.endTime);
    const slotStart = toMinutes(slot.startTime);
    const slotEnd = toMinutes(slot.endTime);
    
    return (bookingStart < slotEnd && bookingEnd > slotStart);
  });
  
  return matchingSlot?.subject || null;
}

// Get available slots for booking
classroomApp.get('/available-slots/:date', expressAsyncHandler(async (req, res) => {
  const { date } = req.params;
  const selectedDate = new Date(date);
  const dayOfWeek = selectedDate.toLocaleDateString("en-US", { weekday: "long" });

  // First year time slots (9 AM to 12 PM and 12:40 PM to 3:40 PM)
  const firstYearTimeSlots = [
    { startTime: "09:00", endTime: "10:00" },
    { startTime: "10:00", endTime: "11:00" },
    { startTime: "11:00", endTime: "12:00" },
    { startTime: "12:40", endTime: "13:40" },
    { startTime: "13:40", endTime: "14:40" },
    { startTime: "14:40", endTime: "15:40" }
  ];

  // Higher years time slots (10 AM to 1 PM and 1:40 PM to 4:40 PM)
  const higherYearTimeSlots = [
    { startTime: "10:00", endTime: "11:00" },
    { startTime: "11:00", endTime: "12:00" },
    { startTime: "12:00", endTime: "13:00" },
    { startTime: "13:40", endTime: "14:40" },
    { startTime: "14:40", endTime: "15:40" },
    { startTime: "15:40", endTime: "16:40" }
  ];

  // First year lab time slots (3-hour blocks)
  const firstYearLabTimeSlots = [
    { startTime: "09:00", endTime: "10:00" },
    { startTime: "10:00", endTime: "11:00" },
    { startTime: "11:00", endTime: "12:00" },
    { startTime: "12:40", endTime: "13:40" },
    { startTime: "13:40", endTime: "14:40" },
    { startTime: "14:40", endTime: "15:40" }
  ];

  // Higher years lab time slots (3-hour blocks)
  const higherYearLabTimeSlots = [
    { startTime: "10:00", endTime: "11:00" },
    { startTime: "11:00", endTime: "12:00" },
    { startTime: "12:00", endTime: "13:00" },
    { startTime: "13:40", endTime: "14:40" },
    { startTime: "14:40", endTime: "15:40" },
    { startTime: "15:40", endTime: "16:40" }
  ];

  const classrooms = await Classroom.find();
  const result = [];

  for (const room of classrooms) {
    let scheduledSlots = [];
    const daySchedule = room.timetable.find(d => d.day === dayOfWeek);
    
    if (daySchedule && daySchedule.slots) {
      daySchedule.slots.forEach(slot => {
        const isCancelled = room.canceledSlots?.some(cs => 
          cs.date === date && 
          cs.startTime === slot.startTime && 
          cs.endTime === slot.endTime
        );
        if (!isCancelled) {
          scheduledSlots.push(slot);
        }
      });
    }

    const bookings = await Booking.find({ classroomId: room._id, date });

    // Check if this is a first-year classroom based on room name, metadata, or year field
    const isFirstYearRoom = room.name.toLowerCase().includes('first') || 
                           room.name.includes('1st') || 
                           room.name.includes('I year') ||
                           room.year === 1;

    const occupied = [
      ...scheduledSlots.map(s => ({
        startTime: s.startTime,
        endTime: s.endTime,
        facultyName: s.facultyName || null,
        facultyId: s.facultyId || null,
        section: s.section || null,
        subject: s.subject || null,
        roomName: room.name
      })),
      ...bookings.map(b => ({
        startTime: b.startTime,
        endTime: b.endTime,
        facultyName: b.facultyName || null,
        facultyId: b.facultyId || null,
        section: getBookingSection(b, dayOfWeek, room.timetable) || "N/A",
        subject: getBookingSubject(b, dayOfWeek, room.timetable) || "N/A",
        roomName: room.name
      }))
    ];

    const canceled = room.canceledSlots.filter(cs => cs.date === date);

    // Determine appropriate time slots based on year and room type
    let applicableTimeSlots;
    if (room.type === "Lab") {
      applicableTimeSlots = isFirstYearRoom ? firstYearLabTimeSlots : higherYearLabTimeSlots;
    } else {
      applicableTimeSlots = isFirstYearRoom ? firstYearTimeSlots : higherYearTimeSlots;
    }

    const slots = applicableTimeSlots.map(slot => {
      const book = bookings.find(
        c => c.startTime === slot.startTime && c.endTime === slot.endTime
      );
      const canceledSlot = book ? null : canceled.find(
        c => c.startTime === slot.startTime && c.endTime === slot.endTime
      );
      
      // IMPROVED OVERLAP DETECTION
      const toMinutes = t => {
        const [hours, minutes] = t.split(':').map(Number);
        return hours * 60 + minutes;
      };
      
      const slotStart = toMinutes(slot.startTime);
      const slotEnd = toMinutes(slot.endTime);
      
      // Check if this slot overlaps with any scheduled/booked slot
      const overlappingSlot = occupied.find(s => {
        const occStart = toMinutes(s.startTime);
        const occEnd = toMinutes(s.endTime);
        
        // Slots overlap if one starts before the other ends
        return (slotStart < occEnd && slotEnd > occStart);
      });
      
      const isTaken = !!overlappingSlot;

      return {
        ...slot,
        available: !isTaken || !!canceledSlot,
        type: canceledSlot ? "Canceled" : isTaken ? "Taken" : "Available",
        bookedBy: overlappingSlot?.facultyName || null,
        bookedById: overlappingSlot?.facultyId || null,
        section: overlappingSlot?.section || null,
        subject: overlappingSlot?.subject || null
      };
    });

    result.push({
      roomId: room._id,
      roomName: room.name,
      capacity: room.capacity,
      type: room.type,
      year: isFirstYearRoom ? 1 : 'higher',
      slots
    });
  }

  res.status(200).json({ payload: result });
}));

// Get available slots for a specific date
classroomApp.get('/available-slots/:date', expressAsyncHandler(async (req, res) => {
    try {
        const { date } = req.params;
        
        // Get faculty on leave for this date
        let facultyOnLeave = [];
        try {
            const leaveResponse = await axios.get('http://localhost:4000/leave-api/on-leave', {
                params: { date }
            });
            facultyOnLeave = leaveResponse.data.payload || [];
        } catch (leaveErr) {
            console.error("Error fetching faculty on leave:", leaveErr);
            // Continue even if this fails
        }
        
        const facultyIdsOnLeave = facultyOnLeave.map(f => f.facultyId);
        
        // Get all classrooms
        const classrooms = await Classroom.find();
        
        // Get scheduled classes for this date
        const schedule = await Schedule.find({ date });
        
        // Get existing bookings for this date
        const bookings = await Booking.find({ date });
        
        // Process each classroom to get available slots
        const results = await Promise.all(classrooms.map(async (classroom) => {
            // Get the scheduled classes for this classroom
            const classSchedule = schedule.filter(s => s.classroomId === classroom._id.toString());
            
            // Get the bookings for this classroom
            const classBookings = bookings.filter(b => b.classroomId === classroom._id.toString());
            
            // Combine all time slots
            const allSlots = generateTimeSlots();
            
            // Mark slots as taken or available
            const processedSlots = allSlots.map(slot => {
                // Check if slot is in schedule
                const scheduleItem = classSchedule.find(s => 
                    s.startTime === slot.startTime && s.endTime === slot.endTime
                );
                
                if (scheduleItem) {
                    // Check if faculty is on leave
                    if (facultyIdsOnLeave.includes(scheduleItem.facultyId)) {
                        return {
                            ...slot,
                            type: "Available",
                            available: true,
                            availableDueToLeave: true,
                            originalFaculty: scheduleItem.facultyName,
                            leaveReason: `Faculty on ${facultyOnLeave.find(f => f.facultyId === scheduleItem.facultyId)?.leaveType || 'Leave'}`
                        };
                    }
                    
                    // Regular scheduled class
                    return {
                        ...slot,
                        type: "Taken",
                        available: false,
                        bookedBy: scheduleItem.facultyName,
                        bookedById: scheduleItem.facultyId,
                        section: scheduleItem.section || "",
                        subject: scheduleItem.subject || ""
                    };
                }
                
                // Check if slot is booked
                const bookingItem = classBookings.find(b => 
                    b.startTime === slot.startTime && b.endTime === slot.endTime
                );
                
                if (bookingItem) {
                    // Check if faculty is on leave
                    if (facultyIdsOnLeave.includes(bookingItem.facultyId)) {
                        return {
                            ...slot,
                            type: "Available",
                            available: true,
                            availableDueToLeave: true,
                            originalFaculty: bookingItem.facultyName,
                            leaveReason: `Faculty on ${facultyOnLeave.find(f => f.facultyId === bookingItem.facultyId)?.leaveType || 'Leave'}`
                        };
                    }
                    
                    // Regular booking
                    return {
                        ...slot,
                        type: "Taken",
                        available: false,
                        bookedBy: bookingItem.facultyName,
                        bookedById: bookingItem.facultyId,
                        section: bookingItem.section || "",
                        subject: bookingItem.subject || ""
                    };
                }
                
                // If neither scheduled nor booked, it's available
                return {
                    ...slot,
                    type: "Available",
                    available: true
                };
            });
            
            return {
                roomId: classroom._id,
                roomName: classroom.name,
                capacity: classroom.capacity,
                type: classroom.type,
                block: classroom.block,
                year: classroom.year,
                slots: processedSlots
            };
        }));
        
        res.status(200).send({
            message: "Available slots retrieved",
            payload: results,
            facultyOnLeave
        });
    } catch (error) {
        console.error("Error in available-slots:", error);
        res.status(500).send({ error: error.message });
    }
}));

// Helper function to generate time slots
function generateTimeSlots() {
    // Define your institution's time slots
    return [
        { startTime: "09:00", endTime: "10:00" },
        { startTime: "10:00", endTime: "11:00" },
        { startTime: "11:00", endTime: "12:00" },
        { startTime: "12:00", endTime: "13:00" },
        { startTime: "12:40", endTime: "13:40" },
        { startTime: "13:40", endTime: "14:40" },
        { startTime: "14:40", endTime: "15:40" },
        { startTime: "15:40", endTime: "16:40" }
    ];
}

// Add this route to delete a classroom by ID
classroomApp.delete('/classrooms/:id', expressAsyncHandler(async(req, res) => {
  const { id } = req.params;
  
  try {
    const classroom = await Classroom.findById(id);
    
    if (!classroom) {
      return res.status(404).send({ error: "Classroom not found" });
    }
    
    // Check if there are any active bookings for this classroom
    const bookings = await Booking.find({ classroomId: id });
    
    if (bookings.length > 0) {
      return res.status(400).send({ 
        error: "Cannot delete classroom with active bookings. Please cancel all bookings first." 
      });
    }
    
    await Classroom.findByIdAndDelete(id);
    
    res.status(200).send({ message: "Classroom deleted successfully" });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
}));

module.exports = classroomApp