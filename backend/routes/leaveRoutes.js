const express = require('express');
const router = express.Router();
const LeaveRequest = require('../models/leaveRequest');
const Staff = require('../models/staff');
const Roster = require('../models/roster');
const { calculateWorkingDays, generateRosterForMonth, buildPairHistory } = require('../utils/rosterRules');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET all leave requests (optional ?staffId= query filter)
router.get('/', async (req, res) => {
    try {
        const query = {};
        if (req.query.staffId) {
            query.staffId = req.query.staffId;
        }

        const leaves = await LeaveRequest.find(query)
            .populate('staffId', 'name phonenumber leaveBalance active role')
            .sort({ createdAt: -1 });

        return res.json(leaves);
    } catch (error) {
        return res.status(500).json({
            error: error.message
        });
    }
});

// POST submit leave request
router.post('/', async (req, res) => {
    try {
        const { staffId, startDate, endDate } = req.body;

        if (!staffId || !startDate || !endDate) {
            return res.status(400).json({
                error: 'staffId, startDate, and endDate are required.'
            });
        }

        const staff = await Staff.findOne({
            _id: staffId,
            active: true
        });

        if (!staff) {
            return res.status(404).json({
                error: 'Active staff member not found.'
            });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
                error: 'Invalid startDate or endDate.'
            });
        }

        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        if (start > end) {
            return res.status(400).json({
                error: 'Start date cannot be after end date.'
            });
        }

        const workingDays = calculateWorkingDays(start, end);

        if (workingDays < 1) {
            return res.status(400).json({
                error: 'Leave request must contain at least one Monday-Friday working day.'
            });
        }

        const overlappingLeave = await LeaveRequest.findOne({
            staffId,
            status: {
                $in: ['pending', 'approved']
            },
            startDate: {
                $lte: end
            },
            endDate: {
                $gte: start
            }
        });

        if (overlappingLeave) {
            return res.status(400).json({
                error: 'This leave period overlaps with an existing leave request.'
            });
        }

        if (staff.leaveBalance < workingDays) {
            return res.status(400).json({
                error: `Insufficient leave balance. Remaining: ${staff.leaveBalance}, requested: ${workingDays}`
            });
        }

        const leaveRequest = new LeaveRequest({
            staffId,
            startDate: start,
            endDate: end,
            workingDays,
            status: 'pending'
        });

        await leaveRequest.save();

        return res.status(201).json(leaveRequest);

    } catch (error) {
        return res.status(500).json({
            error: error.message
        });
    }
});

// PATCH approve leave request (Admin only)
// router.patch('/:id/approve', authenticate, requireAdmin, async (req, res) => {
//     try {
//         const leave = await LeaveRequest.findById(req.params.id);

//         if (!leave) {
//             return res.status(404).json({
//                 error: 'Leave request not found.'
//             });
//         }

//         if (leave.status !== 'pending') {
//             return res.status(400).json({
//                 error: `Leave request is already ${leave.status}.`
//             });
//         }

//         const staff = await Staff.findById(leave.staffId);

//         if (!staff) {
//             return res.status(404).json({
//                 error: 'Staff member not found.'
//             });
//         }

//         if (!staff.active) {
//             return res.status(400).json({
//                 error: 'Cannot approve leave for inactive staff.'
//             });
//         }

//         if (staff.leaveBalance < leave.workingDays) {
//             return res.status(400).json({
//                 error: 'Insufficient leave balance.'
//             });
//         }

//         staff.leaveBalance -= leave.workingDays;
//         leave.status = 'approved';

//         await staff.save();
//         await leave.save();

//         return res.json({
//             message: 'Leave approved successfully.',
//             leave,
//             staff
//         });

//     } catch (error) {
//         return res.status(500).json({
//             error: error.message
//         });
//     }
// });


