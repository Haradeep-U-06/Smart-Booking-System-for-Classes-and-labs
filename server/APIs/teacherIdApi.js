const exp = require('express')
const teacherIdApp = exp.Router()
const TeacherId = require('../models/teacherIdModel')
const expressAsyncHandler = require('express-async-handler');

//Get Teachers Using Id
teacherIdApp.get('/teacherId/:email', expressAsyncHandler(async(req, res) => {
    try {
        const {email}=req.params
        const teachersId = await TeacherId.findOne({email});
        if(teachersId===null)
            res.send({message:"Not Found"})
        else
        res.status(200).send({message:"Teacher Found By Email", payload:teachersId});
    } catch (error) {
        res.status(500).send({error:error.message});
    }
}));


//Default Entry Of Teachers
teacherIdApp.post('/teachersId', expressAsyncHandler(async(req, res) => {
    const newTeacher = req.body;
    try {
        const teacherId = await TeacherId(newTeacher);
        await teacherId.save()
        res.send({message:"Teacher entry done"})
    } catch (error) {
        res.status(500).send({error:error.message});
    }
}));


//Delete Deafult Teacher Using Id
teacherIdApp.delete('/delete/:teacherId', expressAsyncHandler(async(req, res) => {
    try {
        const teach=await TeacherId.findByIdAndDelete(req.params.teacherId);
        res.send({message:"Teacher data deleted"});
    } catch (error) {
        res.status(500).send({error:error.message});
    }
}));



module.exports = teacherIdApp;