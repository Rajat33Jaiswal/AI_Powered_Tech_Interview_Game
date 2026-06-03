import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../db/models/index.js';
import authMiddleware from './authMiddleware.js';
import config from '../config.js';

const router = express.Router();
const JWT_SECRET = config.jwtSecret;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// SIGNUP
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }

    // Input Validation
    if (username.trim().length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters.' });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Check if user exists
    const existingUser = await User.findOne({
      where: {
        [User.sequelize.Sequelize.Op.or]: [{ email }, { username }]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already in use.' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await User.create({
      username,
      email,
      passwordHash
    });

    // Generate JWT
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error('Signup Error:', error);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Find user by email (or username)
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        gamesPlayed: user.gamesPlayed,
        avgScore: user.avgScore,
        maxScore: user.maxScore
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// GET CURRENT USER PROFILE
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'email', 'gamesPlayed', 'avgScore', 'maxScore']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: 'Internal server error fetching profile.' });
  }
});

// GUEST LOGIN
router.post('/guest', async (req, res) => {
  try {
    const randomId = Math.floor(Math.random() * 900000) + 100000;
    const username = `Guest_${randomId}`;
    const email = `guest_${randomId}@interview.ai`;
    const passwordHash = await bcrypt.hash(`guest_password_${randomId}`, 10);

    const newUser = await User.create({
      username,
      email,
      passwordHash,
      gamesPlayed: 0,
      avgScore: 0.0,
      maxScore: 0.0
    });

    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, email: newUser.email, isGuest: true },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Schedule background guest cleanup after 24 hours (1 day)
    setTimeout(async () => {
      try {
        console.log(`Cleaning up guest user: ${newUser.username}`);
        await User.destroy({ where: { id: newUser.id } });
      } catch (err) {
        console.error(`Failed to clean up guest user ${newUser.username}:`, err);
      }
    }, 24 * 60 * 60 * 1000);

    return res.status(201).json({
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        gamesPlayed: 0,
        avgScore: 0.0,
        maxScore: 0.0,
        isGuest: true
      }
    });
  } catch (error) {
    console.error('Guest Login Error:', error);
    return res.status(500).json({ error: 'Internal server error during guest login.' });
  }
});

export default router;
