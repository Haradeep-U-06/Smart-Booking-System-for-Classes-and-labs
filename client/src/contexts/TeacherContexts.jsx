import React, { createContext, useState, useEffect } from 'react'

export const teacherContextObj = createContext()

function TeacherContexts({ children }) {
    const [currentTeacher, setCurrentTeacher] = useState(() => {
        // Try to retrieve stored teacher info from localStorage on init
        const savedTeacher = localStorage.getItem('currentTeacher')
        return savedTeacher ? JSON.parse(savedTeacher) : {
            name: "",
            email: "",
        }
    })

    // Save to localStorage whenever currentTeacher changes
    useEffect(() => {
        if (currentTeacher && (currentTeacher.name || currentTeacher.email)) {
            localStorage.setItem('currentTeacher', JSON.stringify(currentTeacher))
        }
    }, [currentTeacher])

    return (
        <teacherContextObj.Provider value={{ currentTeacher, setCurrentTeacher }}>
            {children}
        </teacherContextObj.Provider>
    )
}

export default TeacherContexts
