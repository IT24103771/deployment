const { validationResult } = require('express-validator');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Discount = require('../models/Discount');

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private
const getSales = async (req, res, next) => {
  try {
    const { search, startDate, endDate } = req.query;
    let filter = {};

    if (startDate && endDate) {
      filter.saleDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else if (startDate) {
      filter.saleDate = { $gte: new Date(startDate) };
    } else if (endDate) {
      filter.saleDate = { $lte: new Date(endDate) };
    }

    let sales = await Sale.find(filter)
      .populate('product', 'productName productCode sellingPrice')
      .populate('inventoryBatch', 'batchNumber expiryDate quantity')
      .sort({ createdAt: -1 });

    // Filter by product name search
    if (search) {
      sales = sales.filter(s =>
        s.product &&
        s.product.productName.toLowerCase().includes(search.toLowerCase())
      );
    }

    res.json(sales);
  } catch (error) {
    next(error);
  }
};

// @desc    Get sale by ID
// @route   GET /api/sales/:id
// @access  Private
const getSaleById = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('product', 'productName productCode sellingPrice')
      .populate('inventoryBatch', 'batchNumber expiryDate quantity');

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    res.json(sale);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a sale (with stock deduction and auto discount application)
// @route   POST /api/sales
// @access  Private
const createSale = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { product: productId, inventoryBatch: batchId, quantity, saleDate } = req.body;

    // Validate product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Validate batch
    const batch = await Inventory.findById(batchId);
    if (!batch) {
      return res.status(404).json({ message: 'Inventory batch not found' });
    }

    // Verify batch belongs to product
    if (batch.product.toString() !== productId) {
      return res.status(400).json({ message: 'Selected batch does not belong to selected product' });
    }

    // Check batch is not expired
    const saleDateObj = new Date(saleDate);
    if (batch.expiryDate < saleDateObj) {
      return res.status(400).json({ message: 'Cannot sell from an expired batch' });
    }

    // Check stock availability
    if (batch.quantity < quantity) {
      return res.status(400).json({
        message: `Not enough stock. Available: ${batch.quantity}, Requested: ${quantity}`
      });
    }

    // Apply pricing and discount (matching original Java logic)
    const originalPrice = product.sellingPrice || 0;
    const activeDiscount = await Discount.findOne({
      product: productId,
      inventoryBatch: batchId,
      active: true
    });

    const discountPct = activeDiscount ? activeDiscount.discountPercent : 0;
    const discountedPrice = originalPrice * (1 - discountPct / 100);
    const totalAmount = discountedPrice * quantity;
    const discountNote = activeDiscount ? activeDiscount.note : null;

    // Deduct stock
    batch.quantity -= quantity;
    await batch.save();

    // Create sale record
    const sale = await Sale.create({
      product: productId,
      inventoryBatch: batchId,
      quantity,
      originalUnitPrice: originalPrice,
      discountPercent: discountPct,
      discountedUnitPrice: discountedPrice,
      totalAmount,
      discountNote,
      saleDate,
      createdBy: req.user ? req.user.username : ''
    });

    const populated = await sale.populate([
      { path: 'product', select: 'productName productCode sellingPrice' },
      { path: 'inventoryBatch', select: 'batchNumber expiryDate quantity' }
    ]);

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a sale
// @route   PUT /api/sales/:id
// @access  Private/Admin
const updateSale = async (req, res, next) => {
  try {
    const existingSale = await Sale.findById(req.params.id);
    if (!existingSale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    const { product: productId, inventoryBatch: batchId, quantity, saleDate } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const newBatch = await Inventory.findById(batchId);
    if (!newBatch) {
      return res.status(404).json({ message: 'Inventory batch not found' });
    }

    // Verify batch belongs to product
    if (newBatch.product.toString() !== productId) {
      return res.status(400).json({ message: 'Selected batch does not belong to selected product' });
    }

    // Restore old stock
    const oldBatch = await Inventory.findById(existingSale.inventoryBatch);
    if (oldBatch) {
      oldBatch.quantity += existingSale.quantity;
      await oldBatch.save();
    }

    // Check new stock availability
    // Re-fetch in case old and new batch are the same
    const freshBatch = await Inventory.findById(batchId);
    if (freshBatch.quantity < quantity) {
      return res.status(400).json({
        message: `Not enough stock. Available: ${freshBatch.quantity}, Requested: ${quantity}`
      });
    }

    // Deduct new stock
    freshBatch.quantity -= quantity;
    await freshBatch.save();

    // Recompute pricing
    const originalPrice = product.sellingPrice || 0;
    const activeDiscount = await Discount.findOne({
      product: productId,
      inventoryBatch: batchId,
      active: true
    });

    const discountPct = activeDiscount ? activeDiscount.discountPercent : 0;
    const discountedPrice = originalPrice * (1 - discountPct / 100);
    const totalAmount = discountedPrice * quantity;

    existingSale.product = productId;
    existingSale.inventoryBatch = batchId;
    existingSale.quantity = quantity;
    existingSale.originalUnitPrice = originalPrice;
    existingSale.discountPercent = discountPct;
    existingSale.discountedUnitPrice = discountedPrice;
    existingSale.totalAmount = totalAmount;
    existingSale.discountNote = activeDiscount ? activeDiscount.note : null;
    existingSale.saleDate = saleDate;

    const updated = await existingSale.save();
    const populated = await updated.populate([
      { path: 'product', select: 'productName productCode sellingPrice' },
      { path: 'inventoryBatch', select: 'batchNumber expiryDate quantity' }
    ]);

    res.json(populated);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a sale (restore stock)
// @route   DELETE /api/sales/:id
// @access  Private/Admin
const deleteSale = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    // Restore stock to batch
    const batch = await Inventory.findById(sale.inventoryBatch);
    if (batch) {
      batch.quantity += sale.quantity;
      await batch.save();
    }

    await Sale.findByIdAndDelete(req.params.id);
    res.json({ message: 'Sale deleted and stock restored successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSales, getSaleById, createSale, updateSale, deleteSale };
