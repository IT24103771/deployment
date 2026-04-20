const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/authController');
const { registerValidation, loginValidation } = require('../validations/authValidation');
const { protect } = require('../middleware/authMiddleware');

// POST /api/auth/register
router.post('/register', registerValidation, register);

// POST /api/auth/login
router.post('/login', loginValidation, login);

// GET /api/auth/profile (protected)
router.get('/profile', protect, getProfile);

module.exports = router;
