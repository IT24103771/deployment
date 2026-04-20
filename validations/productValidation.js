const { body } = require('express-validator');

const productValidation = [
  body('productName')
    .trim()
    .notEmpty().withMessage('Product name is required')
    .isLength({ min: 2 }).withMessage('Product name must be at least 2 characters'),
  body('productCode')
    .trim()
    .notEmpty().withMessage('Product code is required'),
  body('mainCategory')
    .trim()
    .notEmpty().withMessage('Main category is required'),
  body('subCategory')
    .trim()
    .notEmpty().withMessage('Sub category is required'),
  body('itemType')
    .trim()
    .notEmpty().withMessage('Item type is required'),
  body('supplier')
    .trim()
    .notEmpty().withMessage('Supplier is required'),
  body('costPrice')
    .notEmpty().withMessage('Cost price is required')
    .isFloat({ min: 0 }).withMessage('Cost price cannot be negative'),
  body('sellingPrice')
    .notEmpty().withMessage('Selling price is required')
    .isFloat({ min: 0 }).withMessage('Selling price cannot be negative')
];

module.exports = { productValidation };
