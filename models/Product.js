const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    minlength: [2, 'Product name must be at least 2 characters'],
    trim: true
  },
  productCode: {
    type: String,
    required: [true, 'Product code is required'],
    unique: true,
    trim: true
  },
  mainCategory: {
    type: String,
    required: [true, 'Main category is required'],
    trim: true
  },
  subCategory: {
    type: String,
    required: [true, 'Sub category is required'],
    trim: true
  },
  itemType: {
    type: String,
    required: [true, 'Item type is required'],
    trim: true
  },
  supplier: {
    type: String,
    required: [true, 'Supplier is required'],
    trim: true
  },
  costPrice: {
    type: Number,
    required: [true, 'Cost price is required'],
    min: [0, 'Cost price cannot be negative']
  },
  sellingPrice: {
    type: Number,
    required: [true, 'Selling price is required'],
    min: [0, 'Selling price cannot be negative']
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  barcode: {
    type: String,
    trim: true,
    default: ''
  },
  reorderLevel: {
    type: Number,
    default: 10,
    min: [0, 'Reorder level cannot be negative']
  },
  imageUrl: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
