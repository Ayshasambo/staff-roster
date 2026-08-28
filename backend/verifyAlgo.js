const { calculateWorkingDays, generateRosterForWeek } = require('./utils/rosterRules');

function getMockStaff() {
    return [
        { _id: '1', name: 'Alice Smith', email: 'alice@example.com' },
        { _id: '2', name: 'Bob Jones', email: 'bob@example.com' },
        { _id: '3', name: 'Charlie Brown', email: 'charlie@example.com' },
        { _id: '4', name: 'Diana Prince', email: 'diana@example.com' },
        { _id: '5', name: 'Ethan Hunt', email: 'ethan@example.com' },
        { _id: '6', name: 'Fiona Gallagher', email: 'fiona@example.com' },
        { _id: '7', name: 'George Clark', email: 'george@example.com' },
        { _id: '8', name: 'Hannah Abbott', email: 'hannah@example.com' }
    ];
}

function runTests() {
    console.log('=== STARTING ALGORITHM LOGIC TESTS ===');

    let passed = true;

    // Test 1: Leave Duration Working Days Calculation (Monday to Friday, 5 days per full week)
    try {
        const days1 = calculateWorkingDays('2026-07-20', '2026-07-24'); // Mon to Fri
        if (days1 !== 5) throw new Error(`Expected 5, got ${days1}`);

        const days2 = calculateWorkingDays('2026-07-20', '2026-07-26'); // Mon to Sun
        if (days2 !== 5) throw new Error(`Expected 5, got ${days2} (weekends should be excluded)`);

        const days3 = calculateWorkingDays('2026-07-20', '2026-07-27'); // Mon to next Mon
        if (days3 !== 6) throw new Error(`Expected 6, got ${days3}`);

        console.log('✅ TEST 1 PASSED: calculateWorkingDays correctly excludes weekends (5-working days/week).');
    } catch (err) {
        passed = false;
        console.error('❌ TEST 1 FAILED:', err.message);
    }

    // Test 2: Roster Generation Normal Rules (8 people, Mon-Thu, 2 people/day)
    try {
        const monday = new Date('2026-07-20');
        const staff = getMockStaff();
        const shifts = generateRosterForWeek(monday, staff, [], {});

        // Assertions
        if (shifts.length !== 4) throw new Error(`Expected 4 daily shifts, got ${shifts.length}`);

        const weeklyCounts = {};
        staff.forEach(s => { weeklyCounts[s._id] = 0; });

        shifts.forEach((shift, index) => {
            const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday'];
            const date = new Date(monday);
            date.setDate(monday.getDate() + index);

            if (shift.date.toDateString() !== date.toDateString()) {
                throw new Error(`Expected shift date ${date.toDateString()}, got ${shift.date.toDateString()}`);
            }

            if (shift.assignedStaff.length !== 2) {
                throw new Error(`Expected exactly 2 staff for ${dayNames[index]}, got ${shift.assignedStaff.length}`);
            }

            shift.assignedStaff.forEach(id => {
                weeklyCounts[id]++;
            });
        });

        // Under normal conditions, everyone works exactly 1 shift
        Object.entries(weeklyCounts).forEach(([id, count]) => {
            if (count !== 1) {
                throw new Error(`Expected staff member ${id} to work exactly 1 shift, instead worked ${count}`);
            }
        });

        console.log('✅ TEST 2 PASSED: Roster generated with 2 people/day and exactly 1 shift/person (perfect round-robin).');
    } catch (err) {
        passed = false;
        console.error('❌ TEST 2 FAILED:', err.message);
    }

    // Test 3: Leave Exclusion & Coverage (e.g. Alice and Bob on leave)
    try {
        const monday = new Date('2026-07-20');
        const staff = getMockStaff();

        // Approved leaves: Alice (1) and Bob (2) are on leave all week
        const approvedLeaves = [
            { staffId: '1', startDate: new Date('2026-07-20'), endDate: new Date('2026-07-24') },
            { staffId: '2', startDate: new Date('2026-07-20'), endDate: new Date('2026-07-24') }
        ];

        const historicalShifts = {};

        const shifts = generateRosterForWeek(monday, staff, approvedLeaves, historicalShifts);

        const weeklyCounts = {};
        staff.forEach(s => { weeklyCounts[s._id] = 0; });

        shifts.forEach(shift => {
            shift.assignedStaff.forEach(id => {
                const idStr = id.toString();
                if (idStr === '1' || idStr === '2') {
                    throw new Error(`Staff member on leave (${idStr}) was scheduled active!`);
                }
                weeklyCounts[idStr]++;
            });
        });

        // With 6 available people, and 8 shifts, some people must work 2 shifts. No one should exceed 2.
        Object.entries(weeklyCounts).forEach(([id, count]) => {
            if (count > 2) {
                throw new Error(`Staff member ${id} worked ${count} shifts, which exceeds the max limit of 2.`);
            }
        });

        console.log('✅ TEST 3 PASSED: Members on approved leave are successfully excluded, and shifts are covered by other members without anyone exceeding 2 shifts.');
    } catch (err) {
        passed = false;
        console.error('❌ TEST 3 FAILED:', err.message);
    }

    // Test 4: Insufficient Staff (5 people on leave)
    try {
        const monday = new Date('2026-07-20');
        const staff = getMockStaff();

        // Approved leaves: Staff 1 to 5 are on leave all week (only 3 staff available)
        const approvedLeaves = [];
        for (let i = 1; i <= 5; i++) {
            approvedLeaves.push({
                staffId: String(i),
                startDate: new Date('2026-07-20'),
                endDate: new Date('2026-07-24')
            });
        }

        generateRosterForWeek(monday, staff, approvedLeaves, {});
        passed = false;
        console.error('❌ TEST 4 FAILED: Algorithm generated roster with insufficient staff (should have thrown error).');
    } catch (err) {
        if (err.message.includes('Insufficient staff available')) {
            console.log('✅ TEST 4 PASSED: Correctly threw error when there are not enough staff to fulfill roster rules: "' + err.message + '"');
        } else {
            passed = false;
            console.error('❌ TEST 4 FAILED with unexpected error:', err.message);
        }
    }

    // Test 5: Historical Roster Fairness (balances out who gets more shifts)
    try {
        const monday = new Date('2026-07-20');
        const staff = getMockStaff();

        // Charlie (3) has worked 5 shifts historically, Diana (4) has worked 5, others worked 0.
        // Charlie and Diana should be back of the prioritization list if others can take the shift.
        // If Charlie and Diana are on leave, this is moot. Let's see if we make everyone available:
        // With all 8 available, all shifts are 1 per person.
        // If Alice (1) is on leave: 7 available. One person gets 2 shifts.
        // If Charlie (3) already has historical shifts, the system should avoid giving the 2-shift load to Charlie,
        // and instead give it to someone with 0 historical shifts (e.g. Bob).
        const approvedLeaves = [
            { staffId: '1', startDate: new Date('2026-07-20'), endDate: new Date('2026-07-24') } // Alice on leave
        ];

        // Seed historical shifts so Charlie has worked a lot of shifts
        const historicalShifts = {
            '2': 0, // Bob
            '3': 10, // Charlie (high count)
            '4': 0,
            '5': 0,
            '6': 0,
            '7': 0,
            '8': 0
        };

        const shifts = generateRosterForWeek(monday, staff, approvedLeaves, historicalShifts);

        const weeklyCounts = {};
        staff.forEach(s => { weeklyCounts[s._id] = 0; });
        shifts.forEach(shift => {
            shift.assignedStaff.forEach(id => {
                weeklyCounts[id.toString()]++;
            });
        });

        if (weeklyCounts['3'] > 1) {
            throw new Error(`Charlie (who has high historical shifts) was assigned ${weeklyCounts['3']} shifts instead of someone with fewer historical shifts.`);
        }

        console.log('✅ TEST 5 PASSED: Roster fairness correctly uses historical shift counts to prioritize assignment.');
    } catch (err) {
        passed = false;
        console.error('❌ TEST 5 FAILED:', err.message);
    }

    // Test 6: Week-Over-Week Day Rotation (Same person doesn't always get the same days)
    try {
        const monday1 = new Date('2026-07-20');
        const monday2 = new Date('2026-07-27');
        const staff = getMockStaff();

        const shifts1 = generateRosterForWeek(monday1, staff, [], {});
        const shifts2 = generateRosterForWeek(monday2, staff, [], {});

        // Let's get the assigned staff IDs for Monday of Week 1 vs Week 2
        const mon1Assignments = shifts1[0].assignedStaff.map(id => id.toString()).sort();
        const mon2Assignments = shifts2[0].assignedStaff.map(id => id.toString()).sort();

        // They should be different because of the weekIndex rotation!
        const isSame = mon1Assignments.length === mon2Assignments.length &&
            mon1Assignments.every((v, i) => v === mon2Assignments[i]);

        if (isSame) {
            throw new Error(`Monday assignments did not rotate! Both weeks assigned staff IDs: ${mon1Assignments.join(',')}`);
        }

        console.log('✅ TEST 6 PASSED: Roster day assignments successfully rotate week-over-week (Monday shifts differed).');
    } catch (err) {
        passed = false;
        console.error('❌ TEST 6 FAILED:', err.message);
    }

    if (passed) {
        console.log('\n🌟 ALL SYSTEM ALGORITHM TESTS PASSED SUCCESSFULLY! 🌟');
    } else {
        console.error('\n❌ SOME TESTS FAILED. PLEASE REVIEW LOGS.');
    }
}

runTests();
