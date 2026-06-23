const db = require('../config/db');

const logWork = async (req, res) => {
    const { ticketID } = req.params;
    const { role, id: userID } = req.user;
    const { startTime, endTime, notes } = req.body;

    if (!startTime || !endTime) {
        return res.status(400).json({ message: 'Start and end time are required' });
    }

    try {
        const [tickets] = await db.query('SELECT ID, AssignedToID FROM Ticket WHERE ID = ?', [ticketID]);
        if (tickets.length === 0) return res.status(404).json({ message: 'Ticket not found' });

        if (role === 'IT Support Agent' && tickets[0].AssignedToID !== userID) {
            return res.status(403).json({ message: 'You can only log work on tickets assigned to you' });
        }
        if (role !== 'IT Support Agent' && role !== 'Admin' && role !== 'Manager') {
            return res.status(403).json({ message: 'You are not authorized to log work' });
        }

        const start = new Date(startTime);
        const end = new Date(endTime);
        const duration = Math.round((end - start) / 60000);

        await db.query(
            'INSERT INTO WorkLog (TicketID, UserID, StartTime, EndTime, Duration, Notes) VALUES (?, ?, ?, ?, ?, ?)',
            [ticketID, userID, startTime, endTime, duration, notes]
        );

        const logText = notes && notes.trim()
            ? `Logged ${duration} min: ${notes.trim()}`
            : `Logged ${duration} min of work`;

        await db.query(
            'INSERT INTO ActivityLog (Action, UserID, TicketID) VALUES (?, ?, ?)',
            [logText, userID, ticketID]
        );

        res.status(201).json({ message: 'Work logged successfully', duration });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getWorkLogs = async (req, res) => {
    const { ticketID } = req.params;
    const { role, id: userID } = req.user;

    try {
        const [tickets] = await db.query('SELECT ID, CreatedByID, AssignedToID FROM Ticket WHERE ID = ?', [ticketID]);
        if (tickets.length === 0) return res.status(404).json({ message: 'Ticket not found' });

        const ticket = tickets[0];
        const allowed =
            role === 'Admin' || role === 'Manager' ||
            (role === 'Employee' && ticket.CreatedByID === userID) ||
            (role === 'IT Support Agent' && ticket.AssignedToID === userID);

        if (!allowed) {
            return res.status(403).json({ message: 'You do not have access to this ticket' });
        }

        const [logs] = await db.query(`
            SELECT wl.ID, wl.TicketID, wl.StartTime, wl.EndTime, wl.Duration, wl.Notes, wl.UserID, u.Name as UserName
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
