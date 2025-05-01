import React from 'react'
import { useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { teacherContextObj } from '../contexts/TeacherContexts'
import { useUser } from '@clerk/clerk-react'
import { idContextObj } from '../contexts/Idcontexts'
import axios from 'axios'
import './Home.css'

function Home() {
  const { currentTeacher, setCurrentTeacher } = useContext(teacherContextObj)
  const { currentId, setCurrentId } = useContext(idContextObj)
  const { isSignedIn, user, isLoaded } = useUser()
  const navigate = useNavigate()
  
  useEffect(() => {
    const fetchOrCreateTeacher = async () => {
      if (!user || !isSignedIn){
        // Clear stored data if not signed in
        localStorage.removeItem('currentTeacher')
        localStorage.removeItem('currentId')
        setCurrentTeacher({ name: "", email: "" })
        setCurrentId({ id: 0 })
        return
      }

      // Check if user is admin and redirect to admin dashboard
      if (user.emailAddresses[0]?.emailAddress === 'haradeeps119@gmail.com') {
        navigate('/admin')
        return
      }
  
      const updatedTeacher = {
        ...currentTeacher,
        name: user?.firstName,
        email: user?.emailAddresses[0]?.emailAddress
      };
      
      try {
        // Try to find existing teacher by email
        const response = await axios.get(`http://localhost:4000/teacher-api/teacher/${updatedTeacher.email}`);
        
        if (response.data.message === "Teacher Found") {
          console.log("Existing teacher found:", response.data.payload);
          // Update local state with retrieved teacher
          setCurrentTeacher(updatedTeacher);
          localStorage.setItem('currentTeacher', JSON.stringify(updatedTeacher));
        } else {
          // If teacher not found, create a new one
          console.log("Creating new teacher...");
          const createResponse = await axios.post('http://localhost:4000/teacher-api/teachers', updatedTeacher);
          
          if (createResponse.data.message === "Teacher created") {
            console.log("New teacher created:", createResponse.data.payload);
            setCurrentTeacher(updatedTeacher);
            localStorage.setItem('currentTeacher', JSON.stringify(updatedTeacher));
          }
        }
        
        // Fetch or create teacher ID
        const idResponse = await axios.get(`http://localhost:4000/id-teacher-api/teacherId/${updatedTeacher.email}`);
        
        if (idResponse.data.message === "Teacher Found By Email") {
          console.log("Existing teacher ID found:", idResponse.data.payload.id);
          setCurrentId(idResponse.data.payload.id);
          localStorage.setItem('currentId', idResponse.data.payload.id);
        } else {
          // Generate a unique ID (you might want to improve this)
          const newId = Date.now() % 1000; // Simple ID generation
          const idCreateResponse = await axios.post('http://localhost:4000/id-teacher-api/teachersId', {
            id: newId,
            name: updatedTeacher.name,
            email: updatedTeacher.email
          });
          
          if (idCreateResponse.data.message === "Teacher created") {
            console.log("New teacher ID created:", idCreateResponse.data.payload.id);
            setCurrentId(idCreateResponse.data.payload.id);
            localStorage.setItem('currentId', idCreateResponse.data.payload.id);
          }
        }
      } catch (error) {
        console.error("Error fetching or creating teacher:", error);
      }
    };
    
    if (isLoaded) {
      fetchOrCreateTeacher();
    }
  }, [isLoaded, isSignedIn, user, currentTeacher, setCurrentTeacher, setCurrentId, navigate]);

  return (
    <div className="home-container">
      <div className="hero-section">
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
      </div>
      
      <div className="features-section py-5">
        <div className="container">
          <h2 className="text-center mb-5">Smart Booking Features</h2>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="feature-card">
                <div className="feature-icon">📅</div>
                <h3>Easy Scheduling</h3>
                <p>Book classrooms and labs with our intuitive calendar interface</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="feature-card">
                <div className="feature-icon">🔄</div>
                <h3>Flexible Cancellation</h3>
                <p>Easily cancel or modify your bookings as needed</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="feature-card">
                <div className="feature-icon">📊</div>
                <h3>Resource Management</h3>
                <p>Find available rooms based on capacity and equipment needs</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
