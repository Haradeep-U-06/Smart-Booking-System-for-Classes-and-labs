import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'bootstrap/dist/css/bootstrap.css';
import {createBrowserRouter,RouterProvider,Navigate} from 'react-router-dom'
import RootLayout from './common/RootLayout.jsx'
import Home from './common/Home.jsx'
import Signin from './common/Signin.jsx'
import Signup from './common/Signup.jsx'
import Userprofile from './common/Userprofile.jsx'
import Book from './components/Book.jsx'
import Cancel from './components/Cancel.jsx'
import ManageBookings from './components/ManageBookings.jsx'
import TeacherContexts from './contexts/TeacherContexts.jsx';
import Idcontexts from './contexts/Idcontexts.jsx';
import LeaveApplication from './components/LeaveApplication.jsx';
import Notifications from './components/Notifications.jsx';
import AdminDashboard from './admin/AdminDashboard.jsx';
import LeaveRequests from './admin/LeaveRequests.jsx';
import ClassroomManagement from './admin/ClassroomManagement.jsx';

const browserRouterObj=createBrowserRouter([
  {
    path:"/",
    element:<RootLayout/>,
    children:[
      {
        path:"",
        element:<Home/>
      },
      {
        path:"signin",
        element:<Signin/>
      },
      {
        path:"signup",
        element:<Signup/>
      },
      {
        path:"profile",
        element:<Userprofile/>
      },
      {
        path:"book",
        element:<Book/>
      },
      {
        path:"cancel",
        element:<Cancel/>
      },
      {
        path:"manage",
        element:<ManageBookings/>
      }, 
      {
        path:"/leave-application",
        element:<LeaveApplication/>
      }, 
      {
        path:"/notifications",
        element:<Notifications/>
      },
      // Admin Routes
      {
        path:"/admin",
        element:<AdminDashboard/>
      },
      {
        path:"/admin/leave-requests",
        element:<LeaveRequests/>
      },
      {
        path:"/admin/classrooms",
        element:<ClassroomManagement/>
      }
    ]
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TeacherContexts>
      <Idcontexts>
        <RouterProvider router={browserRouterObj}/>
      </Idcontexts>
    </TeacherContexts>
  </StrictMode>,
)
