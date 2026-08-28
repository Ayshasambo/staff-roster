const {
    isPublicHoliday
} = require('./publicHolidays');


/**
 * Calculates the number of working days
 * between leave start date and resume date.
 *
 * The start date is included.
 * The resume date is NOT included.
 *
 * Working days are:
 * Monday to Friday
 *
 * Nigerian public holidays are excluded.
 *
 * Example:
 *
 * Leave:
 * 10 August → 21 September
 *
 * The staff member is away from:
 * 10 August through 20 September
 *
 * They resume on:
 * 21 September
 *
 * @param {Date} startDate
 * @param {Date} resumeDate
 * @returns {number}
 */
function calculateWorkingDays(startDate, resumeDate) {
    let count = 0;

    const currentDate = new Date(startDate);
    const endDate = new Date(resumeDate);

    currentDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    while (currentDate < endDate) {

        const dayOfWeek = currentDate.getDay();

        /*
         * Monday to Friday
         */
        const isWeekday =
            dayOfWeek >= 1 &&
            dayOfWeek <= 5;

        /*
         * Public holidays do not count
         * as leave working days.
         */
        const holiday =
            isPublicHoliday(currentDate);

        if (
            isWeekday &&
            !holiday
        ) {
            count++;
        }

        currentDate.setDate(
            currentDate.getDate() + 1
        );
    }

    return count;
}


/**
 * Generates all roster dates for a given month.
 *
 * Roster days are Monday to Thursday only.
 *
 * Nigerian public holidays are excluded.
 *
 * @param {number} year
 * @param {number} month - 1 to 12
 * @returns {Date[]}
 */
function getRosterDatesForMonth(year, month) {

    const dates = [];

    const firstDayOfMonth =
        new Date(
            year,
            month - 1,
            1
        );

    const lastDayOfMonth =
        new Date(
            year,
            month,
            0
        );

    const currentDate =
        new Date(firstDayOfMonth);

    currentDate.setHours(0, 0, 0, 0);
    lastDayOfMonth.setHours(0, 0, 0, 0);


    while (currentDate <= lastDayOfMonth) {
        const dayOfWeek = currentDate.getDay();

        const isRosterDay =
            dayOfWeek >= 1 &&
            dayOfWeek <= 4;

        const holiday =
            isPublicHoliday(currentDate);

        if (
            isRosterDay &&
            !holiday
        ) {
            dates.push(new Date(currentDate));
        }

        currentDate.setDate(
            currentDate.getDate() + 1
        );
    }

    return dates;
}

/**
 * Checks whether a staff member is on approved leave
 * on a specific date.
 *
 * @param {Object} staff
 * @param {Date} date
 * @param {Array} approvedLeaves
 * @returns {boolean}
 */
function isStaffOnLeave(staff, date, approvedLeaves) {
    const staffId = staff._id.toString();

    const rosterDate = new Date(date);
    rosterDate.setHours(0, 0, 0, 0);

    return approvedLeaves.some(leave => {
        const leaveStaffId = leave.staffId.toString();

        if (leaveStaffId !== staffId) {
            return false;
        }

        const leaveStart = new Date(leave.startDate);
        const leaveEnd = new Date(leave.endDate);

        leaveStart.setHours(0, 0, 0, 0);
        leaveEnd.setHours(0, 0, 0, 0);

        return (
            rosterDate >= leaveStart &&
            rosterDate < leaveEnd
        );
    });
}


/**
 * Returns the Monday that starts the week
 * containing the given date.
 *
 * @param {Date} date
 * @returns {string}
 */
function getWeekKey(date) {
    const currentDate = new Date(date);

    currentDate.setHours(0, 0, 0, 0);

    const dayOfWeek = currentDate.getDay();

    const daysSinceMonday =
        dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    currentDate.setDate(
        currentDate.getDate() - daysSinceMonday
    );

    return currentDate.toISOString().split('T')[0];
}


/**
 * Creates a unique key for a pair of staff members.
 *
 * A + B and B + A are treated as the same pair.
 *
 * @param {string} staffIdOne
 * @param {string} staffIdTwo
 * @returns {string}
 */
