// routes/userRoutes.js
// Defines API endpoints related to users

import express from 'express';
import { registerUser, loginUser, getUserProfile } 
from '../controllers/userController.js'
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/users/register → Register new user (public)
router.post('/register', registerUser);

// POST /api/users/login → Login user (public)
router.post('/login', loginUser);

// GET /api/users/profile → Get profile (protected - requires token)
router.get('/profile', protect, getUserProfile);

export default router;
