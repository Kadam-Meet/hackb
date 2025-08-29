const crypto = require('crypto');
const nodemailer = require('nodemailer');

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTP(email, otp) {
  // Configure transporter with your email credentials
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'yourgmail@gmail.com',
      pass: 'your-app-password'
    }
  });

  await transporter.sendMail({
    from: '"Hackathon App" <yourgmail@gmail.com>',
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is: ${otp}`
  });
}

module.exports = { generateOTP, sendOTP };