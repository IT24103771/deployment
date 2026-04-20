const { body } = require('express-validator');

const discountValidation = [
  body('product')
    .notEmpty().withMessage('Product is required'),
  body('discountPercent')
    .notEmpty().withMessage('Discount percent is required')
    .isFloat({ min: 0, max: 100 }).withMessage('Discount must be between 0 and 100')
];

module.exports = { discountValidation };
