import React, { useState, useEffect } from 'react'
import { createContext } from 'react'

export const idContextObj = createContext()

function Idcontexts({children}) {
    const [currentId, setCurrentId] = useState(() => {
        // Try to retrieve stored ID from localStorage on init
        const savedId = localStorage.getItem('currentId')
        return savedId ? JSON.parse(savedId) : { id: 0 }
    })

    // Save to localStorage whenever currentId changes
    useEffect(() => {
        if (currentId) {
            localStorage.setItem('currentId', JSON.stringify(currentId))
        }
    }, [currentId])

    return (
        <idContextObj.Provider value={{currentId, setCurrentId}}>
            {children}
        </idContextObj.Provider>
    )
}

export default Idcontexts