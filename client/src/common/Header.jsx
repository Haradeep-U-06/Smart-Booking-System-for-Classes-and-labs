import React, { useContext } from 'react'
import { Link,useNavigate } from 'react-router-dom'
import { useClerk,useUser } from '@clerk/clerk-react'
import { teacherContextObj } from '../contexts/TeacherContexts'

function Header() {
  const {signOut} = useClerk()
  const {isSignedIn,user,isLoaded}=useUser()
  const {currentTeacher,setCurrentTeacher}=useContext(teacherContextObj)
  const navigate=useNavigate()

  async function handleSignout() {
    await signOut()
    setCurrentTeacher(null)
    navigate('/')    
  }


  return (
    <div>
      <nav className='header d-flex justify-content-between'>
        <div className="d-flex justify-content-center">
        <Link to="/">LOGO</Link>
        </div>
        <ul className="d-flex list-unstyled">
          {
            !isSignedIn?
            <>
             <li><Link to="">Home</Link></li>
        <li><Link to="signin">Signin</Link></li>
        <li><Link to="signup">Signup</Link></li>
            </>:
            <div className='user-button d-flex'>        
              <div style={{position:'relative'}}>
           <Link to="profile"><img src={user.imageUrl} width='40px' className='rounded-circle' alt=""/></Link>
              <p className=' mb-0 teacher-name' style={{position:'absolute'}}>{user.firstName}</p>
              </div>
              <div>
              <button className='btn btn-danger' onClick={handleSignout}>Signout</button>
            </div>
            <div>
              <Link to="book">Book</Link>
            </div>
            <div>
              <Link to="cancel">Cancel a pre-scheduled Class</Link>
            </div>
            </div>
          }
       
        </ul>
      </nav>
    </div>
  )
}

export default Header