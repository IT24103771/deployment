const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  inventoryBatch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    default: null
  },
  alertType: {
    type: String,
    enum: ['EXPIRING_SOON', 'EXPIRED', 'LOW_STOCK'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  suggestedDiscount: {
    type: Number,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Alert', alertSchema);
