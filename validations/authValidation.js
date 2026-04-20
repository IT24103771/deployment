const { body } = require('express-validator');

const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Invalid email format'),
  body('password')
    .isLength({ min: 5 }).withMessage('Password must be at least 5 characters'),
  body('role')
    .optional()
    .isIn(['ADMIN', 'STAFF']).withMessage('Role must be ADMIN or STAFF')
];

const loginValidation = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required'),
  body('password')
    .notEmpty().withMessage('Password is required')
];

module.exports = { registerValidation, loginValidation };
