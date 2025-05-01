import React, { useEffect, useState, useContext, useCallback } from 'react'
import axios from 'axios'
import { teacherContextObj } from '../contexts/TeacherContexts'
import { idContextObj } from '../contexts/Idcontexts'
import Calendar from './Calendar'
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
    const [showCalendar, setShowCalendar] = useState(false);
    
    // New filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBlock, setSelectedBlock] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
    const [selectedRoomType, setSelectedRoomType] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    
    // Available filter options
    // Update the blockOptions array on line 26
    const blockOptions = ['A', 'B', 'C', 'D', 'E', 'PEB', 'PG'];
    const yearOptions = [
        { value: 1, label: 'First Year' },
        { value: 'higher', label: 'Higher Years' }
    ];
    const timeSlotOptions = [
        { value: '09:00-10:00', label: '9:00 - 10:00 AM' },
        { value: '10:00-11:00', label: '10:00 - 11:00 AM' },
        { value: '11:00-12:00', label: '11:00 - 12:00 PM' },
        { value: '12:00-13:00', label: '12:00 - 1:00 PM' },
        { value: '12:40-13:40', label: '12:40 - 1:40 PM' },
        { value: '13:40-14:40', label: '1:40 - 2:40 PM' },
        { value: '14:40-15:40', label: '2:40 - 3:40 PM' },
        { value: '15:40-16:40', label: '3:40 - 4:40 PM' }
    ];
    const roomTypeOptions = [
        { value: 'Classroom', label: 'Classroom' },
        { value: 'Lab', label: 'Laboratory' }
    ];

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
    }, [date, fetchSlots]);

    // Handle date selection from calendar
    const handleCalendarDateSelect = (selectedDate) => {
        setDate(selectedDate);
        setShowCalendar(false);
    };

    // Handle date selection from horizontal scroller
    const handleDateSelect = (selectedDate) => {
        setDate(selectedDate);
    };

    // Toggle calendar visibility
    const toggleCalendar = () => {
        setShowCalendar(!showCalendar);
    };

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

    // Filter function for rooms
    const getFilteredRooms = () => {
        if (!slotsData) return [];
        
        return slotsData.filter(room => {
            // Filter by room name search
            const matchesSearch = searchQuery === '' || 
                room.roomName.toLowerCase().includes(searchQuery.toLowerCase());
            
            // Filter by block
            const matchesBlock = selectedBlock === '' || 
                room.roomName.includes(selectedBlock);
            
            // Filter by year (first year or higher years)
            const matchesYear = selectedYear === '' || 
                String(room.year) === String(selectedYear);
            
            // Filter by room type
            const matchesRoomType = selectedRoomType === '' || 
                room.type === selectedRoomType;
            
            return matchesSearch && matchesBlock && matchesYear && matchesRoomType;
        });
    };

    // Filter function for time slots
    const getFilteredSlots = (slots) => {
        if (!slots) return [];
        
        if (selectedTimeSlot === '') {
            return slots;
        }
        
        const [filterStartTime, filterEndTime] = selectedTimeSlot.split('-');
        
        return slots.filter(slot => 
            slot.startTime === filterStartTime && slot.endTime === filterEndTime
        );
    };

    // Reset filters
    const handleResetFilters = () => {
        setSearchQuery('');
        setSelectedBlock('');
        setSelectedYear('');
        setSelectedTimeSlot('');
        setSelectedRoomType('');
    };

    // Toggle filters visibility
    const toggleFilters = () => {
        setShowFilters(!showFilters);
    };

    return (
        <div className="booking-container">
            <div className="booking-header">
                <h2>Book a Classroom or Lab</h2>
            </div>
            
            {/* Date selector with calendar button */}
            <div className="date-selector-container">
                <div className="date-selector-header">
                    <h5>Select Date</h5>
                    <button className="calendar-toggle-btn" onClick={toggleCalendar}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
                        </svg>
                        Calendar
                    </button>
                </div>
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
                
                {/* Selected date display */}
                <div className="selected-date-display">
                    Selected: {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>
            
            {/* Calendar modal */}
            {showCalendar && (
                <Calendar 
                    onSelectDate={handleCalendarDateSelect} 
                    onClose={() => setShowCalendar(false)} 
                    currentSelectedDate={date}
                />
            )}
            
            {/* Search and filter section */}
            <div className="search-filter-container">
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Search room name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                    <button 
                        className="filter-toggle-btn"
                        onClick={toggleFilters}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5v-2z"/>
                        </svg>
                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </button>
                </div>
                
                {showFilters && (
                    <div className="filters-panel">
                        <div className="filters-grid">
                            <div className="filter-group ">
                                <label>Block</label>
                                <select 
                                    value={selectedBlock} 
                                    onChange={(e) => setSelectedBlock(e.target.value)}
                                    className="filter-select"
                                >
                                    <option value="">All Blocks</option>
                                    {blockOptions.map(block => (
                                        <option key={block} value={block}>
                                            Block {block}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="filter-group">
                                <label>Year</label>
                                <select 
                                    value={selectedYear} 
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    className="filter-select"
                                >
                                    <option value="">All Years</option>
                                    {yearOptions.map(year => (
                                        <option key={year.value} value={year.value}>
                                            {year.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="filter-group">
                                <label>Time Slot</label>
                                <select 
                                    value={selectedTimeSlot} 
                                    onChange={(e) => setSelectedTimeSlot(e.target.value)}
                                    className="filter-select"
                                >
                                    <option value="">All Time Slots</option>
                                    {timeSlotOptions.map(slot => (
                                        <option key={slot.value} value={slot.value}>
                                            {slot.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="filter-group">
                                <label>Room Type</label>
                                <select 
                                    value={selectedRoomType} 
                                    onChange={(e) => setSelectedRoomType(e.target.value)}
                                    className="filter-select"
                                >
                                    <option value="">All Types</option>
                                    {roomTypeOptions.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        
                        <div className="filter-actions">
                            <button 
                                className="reset-filters-btn"
                                onClick={handleResetFilters}
                            >
                                Reset Filters
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Show error message if any */}
            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                    <button type="button" className="btn-close float-end" onClick={() => setError(null)}></button>
                </div>
            )}
            
            {/* Success message */}
            {successMessage && (
                <div className="alert alert-success" role="alert">
                    {successMessage}
                    <button type="button" className="btn-close float-end" onClick={() => setSuccessMessage(null)}></button>
                </div>
            )}
            
            {isLoading ? (
                <div className="text-center p-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : (
                <div className="room-list">
                    {getFilteredRooms().length === 0 ? (
                        <div className="no-data text-center p-5">
                            <p>{slotsData.length === 0 ? 'Please select a date to view available slots' : 'No rooms match your filters'}</p>
                            {slotsData.length > 0 && (
                                <button className="btn btn-outline-primary mt-3" onClick={handleResetFilters}>
                                    Reset Filters
                                </button>
                            )}
                        </div>
                    ) : (
                        getFilteredRooms().map(room => (
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
                                    {getFilteredSlots(room.slots).length === 0 ? (
                                        <div className="no-slots">
                                            {selectedTimeSlot ? 
                                                `No slots available for ${timeSlotOptions.find(t => t.value === selectedTimeSlot)?.label}` : 
                                                'No slots available for this day'}
                                        </div>
                                    ) : (
                                        getFilteredSlots(room.slots).map((slot, i) => {
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