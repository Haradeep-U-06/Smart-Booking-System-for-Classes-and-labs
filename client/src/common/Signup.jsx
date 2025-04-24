import React, { useState, useEffect } from 'react'
import { SignUp } from '@clerk/clerk-react'
import './Auth.css'
import Loader from './Loader'

function Signup() {
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // Add a small delay to ensure the loader is visible
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1200)
    
    return () => clearTimeout(timer)
  }, [])
  
  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-card">
          <h2 className="text-center mb-4">Create Your Account</h2>
          {loading ? (
            <Loader />
          ) : (
            <SignUp routing="path" path="/signup" signInUrl="/signin" />
          )}
        </div>
      </div>
    </div>
  )
}

export default Signup