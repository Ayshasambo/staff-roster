const express = require('express');
const router = express.Router();
const Staff = require('../models/staff');
const { generateToken, authenticate } = require('../middleware/auth');

// POST /api/auth/login - Log in with phone number and PIN
router.post('/login', async (req, res) => {
  try {
    const { phonenumber, pin } = req.body;

    if (!phonenumber) {
      return res.status(400).json({ error: 'Phone number is required.' });
    }

    const numericPhone = Number(phonenumber);
    if (isNaN(numericPhone)) {
      return res.status(400).json({ error: 'Invalid phone number format.' });
    }

    const staff = await Staff.findOne({ phonenumber: numericPhone });

    if (!staff) {
      return res.status(404).json({ error: 'Staff member with this phone number not found.' });
    }

    if (!staff.active) {
      return res.status(403).json({ error: 'Your staff account has been deactivated. Please contact an admin.' });
    }

    // Default pin is '1234' if not set
    const userPin = staff.pin || '1234';
    const inputPin = pin ? String(pin).trim() : '1234';

    if (inputPin !== userPin) {
      return res.status(401).json({ error: 'Incorrect PIN. Please check and try again.' });
    }

    const token = generateToken({
      staffId: staff._id.toString(),
      role: staff.role || 'staff',
      name: staff.name,
      phonenumber: staff.phonenumber
    });

    return res.json({
      message: 'Login successful.',
      token,
      user: {
        _id: staff._id,
        name: staff.name,
        phonenumber: staff.phonenumber,
        leaveBalance: staff.leaveBalance,
        role: staff.role || 'staff',
        active: staff.active
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/me - Retrieve currently authenticated user profile
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = req.user;
    return res.json({
      user: {
        _id: user._id,
        name: user.name,
        phonenumber: user.phonenumber,
        leaveBalance: user.leaveBalance,
        role: user.role || 'staff',
        active: user.active
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// PATCH /api/auth/change-pin - Update personal PIN
router.patch('/change-pin', authenticate, async (req, res) => {
  try {
    const { currentPin, newPin } = req.body;

    if (!newPin || String(newPin).trim().length < 4) {
      return res.status(400).json({ error: 'New PIN must be at least 4 digits.' });
    }

    const staff = await Staff.findById(req.user._id);
    const existingPin = staff.pin || '1234';

    if (currentPin && String(currentPin) !== existingPin) {
      return res.status(400).json({ error: 'Current PIN is incorrect.' });
    }

    staff.pin = String(newPin).trim();
    await staff.save();

    return res.json({ message: 'PIN updated successfully.' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
