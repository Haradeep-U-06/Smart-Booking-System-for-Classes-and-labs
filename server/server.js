const exp = require('express')
const app = exp()
app.use(exp.json());
require('dotenv').config()
const mongoose = require('mongoose')
const classroomApp = require('./APIs/classroomApi')
const bookingApp = require('./APIs/bookingApi')
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