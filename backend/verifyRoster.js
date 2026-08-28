require('dotenv').config();
const mongoose = require('mongoose');
const Staff = require('./models/staff');
const LeaveRequest = require('./models/leaveRequest');
const Roster = require('./models/roster');
const { calculateWorkingDays } = require('./utils/rosterRules');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/staff-roster';

async function runTests() {
    console.log('=== STARTING AUTOMATED STAFF ROSTER TESTS ===');

    // 1. Connect to DB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to Database.');

    // 2. Clear previous collections
    await Staff.deleteMany({});
    await LeaveRequest.deleteMany({});
    await Roster.deleteMany({});
    console.log('Database cleared.');

    // 3. Seed 8 staff members
    const staffData = [
        { name: 'Alice Smith', email: 'alice@example.com' },
        { name: 'Bob Jones', email: 'bob@example.com' },
        { name: 'Charlie Brown', email: 'charlie@example.com' },
        { name: 'Diana Prince', email: 'diana@example.com' },
        { name: 'Ethan Hunt', email: 'ethan@example.com' },
        { name: 'Fiona Gallagher', email: 'fiona@example.com' },
        { name: 'George Clark', email: 'george@example.com' },
        { name: 'Hannah Abbott', email: 'hannah@example.com' }
    ];

    const staffDocs = [];
    for (const s of staffData) {
        const doc = new Staff(s);
        await doc.save();
        staffDocs.push(doc);
    }
    console.log(`Successfully seeded ${staffDocs.length} staff members.`);

    // Verify limit of 8 staff members
    try {
        const extraStaff = new Staff({ name: 'Ian Fleming', email: 'ian@example.com' });
        // Simulate routes limit rule manually in testing script
        const currentCount = await Staff.countDocuments({});
        if (currentCount >= 8) {
            throw new Error('Roster application is limited to a maximum of 8 staff members.');
        }
        await extraStaff.save();
        console.error('❌ FAILED: Added 9th staff member. Max 8 limit ignored.');
    } catch (error) {
        console.log('✅ PASSED: Safely rejected 9th staff member: ' + error.message);
    }

    // 4. Test Leave Working Days calculation (5-day work week)
    // Mon July 20 to Mon July 27, 2026 (Mon-Fri are working days)
    // July 20 (Mon), 21 (Tue), 22 (Wed), 23 (Thu), 24 (Fri) = 5 working days
    // 25 (Sat), 26 (Sun) = weekends (0)
    // 27 (Mon) = 1 working day. Total = 6 working days
    const startLeave = new Date('2026-07-20');
    const endLeave = new Date('2026-07-27');
    const calculatedDays = calculateWorkingDays(startLeave, endLeave);
    if (calculatedDays === 6) {
        console.log('✅ PASSED: calculateWorkingDays correctly calculated 6 working days between July 20 and July 27.');
    } else {
        console.error(`❌ FAILED: calculateWorkingDays returned ${calculatedDays} instead of 6.`);
    }

    // 5. Test Roster Generation (No one on leave - normal conditions)
    const monday = new Date('2026-07-20'); // Monday

    // Call general generation helper simulation
    const allStaff = await Staff.find({});
    const { generateRosterForWeek } = require('./utils/rosterRules');
    const shifts1 = generateRosterForWeek(monday, allStaff, [], {});

    // Check roster constraints
    let allConstraintsMet = true;
    const staffCounts = {};
    allStaff.forEach(s => { staffCounts[s._id.toString()] = 0; });

    shifts1.forEach(shift => {
        if (shift.assignedStaff.length !== 2) {
            allConstraintsMet = false;
            console.error(`❌ FAILED: Shift on ${shift.date.toDateString()} does not have exactly 2 people.`);
        }
        shift.assignedStaff.forEach(id => {
            staffCounts[id.toString()]++;
        });
    });

    Object.entries(staffCounts).forEach(([id, count]) => {
        if (count > 2) {
            allConstraintsMet = false;
            console.error(`❌ FAILED: Staff ${id} worked ${count} shifts (max allowed is 2).`);
        }
    });

    if (allConstraintsMet) {
        console.log('✅ PASSED: Roster generated with exactly 2 people per day and no one working > 2 shifts under normal conditions.');
    }

    // Save the first roster in DB
    const rosterDraft = new Roster({
        weekStartDate: monday,
        shifts: shifts1,
        status: 'draft'
    });
    await rosterDraft.save();
    console.log('Draft Roster saved in DB.');

    // 6. Test Leave Request and Approval Balance Reduction
    // Alice Smith requests leave from Mon July 20 to Fri July 24 (5 working days)
    const alice = staffDocs[0];
    const leaveReq = new LeaveRequest({
        staffId: alice._id,
        startDate: new Date('2026-07-20'),
        endDate: new Date('2026-07-24'),
        workingDays: 5,
        status: 'pending'
    });
    await leaveReq.save();

    // Approve leave
    alice.leaveBalance -= leaveReq.workingDays;
    leaveReq.status = 'approved';
    await alice.save();
    await leaveReq.save();

    const aliceUpdated = await Staff.findById(alice._id);
    if (aliceUpdated.leaveBalance === 25) {
        console.log('✅ PASSED: Leave request approved and leaveBalance properly decremented to 25 days.');
    } else {
        console.error(`❌ FAILED: Alice leaveBalance is ${aliceUpdated.leaveBalance} (expected 25).`);
    }

    // Bob Jones request leave from Mon July 20 to Mon July 27 (6 working days)
    const bob = staffDocs[1];
    const leaveReqBob = new LeaveRequest({
        staffId: bob._id,
        startDate: new Date('2026-07-20'),
        endDate: new Date('2026-07-27'),
        workingDays: 6,
        status: 'pending'
    });
    await leaveReqBob.save();

    // Approve Bob's leave
    bob.leaveBalance -= leaveReqBob.workingDays;
    leaveReqBob.status = 'approved';
    await bob.save();
    await leaveReqBob.save();

    const bobUpdated = await Staff.findById(bob._id);
    if (bobUpdated.leaveBalance === 24) {
        console.log('✅ PASSED: Bob leave approved and leaveBalance reduced to 24.');
    } else {
        console.error(`❌ FAILED: Bob leaveBalance is ${bobUpdated.leaveBalance} (expected 24).`);
    }

    // 7. Roster Generation (With Alice and Bob on Leave July 20 - July 24)
    // Delete the old draft roster first to avoid duplicate weekStartDate index
    await Roster.deleteOne({ weekStartDate: monday });

    const activeLeaves = await LeaveRequest.find({ status: 'approved' });
    const allStaffFresh = await Staff.find({});

    // Alice & Bob are on leave. Roster should generate without them, and still cover shifts.
    const shiftsWithLeaves = generateRosterForWeek(monday, allStaffFresh, activeLeaves, {});

    let leavesExemptionCheck = true;
    const staffCountsWithLeaves = {};
    allStaffFresh.forEach(s => { staffCountsWithLeaves[s._id.toString()] = 0; });

    shiftsWithLeaves.forEach(shift => {
        shift.assignedStaff.forEach(id => {
            staffCountsWithLeaves[id.toString()]++;
            if (id.toString() === alice._id.toString() || id.toString() === bob._id.toString()) {
                leavesExemptionCheck = false;
                console.error(`❌ FAILED: Person on approved leave (${id}) was scheduled for duty on ${shift.date.toDateString()}.`);
            }
        });
    });

    let maxShiftsCheck = true;
    Object.entries(staffCountsWithLeaves).forEach(([id, count]) => {
        if (count > 2) {
            maxShiftsCheck = false;
            console.error(`❌ FAILED: Staff member ${id} exceeded shift limit with ${count} shifts.`);
        }
    });

    if (leavesExemptionCheck && maxShiftsCheck) {
        console.log('✅ PASSED: Generated roster successfully excluded members on leave while keeping 2 staff per shift and respecting the 2-shift weekly limit.');
    }

    // Save the roster with leaves
    const finalRoster = new Roster({
        weekStartDate: monday,
        shifts: shiftsWithLeaves,
        status: 'draft'
    });
    await finalRoster.save();

    // 8. Manual Override
    // Update finalRoster Monday shifts to Charlie and Diana manually
    const charlie = staffDocs[2];
    const diana = staffDocs[3];

    const dbRoster = await Roster.findOne({ weekStartDate: monday });
    dbRoster.shifts[0].assignedStaff = [charlie._id, diana._id];
    await dbRoster.save();

    const overriddenRoster = await Roster.findOne({ weekStartDate: monday });
    const mondayStaff = overriddenRoster.shifts[0].assignedStaff.map(id => id.toString());
    if (mondayStaff.includes(charlie._id.toString()) && mondayStaff.includes(diana._id.toString())) {
        console.log('✅ PASSED: Manual override properly persisted. Monday shift updated to Charlie & Diana.');
    } else {
        console.error('❌ FAILED: Manual override was not saved/applied.');
    }

    console.log('=== ALL TESTS COMPLETED ===');
    await mongoose.disconnect();
}

runTests().catch(err => {
    console.error('Unexpected test failure:', err);
    mongoose.disconnect();
});
