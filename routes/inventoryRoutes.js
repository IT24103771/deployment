const express = require('express');
const router = express.Router();
const { getInventory, getAvailableBatches, createInventory, updateInventory, deleteInventory } = require('../controllers/inventoryController');
const { inventoryValidation } = require('../validations/inventoryValidation');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
  .get(getInventory)
  .post(inventoryValidation, createInventory);

router.get('/available/:productId', getAvailableBatches);

router.route('/:id')
  .put(updateInventory)
  .delete(authorize('ADMIN'), deleteInventory);

module.exports = router;
