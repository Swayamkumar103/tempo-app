// models/Task.js
// Defines the MongoDB schema and model for Task documents

import mongoose from 'mongoose';

// Define the shape of a Task document in MongoDB
const taskSchema = new mongoose.Schema({
  // Link each task to the user who created it
  userId: {
    type: mongoose.Schema.Types.ObjectId,  // MongoDB ObjectId reference
    ref: 'User',                            // References the User model
    required: [true, 'User ID is required']
  },
  taskName: {
    type: String,
    required: [true, 'Task name is required'],
    trim: true,
    maxlength: [100, 'Task name cannot exceed 100 characters']
  },
  // Category determines if a task counts as "productive" or "break"
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['study', 'work', 'break', 'exercise'], // Only these values allowed
  },
  startTime: {
    type: String,      // Stored as "HH:MM" string format
    required: [true, 'Start time is required']
  },
  endTime: {
    type: String,      // Stored as "HH:MM" string format
    required: [true, 'End time is required']
  },
  // Duration stored in minutes (calculated on frontend, verified on backend)
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [0, 'Duration cannot be negative']
  },
  date: {
    type: String,      // Stored as "YYYY-MM-DD" string for easy filtering
    required: [true, 'Date is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// --- VIRTUAL: Check if task is "productive" ---
// Productive = study, work, or exercise (not break)
taskSchema.virtual('isProductive').get(function () {
  return ['study', 'work', 'exercise'].includes(this.category);
});

// Create and export the Task model
const Task = mongoose.model('Task', taskSchema);
export default Task;
