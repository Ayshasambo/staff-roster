const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    phonenumber: {
        type: Number,
        required: true,
        unique: true,
        trim: true,
    },
    leaveBalance: {
        type: Number,
        required: true,
        default: 30, // 30 working days
    },
    active: {
        type: Boolean,
        default: true
    },
    role: {
        type: String,
        enum: ['admin', 'staff'],
        default: 'staff'
    },
    pin: {
        type: String,
        default: '1234' // Default 4-digit PIN
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Staff', staffSchema);
