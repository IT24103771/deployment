const express = require('express');
const router = express.Router();
const {
  getDiscounts, getActiveDiscounts, lookupActive,
  createDiscount, updateDiscount, toggleDiscount, deleteDiscount
} = require('../controllers/discountController');
const { discountValidation } = require('../validations/discountValidation');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/', getDiscounts);
router.get('/active', getActiveDiscounts);
router.get('/lookup', lookupActive);

router.post('/', authorize('ADMIN'), discountValidation, createDiscount);

router.route('/:id')
  .put(authorize('ADMIN'), updateDiscount)
  .delete(authorize('ADMIN'), deleteDiscount);

router.put('/:id/toggle', authorize('ADMIN'), toggleDiscount);

module.exports = router;
