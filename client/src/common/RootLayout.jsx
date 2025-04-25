import React, { useEffect } from 'react'
import Header from './Header'
import Footer from './Footer'
import { Outlet } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import './RootLayout.css'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

function RootLayout() {
  // Add this effect to preserve scroll position and other state
  useEffect(() => {
    // Save page state before refresh
    const handleBeforeUnload = () => {
      // Save current scroll position
      sessionStorage.setItem('scrollPosition', window.scrollY.toString())
      // You could save other important UI state here
    }
    
    // Listen for page unload events
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    // Restore scroll position after navigation or refresh
    const savedScrollPosition = sessionStorage.getItem('scrollPosition')
    if (savedScrollPosition) {
      window.scrollTo(0, parseInt(savedScrollPosition))
    }
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <div className="app-container">
        <Header />
        <main className="content-container">
          <Outlet />
        </main>
        <Footer />
      </div>
    </ClerkProvider>
  )
}

export default RootLayout