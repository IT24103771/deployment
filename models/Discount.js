const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required']
  },
  inventoryBatch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    default: null
  },
  discountPercent: {
    type: Number,
    required: [true, 'Discount percent is required'],
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100%']
  },
  note: {
    type: String,
    trim: true,
    default: ''
  },
  startDate: {
    type: Date,
    default: null
  },
  endDate: {
    type: Date,
    default: null
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Discount', discountSchema);
