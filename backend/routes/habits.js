const express = require('express');
const router = express.Router();
const habitController = require('../controllers/habitController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, habitController.getHabits);
router.post('/', authenticate, habitController.createHabit);
router.put('/:id', authenticate, habitController.updateHabit);
router.delete('/:id', authenticate, habitController.deleteHabit);

module.exports = router;
