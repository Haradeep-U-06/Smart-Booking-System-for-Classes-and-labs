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
import Available from './components/Available.jsx'
import Booked from './components/Booked.jsx'
import TeacherContexts from './contexts/TeacherContexts.jsx';
import Idcontexts from './contexts/Idcontexts.jsx';

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
        path:"available",
        element:<Available/>
      },
      {
        path:"booked",
        element:<Booked/>
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
