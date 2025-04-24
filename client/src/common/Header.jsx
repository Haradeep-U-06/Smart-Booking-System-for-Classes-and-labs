import React, { useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useClerk, useUser } from '@clerk/clerk-react'
import { teacherContextObj } from '../contexts/TeacherContexts'
import './Header.css' // Make sure this file exists or create it

function Header() {
  const { signOut } = useClerk()
  const { isSignedIn, user, isLoaded } = useUser()
  const { currentTeacher, setCurrentTeacher } = useContext(teacherContextObj)
  const navigate = useNavigate()

  async function handleSignout() {
    await signOut()
    setCurrentTeacher(null)
    navigate('/')    
  }

  return (
    <header className="bg-primary shadow-sm">
      <div className="container-fluid">
        <nav className="navbar navbar-expand-md navbar-dark py-2">
          <div className="container-fluid">
            {/* Logo on the left */}
            <Link to="/" className="navbar-brand fw-bold fs-4 me-5">SMART BOOKING</Link>
            
            {/* Hamburger menu for mobile */}
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" 
                    data-bs-target="#navbarContent" aria-controls="navbarContent" 
                    aria-expanded="false" aria-label="Toggle navigation">
              <span className="navbar-toggler-icon"></span>
            </button>
            
            {/* Navigation items */}
            <div className="collapse navbar-collapse" id="navbarContent">
              {!isSignedIn ? (
                <ul className="navbar-nav ms-auto mb-2 mb-md-0 gap-3">
                  <li className="nav-item">
                    <Link to="" className="nav-link">Home</Link>
                  </li>
                  <li className="nav-item">
                    <Link to="signin" className="nav-link">Signin</Link>
                  </li>
                  <li className="nav-item">
                    <Link to="signup" className="nav-link">Signup</Link>
                  </li>
                </ul>
              ) : (
                <div className="ms-auto d-flex align-items-center gap-3">
                  {/* Navigation links when signed in */}
                  <Link to="book" className="btn btn-outline-light me-2">Book</Link>
                  <Link to="cancel" className="btn btn-outline-light me-3">Cancel a Class</Link>
                  
                  {/* User profile section */}
                  <div className="d-flex align-items-center gap-3">
                    <Link to="profile" className="d-flex align-items-center text-decoration-none">
                      <img src={user.imageUrl} 
                           className="rounded-circle border border-2 border-light" 
                           width="40" height="40" 
                           alt="Profile"/>
                    </Link>
                    <button className="btn btn-danger" onClick={handleSignout}>
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </nav>
      </div>
    </header>
  )
}

export default Header