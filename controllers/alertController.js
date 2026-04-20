const Alert = require('../models/Alert');
const Inventory = require('../models/Inventory');
const Product = require('../models/Product');

// @desc    Get all alerts
// @route   GET /api/alerts
// @access  Private
const getAlerts = async (req, res, next) => {
  try {
    const { unreadOnly } = req.query;
    let filter = {};
    if (unreadOnly === 'true') filter.isRead = false;

    const alerts = await Alert.find(filter)
      .populate('product', 'productName productCode')
      .populate('inventoryBatch', 'batchNumber expiryDate quantity')
      .sort({ createdAt: -1 });

    res.json(alerts);
  } catch (error) {
    next(error);
  }
};

// @desc    Mark alert as read
// @route   PUT /api/alerts/:id/read
// @access  Private
const markAsRead = async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    alert.isRead = true;
    const updated = await alert.save();
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// @desc    Generate alerts for expiring/expired stock
// @route   POST /api/alerts/generate
// @access  Private/Admin
const generateAlerts = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDays = new Date(today);
    sevenDays.setDate(sevenDays.getDate() + 7);
    const fiveDays = new Date(today);
    fiveDays.setDate(fiveDays.getDate() + 5);
    const twoDays = new Date(today);
    twoDays.setDate(twoDays.getDate() + 2);

    const batches = await Inventory.find({ quantity: { $gt: 0 } }).populate('product');
    const newAlerts = [];

    for (const batch of batches) {
      const expiryDate = new Date(batch.expiryDate);
      expiryDate.setHours(0, 0, 0, 0);

      let alertType = null;
      let message = '';
      let suggestedDiscount = null;

      if (expiryDate < today) {
        // Already expired
        alertType = 'EXPIRED';
        message = `${batch.product.productName} (Batch: ${batch.batchNumber}) has expired on ${batch.expiryDate.toISOString().split('T')[0]}`;
      } else if (expiryDate <= twoDays) {
        // Within 2 days
        alertType = 'EXPIRING_SOON';
        message = `${batch.product.productName} (Batch: ${batch.batchNumber}) expires within 2 days. Suggested 40% discount.`;
        suggestedDiscount = 40;
      } else if (expiryDate <= fiveDays) {
        // Within 5 days
        alertType = 'EXPIRING_SOON';
        message = `${batch.product.productName} (Batch: ${batch.batchNumber}) expires within 5 days. Suggested 20% discount.`;
        suggestedDiscount = 20;
      } else if (expiryDate <= sevenDays) {
        // Within 7 days
        alertType = 'EXPIRING_SOON';
        message = `${batch.product.productName} (Batch: ${batch.batchNumber}) expires within 7 days.`;
      }

      if (alertType) {
        // Check if same alert already exists (to avoid duplicates)
        const exists = await Alert.findOne({
          inventoryBatch: batch._id,
          alertType,
          createdAt: { $gte: new Date(today.getTime() - 24 * 60 * 60 * 1000) } // within last 24h
        });

        if (!exists) {
          newAlerts.push({
            product: batch.product._id,
            inventoryBatch: batch._id,
            alertType,
            message,
            suggestedDiscount
          });
        }
      }

      // Low stock alert
      if (batch.quantity <= (batch.product.reorderLevel || 10)) {
        const lowStockExists = await Alert.findOne({
          inventoryBatch: batch._id,
          alertType: 'LOW_STOCK',
          createdAt: { $gte: new Date(today.getTime() - 24 * 60 * 60 * 1000) }
        });

        if (!lowStockExists) {
          newAlerts.push({
            product: batch.product._id,
            inventoryBatch: batch._id,
            alertType: 'LOW_STOCK',
            message: `${batch.product.productName} (Batch: ${batch.batchNumber}) is running low. Only ${batch.quantity} remaining.`,
            suggestedDiscount: null
          });
        }
      }
    }

    if (newAlerts.length > 0) {
      await Alert.insertMany(newAlerts);
    }

    res.json({ message: `Generated ${newAlerts.length} new alerts`, count: newAlerts.length });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete alert
// @route   DELETE /api/alerts/:id
// @access  Private/Admin
const deleteAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    await Alert.findByIdAndDelete(req.params.id);
    res.json({ message: 'Alert deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAlerts, markAsRead, generateAlerts, deleteAlert };
