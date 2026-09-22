import React, { useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { teacherContextObj } from '../contexts/TeacherContexts'
import { idContextObj } from '../contexts/Idcontexts'
import { useUser } from '@clerk/clerk-react'
import axios from 'axios'
import './Home.css'
const API_URL = import.meta.env.VITE_API_URL;

function Home() {
  const { currentTeacher, setCurrentTeacher } = useContext(teacherContextObj)
  const { currentId, setCurrentId } = useContext(idContextObj)
  const { isSignedIn, user, isLoaded } = useUser()
  const navigate = useNavigate()

useEffect(() => {
  const fetchOrCreateTeacher = async () => {
    if (!isSignedIn || !user) {
      localStorage.removeItem('currentTeacher')
      localStorage.removeItem('currentId')
      setCurrentTeacher({ _id: "", name: "", email: "" })
      setCurrentId({ id: 0 })
      return
    }

    try {
      const email = user.emailAddresses[0].emailAddress
      const isAdmin = email === 'rishivarma.d@gmail.com'

      // 🔹 Find teacher/admin in DB
      const teacherRes = await axios.get(
        `${API_URL}/teacher-api/teacher/${email}`
      )

      let teacherData

      if (teacherRes.data.message === "Teacher Found") {
        teacherData = teacherRes.data.payload
      } else {
        const createRes = await axios.post(
          `${API_URL}/teacher-api/teachers`,
          {
            name: user.firstName,
            email,
            role: isAdmin ? "ADMIN" : "TEACHER"
          }
        )
        teacherData = createRes.data.payload
      }

      // ✅ store _id for BOTH admin & teacher
      setCurrentTeacher({
        _id: teacherData._id,
        name: teacherData.name,
        email: teacherData.email,
      })
      localStorage.setItem(
        'currentTeacher',
        JSON.stringify({
          _id: teacherData._id,
          name: teacherData.name,
          email: teacherData.email,
        })
      )

      // 🔹 GENERATED ID PART (UNCHANGED)
      const idRes = await axios.get(
        `${API_URL}/id-teacher-api/teacherId/${email}`
      )

      if (idRes.data.message === "Teacher Found By Email") {
        setCurrentId(idRes.data.payload.id)
        localStorage.setItem('currentId', idRes.data.payload.id)
      } else {
        const newId = Date.now() % 1000
        const idCreateRes = await axios.post(
          `${API_URL}/id-teacher-api/teachersId`,
          {
            id: newId,
            name: teacherData.name,
            email: teacherData.email,
          }
        )
        setCurrentId(idCreateRes.data.payload.id)
        localStorage.setItem('currentId', idCreateRes.data.payload.id)
      }

      // 🚀 NAVIGATE AFTER DB SAVE
      if (isAdmin) {
        navigate('/admin')
      }

    } catch (err) {
      console.error("Error loading user:", err)
    }
  }

  if (isLoaded) {
    fetchOrCreateTeacher()
  }
}, [isLoaded, isSignedIn, navigate])


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
