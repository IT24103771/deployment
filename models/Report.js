const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reportTitle: {
    type: String,
    required: [true, 'Report title is required'],
    trim: true
  },
  reportType: {
    type: String,
    enum: ['INVENTORY', 'EXPIRED', 'NEAR_EXPIRY', 'SALES', 'LOW_STOCK', 'DISCOUNT_USAGE'],
    required: [true, 'Report type is required']
  },
  format: {
    type: String,
    default: 'PDF'
  },
  startDate: {
    type: Date,
    default: null
  },
  endDate: {
    type: Date,
    default: null
  },
  visibility: {
    type: String,
    enum: ['ADMIN', 'ALL'],
    default: 'ADMIN'
  },
  createdBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Report', reportSchema);
