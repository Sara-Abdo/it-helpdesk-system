const db = require('../config/db');
const fs = require('fs');
const path = require('path');

const canAccessTicket = (ticket, user) => {
    if (user.role === 'Admin' || user.role === 'Manager') return true;
    if (user.role === 'Employee') return ticket.CreatedByID === user.id;
    if (user.role === 'IT Support Agent') return ticket.AssignedToID === user.id;
    return false;
};

const uploadAttachment = async (req, res) => {
    const { id } = req.params;
    const userID = req.user.id;

    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        const [tickets] = await db.query('SELECT ID, CreatedByID, AssignedToID, StatusID FROM Ticket WHERE ID = ?', [id]);
        if (tickets.length === 0) {
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ message: 'Ticket not found' });
        }

        const ticket = tickets[0];

        if (!canAccessTicket(ticket, req.user)) {
            fs.unlinkSync(req.file.path);
            return res.status(403).json({ message: 'You do not have access to this ticket' });
        }

        if (ticket.StatusID === 5) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ message: 'Closed tickets cannot be modified' });
        }

        const relativePath = `/uploads/${req.file.filename}`;

        const [result] = await db.query(
            'INSERT INTO TicketAttachment (FileName, FilePath, TicketID, UploadedByID) VALUES (?, ?, ?, ?)',
            [req.file.originalname, relativePath, id, userID]
        );

        await db.query(
            'INSERT INTO ActivityLog (Action, UserID, TicketID) VALUES (?, ?, ?)',
            [`Attachment uploaded: ${req.file.originalname}`, userID, id]
        );

        res.status(201).json({
            id: result.insertId,
            fileName: req.file.originalname,
            filePath: relativePath
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAttachments = async (req, res) => {
    const { id } = req.params;

    try {
        const [tickets] = await db.query('SELECT ID, CreatedByID, AssignedToID FROM Ticket WHERE ID = ?', [id]);
        if (tickets.length === 0) return res.status(404).json({ message: 'Ticket not found' });

        if (!canAccessTicket(tickets[0], req.user)) {
            return res.status(403).json({ message: 'You do not have access to this ticket' });
        }

        const [attachments] = await db.query(`
            SELECT a.ID, a.FileName, a.FilePath, a.UploadedAt, a.UploadedByID, u.Name as UploadedByName
            FROM TicketAttachment a
            JOIN \`User\` u ON a.UploadedByID = u.ID
            WHERE a.TicketID = ?
            ORDER BY a.UploadedAt DESC
        `, [id]);

        res.json(attachments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteAttachment = async (req, res) => {
    const { attachmentId } = req.params;
    const { role, id: userID } = req.user;

    try {
        const [attachments] = await db.query(`
            SELECT a.ID, a.FilePath, a.UploadedByID, t.ID as TicketID, t.CreatedByID, t.AssignedToID
            FROM TicketAttachment a
            JOIN Ticket t ON a.TicketID = t.ID
            WHERE a.ID = ?
        `, [attachmentId]);

        if (attachments.length === 0) {
            return res.status(404).json({ message: 'Attachment not found' });
        }

        const attachment = attachments[0];
        const isOwner = attachment.UploadedByID === userID;
        const isPrivileged = role === 'Admin' || role === 'Manager';

        if (!isOwner && !isPrivileged) {
            return res.status(403).json({ message: 'You can only remove attachments you uploaded' });
        }

        const fullPath = path.join(__dirname, '../../', attachment.FilePath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }

        await db.query('DELETE FROM TicketAttachment WHERE ID = ?', [attachmentId]);

        res.json({ message: 'Attachment removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { uploadAttachment, getAttachments, deleteAttachment };
