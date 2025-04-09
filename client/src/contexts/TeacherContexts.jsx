import React, { createContext, useState } from 'react'

export const teacherContextObj = createContext()

function TeacherContexts({ children }) {
    const [currentTeacher, setCurrentTeacher] = useState({
        name: "",
        email: "",
    });

    return (
        <teacherContextObj.Provider value={{ currentTeacher, setCurrentTeacher }}>
            {children}
        </teacherContextObj.Provider>
    );
}

export default TeacherContexts;
