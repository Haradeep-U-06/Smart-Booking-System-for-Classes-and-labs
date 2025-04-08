import React from 'react'
import { useContext,useEffect } from 'react'
import { teacherContextObj } from '../contexts/TeacherContexts'
import {useUser} from '@clerk/clerk-react'
import { idContextObj } from '../contexts/Idcontexts'
import axios from 'axios'

function Home() {
  const {currentTeacher,setCurrentTeacher}=useContext(teacherContextObj)
  const {currentId,setCurrentId}=useContext(idContextObj)
  const {isSignedIn,user,isLoaded}=useUser()
  useEffect(() => {
    const fetchOrCreateTeacher = async () => {
      if (!user || !isSignedIn) return;
  
      const updatedTeacher = {
        ...currentTeacher,
        name: user?.firstName,
        email: user?.emailAddresses[0]?.emailAddress
      };
  
      setCurrentTeacher(updatedTeacher);
  
      try {
        const res = await axios.get(
          `http://localhost:4000/id-teacher-api/teacherId/${updatedTeacher.email}`
        );
  
        if (res.data.message === "Teacher Found By Email") {
          setCurrentId(res.data.payload.id);
          console.log("Found ID:", res.data.payload.id);
        } else {
          const rep=await axios.get(
            `http://localhost:4000/teacher-api/teacher/${updatedTeacher.email}`
          );
          if(rep.data.message==="Teacher Found")
            console.log("Already Teacher data exists")
          else
          {
          const postRes = await axios.post(
            'http://localhost:4000/teacher-api/teachers',
            updatedTeacher
          );
          console.log("New teacher created:", postRes.data);
        }}
      } catch (err) {
        console.error("Error in fetching/creating teacher:", err);
      }
    };
  
    fetchOrCreateTeacher();
  }, [isLoaded]);
  return (
    <div>Home</div>
  )
}

export default Home
