import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ClassroomManagement.css';

function ClassroomManagement() {
  const [classrooms, setClassrooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('classrooms');
  
  // Basic classroom information
  const [formData, setFormData] = useState({
    name: '',
    year: '',
    block: '',
    capacity: '',
    type: 'Classroom'
  });
  
  // Timetable management
  const [showTimetableForm, setShowTimetableForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [timeSlots, setTimeSlots] = useState([]);
  const [slotForm, setSlotForm] = useState({
    startTime: '09:00',
    endTime: '10:00',
    section: '',
    facultyId: '',
    facultyName: '',
    subject: ''
  });
  
  const dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('http://localhost:4000/classroom-api/classroom');
      setClassrooms(response.data.payload);
    } catch (err) {
      console.error('Failed to fetch classrooms:', err);
      setError('Failed to load classrooms. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleSlotInputChange = (e) => {
    const { name, value } = e.target;
    setSlotForm({ ...slotForm, [name]: value });
  };

  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, { ...slotForm, day: selectedDay }]);
    // Reset form to default values except day
    setSlotForm({
      startTime: '09:00',
      endTime: '10:00',
      section: '',
      facultyId: '',
      facultyName: '',
      subject: ''
    });
  };

  const removeTimeSlot = (index) => {
    const updatedSlots = [...timeSlots];
    updatedSlots.splice(index, 1);
    setTimeSlots(updatedSlots);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      // Organize time slots by day for the timetable structure
      const timetable = [];
      
      // Group slots by day
      const slotsByDay = {};
      timeSlots.forEach(slot => {
        if (!slotsByDay[slot.day]) {
          slotsByDay[slot.day] = [];
        }
        
        // Create a slot object without the day property
        const { day, ...slotData } = slot;
        slotsByDay[slot.day].push(slotData);
      });
      
      // Convert to the required format
      for (const day in slotsByDay) {
        timetable.push({
          day,
          slots: slotsByDay[day]
        });
      }
      
      // Prepare data for submission
      const classroomData = {
        ...formData,
        capacity: parseInt(formData.capacity),
        year: parseInt(formData.year),
        timetable,
        canceledSlots: []
      };
      
      await axios.post('http://localhost:4000/classroom-api/classrooms', classroomData);
      
      setSuccessMessage('Classroom added successfully!');
      
      // Reset form
      setFormData({
        name: '',
        year: '',
        block: '',
        capacity: '',
        type: 'Classroom'
      });
      setTimeSlots([]);
      setShowForm(false);
      setShowTimetableForm(false);
      
      // Refresh data
      fetchClassrooms();
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err) {
      console.error('Failed to add classroom:', err);
      setError(err.response?.data?.error || 'Failed to add classroom. Please try again.');
    }
  };

  const handleDeleteClassroom = async (id) => {
    if (window.confirm('Are you sure you want to delete this classroom? This action cannot be undone.')) {
      try {
        await axios.delete(`http://localhost:4000/classroom-api/classrooms/${id}`);
        setSuccessMessage('Classroom deleted successfully!');
        fetchClassrooms();
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);
      } catch (err) {
        console.error('Failed to delete classroom:', err);
        setError(err.response?.data?.error || 'Failed to delete classroom. Please try again.');
      }
    }
  };

  return (
    <div className="classroom-management-container">
      <div className="classroom-management-header">
        <h2>Manage Classrooms</h2>
        <p className="text-muted">Add, edit, or remove classrooms from the system</p>
        <button 
          className="btn btn-primary add-classroom-btn" 
          onClick={() => {
            setShowForm(!showForm);
            if (!showForm) {
              setTimeSlots([]);
              setShowTimetableForm(false);
            }
          }}
        >
          {showForm ? 'Cancel' : 'Add New Classroom'}
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
          <button type="button" className="btn-close float-end" onClick={() => setError(null)}></button>
        </div>
      )}
      
      {successMessage && (
        <div className="alert alert-success" role="alert">
          {successMessage}
          <button type="button" className="btn-close float-end" onClick={() => setSuccessMessage(null)}></button>
        </div>
      )}

      {showForm && (
        <div className="add-classroom-form-container">
          <h3>Add New Classroom</h3>
          
          <div className="tabs-header">
            <button 
              className={`tab-button ${activeTab === 'classrooms' ? 'active' : ''}`}
              onClick={() => setActiveTab('classrooms')}
            >
              Basic Information
            </button>
            <button 
              className={`tab-button ${activeTab === 'timetable' ? 'active' : ''}`}
              onClick={() => setActiveTab('timetable')}
            >
              Timetable Setup
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="add-classroom-form">
            {activeTab === 'classrooms' && (
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="name" className="form-label">Room Name/Number*</label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., B-314"
                  />
                </div>
                
                <div className="col-md-6">
                  <label htmlFor="block" className="form-label">Block*</label>
                  <select
                    className="form-select"
                    id="block"
                    name="block"
                    value={formData.block}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Block</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="E">E</option>
                    <option value="PEB">PEB</option>
                    <option value="PG">PG</option>
                  </select>
                </div>
                
                <div className="col-md-6">
                  <label htmlFor="year" className="form-label">Year*</label>
                  <select
                    className="form-select"
                    id="year"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Year</option>
                    <option value="1">First Year</option>
                    <option value="2">Second Year</option>
                    <option value="3">Third Year</option>
                    <option value="4">Fourth Year</option>
                  </select>
                </div>
                
                <div className="col-md-6">
                  <label htmlFor="capacity" className="form-label">Capacity*</label>
                  <input
                    type="number"
                    className="form-control"
                    id="capacity"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    required
                    min="1"
                    placeholder="e.g., 40"
                  />
                </div>
                
                <div className="col-md-6">
                  <label htmlFor="type" className="form-label">Room Type*</label>
                  <select
                    className="form-select"
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Classroom">Classroom</option>
                    <option value="Lab">Laboratory</option>
                  </select>
                </div>
                
                <div className="col-12 mt-4">
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={() => setActiveTab('timetable')}
                  >
                    Next: Setup Timetable
                  </button>
                </div>
              </div>
            )}
            
            {activeTab === 'timetable' && (
              <div className="timetable-section">
                <h4>Add Time Slots</h4>
                <p className="text-muted mb-4">
                  Create the classroom's weekly schedule by adding time slots for each day.
                  You can skip this step and edit the timetable later.
                </p>
                
                <div className="time-slot-form">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="day" className="form-label">Day</label>
                      <select
                        className="form-select"
                        id="day"
                        value={selectedDay}
                        onChange={(e) => setSelectedDay(e.target.value)}
                      >
                        {dayOptions.map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="col-md-3">
                      <label htmlFor="startTime" className="form-label">Start Time</label>
                      <input
                        type="time"
                        className="form-control"
                        id="startTime"
                        name="startTime"
                        value={slotForm.startTime}
                        onChange={handleSlotInputChange}
                      />
                    </div>
                    
                    <div className="col-md-3">
                      <label htmlFor="endTime" className="form-label">End Time</label>
                      <input
                        type="time"
                        className="form-control"
                        id="endTime"
                        name="endTime"
                        value={slotForm.endTime}
                        onChange={handleSlotInputChange}
                      />
                    </div>
                    
                    <div className="col-md-6">
                      <label htmlFor="section" className="form-label">Section/Class</label>
                      <input
                        type="text"
                        className="form-control"
                        id="section"
                        name="section"
                        value={slotForm.section}
                        onChange={handleSlotInputChange}
                        placeholder="e.g., CSE-A"
                      />
                    </div>
                    
                    <div className="col-md-6">
                      <label htmlFor="subject" className="form-label">Subject</label>
                      <input
                        type="text"
                        className="form-control"
                        id="subject"
                        name="subject"
                        value={slotForm.subject}
                        onChange={handleSlotInputChange}
                        placeholder="e.g., Data Structures"
                      />
                    </div>
                    
                    <div className="col-md-6">
                      <label htmlFor="facultyId" className="form-label">Faculty ID (optional)</label>
                      <input
                        type="text"
                        className="form-control"
                        id="facultyId"
                        name="facultyId"
                        value={slotForm.facultyId}
                        onChange={handleSlotInputChange}
                      />
                    </div>
                    
                    <div className="col-md-6">
                      <label htmlFor="facultyName" className="form-label">Faculty Name (optional)</label>
                      <input
                        type="text"
                        className="form-control"
                        id="facultyName"
                        name="facultyName"
                        value={slotForm.facultyName}
                        onChange={handleSlotInputChange}
                      />
                    </div>
                    
                    <div className="col-12 mt-3">
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={addTimeSlot}
                      >
                        Add This Time Slot
                      </button>
                    </div>
                  </div>
                </div>
                
                {timeSlots.length > 0 && (
                  <div className="time-slots-list mt-4">
                    <h5>Added Time Slots:</h5>
                    <div className="table-responsive">
                      <table className="table table-striped table-bordered">
                        <thead>
                          <tr>
                            <th>Day</th>
                            <th>Time</th>
                            <th>Section</th>
                            <th>Subject</th>
                            <th>Faculty</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {timeSlots.map((slot, index) => (
                            <tr key={index}>
                              <td>{slot.day}</td>
                              <td>{slot.startTime} - {slot.endTime}</td>
                              <td>{slot.section || '-'}</td>
                              <td>{slot.subject || '-'}</td>
                              <td>{slot.facultyName || '-'}</td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-danger"
                                  onClick={() => removeTimeSlot(index)}
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                <div className="col-12 mt-4 d-flex justify-content-between">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setActiveTab('classrooms')}
                  >
                    Back to Basic Info
                  </button>
                  
                  <button 
                    type="submit" 
                    className="btn btn-success"
                  >
                    Add Classroom
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="text-center p-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : classrooms.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏫</div>
          <h3>No Classrooms</h3>
          <p>There are no classrooms in the system. Add a new classroom to get started.</p>
        </div>
      ) : (
        <div className="classrooms-list-container">
          <div className="table-responsive">
            <table className="table table-striped table-hover classroom-table">
              <thead className="table-dark">
                <tr>
                  <th>Name</th>
                  <th>Block</th>
                  <th>Year</th>
                  <th>Type</th>
                  <th>Capacity</th>
                  <th>Schedule Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {classrooms.map(classroom => (
                  <tr key={classroom._id}>
                    <td>{classroom.name}</td>
                    <td>{classroom.block}</td>
                    <td>{classroom.year}</td>
                    <td>
                      <span className={`badge ${classroom.type === 'Lab' ? 'badge-lab' : 'badge-classroom'}`}>
                        {classroom.type}
                      </span>
                    </td>
                    <td>{classroom.capacity}</td>
                    <td>
                      <span className={`badge ${classroom.timetable && classroom.timetable.length > 0 ? 'badge-schedule' : 'badge-no-schedule'}`}>
                        {classroom.timetable && classroom.timetable.length > 0 
                          ? `${classroom.timetable.reduce((total, day) => total + (day.slots ? day.slots.length : 0), 0)} slots` 
                          : 'No Schedule'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-sm btn-danger" 
                        onClick={() => handleDeleteClassroom(classroom._id)}
                        title="Delete Classroom"
                      >
                        <i className="bi bi-trash"></i> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClassroomManagement;