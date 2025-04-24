import React from 'react'
import './Loader.css'

function Loader() {
  return (
    <div className="auth-loader">
      <div className="loader-logo">SB</div>
      <div className="loader-spinner">
        <div className="dot"></div>
        <div className="dot"></div>
        <div className="dot"></div>
      </div>
      <p className="loader-text">Preparing secure authentication...</p>
    </div>
  )
}

export default Loader