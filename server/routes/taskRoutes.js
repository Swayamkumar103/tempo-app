// routes/taskRoutes.js
// Defines API endpoints related to tasks
// All routes are protected (require JWT token)

import express from 'express';
import {
  createTask,
  getTasks,
  getStats,
  updateTask,
  deleteTask,
  toggleComplete
} from '../controllers/taskController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply protect middleware to ALL task routes
router.use(protect);

// GET /api/tasks/stats → Dashboard statistics
// ⚠️ MUST be defined BEFORE /:id routes so 'stats' is not treated as an id
router.get('/stats', getStats);

// GET  /api/tasks  → Get all tasks
// POST /api/tasks  → Create a new task
router.get('/', getTasks);
router.post('/', createTask);

// PATCH /api/tasks/:id/toggle → Toggle completed status
// ⚠️ MUST be defined BEFORE /:id routes so '/toggle' is not swallowed as an id param
router.patch('/:id/toggle', toggleComplete);

// PUT    /api/tasks/:id → Update a specific task
// DELETE /api/tasks/:id → Delete a specific task
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;