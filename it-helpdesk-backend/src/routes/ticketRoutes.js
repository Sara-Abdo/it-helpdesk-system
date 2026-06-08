const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const {
    createTicket,
    getAllTickets,
    getTicketById,
    updateTicket,
    deleteTicket,
    addComment,
    getTicketHistory,
    getTicketMeta
} = require('../controllers/ticketController');

router.get('/meta', verifyToken, getTicketMeta);
router.post('/', verifyToken, createTicket);
router.get('/', verifyToken, getAllTickets);
router.get('/:id', verifyToken, getTicketById);
router.put('/:id', verifyToken, updateTicket);
router.delete('/:id', verifyToken, deleteTicket);
router.post('/:id/comments', verifyToken, addComment);
router.get('/:id/history', verifyToken, getTicketHistory);

module.exports = router;