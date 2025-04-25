import React, { useEffect, useState, useContext, useCallback } from 'react'
import axios from 'axios'
import { teacherContextObj } from '../contexts/TeacherContexts'
import { idContextObj } from '../contexts/Idcontexts'
import './ManageBookings.css'

function ManageBookings() {
  const { currentTeacher } = useContext(teacherContextObj)
  const { currentId, setCurrentId } = useContext(idContextObj)
  const [date, setDate] = useState('')
  const [dateOptions, setDateOptions] = useState([])
  const [scheduledClasses, setScheduledClasses] = useState([])
  const [bookedClasses, setBookedClasses] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('scheduled')
  const [lastRefresh, setLastRefresh] = useState(null)
  
  // Generate 14 days for date selector (unchanged)
  useEffect(() => {
    const dates = []
    const today = new Date()
    
    for (let i = 0; i < 14; i++) {
      const currentDate = new Date(today)
      currentDate.setDate(today.getDate() + i)
      
      const year = currentDate.getFullYear()
      const month = String(currentDate.getMonth() + 1).padStart(2, '0')
      const day = String(currentDate.getDate()).padStart(2, '0')
      const dateString = `${year}-${month}-${day}`
      
      dates.push({
        date: dateString,
        dayName: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: currentDate.getDate(),
        month: currentDate.toLocaleDateString('en-US', { month: 'short' })
      })
    }
    setDateOptions(dates)
    
    if (!date && dates.length > 0) {
      setDate(dates[0].date)
    }
  }, [])

  // Use useCallback to memoize the fetchClassesData function
  const fetchClassesData = useCallback(async (silent = false) => {
    // Extract the actual ID value from currentId object if needed
    const teacherId = typeof currentId === 'object' ? currentId.id : currentId
    
    if (!teacherId) {
      console.log("No valid teacher ID available")
      return
    }
    
    if (!silent) setIsLoading(true)
    setError(null) // Clear previous errors
    
    try {
      // Fetch schedule data for the selected date
      const scheduleResponse = await axios.get(`http://localhost:4000/classroom-api/schedule/${date}`)
      const scheduleData = scheduleResponse.data.payload || []
      
      // Fetch booking data
      const bookingsResponse = await axios.get('http://localhost:4000/booking-api/booking')
      const bookingsData = bookingsResponse.data.payload || []
      
      // Filter scheduled classes for the current user
      const userScheduled = []
      
      scheduleData.forEach(room => {
        if (!room.schedule || !Array.isArray(room.schedule)) {
          return
        }
        
        const userClasses = room.schedule.filter(slot => {
          const slotFacultyId = String(slot.facultyId)
          const currentTeacherId = String(teacherId)
          
          return slot.type === "Scheduled" && slotFacultyId === currentTeacherId
        })
        
        if (userClasses.length > 0) {
          userClasses.forEach(cls => {
            userScheduled.push({
              ...cls,
              roomId: room.roomId,
              roomName: room.roomName,
              roomType: room.type,
              capacity: room.capacity
            })
          })
        }
      })
      
      // Filter booked classes for the current user
      const userBookedClasses = bookingsData.filter(booking => 
        booking.date === date && String(booking.facultyId) === String(teacherId)
      )
      
      // Add room details to booked classes
      const bookedWithDetails = userBookedClasses.map(booking => {
        const roomDetails = scheduleData.find(room => 
          String(room.roomId) === String(booking.classroomId)
        ) || {}
        
        return {
          ...booking,
          roomName: roomDetails.roomName || "Unknown Room",
          roomType: roomDetails.type || "Unknown",
          capacity: roomDetails.capacity || 0
        }
      })
      
      setScheduledClasses(userScheduled)
      setBookedClasses(bookedWithDetails)
      setLastRefresh(new Date())
    } catch (err) {
      console.error("Error fetching data:", err.message)
      setError("Failed to fetch your classes data. Please try refreshing the page.")
      // Don't clear previous state on error - very important!
    } finally {
      if (!silent) setIsLoading(false)
    }
  }, [currentId, date])

  // Fetch data when currentId or date changes
  useEffect(() => {
    if (currentId && date) {
      fetchClassesData()
    }
  }, [currentId, date, fetchClassesData])

  // Set up periodic refresh (every 2 minutes)
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (currentId && date) {
        fetchClassesData(true) // silent refresh
      }
    }, 120000) // 2 minutes
    
    return () => clearInterval(intervalId)
  }, [currentId, date, fetchClassesData])

  // Check for session validity and attempt recovery
  useEffect(() => {
    const checkSession = async () => {
      // If we haven't had a successful refresh in 30 minutes, try to recover
      if (lastRefresh && (new Date() - lastRefresh) > 30 * 60 * 1000) {
        try {
          // Check if session is still valid by making a small API request
          await axios.get('http://localhost:4000/classroom-api/classroom')
          // If successful, refresh our data
          fetchClassesData()
        } catch (err) {
          // Session likely expired, prompt user
          setError("Your session may have expired. Please refresh the page to continue.")
        }
      }
    }
    
    checkSession()
  }, [lastRefresh, fetchClassesData])

  // The rest of your component mostly unchanged
  const handleDateSelect = (selectedDate) => {
    setDate(selectedDate)
  }

  const handleCancelClass = async (roomId, startTime, endTime) => {
    const teacherId = typeof currentId === 'object' ? currentId.id : currentId
    
    try {
      setError(null)
      await axios.put(`http://localhost:4000/classroom-api/cancel-class/${roomId}`, {
        facultyId: teacherId,
        date,
        startTime,
        endTime
      })
      alert('Class successfully canceled')
      fetchClassesData()
    } catch (err) {
      console.error("Error canceling class:", err.message)
      setError("Failed to cancel class. Please try again.")
    }
  }

  const handleUnBook = async (bookingId) => {
    try {
      setError(null)
      await axios.delete(`http://localhost:4000/booking-api/unbook/${bookingId}`)
      alert('Booking successfully canceled')
      fetchClassesData()
    } catch (err) {
      console.error("Error canceling booking:", err.message)
      setError("Failed to cancel booking. Please try again.")
    }
  }

  const handleManualRefresh = () => {
    fetchClassesData()
  }

  return (
    <div className="manage-bookings-container">
      <div className="booking-header">
        <h2>Manage Your Classes</h2>
        <p className="text-muted">View and manage your scheduled and booked classes</p>
        
        {/* Add refresh button */}
        <button onClick={handleManualRefresh} className="btn btn-outline-primary btn-sm refresh-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
            <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
          </svg>
          Refresh Data
        </button>
        
        {/* Show last refresh time */}
        {lastRefresh && (
          <small className="text-muted d-block mt-1">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </small>
        )}
      </div>
      
      {/* Show error message if any */}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
          <button type="button" className="btn-close float-end" onClick={() => setError(null)}></button>
        </div>
      )}
      
      {/* Date selector and rest of component remains the same */}
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
      
      {/* Tab navigation */}
      <div className="tabs-container">
        <div className="tabs-header">
          <button 
            className={`tab-button ${activeTab === 'scheduled' ? 'active' : ''}`}
            onClick={() => setActiveTab('scheduled')}
          >
            Scheduled Classes ({scheduledClasses.length})
          </button>
          <button 
            className={`tab-button ${activeTab === 'booked' ? 'active' : ''}`}
            onClick={() => setActiveTab('booked')}
          >
            Booked Classes ({bookedClasses.length})
          </button>
        </div>
        
        {/* Loading state */}
        {isLoading ? (
          <div className="text-center p-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="tab-content">
            {/* Scheduled Classes Tab Content */}
            {activeTab === 'scheduled' && (
              <div className="scheduled-tab">
                <h3 className="section-title">Your Scheduled Classes for {date}</h3>
                {scheduledClasses.length === 0 ? (
                  <div className="empty-state">
                    <p>You don't have any scheduled classes on this date.</p>
                  </div>
                ) : (
                  <div className="classes-list">
                    {scheduledClasses.map((cls, index) => (
                      <div className="class-card" key={index}>
                        <div className="class-header">
                          <h4>{cls.subject || "Class"}</h4>
                          <span className={`badge ${cls.roomType === 'Lab' ? 'badge-lab' : 'badge-classroom'}`}>
                            {cls.roomType || "Room"}
                          </span>
                        </div>
                        <div className="class-details">
                          <div className="detail-item">
                            <span className="detail-label">Room:</span>
                            <span className="detail-value">{cls.roomName || "Unknown"}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Time:</span>
                            <span className="detail-value">{cls.startTime} - {cls.endTime}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Section:</span>
                            <span className="detail-value">{cls.section || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="class-actions">
                          <button 
                            className="cancel-button"
                            onClick={() => handleCancelClass(cls.roomId, cls.startTime, cls.endTime)}
                          >
                            Cancel Class
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Booked Classes Tab Content */}
            {activeTab === 'booked' && (
              <div className="booked-tab">
                <h3 className="section-title">Your Booked Classes for {date}</h3>
                {bookedClasses.length === 0 ? (
                  <div className="empty-state">
                    <p>You don't have any bookings on this date.</p>
                  </div>
                ) : (
                  <div className="classes-list">
                    {bookedClasses.map((booking, idx) => (
                      <div className="class-card" key={booking._id || idx}>
                        <div className="class-header">
                          <h4>{booking.roomName || "Room"}</h4>
                          <span className={`badge ${booking.roomType === 'Lab' ? 'badge-lab' : 'badge-classroom'}`}>
                            {booking.roomType || "Room"}
                          </span>
                        </div>
                        <div className="class-details">
                          <div className="detail-item">
                            <span className="detail-label">Time:</span>
                            <span className="detail-value">{booking.startTime} - {booking.endTime}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Room Type:</span>
                            <span className="detail-value">{booking.roomType || "Unknown"}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Capacity:</span>
                            <span className="detail-value">{booking.capacity || "Unknown"}</span>
                          </div>
                        </div>
                        <div className="class-actions">
                          <button 
                            className="cancel-button"
                            onClick={() => handleUnBook(booking._id)}
                          >
                            Cancel Booking
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ManageBookings