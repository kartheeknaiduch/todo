const Todo = require('../models/todoModel');

// GET all todos for the logged-in user
exports.getTodos = async (req, res) => {
  try {
    const todos = await Todo.find({ user: req.user.userId });
    res.status(200).json(todos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
};

// CREATE todo for the logged-in user
exports.createTodo = async (req, res) => {
  try {
    const todo = new Todo({ ...req.body, user: req.user.userId });
    await todo.save();
    res.status(201).json(todo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create todo' });
  }
};

// UPDATE todo (only if it belongs to the logged-in user)
exports.updateTodo = async (req, res) => {
  try {
    const todo = await Todo.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      req.body,
      { new: true }
    );
    if (!todo) return res.status(404).json({ error: 'Todo not found' });
    res.status(200).json(todo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update todo' });
  }
};

// DELETE todo (only if it belongs to the logged-in user)
exports.deleteTodo = async (req, res) => {
  try {
    const todo = await Todo.findOneAndDelete({ _id: req.params.id, user: req.user.userId });
    if (!todo) return res.status(404).json({ error: 'Todo not found' });
    res.status(200).json({ message: 'Todo deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete todo' });
  }
};