// PATCH approve leave request (Admin only)
router.patch('/:id/approve', authenticate, requireAdmin, async (req, res) => {
    try {
        const leave = await LeaveRequest.findById(req.params.id);

        if (!leave) {
            return res.status(404).json({
                error: 'Leave request not found.'
            });
        }

        if (leave.status !== 'pending') {
            return res.status(400).json({
                error: `Leave request is already ${leave.status}.`
            });
        }

        const staff = await Staff.findById(leave.staffId);

        if (!staff) {
            return res.status(404).json({
                error: 'Staff member not found.'
            });
        }

        if (!staff.active) {
            return res.status(400).json({
                error: 'Cannot approve leave for inactive staff.'
            });
        }

        if (staff.leaveBalance < leave.workingDays) {
            return res.status(400).json({
                error: 'Insufficient leave balance.'
            });
        }


        // ==========================================
        // 1. Approve the leave
        // ==========================================

        staff.leaveBalance -= leave.workingDays;

        leave.status = 'approved';

        await staff.save();
        await leave.save();


        // ==========================================
        // 2. Get all active staff
        // ==========================================

        const allStaff = await Staff.find({
            active: true
        });


        // ==========================================
        // 3. Determine the months affected
        // ==========================================

        const affectedMonths = [];

        const leaveStart = new Date(leave.startDate);
        const leaveEnd = new Date(leave.endDate);

        leaveStart.setHours(0, 0, 0, 0);
        leaveEnd.setHours(0, 0, 0, 0);


        /*
         * endDate is the resumption date.
         *
         * Therefore the leave affects dates BEFORE
         * the endDate.
         *
         * Example:
         *
         * 10 August → 21 September
         *
         * Affected:
         * August
         * September
         *
         * because the person is still on leave
         * until September 20.
         */

        const lastLeaveDate = new Date(leaveEnd);
        lastLeaveDate.setDate(lastLeaveDate.getDate() - 1);


        let currentMonth = new Date(leaveStart);
        currentMonth.setDate(1);
        currentMonth.setHours(0, 0, 0, 0);

        const finalMonth = new Date(lastLeaveDate);
        finalMonth.setDate(1);
        finalMonth.setHours(0, 0, 0, 0);


        while (currentMonth <= finalMonth) {

            affectedMonths.push({
                year: currentMonth.getFullYear(),
                month: currentMonth.getMonth() + 1
            });

            currentMonth.setMonth(
                currentMonth.getMonth() + 1
            );
        }


        // ==========================================
        // 4. Find existing rosters for affected months
        // ==========================================

        const updatedRosters = [];


        for (const affectedMonth of affectedMonths) {

            const existingRoster = await Roster.findOne({
                year: affectedMonth.year,
                month: affectedMonth.month
            });


            /*
             * If a roster hasn't been generated yet,
             * there is nothing to reshuffle.
             *
             * When that month is generated later,
             * the approved leave will automatically
             * be taken into consideration.
             */

            if (!existingRoster) {
                continue;
            }


            // ==========================================
            // 5. Get approved leaves for this month
            // ==========================================

            const monthStart = new Date(
                affectedMonth.year,
                affectedMonth.month - 1,
                1
            );

            const monthEnd = new Date(
                affectedMonth.year,
                affectedMonth.month,
                0
            );

            monthStart.setHours(0, 0, 0, 0);
            monthEnd.setHours(23, 59, 59, 999);


            const approvedLeaves = await LeaveRequest.find({
                status: 'approved',
                startDate: {
                    $lte: monthEnd
                },
                endDate: {
                    $gt: monthStart
                }
            });


            // ==========================================
            // 6. Get previous rosters for history
            // ==========================================

            const previousRosters = await Roster.find({
                status: {
                    $in: ['draft', 'published']
                },
                $or: [
                    {
                        year: {
                            $lt: affectedMonth.year
                        }
                    },
                    {
                        year: affectedMonth.year,
                        month: {
                            $lt: affectedMonth.month
                        }
                    }
                ]
            });


            // ==========================================
            // 7. Build historical shift counts
            // ==========================================

            const historicalShifts = {};

            allStaff.forEach(staffMember => {
                historicalShifts[
                    staffMember._id.toString()
                ] = 0;
            });


            previousRosters.forEach(roster => {

                roster.shifts.forEach(shift => {

                    shift.assignedStaff.forEach(staffId => {

                        const staffIdString =
                            staffId._id
                                ? staffId._id.toString()
                                : staffId.toString();

                        if (
                            historicalShifts[staffIdString]
                            !== undefined
                        ) {
                            historicalShifts[staffIdString]++;
                        }

                    });

                });

            });


            // ==========================================
            // 8. Build pair history
            // ==========================================

            const pairHistory =
                buildPairHistory(previousRosters);


            // ==========================================
            // 9. Generate the corrected roster
            // ==========================================

            let newShifts;

            try {

                newShifts = generateRosterForMonth(
                    affectedMonth.year,
                    affectedMonth.month,
                    allStaff,
                    approvedLeaves,
                    historicalShifts,
                    pairHistory
                );

            } catch (algorithmError) {

                /*
                 * Important:
                 *
                 * The leave has already been approved,
                 * so we don't want to silently hide an
                 * inability to generate the roster.
                 */

                return res.status(400).json({
                    error:
                        `Leave approved, but the ${affectedMonth.year}-${String(affectedMonth.month).padStart(2, '0')} roster could not be regenerated: ${algorithmError.message}`
                });
            }


            // ==========================================
            // 10. Replace the existing roster shifts
            // ==========================================

            existingRoster.shifts = newShifts;

            existingRoster.status = 'draft';

            await existingRoster.save();


            // Populate names for response
            const populatedRoster =
                await Roster.findById(existingRoster._id)
                    .populate(
                        'shifts.assignedStaff',
                        'name phonenumber leaveBalance active'
                    );


            updatedRosters.push(populatedRoster);
        }


        // ==========================================
        // 11. Return result
        // ==========================================

        return res.json({
            message: 'Leave approved successfully and affected rosters updated.',
            leave,
            staff,
            updatedRosters
        });

    } catch (error) {

        return res.status(500).json({
            error: error.message
        });

    }
});

// PATCH reject leave request (Admin only)
router.patch('/:id/reject', authenticate, requireAdmin, async (req, res) => {
    try {
        const leave = await LeaveRequest.findById(req.params.id);

        if (!leave) {
            return res.status(404).json({
                error: 'Leave request not found.'
            });
        }

        if (leave.status !== 'pending') {
            return res.status(400).json({
                error: `Leave request is already ${leave.status}.`
            });
        }

        leave.status = 'rejected';

        await leave.save();

        return res.json({
            message: 'Leave request rejected.',
            leave
        });

    } catch (error) {
        return res.status(500).json({
            error: error.message
        });
    }
});

module.exports = router;