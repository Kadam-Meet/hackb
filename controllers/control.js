const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateOTP, sendOTP } = require('../utils/otp');
const userController = require('../controllers/control');

exports.register = async (req, res) => {
  const { role, name, email, password, companyName, universityName, adminCode } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = { role, name, email, password: hashedPassword };

    if (role === 'company' && companyName) userData.companyName = companyName;
    if (role === 'university' && universityName) userData.universityName = universityName;
    if (role === 'admin' && adminCode) userData.adminCode = adminCode;

    // If registering as admin, generate and send OTP
    if (role === 'admin') {
      const otp = generateOTP();
      userData.otp = otp;
      userData.otpExpires = Date.now() + 10 * 60 * 1000; // 10 min
      await sendOTP(email, otp); // Send OTP to admin's email
    }

    const user = new User(userData);
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: 'Email already exists' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
  res.json({ token, role: user.role, name: user.name });
};

exports.sendOtp = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: 'User not found' });
  const otp = generateOTP();
  user.otp = otp;
  user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 min
  await user.save();
  await sendOTP(email, otp);
  res.json({ success: true });
};

exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });
  if (!user || user.otp !== otp || user.otpExpires < Date.now())
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();
  res.json({ success: true });
};