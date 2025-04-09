import React from 'react'
import { createContext,useState } from 'react'

export const idContextObj=createContext()

function Idcontexts({children}) {
    const [currentId,setCurrentId]=useState({
        id:0
    })
  return (
   <idContextObj.Provider value={{currentId,setCurrentId}}>
    {children}
   </idContextObj.Provider>
  )
}

export default Idcontexts