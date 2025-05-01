import React, { useState, useContext, useEffect } from 'react'
import axios from 'axios'
import { teacherContextObj } from '../contexts/TeacherContexts'
import { idContextObj } from '../contexts/Idcontexts'
import { useUser } from '@clerk/clerk-react'
import Calendar from './Calendar'
import './LeaveApplication.css'

function LeaveApplication() {
  const { currentTeacher } = useContext(teacherContextObj)
  const { currentId } = useContext(idContextObj)
  const { isSignedIn, user } = useUser()

  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [showFromCalendar, setShowFromCalendar] = useState(false)
  const [showToCalendar, setShowToCalendar] = useState(false)

  const validateForm = () => {
    if (!fromDate) {
      setError('Please select a from date')
      return false
    }
    if (!toDate) {
      setError('Please select a to date')
      return false
    }
    if (!reason.trim()) {
      setError('Please provide a reason for your leave')
      return false
    }
    // Check if from date is before to date
    if (new Date(fromDate) > new Date(toDate)) {
      setError('From date cannot be after to date')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    
    if (!validateForm()) return
    
    if (!isSignedIn || !currentTeacher || !currentId) {
      setError('Please sign in to submit a leave application')
      return
    }

    setIsSubmitting(true)
    
    try {
      const leaveData = {
        facultyId: currentId.id || currentId,
        facultyName: currentTeacher.name,
        facultyEmail: currentTeacher.email,
        fromDate,
        toDate,
        reason
      }
      
      const response = await axios.post('http://localhost:4000/leave-api/apply', leaveData)
      
      setSuccessMessage('Your leave application has been submitted successfully')
      // Reset form
      setFromDate('')
      setToDate('')
      setReason('')
    } catch (err) {
      console.error('Failed to submit leave application:', err)
      setError('Failed to submit leave application. Please try again later.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFromDateSelect = (date) => {
    setFromDate(date)
    setShowFromCalendar(false)
  }

  const handleToDateSelect = (date) => {
    setToDate(date)
    setShowToCalendar(false)
  }

  return (
    <div className="leave-application-container">
      <div className="leave-header">
        <h2>Apply for Leave</h2>
        <p className="text-muted">Submit your leave request for approval</p>
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

      <div className="leave-form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group mb-4">
            <label htmlFor="fromDate">From Date</label>
            <div className="date-picker-container">
              <input
                type="text"
                id="fromDate"
                className="form-control date-input"
                value={fromDate ? new Date(fromDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : ''}
                readOnly
                onClick={() => setShowFromCalendar(true)}
                placeholder="Select start date"
              />
              <button
                type="button"
                className="calendar-button"
                onClick={() => setShowFromCalendar(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
                </svg>
              </button>
            </div>
            {showFromCalendar && (
              <Calendar
                onSelectDate={handleFromDateSelect}
                onClose={() => setShowFromCalendar(false)}
                currentSelectedDate={fromDate}
              />
            )}
          </div>

          <div className="form-group mb-4">
            <label htmlFor="toDate">To Date</label>
            <div className="date-picker-container">
              <input
                type="text"
                id="toDate"
                className="form-control date-input"
                value={toDate ? new Date(toDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : ''}
                readOnly
                onClick={() => setShowToCalendar(true)}
                placeholder="Select end date"
              />
              <button
                type="button"
                className="calendar-button"
                onClick={() => setShowToCalendar(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
                </svg>
              </button>
            </div>
            {showToCalendar && (
              <Calendar
                onSelectDate={handleToDateSelect}
                onClose={() => setShowToCalendar(false)}
                currentSelectedDate={toDate}
              />
            )}
          </div>

          <div className="form-group mb-4">
            <label htmlFor="reason">Reason for Leave</label>
            <textarea
              id="reason"
              className="form-control reason-textarea"
              rows="5"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide detailed reason for your leave request"
            ></textarea>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Submitting...
                </>
              ) : 'Submit Leave Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LeaveApplication