function getPairKey(staffIdOne, staffIdTwo) {
    return [
        staffIdOne.toString(),
        staffIdTwo.toString()
    ]
        .sort()
        .join('_');
}


/**
 * Builds a history of how many times
 * each pair has worked together.
 *
 * Every roster day counts as one pairing.
 *
 * @param {Array} publishedRosters
 * @returns {Object}
 */
function buildPairHistory(publishedRosters) {
    const pairHistory = {};

    publishedRosters.forEach(roster => {
        roster.shifts.forEach(shift => {

            const assignedStaff = shift.assignedStaff;

            if (
                !assignedStaff ||
                assignedStaff.length !== 2
            ) {
                return;
            }

            const firstStaffId =
                assignedStaff[0]._id
                    ? assignedStaff[0]._id.toString()
                    : assignedStaff[0].toString();

            const secondStaffId =
                assignedStaff[1]._id
                    ? assignedStaff[1]._id.toString()
                    : assignedStaff[1].toString();

            const pairKey = getPairKey(
                firstStaffId,
                secondStaffId
            );

            pairHistory[pairKey] =
                (pairHistory[pairKey] || 0) + 1;
        });
    });

    return pairHistory;
}


/**
 * Returns how many times two staff members
 * have worked together.
 *
 * @param {Object} pairHistory
 * @param {string} staffIdOne
 * @param {string} staffIdTwo
 * @returns {number}
 */
function getPairCount(
    pairHistory,
    staffIdOne,
    staffIdTwo
) {
    const pairKey = getPairKey(
        staffIdOne,
        staffIdTwo
    );

    return pairHistory[pairKey] || 0;
}


/**
 * Checks whether a staff member can work
 * on a particular date.
 *
 * @param {Object} staff
 * @param {Date} date
 * @param {Array} approvedLeaves
 * @param {Object} weeklyShiftCounts
 * @returns {boolean}
 */
function canStaffWork(
    staff,
    date,
    approvedLeaves,
    weeklyShiftCounts
) {
    const staffId = staff._id.toString();
    const weekKey = getWeekKey(date);

    if (
        isStaffOnLeave(
            staff,
            date,
            approvedLeaves
        )
    ) {
        return false;
    }

    const weeklyCount =
        weeklyShiftCounts[staffId][weekKey] || 0;

    return weeklyCount < 2;
}


/**
 * Scores a possible pair.
 *
 * Lower score = better pair.
 *
 * Priority:
 *
 * 1. Avoid pairs that have worked together frequently.
 * 2. Balance monthly shifts.
 * 3. Balance historical shifts.
 * 4. Stable ID ordering.
 *
 * @param {Object} firstStaff
 * @param {Object} secondStaff
 * @param {Object} pairHistory
 * @param {Object} monthlyShiftCounts
 * @param {Object} historicalShifts
 * @returns {Array}
 */
function getPairScore(
    firstStaff,
    secondStaff,
    pairHistory,
    monthlyShiftCounts,
    historicalShifts
) {
    const firstId = firstStaff._id.toString();
    const secondId = secondStaff._id.toString();

    const pairCount = getPairCount(
        pairHistory,
        firstId,
        secondId
    );

    const monthlyCount =
        monthlyShiftCounts[firstId] +
        monthlyShiftCounts[secondId];

    const historicalCount =
        (historicalShifts[firstId] || 0) +
        (historicalShifts[secondId] || 0);

    return [
        pairCount,
        monthlyCount,
        historicalCount,
        firstId.localeCompare(secondId)
    ];
}


/**
 * Compares two pair scores.
 *
 * @param {Array} scoreA
 * @param {Array} scoreB
 * @returns {number}
 */
function comparePairScores(scoreA, scoreB) {
    for (let i = 0; i < scoreA.length; i++) {

        if (scoreA[i] < scoreB[i]) {
            return -1;
        }

        if (scoreA[i] > scoreB[i]) {
            return 1;
        }
    }

    return 0;
}


