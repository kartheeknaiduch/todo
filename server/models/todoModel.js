const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
  title: String,
  deadline: {
    type: Date,
    required: true
  },
  priority: {
    type: String,
    enum: ["High", "Medium", "Low"],
    default: "Medium"
  },
  completed: {
    type: Boolean,
    default: false
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
},{timestamps: true });

module.exports = mongoose.model('Todo', todoSchema);
