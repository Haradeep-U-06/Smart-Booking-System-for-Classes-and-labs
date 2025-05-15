const exp = require('express')
const leaveApp = exp.Router()
const LeaveApplication = require('../models/leaveModel')
const expressAsyncHandler = require('express-async-handler');

// Submit a new leave application
leaveApp.post('/apply', expressAsyncHandler(async(req, res) => {
    try {
        const { facultyId, facultyName, facultyEmail, fromDate, toDate, reason, leaveType } = req.body;
        
        // Validate input
        if (!facultyId || !facultyName || !facultyEmail || !fromDate || !toDate || !reason || !leaveType) {
            return res.status(400).send({
                error: "Missing required fields. Please provide all required information."
            });
        }
        
        // Check if faculty has already applied for leave on these dates
        const existingFacultyLeave = await LeaveApplication.findOne({
            facultyId: facultyId,
            $or: [
                // Check if any existing leave overlaps with requested dates
                {
                    fromDate: { $lte: toDate },
                    toDate: { $gte: fromDate }
                }
            ]
        });

        if (existingFacultyLeave) {
            return res.status(400).send({
                error: "You already have a leave application that overlaps with the requested dates."
            });
        }
        
        // Check if maximum leaves limit is reached for any day in the date range
        const fromDateObj = new Date(fromDate);
        const toDateObj = new Date(toDate);
        
        // Loop through each day in the range
        for (let day = new Date(fromDateObj); day <= toDateObj; day.setDate(day.getDate() + 1)) {
            const currentDate = day.toISOString().split('T')[0]; // Format: YYYY-MM-DD
            
            // Count how many leaves are already applied for this date
            const existingLeaves = await LeaveApplication.countDocuments({
                $or: [
                    // Date range overlaps with current date
                    {
                        fromDate: { $lte: currentDate },
                        toDate: { $gte: currentDate }
                    }
                ]
            });
            
            if (existingLeaves >= 8) {
                return res.status(400).send({
                    error: `Maximum leave limit reached for ${new Date(currentDate).toLocaleDateString()}. No more leave applications can be accepted for this date.`
                });
            }
        }
        
        const newLeave = new LeaveApplication({
            facultyId,
            facultyName,
            facultyEmail,
            fromDate,
            toDate,
            reason,
            leaveType, // Add the leave type
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

// Get faculty on leave for a specific date
leaveApp.get('/on-leave', expressAsyncHandler(async(req, res) => {
    try {
        const { date } = req.query;
        
        if (!date) {
            return res.status(400).send({ error: "Date parameter is required" });
        }
        
        // Find all approved leaves that include this date
        const leavesOnDate = await LeaveApplication.find({
            fromDate: { $lte: date },
            toDate: { $gte: date },
            status: 'approved'
        });
        
        // Extract faculty information
        const facultyOnLeave = leavesOnDate.map(leave => ({
            facultyId: leave.facultyId,
            facultyName: leave.facultyName,
            leaveType: leave.leaveType
        }));
        
        res.status(200).send({
            message: "Retrieved faculty on leave",
            payload: facultyOnLeave
        });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
}));

module.exports = leaveApp;