const { validationResult } = require('express-validator');
const Product = require('../models/Product');

// @desc    Get all products
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res, next) => {
  try {
    const { search, category } = req.query;
    let filter = {};

    if (search) {
      filter.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { productCode: { $regex: search, $options: 'i' } },
        { supplier: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) filter.mainCategory = category;

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    next(error);
  }
};

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Private
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    // Check duplicate product code
    const existing = await Product.findOne({ productCode: req.body.productCode });
    if (existing) {
      return res.status(400).json({ message: 'Product code already exists' });
    }

    // Handle uploaded image
    let imageUrl = '';
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const product = await Product.create({
      ...req.body,
      imageUrl
    });
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check duplicate product code (if changed)
    if (req.body.productCode && req.body.productCode !== product.productCode) {
      const existing = await Product.findOne({ productCode: req.body.productCode });
      if (existing) {
        return res.status(400).json({ message: 'Product code already exists' });
      }
    }

    // Handle uploaded image
    if (req.file) {
      req.body.imageUrl = `/uploads/${req.file.filename}`;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    res.json(updatedProduct);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };
