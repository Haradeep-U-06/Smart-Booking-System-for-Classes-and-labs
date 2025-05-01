import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { teacherContextObj } from '../contexts/TeacherContexts';
import './AdminDashboard.css';

function AdminDashboard() {
  const { currentTeacher } = useContext(teacherContextObj);

  return (
    <div className="admin-dashboard-container">
      <div className="admin-header">
        <h2>Admin Dashboard</h2>
      </div>

      <div className="admin-cards-container">
        <div className="row g-4">
          <div className="col-md-6 col-lg-4">
            <Link to="/admin/leave-requests" className="admin-card">
              <div className="admin-card-icon">📝</div>
              <div className="admin-card-content">
                <h3>Manage Leave Requests</h3>
                <p>Review, approve, or reject leave applications from faculty</p>
              </div>
            </Link>
          </div>
          
          <div className="col-md-6 col-lg-4">
            <Link to="/admin/classrooms" className="admin-card">
              <div className="admin-card-icon">🏫</div>
              <div className="admin-card-content">
                <h3>Manage Classrooms</h3>
                <p>Add, modify, or remove classrooms from the system</p>
              </div>
            </Link>
          </div>
          
          <div className="col-md-6 col-lg-4">
            <Link to="/admin/reports" className="admin-card">
              <div className="admin-card-icon">📊</div>
              <div className="admin-card-content">
                <h3>Reports</h3>
                <p>View resource utilization and booking statistics</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;