/**
 * Finds the best pair from a list of staff members.
 *
 * The pair-history rule is important here:
 *
 * If:
 *
 * A + B = 4 previous times
 * A + C = 1 previous time
 * A + D = 0 previous times
 *
 * the algorithm prefers A + D.
 *
 * @param {Array} candidates
 * @param {Object} pairHistory
 * @param {Object} monthlyShiftCounts
 * @param {Object} historicalShifts
 * @returns {Array|null}
 */
function findBestPair(
    candidates,
    pairHistory,
    monthlyShiftCounts,
    historicalShifts
) {
    if (candidates.length < 2) {
        return null;
    }

    let bestPair = null;
    let bestScore = null;

    for (let i = 0; i < candidates.length; i++) {

        for (let j = i + 1; j < candidates.length; j++) {

            const firstStaff = candidates[i];
            const secondStaff = candidates[j];

            const score = getPairScore(
                firstStaff,
                secondStaff,
                pairHistory,
                monthlyShiftCounts,
                historicalShifts
            );

            if (
                !bestScore ||
                comparePairScores(score, bestScore) < 0
            ) {
                bestScore = score;

                bestPair = [
                    firstStaff,
                    secondStaff
                ];
            }
        }
    }

    return bestPair;
}


/**
 * Adds a pair to the roster and updates
 * weekly/monthly counters.
 *
 * @param {Array} shifts
 * @param {Date} date
 * @param {Object} firstStaff
 * @param {Object} secondStaff
 * @param {string} weekKey
 * @param {Object} weeklyShiftCounts
 * @param {Object} monthlyShiftCounts
 */
function assignPair(
    shifts,
    date,
    firstStaff,
    secondStaff,
    weekKey,
    weeklyShiftCounts,
    monthlyShiftCounts
) {
    const firstId =
        firstStaff._id.toString();

    const secondId =
        secondStaff._id.toString();

    shifts.push({
        date,
        assignedStaff: [
            firstStaff._id,
            secondStaff._id
        ]
    });

    weeklyShiftCounts[firstId][weekKey] =
        (weeklyShiftCounts[firstId][weekKey] || 0) + 1;

    weeklyShiftCounts[secondId][weekKey] =
        (weeklyShiftCounts[secondId][weekKey] || 0) + 1;

    monthlyShiftCounts[firstId]++;
    monthlyShiftCounts[secondId]++;
}


/**
 * Generates a monthly roster.
 *
 * Rules:
 * - Monday to Thursday only
 * - Exactly 2 staff per day
 * - Maximum 2 shifts per staff per week
 * - Staff on approved leave cannot be assigned
 * - Staff normally work two consecutive days
 * - Pairings are rotated using pair history
 * - Pairings are balanced across the month
 *
 * @param {number} year
 * @param {number} month
 * @param {Array} allStaff
 * @param {Array} approvedLeaves
 * @param {Object} historicalShifts
 * @param {Object} pairHistory
 * @returns {Array}
 */
