const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required']
  },
  batchNumber: {
    type: String,
    required: [true, 'Batch number is required'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative']
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required']
  }
}, {
  timestamps: true
});

// Compound unique index: same product cannot have duplicate batch numbers
inventorySchema.index({ product: 1, batchNumber: 1 }, { unique: true });

// Virtual field: compute expiry status dynamically
inventorySchema.virtual('status').get(function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(this.expiryDate);
  expiry.setHours(0, 0, 0, 0);

  if (expiry < today) return 'Expired';

  const sevenDaysLater = new Date(today);
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

  if (expiry <= sevenDaysLater) return 'Expiring Soon';
  return 'Safe';
});

// Ensure virtuals are included in JSON and Object output
inventorySchema.set('toJSON', { virtuals: true });
inventorySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Inventory', inventorySchema);
