const { body } = require('express-validator');

const inventoryValidation = [
  body('product')
    .notEmpty().withMessage('Product is required'),
  body('batchNumber')
    .trim()
    .notEmpty().withMessage('Batch number is required'),
  body('quantity')
    .notEmpty().withMessage('Quantity is required')
    .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('expiryDate')
    .notEmpty().withMessage('Expiry date is required')
    .isISO8601().withMessage('Expiry date must be a valid date')
    .custom((value) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiry = new Date(value);
      if (expiry < today) {
        throw new Error('Expiry date cannot be before current date');
      }
      return true;
    })
];

module.exports = { inventoryValidation };
