import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { teacherContextObj } from '../contexts/TeacherContexts'
import { idContextObj } from '../contexts/Idcontexts'
import './Notifications.css'

function Notifications() {
  const { currentTeacher } = useContext(teacherContextObj)
  const { currentId } = useContext(idContextObj)
  const [leaveApplications, setLeaveApplications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    const fetchLeaveApplications = async () => {
      if (!currentId || (typeof currentId === 'object' && !currentId.id)) {
        setIsLoading(false)
        return
      }

      const teacherId = typeof currentId === 'object' ? currentId.id : currentId
      
      try {
        setIsLoading(true)
        const response = await axios.get(`http://localhost:4000/leave-api/faculty/${teacherId}`)
        setLeaveApplications(response.data.payload)
      } catch (err) {
        console.error('Failed to fetch leave applications:', err)
        setError('Failed to load your leave applications. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeaveApplications()
  }, [currentId])

  const getFilteredApplications = () => {
    if (activeTab === 'all') {
      return leaveApplications
    }
    return leaveApplications.filter(app => app.status === activeTab)
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'badge-pending'
      case 'approved':
        return 'badge-approved'
      case 'rejected':
        return 'badge-rejected'
      default:
        return 'badge-pending'
    }
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <h2>Leave Applications</h2>
        <p className="text-muted">View status and updates on your leave requests</p>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
          <button type="button" className="btn-close float-end" onClick={() => setError(null)}></button>
        </div>
      )}

      <div className="tabs-header">
        <button 
          className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Applications
        </button>
        <button 
          className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending
        </button>
        <button 
          className={`tab-button ${activeTab === 'approved' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved')}
        >
          Approved
        </button>
        <button 
          className={`tab-button ${activeTab === 'rejected' ? 'active' : ''}`}
          onClick={() => setActiveTab('rejected')}
        >
          Rejected
        </button>
      </div>

      {isLoading ? (
        <div className="text-center p-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : leaveApplications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>No Leave Applications</h3>
          <p>You haven't submitted any leave applications yet.</p>
          <a href="/leave-application" className="btn btn-primary">Apply for Leave</a>
        </div>
      ) : getFilteredApplications().length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No {activeTab !== 'all' ? activeTab.charAt(0).toUpperCase() + activeTab.slice(1) : ''} Applications</h3>
          <p>You don't have any {activeTab} leave applications.</p>
        </div>
      ) : (
        <div className="leave-applications-list">
          {getFilteredApplications().map(application => (
            <div className="leave-card" key={application._id}>
              <div className="leave-card-header">
                <div className="leave-dates">
                  <span className="date-label">From:</span> {formatDate(application.fromDate)}
                  <span className="date-separator">→</span>
                  <span className="date-label">To:</span> {formatDate(application.toDate)}
                </div>
                <span className={`status-badge ${getStatusBadgeClass(application.status)}`}>
                  {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                </span>
              </div>
              
              <div className="leave-card-body">
                <div className="reason-section">
                  <h4>Reason for Leave</h4>
                  <p>{application.reason}</p>
                </div>
                
                {application.status !== 'pending' && application.adminMessage && (
                  <div className="admin-response">
                    <h4>Admin Response</h4>
                    <p>{application.adminMessage}</p>
                  </div>
                )}
              </div>
              
              <div className="leave-card-footer">
                <div className="application-date">
                  Submitted on: {new Date(application.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Notifications