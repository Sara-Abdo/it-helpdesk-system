const db = require('../config/db');

// -----------------------------------------------
// Create a new ticket
// Only authenticated users can create tickets
// Status is set to 1 (Open) by default
// A unique reference number is generated automatically
// -----------------------------------------------
const createTicket = async (req, res) => {
    const { title, description, categoryID, priorityID } = req.body;
    const createdByID = req.user.id;

    if (!title || !description || !categoryID || !priorityID) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Generate a unique reference number using timestamp
        const refNumber = 'TK-' + Date.now();

        // Insert the new ticket into the database
        const [result] = await db.query(
            `INSERT INTO Ticket (ReferenceNumber, Title, Description, StatusID, PriorityID, CategoryID, CreatedByID)
             VALUES (?, ?, ?, 1, ?, ?, ?)`,
            [refNumber, title, description, priorityID, categoryID, createdByID]
        );

        // Log this action in the ActivityLog table
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

// -----------------------------------------------
// Get all tickets
// Role-based filtering:
// - Admin/Manager: sees all tickets
// - Employee: sees only tickets they created
// - IT Support Agent: sees only tickets assigned to them
// -----------------------------------------------
const getAllTickets = async (req, res) => {
    const { role, id } = req.user;

    try {
        // Base query to get ticket details with related table data
        let query = `
            SELECT t.*, 
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

        // Filter tickets based on the user's role
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

// -----------------------------------------------
// Get a single ticket by ID
// Also returns all comments linked to this ticket
// -----------------------------------------------
const getTicketById = async (req, res) => {
    const { id } = req.params;

    try {
        // Get the ticket with all related information
        const [tickets] = await db.query(`
            SELECT t.*, 
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

        // Get all comments for this ticket ordered by oldest first
        const [comments] = await db.query(`
            SELECT tc.*, u.Name as UserName 
            FROM TicketComment tc
            JOIN \`User\` u ON tc.UserID = u.ID
            WHERE tc.TicketID = ?
            ORDER BY tc.CreatedAt ASC
        `, [id]);

        // Return ticket details along with its comments
        res.json({ ...tickets[0], comments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// -----------------------------------------------
// Update a ticket
// Rules:
// - Closed tickets (StatusID = 5) cannot be modified
// - Employees can only edit if ticket is still Open (StatusID = 1)
// - Admin/Manager/Agent can update status and assignment
// -----------------------------------------------
const updateTicket = async (req, res) => {
    const { id } = req.params;
    const { role, id: userID } = req.user;
    const { title, description, categoryID, priorityID, statusID, assignedToID } = req.body;

    try {
        // Check if ticket exists
        const [tickets] = await db.query('SELECT * FROM Ticket WHERE ID = ?', [id]);
        if (tickets.length === 0) return res.status(404).json({ message: 'Ticket not found' });

        const ticket = tickets[0];

        // Closed tickets cannot be modified
        if (ticket.StatusID === 5) {
            return res.status(400).json({ message: 'Closed tickets cannot be modified' });
        }

        if (role === 'Employee') {
            // Employees can only edit tickets that are still Open
            if (ticket.StatusID !== 1) {
                return res.status(403).json({ message: 'You can only edit open tickets' });
            }
            await db.query(
                'UPDATE Ticket SET Title=?, Description=?, CategoryID=?, PriorityID=?, UpdatedAt=NOW() WHERE ID=?',
                [title, description, categoryID, priorityID, id]
            );
        } else {
            const previousAgentID = ticket.AssignedToID;
            await db.query(
                'UPDATE Ticket SET StatusID=?, AssignedToID=?, UpdatedAt=NOW() WHERE ID=?',
                [statusID, assignedToID, id]
            );

            if (previousAgentID && previousAgentID !== parseInt(assignedToID)) {
                await db.query(
                    'INSERT INTO ActivityLog (Action, UserID, TicketID) VALUES (?, ?, ?)',
                    [`Ticket reassigned from agent ID ${previousAgentID} to agent ID ${assignedToID}`, userID, id]
                );
            }
        }

        // Log the update action
        await db.query(
            'INSERT INTO ActivityLog (Action, UserID, TicketID) VALUES (?, ?, ?)',
            [`Ticket updated by ${role}`, userID, id]
        );

        res.json({ message: 'Ticket updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// -----------------------------------------------
// Delete a ticket
// Rules:
// - Can only delete if ticket is unassigned
// - Can only delete if ticket status is still Open (StatusID = 1)
// -----------------------------------------------
const deleteTicket = async (req, res) => {
    const { id } = req.params;

    try {
        // Check if ticket exists
        const [tickets] = await db.query('SELECT * FROM Ticket WHERE ID = ?', [id]);
        if (tickets.length === 0) return res.status(404).json({ message: 'Ticket not found' });

        const ticket = tickets[0];

        // Cannot delete if ticket is already assigned to someone
        if (ticket.AssignedToID !== null) {
            return res.status(400).json({ message: 'Cannot delete a ticket that is already assigned' });
        }

        // Cannot delete if ticket is not in Open status
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

// -----------------------------------------------
// Add a comment to a ticket
// Works like a chat between assigned users and manager
// Every comment is also logged in ActivityLog
// -----------------------------------------------
const addComment = async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    const userID = req.user.id;

    if (!content) return res.status(400).json({ message: 'Comment cannot be empty' });

    try {
        // Insert comment into TicketComment table
        await db.query(
            'INSERT INTO TicketComment (Content, TicketID, UserID) VALUES (?, ?, ?)',
            [content, id, userID]
        );

        // Log the comment action
        await db.query(
            'INSERT INTO ActivityLog (Action, UserID, TicketID) VALUES (?, ?, ?)',
            ['Comment added', userID, id]
        );

        res.status(201).json({ message: 'Comment added' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// -----------------------------------------------
// Get ticket history (audit log)
// Shows all actions taken on a ticket
// For example: created, assigned, updated, commented
// -----------------------------------------------
const getTicketHistory = async (req, res) => {
    const { id } = req.params;

    try {
        // Get all activity logs for this ticket with the user's name
        const [history] = await db.query(`
            SELECT al.*, u.Name as UserName 
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

module.exports = { createTicket, getAllTickets, getTicketById, updateTicket, deleteTicket, addComment, getTicketHistory };
const getTicketMeta = async (req, res) => {
    try {
        const [categories] = await db.query('SELECT * FROM Category');
        const [priorities] = await db.query('SELECT * FROM Priority');
        res.json({ categories, priorities });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
module.exports = { createTicket, getAllTickets, getTicketById, updateTicket, deleteTicket, addComment, getTicketHistory, getTicketMeta };