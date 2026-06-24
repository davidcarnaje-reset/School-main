import express from 'express';
import login from './login.js';

const router = express.Router();

// Main login route
router.post('/login', login);

// Placeholder routes for other auth scripts pending migration
router.post('/check_email', (req, res) => {
  res.json({ success: true, message: "check_email placeholder active" });
});

router.post('/forgot_password', (req, res) => {
  res.json({ success: true, message: "forgot_password placeholder active" });
});

router.post('/reset_password', (req, res) => {
  res.json({ success: true, message: "reset_password placeholder active" });
});

router.post('/setup_password', (req, res) => {
  res.json({ success: true, message: "setup_password placeholder active" });
});

export default router;
