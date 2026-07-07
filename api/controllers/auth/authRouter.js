import express from 'express';
import login from './login.js';
import setupPassword from './setupPassword.js';

const router = express.Router();

// Main login route
router.post('/login', login);
router.post('/login.php', login); // Legacy alias — browser cache compatibility

import { checkEmail } from '../admin/user.js';

// Placeholder routes for other auth scripts pending migration
router.get('/check-email', checkEmail);
router.get('/check_email.php', checkEmail);
router.post('/check_email', (req, res) => {
  req.query.email = req.body.email || req.query.email;
  checkEmail(req, res);
});

router.post('/forgot_password', (req, res) => {
  res.json({ success: true, message: "forgot_password placeholder active" });
});

router.post('/reset_password', (req, res) => {
  res.json({ success: true, message: "reset_password placeholder active" });
});

router.post('/setup_password', setupPassword);
router.post('/setup_password.php', setupPassword); // Legacy alias — matches frontend call

export default router;
