import React, { useEffect, useState, useContext } from 'react'
import axios from 'axios'
import { teacherContextObj } from '../contexts/TeacherContexts'
import { idContextObj } from '../contexts/Idcontexts'
import Calendar from './Calendar' // Import Calendar component
import './Cancel.css'

function Cancel() {
  const { currentTeacher } = useContext(teacherContextObj)
  const { currentId } = useContext(idContextObj)
  const [date, setDate] = useState('');
  const [slotsData, setSlotsData] = useState([]);
  const [bookingsData, setBookingsData] = useState([]);
  const [dateOptions, setDateOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  
  // New filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedRoomType, setSelectedRoomType] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Available filter options
// Update the blockOptions array on line 26
const blockOptions = ['A', 'B', 'C', 'D', 'E', 'PEB', 'PG'];
  const yearOptions = [
    { value: 1, label: 'First Year' },
    { value: 'higher', label: 'Higher Years' }
  ];
  const roomTypeOptions = [
    { value: 'Classroom', label: 'Classroom' },
    { value: 'Lab', label: 'Laboratory' }
  ];

  // Generate 14 days for the date selector
  useEffect(() => {
    // Existing code remains unchanged
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);
      
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

  // Existing function for fetching slots
  async function fetchSlots() {
    // Existing code remains unchanged
    if (!date) return;
    setIsLoading(true);
    try {
      const result = await axios.get(`http://localhost:4000/classroom-api/schedule/${date}`);
      setSlotsData(result.data.payload);
      const bookings = await axios.get('http://localhost:4000/booking-api/booking');
      setBookingsData(bookings.data.payload);
    } catch (err) {
      console.error("Error fetching slots:", err.message);
      alert("Failed to fetch slots. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCancel(roomId, startTime, endTime) {
    try {
      await axios.put(`http://localhost:4000/classroom-api/cancel-class/${roomId}`, {
        facultyId: currentId,
        date,
        startTime,
        endTime
      });
      alert('Slot canceled successfully!');
      fetchSlots();
    } catch (err) {
      console.log("Cancellation error:", err.message);
      alert("Failed. Please check your access or try again later.");
    }
  }

  function isBooked(type, facultyId, roomId, startTime, endTime) {
    if (Number(facultyId) === Number(currentId) && type === "Booked") {
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
      await axios.delete(`http://localhost:4000/booking-api/unbook/${b[0]._id}`);
      fetchSlots();
      alert('Booking canceled successfully!');
    } catch(err) {
      console.log("Unbooking error:", err.message);
      alert("Failed to cancel booking. Please try again.");
    }
  }

  useEffect(() => {
    if (date) fetchSlots();
  }, [date]);

  const handleDateSelect = (selectedDate) => {
    setDate(selectedDate);
  };

  // Handle date selection from calendar
  const handleCalendarDateSelect = (selectedDate) => {
    setDate(selectedDate);
    setShowCalendar(false);
  };

  // Toggle calendar visibility
  const toggleCalendar = () => {
    setShowCalendar(!showCalendar);
  };

  // Toggle filters visibility
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedBlock('');
    setSelectedYear('');
    setSelectedRoomType('');
  };

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
      const isFirstYearRoom = room.roomName.toLowerCase().includes('first') || 
                          room.roomName.includes('1st') || 
                          room.roomName.includes('I year') ||
                          (room.year === 1);
                          
      const matchesYear = selectedYear === '' || 
        (selectedYear === '1' && isFirstYearRoom) ||
        (selectedYear === 'higher' && !isFirstYearRoom);
      
      // Filter by room type
      const matchesRoomType = selectedRoomType === '' || 
        room.type === selectedRoomType;
      
      return matchesSearch && matchesBlock && matchesYear && matchesRoomType;
    });
  };

  return (
    <div className="booking-container">
      <div className="booking-header">
        <h2>Cancel Scheduled Slots</h2>
        <p className="text-muted">View and manage your scheduled classes and bookings</p>
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
      
      {/* NEW: Search and filter section */}
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
              <div className="filter-group">
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
      
      {/* Calendar modal */}
      {showCalendar && (
        <Calendar 
          onSelectDate={handleCalendarDateSelect} 
          onClose={() => setShowCalendar(false)} 
          currentSelectedDate={date}
        />
      )}
      
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
              <p>Please select a date to view schedules</p>
            </div>
          ) : getFilteredRooms().length === 0 ? (
            <div className="no-data text-center p-5">
              <p>No rooms match your filters</p>
              <button className="btn btn-outline-primary mt-3" onClick={handleResetFilters}>
                Reset Filters
              </button>
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
                  {room.schedule.length === 0 ? (
                    <div className="no-slots">No scheduled classes for this day</div>
                  ) : (
                    room.schedule.map((slot, i) => {
                      const userBooking = isBooked(
                        slot.type, 
                        slot.facultyId, 
                        room.roomId, 
                        slot.startTime, 
                        slot.endTime
                      );
                      
                      let slotTypeClass = "";
                      if (userBooking) {
                        slotTypeClass = "time-slot-booked";
                      } else if (slot.type === "Scheduled") {
                        slotTypeClass = "time-slot-scheduled";
                      } else if (slot.type === "Booked") {
                        slotTypeClass = "time-slot-taken";
                      } else if (slot.type === "Canceled") {
                        slotTypeClass = "time-slot-canceled";
                      } else {
                        slotTypeClass = "time-slot-available";
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
                            {userBooking ? "Your Booking" : slot.type}
                          </span>

                          {/* Show detailed information */}
                          <div className="booking-details">
                            {/* Faculty information */}
                            {slot.facultyName && (
                              <span className="faculty">
                                Faculty: {slot.facultyName}
                              </span>
                            )}
                             
                            {/* Show section information */}
                            {slot.section && (
                              <span className="section">
                                Class: {slot.section}
                              </span>
                            )}
                            
                            {/* Show subject information */}
                            {slot.subject && (
                              <span className="subject">
                                Subject: {slot.subject}
                              </span>
                            )}
                          </div>
                          
                          {slot.type === "Scheduled" && 
                           Number(slot.facultyId) === Number(currentId) && (
                            <button 
                              onClick={() => handleCancel(room.roomId, slot.startTime, slot.endTime)}
                              className="cancel-btn"
                            >
                              Cancel Class
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

export default Cancel;