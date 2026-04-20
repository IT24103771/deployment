const express = require('express');
const router = express.Router();
const { getAlerts, markAsRead, generateAlerts, deleteAlert } = require('../controllers/alertController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/', getAlerts);
router.put('/:id/read', markAsRead);
router.post('/generate', authorize('ADMIN'), generateAlerts);
router.delete('/:id', authorize('ADMIN'), deleteAlert);

module.exports = router;
