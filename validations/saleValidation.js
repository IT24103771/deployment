const { body } = require('express-validator');

const saleValidation = [
  body('product')
    .notEmpty().withMessage('Product is required'),
  body('inventoryBatch')
    .notEmpty().withMessage('Inventory batch is required'),
  body('quantity')
    .notEmpty().withMessage('Quantity is required')
    .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('saleDate')
    .notEmpty().withMessage('Sale date is required')
    .isISO8601().withMessage('Sale date must be a valid date')
    .custom((value) => {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const saleDate = new Date(value);
      if (saleDate > today) {
        throw new Error('Sale date cannot be in the future');
      }
      return true;
    })
];

module.exports = { saleValidation };
