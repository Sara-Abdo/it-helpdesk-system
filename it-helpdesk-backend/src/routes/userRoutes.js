const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const { getAllUsers, createUser, getUserWorkload, getRoles } = require('../controllers/userController');

router.get('/workload', verifyToken, getUserWorkload);
router.get('/roles', verifyToken, getRoles);
router.get('/', verifyToken, getAllUsers);
router.post('/', verifyToken, createUser);

module.exports = router;