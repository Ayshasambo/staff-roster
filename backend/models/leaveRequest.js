const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
    staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
        required: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    workingDays: {
        type: Number,
        required: true,
        min: 1,
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
