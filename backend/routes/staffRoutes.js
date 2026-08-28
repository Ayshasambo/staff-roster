const express = require('express');
const router = express.Router();
const Staff = require('../models/staff');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET all active staff
router.get('/', async (req, res) => {
    try {
        const staffList = await Staff.find({ active: true }).select('-pin');
        return res.json(staffList);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

// GET all staff, including inactive staff
router.get('/all', async (req, res) => {
    try {
        const staffList = await Staff.find({}).select('-pin');
        return res.json(staffList);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

// POST create staff member (Admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
    try {
        const { name, phonenumber, leaveBalance } = req.body;

        if (!name || !phonenumber) {
            return res.status(400).json({
                error: 'Name and phonenumber are required.'
            });
        }

        const existingStaff = await Staff.findOne({ phonenumber });

        if (existingStaff) {
            return res.status(400).json({
                error: 'A staff member with this phone number already exists.'
            });
        }

        const staffMember = new Staff({
            name,
            phonenumber,
            leaveBalance: leaveBalance !== undefined
                ? leaveBalance
                : 30
        });

        await staffMember.save();

        return res.status(201).json(staffMember);
    } catch (error) {
        return res.status(500).json({
            error: error.message
        });
    }
});

// PATCH update staff details (Admin only)
router.patch('/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { name, phonenumber } = req.body;

        const staff = await Staff.findById(req.params.id);

        if (!staff) {
            return res.status(404).json({
                error: 'Staff member not found.'
            });
        }

        if (phonenumber && phonenumber !== staff.phonenumber) {
            const existingStaff = await Staff.findOne({ phonenumber });

            if (existingStaff) {
                return res.status(400).json({
                    error: 'A staff member with this phone number already exists.'
                });
            }
        }

        if (name !== undefined) {
            staff.name = name;
        }

        if (phonenumber !== undefined) {
            staff.phonenumber = phonenumber;
        }

        await staff.save();

        return res.json(staff);
    } catch (error) {
        return res.status(500).json({
            error: error.message
        });
    }
});

// PATCH deactivate staff member (Admin only)
router.patch('/:id/deactivate', authenticate, requireAdmin, async (req, res) => {
    try {
        const staff = await Staff.findById(req.params.id);

        if (!staff) {
            return res.status(404).json({
                error: 'Staff member not found.'
            });
        }

        staff.active = false;

        await staff.save();

        return res.json({
            message: 'Staff member deactivated successfully.',
            staff
        });
    } catch (error) {
        return res.status(500).json({
            error: error.message
        });
    }
});

// PATCH reactivate staff member (Admin only)
router.patch('/:id/activate', authenticate, requireAdmin, async (req, res) => {
    try {
        const staff = await Staff.findById(req.params.id);

        if (!staff) {
            return res.status(404).json({
                error: 'Staff member not found.'
            });
        }

        staff.active = true;

        await staff.save();

        return res.json({
            message: 'Staff member activated successfully.',
            staff
        });
    } catch (error) {
        return res.status(500).json({
            error: error.message
        });
    }
});

module.exports = router;