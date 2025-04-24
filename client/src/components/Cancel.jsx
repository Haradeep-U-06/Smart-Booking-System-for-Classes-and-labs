import React, { useEffect, useState, useContext } from 'react'
import axios from 'axios'
import { teacherContextObj } from '../contexts/TeacherContexts'
import { idContextObj } from '../contexts/Idcontexts'
import './Cancel.css'

function Cancel() {
  const { currentTeacher } = useContext(teacherContextObj)
  const { currentId } = useContext(idContextObj)
  const [date, setDate] = useState('');
  const [slotsData, setSlotsData] = useState([]);
  const [bookingsData, setBookingsData] = useState([]);
  const [dateOptions, setDateOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Generate 14 days for the date selector
  useEffect(() => {
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

  async function fetchSlots() {
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

  return (
    <div className="booking-container">
      <div className="booking-header">
        <h2>Cancel Scheduled Slots</h2>
        <p className="text-muted">View and manage your scheduled classes and bookings</p>
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
              <p>Please select a date to view schedules</p>
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
                          
                          {slot.facultyName && (
                            <span className="faculty">
                              {slot.facultyName}
                            </span>
                          )}
                          
                          {slot.type === "Scheduled" && 
                           Number(slot.facultyId) === Number(currentId) && (
                            <button 
                              onClick={() => handleCancel(room.roomId, slot.startTime, slot.endTime)}
                              className="cancel-btn"
                            >
                              Cancel Class
                            </button>
                          )}
                          
                          {userBooking && (
                            <button 
                              onClick={() => handleUnBook(slot.facultyId, room.roomId, slot.startTime, slot.endTime)}
                              className="cancel-btn"
                            >
                              Cancel Booking
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