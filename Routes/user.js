const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const User = require('../models/User'); // Ensure this path is correct

// POST /api/user/register
// Handles new user registration requests
router.post('/register', async (req, res) => {
  try {
    const { role, name, email, password, adminCode } = req.body;

    if (role === 'admin' && adminCode !== process.env.ADMIN_SECRET_CODE) {
      return res.status(403).json({ success: false, error: 'Invalid Admin Code.' });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, error: 'User with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

    user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      otp,
      otpExpires,
    });

    await user.save();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP for Verification',
      text: `Your OTP is: ${otp}. It will expire in 10 minutes.`,
    });

    res.status(200).json({ success: true, message: 'OTP sent to your email.' });
  } catch (error) {
    console.error('Registration Error:', error.message);
    res.status(500).json({ success: false, error: 'Server error during registration.' });
  }
});


// POST /api/user/verify-otp
// Handles OTP verification
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ success: false, error: 'User not found.' });
        }
        if (user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ success: false, error: 'Invalid or expired OTP.' });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.status(200).json({ success: true, message: 'Account verified successfully.' });
    } catch (error) {
        console.error('OTP Verification Error:', error.message);
        res.status(500).json({ success: false, error: 'Server error during OTP verification.' });
    }
});


// POST /api/user/login
// Handles admin login requests
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find the user by email in the database
    const user = await User.findOne({ email });
    if (!user) {
      // Security: Use a generic error message. Don't reveal if an email exists or not.
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // 2. Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // 3. Check if the user is a verified admin
    if (user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Access denied. Not an admin.' });
    }
    
    // =============================================================
    // == THIS IS THE CORRECTED LINE OF CODE ==
    // =============================================================
    if (user.isVerified) { // The logic is now correct: block if NOT verified
        return res.status(403).json({ success: false, error: 'Account not verified. Please complete OTP verification.' });
    }

    // --- Login Successful ---
    // In a real application, you would generate a JWT (JSON Web Token) here for session management.
    // For now, we confirm success and send back some safe user info.
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ success: false, error: 'Server error. Please try again.' });
  }
});


module.exports = router;