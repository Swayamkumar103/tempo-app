// routes/taskRoutes.js
// Defines API endpoints related to tasks
// All routes are protected (require JWT token)

import express from 'express';
import {
  createTask,
  getTasks,
  getStats,
  updateTask,
  deleteTask
} from '../controllers/taskController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply protect middleware to ALL task routes
// This means every request must have a valid JWT token
router.use(protect);

// GET  /api/tasks/stats → Dashboard statistics
router.get('/stats', getStats);

// GET  /api/tasks       → Get all tasks for logged-in user
// POST /api/tasks       → Create a new task
router.route('/')
  .get(getTasks)
  .post(createTask);

// PUT    /api/tasks/:id → Update a specific task
// DELETE /api/tasks/:id → Delete a specific task
router.route('/:id')
  .put(updateTask)
  .delete(deleteTask);

export default router;
