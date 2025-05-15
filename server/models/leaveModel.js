const mongoose = require('mongoose')

const leaveApplicationSchema = new mongoose.Schema({
    facultyId: {
        type: String,
        required: true
    },
    facultyName: {
        type: String,
        required: true
    },
    facultyEmail: {
        type: String,
        required: true
    },
    fromDate: {
        type: String,
        required: true
    },
    toDate: {
        type: String,
        required: true
    },
    leaveType: {
        type: String,
        enum: ['EL', 'CL', 'SL', 'LOP'],
        default: 'CL',
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    adminMessage: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {timestamps: true});

module.exports = mongoose.model('LeaveApplication', leaveApplicationSchema);