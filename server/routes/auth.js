import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { sendOtpEmail } from '../utils/email.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';
const OTP_MINUTES = parseInt(process.env.OTP_EXPIRES_MINUTES || '10', 10);

function generateToken(id) {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

router.post('/signup',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const { email, password, name } = req.body;
      if (await User.findOne({ email })) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      const user = await User.create({ email, password, name });
      const token = generateToken(user._id);
      res.status(201).json({
        token,
        user: { id: user._id, email: user.email, name: user.name },
      });
    } catch (e) {
      res.status(500).json({ message: e.message || 'Signup failed' });
    }
  }
);

router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      const token = generateToken(user._id);
      res.json({
        token,
        user: { id: user._id, email: user.email, name: user.name },
      });
    } catch (e) {
      res.status(500).json({ message: e.message || 'Login failed' });
    }
  }
);

router.post('/forgot-password',
  body('email').isEmail().normalizeEmail(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const { email } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        return res.json({ message: 'If an account exists, an OTP has been sent.' });
      }
      const code = String(Math.floor(100000 + Math.random() * 900000));
      user.otp = { code, expiresAt: new Date(Date.now() + OTP_MINUTES * 60 * 1000) };
      await user.save();
      await sendOtpEmail(email, code);
      res.json({ message: 'If an account exists, an OTP has been sent.' });
    } catch (e) {
      res.status(500).json({ message: e.message || 'Request failed' });
    }
  }
);

router.post('/reset-password',
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }),
  body('newPassword').isLength({ min: 6 }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const { email, otp, newPassword } = req.body;
      const user = await User.findOne({ email });
      if (!user || !user.otp?.code || user.otp.code !== otp) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
      }
      if (new Date() > user.otp.expiresAt) {
        user.otp = undefined;
        await user.save();
        return res.status(400).json({ message: 'OTP has expired' });
      }
      user.password = newPassword;
      user.otp = undefined;
      await user.save();
      const token = generateToken(user._id);
      res.json({
        token,
        user: { id: user._id, email: user.email, name: user.name },
      });
    } catch (e) {
      res.status(500).json({ message: e.message || 'Reset failed' });
    }
  }
);

router.get('/me', protect, (req, res) => {
  res.json({ user: req.user });
});

router.post('/logout', protect, (_, res) => {
  res.json({ message: 'Logged out' });
});

export default router;
