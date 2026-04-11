// models/User.js
// Defines the MongoDB schema and model for User documents

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Define the shape of a User document in MongoDB
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,          // Remove extra whitespace
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,        // No two users can have the same email
    lowercase: true,     // Store emails in lowercase
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false        // Don't return password by default in queries
  },
  createdAt: {
    type: Date,
    default: Date.now    // Automatically set when user registers
  }
});

// --- MIDDLEWARE: Hash password before saving ---
// This runs automatically before every .save() call
userSchema.pre('save', async function () {

  // Only hash password if modified
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

});

// --- METHOD: Compare entered password with hashed password ---
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Create and export the User model
const User = mongoose.model('User', userSchema);
export default User;
