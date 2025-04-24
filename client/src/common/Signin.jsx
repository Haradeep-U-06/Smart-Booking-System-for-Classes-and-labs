import React, { useState, useEffect } from 'react'
import { SignIn } from '@clerk/clerk-react'
import './Auth.css'
import Loader from './Loader'

function Signin() {
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // Add a small delay to ensure the loader is visible
    // This improves user perception even if authentication loads quickly
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1200)
    
    return () => clearTimeout(timer)
  }, [])
  
  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-card">
          <h2 className="text-center mb-4">Sign In to Smart Booking</h2>
          {loading ? (
            <Loader />
          ) : (
            <SignIn routing="path" path="/signin" signUpUrl="/signup" />
          )}
        </div>
      </div>
    </div>
  )
}

export default Signin