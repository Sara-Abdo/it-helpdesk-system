const db = require('../config/db');

const getNotifications = async (req, res) => {
    const userID = req.user.id;
    try {
        const [notifications] = await db.query(`
            SELECT ID, Message, IsRead, CreatedAt, TicketID
            FROM Notification
            WHERE UserID = ?
            ORDER BY CreatedAt DESC
            LIMIT 50
        `, [userID]);
        res.json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getUnreadCount = async (req, res) => {
    const userID = req.user.id;
    try {
        const [[row]] = await db.query(
            'SELECT COUNT(*) as count FROM Notification WHERE UserID = ? AND IsRead = 0',
            [userID]
        );
        res.json({ count: row.count });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const markAsRead = async (req, res) => {
    const userID = req.user.id;
    const { id } = req.params;
    try {
        await db.query(
            'UPDATE Notification SET IsRead = 1 WHERE ID = ? AND UserID = ?',
            [id, userID]
        );
        res.json({ message: 'Marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const markAllAsRead = async (req, res) => {
    const userID = req.user.id;
    try {
        await db.query(
            'UPDATE Notification SET IsRead = 1 WHERE UserID = ? AND IsRead = 0',
            [userID]
        );
        res.json({ message: 'All marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getNotifications, getUnreadCount, markAsRead, markAllAsRead };