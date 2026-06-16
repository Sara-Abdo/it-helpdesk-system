const db = require('../config/db');

const logWork = async (req, res) => {
    const { ticketID } = req.params;
    const userID = req.user.id;
    const { startTime, endTime, notes } = req.body;

    try {
        const start = new Date(startTime);
        const end = new Date(endTime);
        const duration = Math.round((end - start) / 60000);

        await db.query(
            'INSERT INTO WorkLog (TicketID, UserID, StartTime, EndTime, Duration, Notes) VALUES (?, ?, ?, ?, ?, ?)',
            [ticketID, userID, startTime, endTime, duration, notes]
        );

        await db.query(
            'INSERT INTO ActivityLog (Action, UserID, TicketID) VALUES (?, ?, ?)',
            [`Work logged: ${duration} minutes`, userID, ticketID]
        );

        res.status(201).json({ message: 'Work logged successfully', duration });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getWorkLogs = async (req, res) => {
    const { ticketID } = req.params;

    try {
        const [logs] = await db.query(`
            SELECT wl.*, u.Name as UserName
            FROM WorkLog wl
            JOIN \`User\` u ON wl.UserID = u.ID
            WHERE wl.TicketID = ?
            ORDER BY wl.StartTime ASC
        `, [ticketID]);

        res.json(logs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { logWork, getWorkLogs };