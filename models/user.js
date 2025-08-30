const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // Each email must be unique
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user',
  },
  isVerified: {
    type: Boolean,
    default: false, // User is not verified until they enter the OTP
  },
  otp: {
    type: String,
  },
  otpExpires: {
    type: Date,
  },
}, { timestamps: true }); // Adds createdAt and updatedAt timestamps

module.exports = mongoose.model('User', UserSchema);
