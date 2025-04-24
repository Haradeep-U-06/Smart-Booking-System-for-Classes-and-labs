import React from 'react'
import './Footer.css'

function Footer() {
  return (
    <footer className="footer">
      <div className="container py-3">
        <div className="row">
          <div className="col-md-6">
            <h5>Smart Booking System</h5>
            <p className="small">Efficiently manage classroom and lab resources</p>
          </div>
          <div className="col-md-6 text-md-end">
            <p className="small mb-0">© {new Date().getFullYear()} Smart Booking. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer