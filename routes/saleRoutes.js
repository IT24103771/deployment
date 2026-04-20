const express = require('express');
const router = express.Router();
const { getSales, getSaleById, createSale, updateSale, deleteSale } = require('../controllers/saleController');
const { saleValidation } = require('../validations/saleValidation');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
  .get(getSales)
  .post(saleValidation, createSale);

router.route('/:id')
  .get(getSaleById)
  .put(authorize('ADMIN'), updateSale)
  .delete(authorize('ADMIN'), deleteSale);

module.exports = router;
