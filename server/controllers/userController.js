// controllers/userController.js
// Handles the logic for user registration and login

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// --- Helper: Generate a JWT token ---
// JWT (JSON Web Token) is used to identify logged-in users
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },                                          // Payload: user's ID
    process.env.JWT_SECRET || 'your_super_secret_key_here', // Secret key for signing
    { expiresIn: '7d' }                                     // Token expires in 7 days
  );
};

// --- REGISTER a new user ---
// POST /api/users/register
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if all fields are provided
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create new user (password gets hashed automatically via model middleware)
    const user = await User.create({ name, email, password });

    // Generate token for the new user
    const token = generateToken(user._id);

    // Send back user info and token
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// --- LOGIN an existing user ---
// POST /api/users/login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if fields are provided
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user by email (use +password to include it since select:false in schema)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare entered password with hashed password in DB
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate token for logged-in user
    const token = generateToken(user._id);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// --- GET current logged-in user profile ---
// GET /api/users/profile
export const getUserProfile = async (req, res) => {
  try {
    // req.user is set by the auth middleware
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};
