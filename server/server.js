const exp = require('express')
const app = exp()
app.use(exp.json());
require('dotenv').config()
const mongoose = require('mongoose')
const classroomApp = require('./APIs/classroomApi')
const bookingApp = require('./APIs/bookingApi')
const teacherApp = require('./APIs/teacherApi')
const teacherAppId = require('./APIs/teacherIdApi')
const leaveApp = require('./APIs/leaveApi') // Add this line
const cors = require('cors')
app.use(cors())

const port = process.env.PORT || 4000

mongoose.connect(process.env.DBURL)
.then(()=>{
    app.listen(port, ()=>console.log(`Server is listening on port number ${port}..`))
    console.log("DB connection successful")
})
.catch(err=>console.log("Error in DB connection", err))

app.use(exp.json())
app.use('/classroom-api', classroomApp)
app.use('/booking-api', bookingApp)
app.use('/teacher-api', teacherApp)
app.use('/id-teacher-api', teacherAppId)

app.use('/leave-api', leaveApp) // Add this lineapp.use('/leave-api', leaveApp) // Add this line