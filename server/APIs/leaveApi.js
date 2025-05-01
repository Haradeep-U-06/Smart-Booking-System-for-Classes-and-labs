const exp = require('express')
const leaveApp = exp.Router()
const LeaveApplication = require('../models/leaveModel')
const expressAsyncHandler = require('express-async-handler');

// Submit a new leave application
leaveApp.post('/apply', expressAsyncHandler(async(req, res) => {
    try {
        const { facultyId, facultyName, facultyEmail, fromDate, toDate, reason } = req.body;
        
        // Validate input
        if (!facultyId || !facultyName || !facultyEmail || !fromDate || !toDate || !reason) {
            return res.status(400).send({
                error: "Missing required fields. Please provide all required information."
            });
        }
        
        const newLeave = new LeaveApplication({
            facultyId,
            facultyName,
            facultyEmail,
            fromDate,
            toDate,
            reason,
            status: 'pending',
            adminMessage: '',
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        const savedLeave = await newLeave.save();
        
        // Log for debugging
        console.log("New leave application saved:", savedLeave);
        
        res.status(201).send({
            message: "Leave application submitted successfully",
            payload: savedLeave
        });
    } catch (error) {
        console.error("Error saving leave application:", error);
        res.status(500).send({error: error.message});
    }
}));

// Get all leave applications for a specific faculty
leaveApp.get('/faculty/:facultyId', expressAsyncHandler(async(req, res) => {
    try {
        const { facultyId } = req.params;
        const leaves = await LeaveApplication.find({ facultyId }).sort({ createdAt: -1 });
        
        res.status(200).send({
            message: "Faculty leave applications retrieved",
            payload: leaves
        });
    } catch (error) {
        res.status(500).send({error: error.message});
    }
}));

// Get all pending leave applications (for admin)
leaveApp.get('/pending', expressAsyncHandler(async(req, res) => {
    try {
        const pendingLeaves = await LeaveApplication.find({ status: 'pending' }).sort({ createdAt: 1 });
        
        res.status(200).send({
            message: "Pending leave applications retrieved",
            payload: pendingLeaves
        });
    } catch (error) {
        res.status(500).send({error: error.message});
    }
}));

// Get all leave applications (for admin)
leaveApp.get('/all', expressAsyncHandler(async(req, res) => {
    try {
        const allLeaves = await LeaveApplication.find().sort({ updatedAt: -1 });
        
        res.status(200).send({
            message: "All leave applications retrieved",
            payload: allLeaves
        });
    } catch (error) {
        res.status(500).send({error: error.message});
    }
}));

// Approve a leave application
leaveApp.put('/:id/approve', expressAsyncHandler(async(req, res) => {
    try {
        const { id } = req.params;
        const { adminMessage } = req.body;
        
        const updatedLeave = await LeaveApplication.findByIdAndUpdate(
            id,
            { 
                status: 'approved', 
                adminMessage: adminMessage || 'Your leave request has been approved.',
                updatedAt: Date.now()
            },
            { new: true }
        );
        
        if (!updatedLeave) {
            return res.status(404).send({ error: "Leave application not found" });
        }
        
        res.status(200).send({
            message: "Leave application approved",
            payload: updatedLeave
        });
    } catch (error) {
        res.status(500).send({error: error.message});
    }
}));

// Reject a leave application
leaveApp.put('/:id/reject', expressAsyncHandler(async(req, res) => {
    try {
        const { id } = req.params;
        const { adminMessage } = req.body;
        
        if (!adminMessage) {
            return res.status(400).send({ error: "Admin message is required for rejection" });
        }
        
        const updatedLeave = await LeaveApplication.findByIdAndUpdate(
            id,
            { 
                status: 'rejected', 
                adminMessage,
                updatedAt: Date.now()
            },
            { new: true }
        );
        
        if (!updatedLeave) {
            return res.status(404).send({ error: "Leave application not found" });
        }
        
        res.status(200).send({
            message: "Leave application rejected",
            payload: updatedLeave
        });
    } catch (error) {
        res.status(500).send({error: error.message});
    }
}));

module.exports = leaveApp;