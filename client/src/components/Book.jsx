import React, { useEffect, useState, useContext, useCallback} from 'react'
import axios from 'axios'
import { teacherContextObj } from '../contexts/TeacherContexts'
import { idContextObj } from '../contexts/Idcontexts'
import './Book.css'

function Book() {
    const { currentTeacher } = useContext(teacherContextObj)
    const { currentId } = useContext(idContextObj)
    const [date, setDate] = useState('');
    const [slotsData, setSlotsData] = useState([]);
    const [bookingsData, setBookingsData] = useState([]);
    const [dateOptions, setDateOptions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // Generate 14 days for the date selector with explicit timezone handling
    useEffect(() => {
        const dates = [];
        
        // Get current date in user's timezone
        const now = new Date();
        
        for (let i = 0; i < 14; i++) {
            // Create a new date object for each day (don't modify the original)
            const currentDate = new Date(now);
            currentDate.setDate(now.getDate() + i);
            
            // Format date as YYYY-MM-DD with timezone compensation
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const day = String(currentDate.getDate()).padStart(2, '0');
            const dateString = `${year}-${month}-${day}`;
            
            dates.push({
                date: dateString,
                dayName: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
                dayNumber: currentDate.getDate(),
                month: currentDate.toLocaleDateString('en-US', { month: 'short' })
            });
        }
        setDateOptions(dates);
        
        // Default to today's date
        if (!date && dates.length > 0) {
            setDate(dates[0].date);
        }
    }, []);

    // Use useCallback for fetchSlots to prevent unnecessary re-creation
    const fetchSlots = useCallback(async (silent = false) => {
        if (!date) return;
        if (!silent) setIsLoading(true);
        setError(null); // Clear any previous errors
        
        try {
            console.log("Fetching slots for date:", date);
            const result = await axios.get(`http://localhost:4000/classroom-api/available-slots/${date}`);
            console.log("Received slots:", result.data.payload.length); 
            setSlotsData(result.data.payload);
            
            const bookings = await axios.get('http://localhost:4000/booking-api/booking');
            setBookingsData(bookings.data.payload);
        } catch (err) {
            console.error("Error fetching slots:", err.message);
            setError("Failed to fetch available slots. Please try refreshing the page.");
            // Don't clear existing data on error
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, [date]);

     // Set up automatic refresh every 3 minutes
     useEffect(() => {
        const intervalId = setInterval(() => {
            if (date) {
                fetchSlots(true); // silent refresh
            }
        }, 180000); // 3 minutes
        
        return () => clearInterval(intervalId);
    }, [date, fetchSlots]);

    // Call fetchSlots whenever date changes
    useEffect(() => {
        if (date) {
            fetchSlots();
        }
    }, [date]);

    async function handleBook(roomId, startTime, endTime) {
        try {
            // Ensure consistent date format when booking
            await axios.post('http://localhost:4000/booking-api/bookings', {
                facultyId: currentId,
                facultyName: currentTeacher.name,
                email: currentTeacher.email,
                classroomId: roomId,
                date: date, // Make sure we use the selected date
                startTime,
                endTime
            });
            alert('Slot booked successfully!');
            fetchSlots(); // Refresh data after booking
        } catch (err) {
            console.log("Booking error:", err.message);
            alert("Booking failed. Please check your access or try again later.");
        }
    }

    // Rest of your component remains the same...
    function isBooked(type, facultyId, roomId, startTime, endTime) {
        if (Number(facultyId) === Number(currentId) && type === "Taken") {
            return bookingsData.some(b => 
                b.date === date && 
                b.classroomId === roomId && 
                b.facultyId === facultyId && 
                b.startTime === startTime && 
                b.endTime === endTime
            );
        }
        return false;
    }

    async function handleUnBook(facultyId, roomId, startTime, endTime) {
        try {
            const b = bookingsData.filter(b => 
                b.date === date && 
                b.classroomId === roomId && 
                b.facultyId === facultyId && 
                b.startTime === startTime && 
                b.endTime === endTime
            );
            
            if (b.length > 0) {
                await axios.delete(`http://localhost:4000/booking-api/unbook/${b[0]._id}`);
                fetchSlots(); // Refresh data after unbooking
            }
        } catch(err) {
            console.log("Unbooking error:", err.message);
            alert("Failed to cancel booking. Please try again.");
        }
    }

    const handleDateSelect = (selectedDate) => {
        setDate(selectedDate);
    };

    return (
        <div className="booking-container">
            <div className="booking-header">
                <h2>Book a Classroom or Lab</h2>
            </div>
            
            <div className="date-selector-container">
                <div className="date-selector">
                    {dateOptions.map(option => (
                        <div 
                            key={option.date} 
                            className={`date-item ${date === option.date ? 'selected' : ''}`}
                            onClick={() => handleDateSelect(option.date)}
                        >
                            <span className="day-name">{option.dayName}</span>
                            <span className="day-number">{option.dayNumber}</span>
                            <span className="month">{option.month}</span>
                        </div>
                    ))}
                </div>
            </div>
            
            {isLoading ? (
                <div className="text-center p-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : (
                <div className="room-list">
                    {slotsData.length === 0 ? (
                        <div className="no-data text-center p-5">
                            <p>Please select a date to view available slots</p>
                        </div>
                    ) : (
                        slotsData.map(room => (
                            <div 
                                key={room.roomId} 
                                className={`room-card ${room.type === "Lab" ? "room-type-lab" : ""}`}
                            >
                                <div className="room-header">
                                    <h3>
                                        {room.roomName}
                                        <span className="room-details">
                                            ({room.type} • Capacity: {room.capacity})
                                        </span>
                                    </h3>
                                </div>
                                
                                <div className="slots-container">
                                    {room.slots.length === 0 ? (
                                        <div className="no-slots">No slots available for this day</div>
                                    ) : (
                                        room.slots.map((slot, i) => {
                                            const isUserBooked = isBooked(
                                                slot.type, 
                                                slot.bookedById, 
                                                room.roomId, 
                                                slot.startTime, 
                                                slot.endTime
                                            );
                                            
                                            let slotTypeClass = "time-slot-taken";
                                            if (isUserBooked) {
                                                slotTypeClass = "time-slot-booked";
                                            } else if (slot.type === "Available") {
                                                slotTypeClass = "time-slot-available";
                                            } else if (slot.type === "Canceled") {
                                                slotTypeClass = "time-slot-canceled";
                                            }
                                            
                                            return (
                                                <div 
                                                    key={i} 
                                                    className={`time-slot ${slotTypeClass}`}
                                                >
                                                    <span className="time">
                                                        {slot.startTime} - {slot.endTime}
                                                    </span>
                                                    <span className="status">
                                                        {isUserBooked ? "Your Booking" : slot.type}
                                                    </span>

                                                    {/* Room Name for all slots */}
                                                    {/* <span className="room-name">
                                                        Room: {room.roomName}
                                                    </span> */}
                                                    
                                                    {/* {slot.bookedBy && (
                                                        <span className="faculty">
                                                            Booked by: {slot.bookedBy}
                                                        </span>
                                                    )} */}

                                                    {/* Add class/section information */}
                                                    {/* {slot.type === "Taken" && slot.section && (
                                                        <span className="section">
                                                            Class: {slot.section}
                                                        </span>
                                                    )} */}
                                                    
                                                    {/* Add subject information if available */}
                                                    {/* {slot.type === "Taken" && slot.subject && (
                                                        <span className="subject">
                                                            Subject: {slot.subject}
                                                        </span>
                                                    )} */}
                                                    {/* Show who booked the slot with additional information */}
                                                    {slot.type === "Taken" && (
                                                        <div className="booking-details">
                                                            {slot.bookedBy && (
                                                                <span className="faculty">
                                                                    Booked by: {slot.bookedBy}
                                                                </span>
                                                            )}

                                                            {/* Add class/section information */}
                                                            {slot.section && (
                                                                <span className="section">
                                                                    Class: {slot.section}
                                                                </span>
                                                            )}
                                                            
                                                            {/* Add subject information if available */}
                                                            {slot.subject && (
                                                                <span className="subject">
                                                                    Subject: {slot.subject}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}

                                                    
                                                    {slot.available && (
                                                        <button onClick={() => handleBook(room.roomId, slot.startTime, slot.endTime)}>
                                                            Book Now
                                                        </button>
                                                    )}
                                                    
                                                    {/* {isUserBooked && (
                                                        <button onClick={() => handleUnBook(slot.bookedById, room.roomId, slot.startTime, slot.endTime)}>
                                                            Cancel Booking
                                                        </button>
                                                    )} */}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

export default Book;