const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const { logWork, getWorkLogs } = require('../controllers/workLogController');

router.post('/:ticketID', verifyToken, logWork);
router.get('/:ticketID', verifyToken, getWorkLogs);

module.exports = router;