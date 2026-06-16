const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const { getAllUsers, createUser, getUserWorkload, getRoles, deactivateUser, deleteUser, getDashboardStats } = require('../controllers/userController');

router.get('/workload', verifyToken, getUserWorkload);
router.get('/roles', verifyToken, getRoles);
router.get('/dashboard-stats', verifyToken, getDashboardStats);
router.get('/', verifyToken, getAllUsers);
router.post('/', verifyToken, createUser);
router.put('/:id/deactivate', verifyToken, deactivateUser);
router.delete('/:id', verifyToken, deleteUser);

module.exports = router;