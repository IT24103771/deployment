const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Sale = require('../models/Sale');
const Discount = require('../models/Discount');
const Alert = require('../models/Alert');

// @desc    Get dashboard summary
// @route   GET /api/reports/dashboard
// @access  Private
const getDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDays = new Date(today);
    sevenDays.setDate(sevenDays.getDate() + 7);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Total products
    const totalProducts = await Product.countDocuments();

    // Total inventory batches
    const totalBatches = await Inventory.countDocuments();

    // Total stock quantity
    const stockAgg = await Inventory.aggregate([
      { $group: { _id: null, total: { $sum: '$quantity' } } }
    ]);
    const totalStockQty = stockAgg.length > 0 ? stockAgg[0].total : 0;

    // Low stock batches (qty <= reorder level)
    const inventoryWithProduct = await Inventory.find().populate('product', 'reorderLevel');
    const lowStockBatches = inventoryWithProduct.filter(
      inv => inv.quantity <= (inv.product?.reorderLevel || 10)
    ).length;

    // Expired batches
    const expiredBatches = await Inventory.countDocuments({
      expiryDate: { $lt: today }
    });

    // Expiring soon batches (within 7 days)
    const expiringSoonBatches = await Inventory.countDocuments({
      expiryDate: { $gte: today, $lte: sevenDays }
    });

    // Sales today
    const salesTodayAgg = await Sale.aggregate([
      { $match: { saleDate: { $gte: today, $lt: tomorrow } } },
      { $group: { _id: null, totalQty: { $sum: '$quantity' }, totalAmount: { $sum: '$totalAmount' } } }
    ]);
    const salesTodayQty = salesTodayAgg.length > 0 ? salesTodayAgg[0].totalQty : 0;
    const salesTodayAmount = salesTodayAgg.length > 0 ? salesTodayAgg[0].totalAmount : 0;

    // Active discounts
    const activeDiscounts = await Discount.countDocuments({ active: true });

    // Recent alerts (unread)
    const unreadAlerts = await Alert.countDocuments({ isRead: false });

    // Total sales count & revenue
    const totalSalesAgg = await Sale.aggregate([
      { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } }
    ]);
    const totalSalesCount = totalSalesAgg.length > 0 ? totalSalesAgg[0].count : 0;
    const totalRevenue = totalSalesAgg.length > 0 ? totalSalesAgg[0].revenue : 0;

    res.json({
      totalProducts,
      totalBatches,
      totalStockQty,
      lowStockBatches,
      expiredBatches,
      expiringSoonBatches,
      salesTodayQty,
      salesTodayAmount,
      activeDiscounts,
      unreadAlerts,
      totalSalesCount,
      totalRevenue
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard };
