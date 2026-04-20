const express = require('express');
const router = express.Router();
const { getUsers, getUserById, createUser, updateUser, deleteUser, toggleStatus } = require('../controllers/userController');
const { registerValidation } = require('../validations/authValidation');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All routes are protected and admin-only
router.use(protect);
router.use(authorize('ADMIN'));

router.route('/')
  .get(getUsers)
  .post(registerValidation, createUser);

router.route('/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

router.put('/:id/toggle-status', toggleStatus);

module.exports = router;
