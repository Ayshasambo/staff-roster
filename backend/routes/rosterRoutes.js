const express = require('express');
const router = express.Router();
const Roster = require('../models/roster');
const Staff = require('../models/staff');
const LeaveRequest = require('../models/leaveRequest');
const { generateRosterForMonth, buildPairHistory } = require('../utils/rosterRules');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET all monthly rosters
router.get('/', authenticate, async (req, res) => {
    try {
        const rosters = await Roster.find({})
            .populate('shifts.assignedStaff', 'name phonenumber leaveBalance active role')
            .sort({ year: -1, month: -1 });

        return res.json(rosters);

    } catch (error) {
        return res.status(500).json({
            error: error.message
        });
    }
});


// GET roster for a specific month
router.get('/:year/:month', authenticate, async (req, res) => {
    try {
        const { year, month } = req.params;

        const roster = await Roster.findOne({
            year: Number(year),
            month: Number(month)
        }).populate(
            'shifts.assignedStaff',
            'name phonenumber leaveBalance active role'
        );

        if (!roster) {
            return res.status(404).json({
                error: 'Roster not found for this month.'
            });
        }

        return res.json(roster);

    } catch (error) {
        return res.status(500).json({
            error: error.message
        });
    }
});


// POST generate a draft roster for a month (Admin only)
router.post('/generate', authenticate, requireAdmin, async (req, res) => {
    try {
        const { year, month } = req.body;

        if (!year || !month) {
            return res.status(400).json({
                error: 'year and month are required.'
            });
        }

        const numericYear = Number(year);
        const numericMonth = Number(month);

        if (
            !Number.isInteger(numericYear) ||
            !Number.isInteger(numericMonth) ||
            numericMonth < 1 ||
            numericMonth > 12
        ) {
            return res.status(400).json({
                error: 'year must be a valid integer and month must be between 1 and 12.'
            });
        }


        // Check if roster already exists for this month
        const existingRoster = await Roster.findOne({
            year: numericYear,
            month: numericMonth
        });

        if (existingRoster) {
            return res.status(400).json({
                error: 'A roster already exists for this month.',
                roster: existingRoster
            });
        }


        // Get active staff
        const allStaff = await Staff.find({
            active: true
        });

        if (allStaff.length < 2) {
            return res.status(400).json({
                error: 'At least 2 active staff members are required.'
            });
        }


        // Get first and last day of the month
        const monthStart = new Date(
            numericYear,
            numericMonth - 1,
            1
        );

        const monthEnd = new Date(
            numericYear,
            numericMonth,
            0
        );

        monthStart.setHours(0, 0, 0, 0);
        monthEnd.setHours(23, 59, 59, 999);


        // Get approved leaves that overlap this month
        const approvedLeaves = await LeaveRequest.find({
            status: 'approved',
            startDate: {
                $lte: monthEnd
            },
            endDate: {
                $gte: monthStart
            }
        });


        // Get all previously published rosters
        const publishedRosters = await Roster.find({
            status: 'published'
        });

        const pairHistory = buildPairHistory(publishedRosters);


        // Count historical shifts for each staff member
        const historicalShifts = {};

        allStaff.forEach(staff => {
            historicalShifts[staff._id.toString()] = 0;
        });


        publishedRosters.forEach(roster => {
            roster.shifts.forEach(shift => {

                shift.assignedStaff.forEach(staffId => {

                    const staffIdString = staffId.toString();

                    if (
                        historicalShifts[staffIdString] !== undefined
                    ) {
                        historicalShifts[staffIdString]++;
                    }

                });

            });
        });


        // Generate the monthly roster
        let shifts;

        try {
            shifts = generateRosterForMonth(
                numericYear,
                numericMonth,
                allStaff,
                approvedLeaves,
                historicalShifts,
                pairHistory
            );

        } catch (algorithmError) {
            return res.status(400).json({
                error: algorithmError.message
            });
        }


        // Create the monthly draft roster
        const roster = new Roster({
            year: numericYear,
            month: numericMonth,
            shifts,
            status: 'draft'
        });


        const savedRoster = await roster.save();

        const populatedRoster = await Roster.findById(savedRoster._id)
        .populate(
         'shifts.assignedStaff',
         'name phonenumber leaveBalance active'
       );
        // Format roster dates for Nigerian users
        const formattedShifts = populatedRoster.shifts.map(shift => ({
            date: shift.date,

            displayDate: new Intl.DateTimeFormat('en-NG', {
                timeZone: 'Africa/Lagos',
                dateStyle: 'full'
            }).format(new Date(shift.date)),

            assignedStaff: shift.assignedStaff
        }));


        return res.status(201).json({
            message: 'Monthly roster draft generated successfully.',

            roster: {
                ...populatedRoster.toObject(),
                shifts: formattedShifts
            }
        });

        } catch (error) {
            return res.status(500).json({
                error: error.message
            });
        }
});


// PUT manually edit a monthly roster (Admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { shifts } = req.body;

        if (!Array.isArray(shifts)) {
            return res.status(400).json({
                error: 'shifts must be an array.'
            });
        }


        const roster = await Roster.findById(req.params.id);

        if (!roster) {
            return res.status(404).json({
                error: 'Roster not found.'
            });
        }


        // Validate every shift
        for (const shift of shifts) {

            if (
                !shift.date ||
                !Array.isArray(shift.assignedStaff) ||
                shift.assignedStaff.length !== 2
            ) {
                return res.status(400).json({
                    error: 'Each shift must have a date and exactly 2 assigned staff members.'
                });
            }


            const shiftDate = new Date(shift.date);

            if (isNaN(shiftDate.getTime())) {
                return res.status(400).json({
                    error: `Invalid date: ${shift.date}`
                });
            }


            const day = shiftDate.getDay();

            // Only Monday to Thursday are roster days
            if (day === 0 || day === 5 || day === 6) {
                return res.status(400).json({
                    error: 'Roster shifts can only be assigned from Monday to Thursday.'
                });
            }


            // Make sure staff members exist
            for (const staffId of shift.assignedStaff) {

                const staff = await Staff.findOne({
                    _id: staffId,
                    active: true
                });

                if (!staff) {
                    return res.status(400).json({
                        error: `Active staff member with ID ${staffId} does not exist.`
                    });
                }
            }
        }


        roster.shifts = shifts.map(shift => ({
            date: new Date(shift.date),
            assignedStaff: shift.assignedStaff
        }));


        await roster.save();


        return res.json({
            message: 'Roster customized successfully.',
            roster
        });

    } catch (error) {
        return res.status(500).json({
            error: error.message
        });
    }
});


// PATCH publish roster (Admin only)
router.patch('/:id/publish', authenticate, requireAdmin, async (req, res) => {
    try {
        const roster = await Roster.findById(req.params.id);

        if (!roster) {
            return res.status(404).json({
                error: 'Roster not found.'
            });
        }


        if (roster.status === 'published') {
            return res.status(400).json({
                error: 'Roster is already published.'
            });
        }


        roster.status = 'published';

        await roster.save();


        return res.json({
            message: 'Roster published successfully.',
            roster
        });

    } catch (error) {
        return res.status(500).json({
            error: error.message
        });
    }
});


module.exports = router;