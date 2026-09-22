import React, { createContext, useState, useEffect } from 'react'

export const teacherContextObj = createContext()

function TeacherContexts({ children }) {
  const [currentTeacher, setCurrentTeacher] = useState(() => {
    const savedTeacher = localStorage.getItem('currentTeacher')
    return savedTeacher
      ? JSON.parse(savedTeacher)
      : {
          _id: "",
          name: "",
          email: "",
        }
  })

  useEffect(() => {
    if (currentTeacher?._id) {
      localStorage.setItem('currentTeacher', JSON.stringify(currentTeacher))
    } else {
      localStorage.removeItem('currentTeacher')
    }
  }, [currentTeacher])

  return (
    <teacherContextObj.Provider value={{ currentTeacher, setCurrentTeacher }}>
      {children}
    </teacherContextObj.Provider>
  )
}

export default TeacherContexts
