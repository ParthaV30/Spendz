const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const authMiddleware = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key';

// Register
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const user = await userRepository.create(email, password, name);

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '15m' });

    res.status(201).json({
      data: {
        user: { id: user.id, email: user.email, name: user.name },
        accessToken: token
      }
    });
  } catch (err) {
    next(err);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await userRepository.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await userRepository.verifyPassword(user.password_hash, password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '15m' });

    res.json({
      data: {
        user: { id: user.id, email: user.email, name: user.name },
        accessToken: token
      }
    });
  } catch (err) {
    next(err);
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await userRepository.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      data: { user }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
