const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, logController.logCompletion);
router.get('/date/:date', authenticate, logController.getByDate);
router.get('/range', authenticate, logController.getByDateRange);
router.get('/heatmap/habit/:habitId', authenticate, logController.getSingleHabitHeatmapData);
router.get('/heatmap', authenticate, logController.getHeatmapData);
router.get('/stats', authenticate, logController.getStats);
router.get('/charts', authenticate, logController.getChartData);

module.exports = router;