function generateRosterForMonth(
    year,
    month,
    allStaff,
    approvedLeaves,
    historicalShifts = {},
    pairHistory = {}
) {
    const rosterDates = getRosterDatesForMonth(year, month);

    /*
     * Group roster dates by their actual Monday-based week.
     *
     * This is important because a month can start or end
     * in the middle of a working week.
     *
     * Example: December 2026
     *
     * Week 1:
     * Tuesday Dec 1
     * Wednesday Dec 2
     * Thursday Dec 3
     *
     * Week 2:
     * Monday Dec 7
     * Tuesday Dec 8
     * Wednesday Dec 9
     * Thursday Dec 10
     */
    const weeks = {};

    rosterDates.forEach(date => {
        const weekKey = getWeekKey(date);

        if (!weeks[weekKey]) {
            weeks[weekKey] = [];
        }

        weeks[weekKey].push(date);
    });

    const weeklyShiftCounts = {};
    const monthlyShiftCounts = {};

    allStaff.forEach(staff => {
        const staffId = staff._id.toString();

        weeklyShiftCounts[staffId] = {};
        monthlyShiftCounts[staffId] = 0;
    });

    const shifts = [];

    /*
     * Process one actual calendar week at a time.
     */
    for (const weekKey of Object.keys(weeks)) {

        const weekDates = weeks[weekKey];

        /*
         * A normal week has:
         *
         * Monday
         * Tuesday
         * Wednesday
         * Thursday
         *
         * We process them as:
         *
         * Monday + Tuesday
         * Wednesday + Thursday
         *
         * If the month starts in the middle of a week,
         * we simply use the dates that exist in the month.
         */
        for (let i = 0; i < weekDates.length; i += 2) {

            const firstDate = weekDates[i];
            const secondDate = weekDates[i + 1];

            /*
             * Find staff available for the first day.
             */
            const availableForFirstDay = allStaff.filter(staff => {

                const staffId = staff._id.toString();

                /*
                 * Staff cannot work while on approved leave.
                 */
                if (
                    isStaffOnLeave(
                        staff,
                        firstDate,
                        approvedLeaves
                    )
                ) {
                    return false;
                }

                /*
                 * Maximum 2 shifts in this calendar week.
                 */
                const weeklyCount =
                    weeklyShiftCounts[staffId][weekKey] || 0;

                return weeklyCount < 2;
            });

            if (availableForFirstDay.length < 2) {
                throw new Error(
                    `Unable to generate roster for ${firstDate.toISOString().split('T')[0]
                    }. Fewer than 2 eligible staff members are available.`
                );
            }

            /*
             * Sort staff for fairness.
             *
             * Priority:
             *
             * 1. Fewest shifts this month
             * 2. Fewest historical shifts
             * 3. Stable ID
             */
            availableForFirstDay.sort((a, b) => {

                const aId = a._id.toString();
                const bId = b._id.toString();

                const monthlyDifference =
                    monthlyShiftCounts[aId] -
                    monthlyShiftCounts[bId];

                if (monthlyDifference !== 0) {
                    return monthlyDifference;
                }

                const historicalDifference =
                    (historicalShifts[aId] || 0) -
                    (historicalShifts[bId] || 0);

                if (historicalDifference !== 0) {
                    return historicalDifference;
                }

                return aId.localeCompare(bId);
            });

            /*
             * First staff member.
             */
            const firstStaff = availableForFirstDay[0];

            const firstStaffId =
                firstStaff._id.toString();

            /*
             * Find the best partner.
             *
             * We prefer someone who has worked
             * with this person fewer times historically.
             */
            const partnerCandidates =
                availableForFirstDay.slice(1);

            partnerCandidates.sort((a, b) => {

                const aId = a._id.toString();
                const bId = b._id.toString();

                const aPairCount =
                    getPairCount(
                        pairHistory,
                        firstStaffId,
                        aId
                    );

                const bPairCount =
                    getPairCount(
                        pairHistory,
                        firstStaffId,
                        bId
                    );

                /*
                 * Prefer a less frequently used pair.
                 */
                if (aPairCount !== bPairCount) {
                    return aPairCount - bPairCount;
                }

                /*
                 * Then prefer the person with
                 * fewer shifts this month.
                 */
                const monthlyDifference =
                    monthlyShiftCounts[aId] -
                    monthlyShiftCounts[bId];

                if (monthlyDifference !== 0) {
                    return monthlyDifference;
                }

                /*
                 * Then use historical workload.
                 */
                const historicalDifference =
                    (historicalShifts[aId] || 0) -
                    (historicalShifts[bId] || 0);

                if (historicalDifference !== 0) {
                    return historicalDifference;
                }

                return aId.localeCompare(bId);
            });

            const secondStaff =
                partnerCandidates[0];

            const secondStaffId =
                secondStaff._id.toString();

            /*
             * Assign the pair to the first day.
             */
            shifts.push({
                date: firstDate,
                assignedStaff: [
                    firstStaff._id,
                    secondStaff._id
                ]
            });

            /*
             * Update counts.
             */
            weeklyShiftCounts[firstStaffId][weekKey] =
                (weeklyShiftCounts[firstStaffId][weekKey] || 0) + 1;

            weeklyShiftCounts[secondStaffId][weekKey] =
                (weeklyShiftCounts[secondStaffId][weekKey] || 0) + 1;

            monthlyShiftCounts[firstStaffId]++;
            monthlyShiftCounts[secondStaffId]++;

            /*
             * If this week only has one remaining
             * roster day in the month, we are done.
             *
             * Example:
             *
             * December 2026 starts on Tuesday.
             *
             * Week 1 contains:
             * Tue Dec 1
             * Wed Dec 2
             * Thu Dec 3
             *
             * The first pair takes Tue + Wed.
             *
             * Thu needs a different pair.
             */
            if (!secondDate) {
                continue;
            }

            /*
             * Check whether the original pair can
             * work the second consecutive day.
             */
            const firstStaffOnLeaveSecondDay =
                isStaffOnLeave(
                    firstStaff,
                    secondDate,
                    approvedLeaves
                );

            const secondStaffOnLeaveSecondDay =
                isStaffOnLeave(
                    secondStaff,
                    secondDate,
                    approvedLeaves
                );

            /*
             * Also check weekly limits.
             *
             * Normally both should have count = 1 here,
             * so they can work the second day.
             */
            const firstStaffWeeklyCount =
                weeklyShiftCounts[firstStaffId][weekKey] || 0;

            const secondStaffWeeklyCount =
                weeklyShiftCounts[secondStaffId][weekKey] || 0;

            const firstStaffCanWork =
                !firstStaffOnLeaveSecondDay &&
                firstStaffWeeklyCount < 2;

            const secondStaffCanWork =
                !secondStaffOnLeaveSecondDay &&
                secondStaffWeeklyCount < 2;

            /*
             * CASE 1:
             *
             * Both original staff can work.
             *
             * Keep the same pair.
             */
            if (
                firstStaffCanWork &&
                secondStaffCanWork
            ) {

                shifts.push({
                    date: secondDate,
                    assignedStaff: [
                        firstStaff._id,
                        secondStaff._id
                    ]
                });

                weeklyShiftCounts[firstStaffId][weekKey]++;
                weeklyShiftCounts[secondStaffId][weekKey]++;

                monthlyShiftCounts[firstStaffId]++;
                monthlyShiftCounts[secondStaffId]++;

                continue;
            }

            /*
             * CASE 2:
             *
             * Only one of the original staff
             * can work the second day.
             *
             * Keep that person and find a replacement.
             */
            let availableStaffMember = null;
            let unavailableStaffId = null;

            if (firstStaffCanWork) {

                availableStaffMember = firstStaff;
                unavailableStaffId = secondStaffId;

            } else if (secondStaffCanWork) {

                availableStaffMember = secondStaff;
                unavailableStaffId = firstStaffId;
            }

            /*
             * One person can stay.
             */
            if (availableStaffMember) {

                const replacementCandidates =
                    allStaff.filter(staff => {

                        const staffId =
                            staff._id.toString();

                        /*
                         * Don't choose unavailable staff.
                         */
                        if (
                            staffId ===
                            unavailableStaffId
                        ) {
                            return false;
                        }

                        /*
                         * Don't choose the person
                         * already working.
                         */
                        if (
                            staffId ===
                            availableStaffMember._id.toString()
                        ) {
                            return false;
                        }

                        /*
                         * Cannot be on leave.
                         */
                        if (
                            isStaffOnLeave(
                                staff,
                                secondDate,
                                approvedLeaves
                            )
                        ) {
                            return false;
                        }

                        /*
                         * Cannot exceed 2 shifts this week.
                         */
                        const weeklyCount =
                            weeklyShiftCounts[staffId][weekKey] || 0;

                        return weeklyCount < 2;
                    });

                if (replacementCandidates.length < 1) {
                    throw new Error(
                        `Unable to find a replacement staff member for ${secondDate.toISOString().split('T')[0]
                        }.`
                    );
                }

                /*
                 * Choose the fairest replacement.
                 */
                replacementCandidates.sort((a, b) => {

                    const aId = a._id.toString();
                    const bId = b._id.toString();

                    /*
                     * Prefer a person with fewer
                     * monthly shifts.
                     */
                    const monthlyDifference =
                        monthlyShiftCounts[aId] -
                        monthlyShiftCounts[bId];

                    if (monthlyDifference !== 0) {
                        return monthlyDifference;
                    }

                    /*
                     * Prefer a less frequently
                     * used pairing.
                     */
                    const aPairCount =
                        getPairCount(
                            pairHistory,
                            availableStaffMember._id,
                            aId
                        );

                    const bPairCount =
                        getPairCount(
                            pairHistory,
                            availableStaffMember._id,
                            bId
                        );

                    if (aPairCount !== bPairCount) {
                        return aPairCount - bPairCount;
                    }

                    return aId.localeCompare(bId);
                });

                const replacement =
                    replacementCandidates[0];

                const replacementId =
                    replacement._id.toString();

                shifts.push({
                    date: secondDate,
                    assignedStaff: [
                        availableStaffMember._id,
                        replacement._id
                    ]
                });

                weeklyShiftCounts[
                    availableStaffMember._id.toString()
                ][weekKey]++;

                weeklyShiftCounts[
                    replacementId
                ][weekKey]++;

                monthlyShiftCounts[
                    availableStaffMember._id.toString()
                ]++;

                monthlyShiftCounts[replacementId]++;

                continue;
            }

            /*
             * CASE 3:
             *
             * Both original staff cannot work
             * the second day.
             *
             * Find a completely new pair.
             */
            const availableForSecondDay =
                allStaff.filter(staff => {

                    const staffId =
                        staff._id.toString();

                    /*
                     * Cannot be on leave.
                     */
                    if (
                        isStaffOnLeave(
                            staff,
                            secondDate,
                            approvedLeaves
                        )
                    ) {
                        return false;
                    }

                    /*
                     * Cannot exceed 2 shifts this week.
                     */
                    const weeklyCount =
                        weeklyShiftCounts[staffId][weekKey] || 0;

                    return weeklyCount < 2;
                });

            if (availableForSecondDay.length < 2) {
                throw new Error(
                    `Unable to generate roster for ${secondDate.toISOString().split('T')[0]
                    }. Fewer than 2 eligible staff members are available.`
                );
            }

            /*
             * Sort by monthly workload first.
             */
            availableForSecondDay.sort((a, b) => {

                const aId = a._id.toString();
                const bId = b._id.toString();

                const monthlyDifference =
                    monthlyShiftCounts[aId] -
                    monthlyShiftCounts[bId];

                if (monthlyDifference !== 0) {
                    return monthlyDifference;
                }

                const pairDifference =
                    getPairCount(
                        pairHistory,
                        firstStaffId,
                        aId
                    ) -
                    getPairCount(
                        pairHistory,
                        firstStaffId,
                        bId
                    );

                if (pairDifference !== 0) {
                    return pairDifference;
                }

                return aId.localeCompare(bId);
            });

            const replacementOne =
                availableForSecondDay[0];

            const replacementTwo =
                availableForSecondDay[1];

            const replacementOneId =
                replacementOne._id.toString();

            const replacementTwoId =
                replacementTwo._id.toString();

            shifts.push({
                date: secondDate,
                assignedStaff: [
                    replacementOne._id,
                    replacementTwo._id
                ]
            });

            weeklyShiftCounts[replacementOneId][weekKey]++;
            weeklyShiftCounts[replacementTwoId][weekKey]++;

            monthlyShiftCounts[replacementOneId]++;
            monthlyShiftCounts[replacementTwoId]++;
        }
    }

    return shifts;
}

module.exports = {
    calculateWorkingDays,
    getRosterDatesForMonth,
    isStaffOnLeave,
    getWeekKey,
    getPairKey,
    buildPairHistory,
    getPairCount,
    canStaffWork,
    getPairScore,
    findBestPair,
    generateRosterForMonth
};