const db = require('../config/db');

const canAccessTicket = (ticket, user) => {
    if (user.role === 'Admin' || user.role === 'Manager') return true;
    if (user.role === 'Employee') return ticket.CreatedByID === user.id;
    if (user.role === 'IT Support Agent') return ticket.AssignedToID === user.id;
    return false;
};

const createTicket = async (req, res) => {
    const { title, description, categoryID, priorityID } = req.body;
    const createdByID = req.user.id;

    if (!title || !description || !categoryID || !priorityID) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const refNumber = 'TK-' + Date.now();

        const [result] = await db.query(
            `INSERT INTO Ticket (ReferenceNumber, Title, Description, StatusID, PriorityID, CategoryID, CreatedByID)
             VALUES (?, ?, ?, 1, ?, ?, ?)`,
            [refNumber, title, description, priorityID, categoryID, createdByID]
        );

        await db.query(
            `INSERT INTO ActivityLog (Action, UserID, TicketID) VALUES (?, ?, ?)`,
            ['Ticket created', createdByID, result.insertId]
        );

        res.status(201).json({ message: 'Ticket created', ticketID: result.insertId, referenceNumber: refNumber });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAllTickets = async (req, res) => {
    const { role, id } = req.user;

    try {
        let query = `
            SELECT
                t.ID, t.ReferenceNumber, t.Title, t.StatusID, t.PriorityID, t.CategoryID,
                t.CreatedByID, t.AssignedToID, t.CreatedAt, t.UpdatedAt,
                s.Name as StatusName,
                p.Name as PriorityName,
                c.Name as CategoryName,
                u1.Name as CreatedByName,
                u2.Name as AssignedToName
            FROM Ticket t
            JOIN \`Status\` s ON t.StatusID = s.ID
            JOIN Priority p ON t.PriorityID = p.ID
            JOIN Category c ON t.CategoryID = c.ID
            JOIN \`User\` u1 ON t.CreatedByID = u1.ID
            LEFT JOIN \`User\` u2 ON t.AssignedToID = u2.ID
        `;

        let params = [];

        if (role === 'Employee') {
            query += ' WHERE t.CreatedByID = ?';
            params = [id];
        } else if (role === 'IT Support Agent') {
            query += ' WHERE t.AssignedToID = ?';
            params = [id];
        }

        query += ' ORDER BY t.CreatedAt DESC';

        const [tickets] = await db.query(query, params);
        res.json(tickets);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getTicketById = async (req, res) => {
    const { id } = req.params;

    try {
        const [tickets] = await db.query(`
            SELECT
                t.ID, t.ReferenceNumber, t.Title, t.Description, t.StatusID, t.PriorityID, t.CategoryID,
                t.CreatedByID, t.AssignedToID, t.CreatedAt, t.UpdatedAt,
                s.Name as StatusName,
                p.Name as PriorityName,
                c.Name as CategoryName,
                u1.Name as CreatedByName,
                u2.Name as AssignedToName
            FROM Ticket t
            JOIN \`Status\` s ON t.StatusID = s.ID
            JOIN Priority p ON t.PriorityID = p.ID
            JOIN Category c ON t.CategoryID = c.ID
            JOIN \`User\` u1 ON t.CreatedByID = u1.ID
            LEFT JOIN \`User\` u2 ON t.AssignedToID = u2.ID
            WHERE t.ID = ?
        `, [id]);

        if (tickets.length === 0) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        const ticket = tickets[0];

        if (!canAccessTicket(ticket, req.user)) {
            return res.status(403).json({ message: 'You do not have access to this ticket' });
        }

        const [comments] = await db.query(`
            SELECT tc.ID, tc.Content, tc.CreatedAt, tc.UserID, u.Name as UserName
            FROM TicketComment tc
            JOIN \`User\` u ON tc.UserID = u.ID
            WHERE tc.TicketID = ?
            ORDER BY tc.CreatedAt ASC
        `, [id]);

        res.json({ ...ticket, comments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateTicket = async (req, res) => {
    const { id } = req.params;
    const { role, id: userID } = req.user;
    const { title, description, categoryID, priorityID, statusID, assignedToID } = req.body;

    try {
        const [tickets] = await db.query('SELECT * FROM Ticket WHERE ID = ?', [id]);
        if (tickets.length === 0) return res.status(404).json({ message: 'Ticket not found' });

        const ticket = tickets[0];

        if (ticket.StatusID === 5) {
            return res.status(400).json({ message: 'Closed tickets cannot be modified' });
        }

        if (role === 'Employee') {
            if (ticket.CreatedByID !== userID) {
                return res.status(403).json({ message: 'You can only edit tickets you created' });
            }
            if (ticket.StatusID !== 1) {
                return res.status(403).json({ message: 'You can only edit open tickets' });
            }
            await db.query(
                'UPDATE Ticket SET Title=?, Description=?, CategoryID=?, PriorityID=?, UpdatedAt=NOW() WHERE ID=?',
                [title, description, categoryID, priorityID, id]
            );
        } else if (role === 'IT Support Agent') {
            if (ticket.AssignedToID !== userID) {
                return res.status(403).json({ message: 'You can only update tickets assigned to you' });
            }
            const previousStatusID = ticket.StatusID;
            await db.query(
                'UPDATE Ticket SET StatusID=?, UpdatedAt=NOW() WHERE ID=?',
                [statusID, id]
            );
            if (statusID && parseInt(statusID) !== previousStatusID) {
                const [statusRows] = await db.query('SELECT Name FROM `Status` WHERE ID IN (?, ?)', [previousStatusID, statusID]);
                const oldName = statusRows.find(s => s.ID === previousStatusID)?.Name || previousStatusID;
                const newName = statusRows.find(s => s.ID === parseInt(statusID))?.Name || statusID;
                await db.query(
                    'INSERT INTO ActivityLog (Action, UserID, TicketID) VALUES (?, ?, ?)',
                    [`Status changed from ${oldName} to ${newName}`, userID, id]
                );
                await db.query(
                    'INSERT INTO Notification (Message, UserID, TicketID) VALUES (?, ?, ?)',
                    [`Ticket ${ticket.ReferenceNumber} status changed to ${newName}`, ticket.CreatedByID, id]
                );
            }
        } else {
            const previousAgentID = ticket.AssignedToID;
            const previousStatusID = ticket.StatusID;
            await db.query(
                'UPDATE Ticket SET StatusID=?, AssignedToID=?, UpdatedAt=NOW() WHERE ID=?',
                [statusID, assignedToID || null, id]
            );

            if (assignedToID && previousAgentID !== parseInt(assignedToID)) {
                await db.query(
                    'INSERT INTO ActivityLog (Action, UserID, TicketID) VALUES (?, ?, ?)',
                    [`Ticket reassigned from agent ID ${previousAgentID || 'none'} to agent ID ${assignedToID}`, userID, id]
                );
                await db.query(
                    'INSERT INTO Notification (Message, UserID, TicketID) VALUES (?, ?, ?)',
                    [`You have been assigned ticket ${ticket.ReferenceNumber}`, assignedToID, id]
                );
            }
            if (statusID && parseInt(statusID) !== previousStatusID) {
                const [statusRows] = await db.query('SELECT Name FROM `Status` WHERE ID IN (?, ?)', [previousStatusID, statusID]);
                const oldName = statusRows.find(s => s.ID === previousStatusID)?.Name || previousStatusID;
                const newName = statusRows.find(s => s.ID === parseInt(statusID))?.Name || statusID;
                await db.query(
                    'INSERT INTO ActivityLog (Action, UserID, TicketID) VALUES (?, ?, ?)',
                    [`Status changed from ${oldName} to ${newName}`, userID, id]
                );
                await db.query(
                    'INSERT INTO Notification (Message, UserID, TicketID) VALUES (?, ?, ?)',
                    [`Ticket ${ticket.ReferenceNumber} status changed to ${newName}`, ticket.CreatedByID, id]
                );
            }
        }

        res.json({ message: 'Ticket updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteTicket = async (req, res) => {
    const { id } = req.params;
    const { role, id: userID } = req.user;

    try {
        const [tickets] = await db.query('SELECT ID, CreatedByID, AssignedToID, StatusID FROM Ticket WHERE ID = ?', [id]);
        if (tickets.length === 0) return res.status(404).json({ message: 'Ticket not found' });

        const ticket = tickets[0];

        if (role === 'Employee' && ticket.CreatedByID !== userID) {
            return res.status(403).json({ message: 'You can only delete tickets you created' });
        }

        if (ticket.AssignedToID !== null) {
            return res.status(400).json({ message: 'Cannot delete a ticket that is already assigned' });
        }

        if (ticket.StatusID !== 1) {
            return res.status(400).json({ message: 'Can only delete open unassigned tickets' });
        }

        await db.query('DELETE FROM Ticket WHERE ID = ?', [id]);
        res.json({ message: 'Ticket deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const addComment = async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    const userID = req.user.id;

    if (!content) return res.status(400).json({ message: 'Comment cannot be empty' });

    try {
        const [tickets] = await db.query('SELECT ID, ReferenceNumber, CreatedByID, AssignedToID FROM Ticket WHERE ID = ?', [id]);
        if (tickets.length === 0) return res.status(404).json({ message: 'Ticket not found' });

        const ticket = tickets[0];

        if (!canAccessTicket(ticket, req.user)) {
            return res.status(403).json({ message: 'You do not have access to this ticket' });
        }

        await db.query(
            'INSERT INTO TicketComment (Content, TicketID, UserID) VALUES (?, ?, ?)',
            [content, id, userID]
        );

        const notifyTargets = [];
        if (ticket.CreatedByID !== userID) notifyTargets.push(ticket.CreatedByID);
        if (ticket.AssignedToID && ticket.AssignedToID !== userID) notifyTargets.push(ticket.AssignedToID);

        for (const targetID of notifyTargets) {
            await db.query(
                'INSERT INTO Notification (Message, UserID, TicketID) VALUES (?, ?, ?)',
                [`New comment on ticket ${ticket.ReferenceNumber}`, targetID, id]
            );
        }

        res.status(201).json({ message: 'Comment added' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getTicketHistory = async (req, res) => {
    const { id } = req.params;

    try {
        const [tickets] = await db.query('SELECT ID, CreatedByID, AssignedToID FROM Ticket WHERE ID = ?', [id]);
        if (tickets.length === 0) return res.status(404).json({ message: 'Ticket not found' });

        if (!canAccessTicket(tickets[0], req.user)) {
            return res.status(403).json({ message: 'You do not have access to this ticket' });
        }

        const [history] = await db.query(`
            SELECT al.ID, al.Action, al.Timestamp, al.UserID, u.Name as UserName
            FROM ActivityLog al
            JOIN \`User\` u ON al.UserID = u.ID
            WHERE al.TicketID = ?
            ORDER BY al.Timestamp ASC
        `, [id]);

        res.json(history);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getTicketMeta = async (req, res) => {
    try {
        const [categories] = await db.query('SELECT ID, Name FROM Category');
        const [priorities] = await db.query('SELECT ID, Name FROM Priority');
        res.json({ categories, priorities });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createTicket,
    getAllTickets,
    getTicketById,
    updateTicket,
    deleteTicket,
    addComment,
    getTicketHistory,
    getTicketMeta
};