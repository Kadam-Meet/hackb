const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { generateOTP, sendOTP } = require('../utils/otp');

exports.register = async (req, res) => {
  const { role, name, email, password, companyName, universityName, adminCode } = req.body;
  try {
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    console.log("A");

    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = { role, name, email, password: hashedPassword };

    if (role === 'company' && companyName) userData.companyName = companyName;
    if (role === 'university' && universityName) userData.universityName = universityName;
    if (role === 'admin' && adminCode) userData.adminCode = adminCode;
    
    console.log("B");
    // If registering as admin, generate and send OTP
    if (role === 'admin') {
      const otp = generateOTP();
      userData.otp = otp;
      userData.otpExpires = Date.now() + 10 * 60 * 1000; // 10 min
      await sendOTP(email, otp);
    }
    
    console.log("C");
    const user = new User(userData);
    await user.save();
    res.json({ success: true });
    console.log("D");
  } catch (err) {
    res.status(400).json({ error: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log("Wrong");
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: 'Login failed' });
  }
};

exports.sendOtp = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 min
    await user.save();
    await sendOTP(email, otp);

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: 'Failed to send OTP' });
  }
};

exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (Date.now() > user.otpExpires) {
      return res.status(400).json({ error: 'OTP expired' });
    }

    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: 'OTP verification failed' });
  }
};