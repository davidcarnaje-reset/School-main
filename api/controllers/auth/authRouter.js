import express from 'express';
import login from './login.js';
import setupPassword from './setupPassword.js';
import checkEmail from './checkEmail.js';
import forgotPassword from './forgotPassword.js';
import resetPassword from './resetPassword.js';

const router = express.Router();

// Main login route
router.post('/login', login);
router.post('/login.php', login); // Legacy alias — browser cache compatibility

// Email check routes
router.get('/check-email', checkEmail);
router.get('/check_email.php', checkEmail);
router.post('/check_email', checkEmail);

// Forgot Password routes
router.post('/forgot_password', forgotPassword);
router.post('/forgot_password.php', forgotPassword); // Legacy alias

// Reset Password routes
router.post('/reset_password', resetPassword);
router.post('/reset_password.php', resetPassword); // Legacy alias

// Setup Password routes
router.post('/setup_password', setupPassword);
router.post('/setup_password.php', setupPassword); // Legacy alias

export default router;
