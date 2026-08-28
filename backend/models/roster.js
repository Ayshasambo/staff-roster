const mongoose = require('mongoose');

const dailyShiftSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
    },

    assignedStaff: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
        required: true,
    }]
}, { _id: false });


// Every roster day must have exactly 2 staff members
dailyShiftSchema.path('assignedStaff').validate(function (value) {
    return value.length === 2;
}, 'Each roster day must have exactly 2 assigned staff members.');


const rosterSchema = new mongoose.Schema({
    year: {
        type: Number,
        required: true,
    },

    month: {
        type: Number,
        required: true,
        min: 1,
        max: 12,
    },

    shifts: {
        type: [dailyShiftSchema],
        default: [],
    },

    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft',
    }

}, {
    timestamps: true
});


// Prevent two rosters for the same month
rosterSchema.index(
    { year: 1, month: 1 },
    { unique: true }
);


module.exports = mongoose.model('Roster', rosterSchema);