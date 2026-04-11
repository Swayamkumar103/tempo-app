// server.js
// Main entry point for the Node.js/Express backend server

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './server/config/db.js';
import userRoutes from './server/routes/userRoutes.js';
import taskRoutes from './server/routes/taskRoutes.js';


// --- Setup __dirname for ES modules ---
// (ES modules don't have __dirname by default)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Connect to MongoDB ---
connectDB();

// --- Initialize Express app ---
const app = express();

// --- Middleware ---
app.use(cors());                     // Allow cross-origin requests
app.use(express.json());             // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// --- Serve static files (HTML, CSS, JS) from /public ---
app.use(express.static(path.join(__dirname, 'public')));

// --- API Routes ---
app.use('/api/users', userRoutes);   // User auth routes
app.use('/api/tasks', taskRoutes);   // Task CRUD routes

// --- Serve HTML pages ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/html/login.html'));
});
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/html/register.html'));
});
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/html/dashboard.html'));
});

// --- 404 Handler ---
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong on the server!' });
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
});
