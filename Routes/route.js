const express = require('express');
const router = express.Router();
const userController = require('../controllers/control'); // Correct path

router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/send-otp', userController.sendOtp);
router.post('/verify-otp', userController.verifyOtp);

module.exports = router;