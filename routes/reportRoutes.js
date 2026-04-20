const express = require('express');
const router = express.Router();
const { getDashboard } = require('../controllers/dashboardController');
const {
  createReport, getReports, deleteReport,
  getExpiredProducts, getNearExpiry, getSalesReport, getMonthlySales
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

// Dashboard
router.get('/dashboard', getDashboard);

// Reports CRUD
router.route('/')
  .get(getReports)
  .post(authorize('ADMIN'), createReport);

router.delete('/:id', authorize('ADMIN'), deleteReport);

// Report data endpoints
router.get('/expired-products', getExpiredProducts);
router.get('/near-expiry', getNearExpiry);
router.get('/sales-report', getSalesReport);
router.get('/monthly-sales', getMonthlySales);

module.exports = router;
