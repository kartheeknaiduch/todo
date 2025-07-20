const express = require('express');
const router = express.Router();
const {
  createOrUpdateUser,
  getUserByEmail,
  register,
  login
} = require('../controllers/userController');

router.post('/', createOrUpdateUser);
router.get('/:email', getUserByEmail);
router.post('/register', register);
router.post('/login', login);

module.exports = router; 