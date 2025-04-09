const exp = require('express')
const teacherApp = exp.Router()
const Teacher = require('../models/teacherModel')
const expressAsyncHandler = require('express-async-handler');

// Get all teachers
teacherApp.get('/teacher/:email', expressAsyncHandler(async(req, res) => {
    try {
        const {email}=req.params
        const teachers = await Teacher.findOne({email});
        if(teachers===null)
            res.send({message:"Not Found"})
        else
        res.status(200).send({message:"Teacher Found", payload:teachers});
    } catch (error) {
        res.status(500).send({error:error.message});
    }
}));

// Entry of a teacher 
teacherApp.post('/teachers', expressAsyncHandler(async(req, res) => {
    const newTeacher = req.body;
    try {
        const teacher = await Teacher(newTeacher);
        await teacher.save()
        res.send({message:"Teacher entry done"})
    } catch (error) {
        res.status(500).send({error:error.message});
    }
}));

// Delete a teacher
teacherApp.delete('/del/:teacherId', expressAsyncHandler(async(req, res) => {
    try {
        const teach=await Teacher.findByIdAndDelete(req.params.teacherId);
        res.send({message:"Teacher data deleted"});
    } catch (error) {
        res.status(500).send({error:error.message});
    }
}));

module.exports = teacherApp;