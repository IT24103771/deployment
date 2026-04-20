const express = require('express');
const router = express.Router();
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { productValidation } = require('../validations/productValidation');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../utils/multerConfig');

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getProducts)
  .post(authorize('ADMIN'), upload.single('image'), productValidation, createProduct);

router.route('/:id')
  .get(getProductById)
  .put(authorize('ADMIN'), upload.single('image'), updateProduct)
  .delete(authorize('ADMIN'), deleteProduct);

module.exports = router;
