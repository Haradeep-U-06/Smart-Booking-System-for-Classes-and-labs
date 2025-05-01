import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './LeaveRequests.css';

function LeaveRequests() {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [responseMessage, setResponseMessage] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [action, setAction] = useState('');

    // Replace the initial useEffect with this:
    useEffect(() => {
        fetchLeaveRequests();
    }, []);

//   useEffect(() => {
//     const fetchLeaveRequests = async () => {
//       try {
//         const response = await axios.get('http://localhost:4000/leave-api/all');
//         setLeaveRequests(response.data.payload);
//       } catch (err) {
//         console.error('Failed to fetch leave requests:', err);
//         setError('Failed to load leave requests. Please try again later.');
//       }
//     };
//     fetchLeaveRequests();
//   }, []);

  const fetchLeaveRequests = async () => {
    // In fetchLeaveRequests function
    try {
        setIsLoading(true);
        const response = await axios.get('http://localhost:4000/leave-api/all');
        console.log('Leave requests data:', response.data);  // Add this line
        setLeaveRequests(response.data.payload);
    } catch (err) {
        console.error('Failed to fetch leave requests:', err);
        setError('Failed to load leave requests. Please try again later.');
    } finally {
        setIsLoading(false);
    }
  };

  const getFilteredRequests = () => {
    if (activeTab === 'all') {
      return leaveRequests;
    }
    return leaveRequests.filter(req => req.status === activeTab);
  };

  const handleApprove = (id) => {
    setSelectedRequestId(id);
    setAction('approve');
    setResponseMessage('Your leave application has been approved.');
    setShowResponseModal(true);
  };

  const handleReject = (id) => {
    setSelectedRequestId(id);
    setAction('reject');
    setResponseMessage('');
    setShowResponseModal(true);
  };

  const submitResponse = async () => {
    if (!selectedRequestId) return;
    
    try {
      let endpoint = '';
      if (action === 'approve') {
        endpoint = `http://localhost:4000/leave-api/${selectedRequestId}/approve`;
      } else if (action === 'reject') {
        endpoint = `http://localhost:4000/leave-api/${selectedRequestId}/reject`;
      }
      
      await axios.put(endpoint, { adminMessage: responseMessage });
      
      setShowResponseModal(false);
      setSelectedRequestId(null);
      setResponseMessage('');
      fetchLeaveRequests();
    } catch (err) {
      console.error('Failed to process leave request:', err);
      setError('Failed to process leave request. Please try again later.');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="leave-requests-container">
      <div className="leave-requests-header">
        <h2>Manage Leave Applications</h2>
        <p className="text-muted">Review and respond to faculty leave requests</p>
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
          All Requests
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
      ) : getFilteredRequests().length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No {activeTab !== 'all' ? activeTab : ''} Leave Requests</h3>
          <p>There are no {activeTab} leave requests at this time.</p>
        </div>
      ) : (
        <div className="leave-requests-list">
          {getFilteredRequests().map(request => (
            <div className="leave-request-card" key={request._id}>
              <div className="leave-request-header">
                <div className="faculty-info">
                  <h4>{request.facultyName}</h4>
                  <span className="faculty-email">{request.facultyEmail}</span>
                </div>
                <div className="request-status-badge" data-status={request.status}>
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </div>
              </div>
              
              <div className="leave-request-body">
                <div className="leave-dates">
                  <div className="date-item">
                    <span className="date-label">From:</span>
                    <span className="date-value">{formatDate(request.fromDate)}</span>
                  </div>
                  <div className="date-item">
                    <span className="date-label">To:</span>
                    <span className="date-value">{formatDate(request.toDate)}</span>
                  </div>
                </div>
                
                <div className="leave-reason">
                  <h5>Reason for Leave</h5>
                  <p>{request.reason}</p>
                </div>
                
                {request.status !== 'pending' && (
                  <div className="admin-response">
                    <h5>Your Response</h5>
                    <p>{request.adminMessage}</p>
                  </div>
                )}
              </div>
              
              {request.status === 'pending' && (
                <div className="leave-request-actions">
                  <button 
                    className="btn btn-outline-danger"
                    onClick={() => handleReject(request._id)}
                  >
                    Reject
                  </button>
                  <button 
                    className="btn btn-success"
                    onClick={() => handleApprove(request._id)}
                  >
                    Approve
                  </button>
                </div>
              )}
              
              <div className="leave-request-footer">
                <span className="submission-date">
                  Submitted: {new Date(request.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Response Modal */}
      {showResponseModal && (
        <div className="modal-backdrop">
          <div className="response-modal">
            <div className="modal-header">
              <h4>{action === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}</h4>
              <button className="close-btn" onClick={() => setShowResponseModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <label htmlFor="responseMessage">Message to Faculty:</label>
              <textarea
                id="responseMessage"
                className="form-control"
                rows="4"
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                placeholder="Enter your response message for the faculty member..."
                required={action === 'reject'}
              ></textarea>
              {action === 'reject' && responseMessage.trim() === '' && (
                <div className="text-danger mt-2">
                  <small>A message is required when rejecting a leave request.</small>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowResponseModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={submitResponse}
                disabled={action === 'reject' && responseMessage.trim() === ''}
              >
                Submit Response
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeaveRequests;