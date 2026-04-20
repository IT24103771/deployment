const { validationResult } = require('express-validator');
const Discount = require('../models/Discount');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');

// @desc    Get all discounts
// @route   GET /api/discounts
// @access  Private
const getDiscounts = async (req, res, next) => {
  try {
    const discounts = await Discount.find()
      .populate('product', 'productName productCode')
      .populate('inventoryBatch', 'batchNumber expiryDate quantity')
      .sort({ createdAt: -1 });
    res.json(discounts);
  } catch (error) {
    next(error);
  }
};

// @desc    Get active discounts only
// @route   GET /api/discounts/active
// @access  Private
const getActiveDiscounts = async (req, res, next) => {
  try {
    const discounts = await Discount.find({ active: true })
      .populate('product', 'productName productCode')
      .populate('inventoryBatch', 'batchNumber expiryDate quantity')
      .sort({ createdAt: -1 });
    res.json(discounts);
  } catch (error) {
    next(error);
  }
};

// @desc    Lookup active discount for a product + batch
// @route   GET /api/discounts/lookup?product=X&batch=Y
// @access  Private
const lookupActive = async (req, res, next) => {
  try {
    const { product, batch } = req.query;
    if (!product || !batch) {
      return res.status(400).json({ message: 'Product and batch are required' });
    }

    const discount = await Discount.findOne({
      product,
      inventoryBatch: batch,
      active: true
    }).populate('product', 'productName productCode')
      .populate('inventoryBatch', 'batchNumber expiryDate quantity');

    res.json(discount || null);
  } catch (error) {
    next(error);
  }
};

// @desc    Create discount
// @route   POST /api/discounts
// @access  Private/Admin
const createDiscount = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { product: productId, inventoryBatch: batchId, discountPercent, note, startDate, endDate, active } = req.body;

    // Verify product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Verify batch if provided
    if (batchId) {
      const batch = await Inventory.findById(batchId);
      if (!batch) {
        return res.status(404).json({ message: 'Batch not found' });
      }
      if (batch.product.toString() !== productId) {
        return res.status(400).json({ message: 'Selected batch does not belong to the selected product' });
      }

      // Check for existing active discount on this batch
      const existingActive = await Discount.findOne({ inventoryBatch: batchId, active: true });
      if (existingActive) {
        return res.status(400).json({ message: 'An active discount already exists for this batch' });
      }
    }

    const discount = await Discount.create({
      product: productId,
      inventoryBatch: batchId || null,
      discountPercent,
      note: note ? note.trim() : '',
      startDate: startDate || null,
      endDate: endDate || null,
      active: active !== undefined ? active : true
    });

    const populated = await discount.populate([
      { path: 'product', select: 'productName productCode' },
      { path: 'inventoryBatch', select: 'batchNumber expiryDate quantity' }
    ]);

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

// @desc    Update discount
// @route   PUT /api/discounts/:id
// @access  Private/Admin
const updateDiscount = async (req, res, next) => {
  try {
    const discount = await Discount.findById(req.params.id);
    if (!discount) {
      return res.status(404).json({ message: 'Discount not found' });
    }

    const { product: productId, inventoryBatch: batchId, discountPercent, note, startDate, endDate, active } = req.body;

    if (productId) {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      discount.product = productId;
    }

    if (batchId !== undefined) {
      if (batchId) {
        const batch = await Inventory.findById(batchId);
        if (!batch) {
          return res.status(404).json({ message: 'Batch not found' });
        }
        // Check duplicate only if changing batch
        const currentBatchId = discount.inventoryBatch ? discount.inventoryBatch.toString() : null;
        if (currentBatchId !== batchId) {
          const existingActive = await Discount.findOne({ inventoryBatch: batchId, active: true });
          if (existingActive) {
            return res.status(400).json({ message: 'An active discount already exists for this batch' });
          }
        }
      }
      discount.inventoryBatch = batchId || null;
    }

    if (discountPercent !== undefined) discount.discountPercent = discountPercent;
    if (note !== undefined) discount.note = note.trim();
    if (startDate !== undefined) discount.startDate = startDate;
    if (endDate !== undefined) discount.endDate = endDate;
    if (active !== undefined) discount.active = active;

    const updated = await discount.save();
    const populated = await updated.populate([
      { path: 'product', select: 'productName productCode' },
      { path: 'inventoryBatch', select: 'batchNumber expiryDate quantity' }
    ]);

    res.json(populated);
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle discount active status
// @route   PUT /api/discounts/:id/toggle
// @access  Private/Admin
const toggleDiscount = async (req, res, next) => {
  try {
    const discount = await Discount.findById(req.params.id);
    if (!discount) {
      return res.status(404).json({ message: 'Discount not found' });
    }

    discount.active = !discount.active;
    const updated = await discount.save();
    const populated = await updated.populate([
      { path: 'product', select: 'productName productCode' },
      { path: 'inventoryBatch', select: 'batchNumber expiryDate quantity' }
    ]);

    res.json(populated);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete discount
// @route   DELETE /api/discounts/:id
// @access  Private/Admin
const deleteDiscount = async (req, res, next) => {
  try {
    const discount = await Discount.findById(req.params.id);
    if (!discount) {
      return res.status(404).json({ message: 'Discount not found' });
    }

    await Discount.findByIdAndDelete(req.params.id);
    res.json({ message: 'Discount deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDiscounts, getActiveDiscounts, lookupActive,
  createDiscount, updateDiscount, toggleDiscount, deleteDiscount
};
