const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required']
  },
  inventoryBatch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    required: [true, 'Inventory batch is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity sold is required'],
    min: [1, 'Quantity must be at least 1']
  },
  originalUnitPrice: {
    type: Number,
    default: 0
  },
  discountPercent: {
    type: Number,
    default: 0
  },
  discountedUnitPrice: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  discountNote: {
    type: String,
    default: null
  },
  saleDate: {
    type: Date,
    required: [true, 'Sale date is required']
  },
  createdBy: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Sale', saleSchema);
