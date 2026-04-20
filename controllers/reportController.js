const Report = require('../models/Report');
const Inventory = require('../models/Inventory');
const Sale = require('../models/Sale');

// @desc    Create a report record
// @route   POST /api/reports
// @access  Private/Admin
const createReport = async (req, res, next) => {
  try {
    const { reportTitle, reportType, startDate, endDate, visibility } = req.body;

    if (!reportTitle || !reportType) {
      return res.status(400).json({ message: 'Report title and type are required' });
    }

    const report = await Report.create({
      reportTitle,
      reportType,
      startDate: startDate || null,
      endDate: endDate || null,
      visibility: visibility || 'ADMIN',
      createdBy: req.user ? req.user.username : 'System'
    });

    res.status(201).json(report);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reports
// @route   GET /api/reports
// @access  Private
const getReports = async (req, res, next) => {
  try {
    const { visibility } = req.query;
    let filter = {};

    // Staff can only see ALL visibility reports
    if (req.user && req.user.role === 'STAFF') {
      filter.visibility = 'ALL';
    } else if (visibility) {
      filter.visibility = visibility;
    }

    const reports = await Report.find(filter).sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete report
// @route   DELETE /api/reports/:id
// @access  Private/Admin
const deleteReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    await Report.findByIdAndDelete(req.params.id);
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get expired products report data
// @route   GET /api/reports/expired-products
// @access  Private
const getExpiredProducts = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expired = await Inventory.find({
      expiryDate: { $lt: today }
    }).populate('product', 'productName productCode');

    res.json(expired);
  } catch (error) {
    next(error);
  }
};

// @desc    Get near-expiry products report data
// @route   GET /api/reports/near-expiry
// @access  Private
const getNearExpiry = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDays = new Date(today);
    sevenDays.setDate(sevenDays.getDate() + 7);

    const nearExpiry = await Inventory.find({
      expiryDate: { $gte: today, $lte: sevenDays }
    }).populate('product', 'productName productCode');

    res.json(nearExpiry);
  } catch (error) {
    next(error);
  }
};

// @desc    Get sales report data
// @route   GET /api/reports/sales-report
// @access  Private
const getSalesReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    let filter = {};

    if (startDate && endDate) {
      filter.saleDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const sales = await Sale.find(filter)
      .populate('product', 'productName productCode')
      .populate('inventoryBatch', 'batchNumber expiryDate')
      .sort({ saleDate: -1 });

    // Calculate summary
    const totalRevenue = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const totalQty = sales.reduce((sum, s) => sum + (s.quantity || 0), 0);

    res.json({
      sales,
      totalRevenue,
      totalQty,
      totalRecords: sales.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get monthly sales trend (for charts)
// @route   GET /api/reports/monthly-sales
// @access  Private
const getMonthlySales = async (req, res, next) => {
  try {
    const monthlyData = await Sale.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$saleDate' },
            month: { $month: '$saleDate' }
          },
          totalRevenue: { $sum: '$totalAmount' },
          totalQty: { $sum: '$quantity' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    res.json(monthlyData);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReport, getReports, deleteReport,
  getExpiredProducts, getNearExpiry, getSalesReport, getMonthlySales
};
