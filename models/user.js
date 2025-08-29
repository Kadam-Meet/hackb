const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  role: { type: String, enum: ['admin', 'student', 'company', 'university'], required: true },
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  companyName: { type: String },      // for company
  universityName: { type: String },   // for university
  adminCode: { type: String },        // for admin (optional, e.g. secret code)
  otp: { type: String },
  otpExpires: { type: Date }
});

module.exports = mongoose.model('User', userSchema);