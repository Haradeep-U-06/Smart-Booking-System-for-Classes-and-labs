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
      {/* <div className="hero-section">
        <div className="container py-5">
          <div className="row">
            <div className="col-lg-6">
              <h1 className="display-4 fw-bold">Smart Classroom & Lab Booking</h1>
              <p className="lead my-4">
                Efficiently manage classroom resources with our intuitive booking system.
                Book available classrooms and labs in just a few clicks.
              </p>
              {isSignedIn ? (
                <div className="d-flex gap-3">
                  <a href="/book" className="btn btn-primary btn-lg">Book Now</a>
                  <a href="/manage" className="btn btn-outline-light btn-lg">Manage Bookings</a>
                </div>
              ) : (
                <div className="d-flex gap-3">
                  <a href="/signin" className="btn btn-primary btn-lg">Sign In</a>
                  <a href="/signup" className="btn btn-outline-light btn-lg">Sign Up</a>
                </div>
              )}
            </div>
            <div className="col-lg-6 d-flex align-items-center justify-content-center">
              <div className="img-placeholder rounded shadow-lg">
                <img src="https://cache.careers360.mobi/media/article_images/2024/6/4/vnrvjiet-hyderabad-management-quota.jpg" alt="College Campus" className='campus-image rounded shadow-lg' />
              </div>
            </div>
          </div>
        </div>
      </div> */}

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
          
          {/* <div className="col-md-6 col-lg-4">
            <Link to="/admin/reports" className="admin-card">
              <div className="admin-card-icon">📊</div>
              <div className="admin-card-content">
                <h3>Reports</h3>
                <p>View resource utilization and booking statistics</p>
              </div>
            </Link>
          </div> */}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;