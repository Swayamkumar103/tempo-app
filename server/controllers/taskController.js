// controllers/taskController.js
// Handles CRUD operations for tasks

import Task from '../models/Task.js';

// --- Helper: Calculate duration in minutes from time strings ---
const calcDuration = (startTime, endTime) => {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;
  return Math.max(0, endMinutes - startMinutes);
};

// --- CREATE a new task ---
// POST /api/tasks
export const createTask = async (req, res) => {
  try {
    const { taskName, category, startTime, endTime, date } = req.body;

    // Validate required fields
    if (!taskName || !category || !startTime || !endTime || !date) {
      return res.status(400).json({ message: 'All task fields are required' });
    }

    // Calculate duration server-side (don't trust client entirely)
    const duration = calcDuration(startTime, endTime);
    if (duration <= 0) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    // Create task linked to the logged-in user
    const task = await Task.create({
      userId: req.user.id,   // From auth middleware
      taskName,
      category,
      startTime,
      endTime,
      duration,
      date
    });

    res.status(201).json({ message: 'Task created successfully', task });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error creating task' });
  }
};

// --- GET all tasks for the logged-in user ---
// GET /api/tasks
export const getTasks = async (req, res) => {
  try {
    // Optional: filter by date via query string (?date=2024-01-15)
    const filter = { userId: req.user.id };
    if (req.query.date) filter.date = req.query.date;
    if (req.query.category) filter.category = req.query.category;

    // Fetch tasks, newest first
    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ tasks });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching tasks' });
  }
};

// --- GET dashboard statistics for today ---
// GET /api/tasks/stats
export const getStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

    // Get today's tasks for this user
    const todayTasks = await Task.find({ userId: req.user.id, date: today });

    // Calculate totals
    const totalTasks = todayTasks.length;
    const totalMinutes = todayTasks.reduce((sum, t) => sum + t.duration, 0);

    // Productive = study + work + exercise; Break = break
    const productiveMinutes = todayTasks
      .filter(t => ['study', 'work', 'exercise'].includes(t.category))
      .reduce((sum, t) => sum + t.duration, 0);

    const breakMinutes = todayTasks
      .filter(t => t.category === 'break')
      .reduce((sum, t) => sum + t.duration, 0);

    // Productivity % formula: (productive / total) * 100
    const productivityPercent = totalMinutes > 0
      ? Math.round((productiveMinutes / totalMinutes) * 100)
      : 0;

    // Category breakdown for pie chart
    const categoryBreakdown = {};
    todayTasks.forEach(t => {
      categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.duration;
    });

    // Last 7 days productivity for bar chart
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayTasks = await Task.find({ userId: req.user.id, date: dateStr });
      const dayTotal = dayTasks.reduce((s, t) => s + t.duration, 0);
      const dayProductive = dayTasks
        .filter(t => ['study', 'work', 'exercise'].includes(t.category))
        .reduce((s, t) => s + t.duration, 0);
      last7Days.push({
        date: dateStr,
        label: d.toLocaleDateString('en', { weekday: 'short' }),
        totalMinutes: dayTotal,
        productiveMinutes: dayProductive,
        productivityPercent: dayTotal > 0 ? Math.round((dayProductive / dayTotal) * 100) : 0
      });
    }

    res.status(200).json({
      stats: {
        totalTasks,
        totalMinutes,
        productiveMinutes,
        breakMinutes,
        productivityPercent,
        categoryBreakdown,
        last7Days,
        totalHours: (totalMinutes / 60).toFixed(1)
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
};

// --- UPDATE a task ---
// PUT /api/tasks/:id
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Security check: ensure the task belongs to the requesting user
    if (task.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to edit this task' });
    }

    const { taskName, category, startTime, endTime, date } = req.body;

    // Recalculate duration if times changed
    const newStart = startTime || task.startTime;
    const newEnd = endTime || task.endTime;
    const duration = calcDuration(newStart, newEnd);

    // Update fields
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { taskName, category, startTime, endTime, duration, date },
      { new: true, runValidators: true } // Return updated doc, run schema validators
    );

    res.status(200).json({ message: 'Task updated successfully', task: updatedTask });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating task' });
  }
};

// --- DELETE a task ---
// DELETE /api/tasks/:id
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Security check: ensure the task belongs to the requesting user
    if (task.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting task' });
  }
};
