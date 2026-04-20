const { validationResult } = require('express-validator');
const Inventory = require('../models/Inventory');
const Product = require('../models/Product');

// @desc    Get all inventory batches
// @route   GET /api/inventory
// @access  Private
const getInventory = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    let inventory = await Inventory.find()
      .populate('product', 'productName productCode')
      .sort({ expiryDate: 1 });

    // Filter by search (product name)
    if (search) {
      inventory = inventory.filter(inv =>
        inv.product &&
        (inv.product.productName.toLowerCase().includes(search.toLowerCase()) ||
         inv.batchNumber.toLowerCase().includes(search.toLowerCase()))
      );
    }

    // Filter by expiry status
    if (status) {
      inventory = inventory.filter(inv => inv.status === status);
    }

    res.json(inventory);
  } catch (error) {
    next(error);
  }
};

// @desc    Get available batches for a product (non-expired, quantity > 0)
// @route   GET /api/inventory/available/:productId
// @access  Private
const getAvailableBatches = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const batches = await Inventory.find({
      product: req.params.productId,
      quantity: { $gt: 0 },
      expiryDate: { $gte: today }
    })
      .populate('product', 'productName productCode')
      .sort({ expiryDate: 1 });

    res.json(batches);
  } catch (error) {
    next(error);
  }
};

// @desc    Create inventory batch
// @route   POST /api/inventory
// @access  Private
const createInventory = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { product, batchNumber, quantity, expiryDate } = req.body;

    // Verify product exists
    const productExists = await Product.findById(product);
    if (!productExists) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check duplicate batch number for same product
    const existingBatch = await Inventory.findOne({ product, batchNumber: batchNumber.trim() });
    if (existingBatch) {
      return res.status(400).json({ message: 'This batch number already exists for the selected product' });
    }

    const inventory = await Inventory.create({
      product,
      batchNumber: batchNumber.trim(),
      quantity,
      expiryDate
    });

    const populated = await inventory.populate('product', 'productName productCode');
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

// @desc    Update inventory batch
// @route   PUT /api/inventory/:id
// @access  Private
const updateInventory = async (req, res, next) => {
  try {
    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }

    const { product, batchNumber, quantity, expiryDate } = req.body;

    // Verify product exists
    if (product) {
      const productExists = await Product.findById(product);
      if (!productExists) {
        return res.status(404).json({ message: 'Product not found' });
      }
    }

    // Check duplicate batch number if changed
    const newProduct = product || inventory.product;
    const newBatch = batchNumber ? batchNumber.trim() : inventory.batchNumber;

    const productChanged = product && product.toString() !== inventory.product.toString();
    const batchChanged = batchNumber && batchNumber.trim() !== inventory.batchNumber;

    if (productChanged || batchChanged) {
      const existing = await Inventory.findOne({ product: newProduct, batchNumber: newBatch });
      if (existing) {
        return res.status(400).json({ message: 'This batch number already exists for the selected product' });
      }
    }

    inventory.product = newProduct;
    inventory.batchNumber = newBatch;
    if (quantity !== undefined) inventory.quantity = quantity;
    if (expiryDate) inventory.expiryDate = expiryDate;

    const updated = await inventory.save();
    const populated = await updated.populate('product', 'productName productCode');
    res.json(populated);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete inventory batch
// @route   DELETE /api/inventory/:id
// @access  Private/Admin
const deleteInventory = async (req, res, next) => {
  try {
    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }

    await Inventory.findByIdAndDelete(req.params.id);
    res.json({ message: 'Inventory batch deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getInventory, getAvailableBatches, createInventory, updateInventory, deleteInventory };
