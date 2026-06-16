const db = require('../config/db');
const bcrypt = require('bcryptjs');

const getAllUsers = async (req, res) => {
    const { role } = req.user;
    if (role !== 'Admin' && role !== 'Manager') {
        return res.status(403).json({ message: 'Access denied' });
    }
    try {
        const [users] = await db.query(`
            SELECT u.ID, u.Name, u.Email, u.IsActive, u.CreatedAt, r.Name as RoleName
            FROM \`User\` u
            JOIN Role r ON u.RoleID = r.ID
            ORDER BY u.CreatedAt DESC
        `);
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const createUser = async (req, res) => {
    const { role } = req.user;
    if (role !== 'Admin') {
        return res.status(403).json({ message: 'Only admins can create users' });
    }
    const { name, email, password, roleID } = req.body;
    if (!name || !email || !password || !roleID) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    try {
        const [existing] = await db.query('SELECT ID FROM `User` WHERE Email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query(
            'INSERT INTO `User` (Name, Email, Password, RoleID) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, roleID]
        );
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getUserWorkload = async (req, res) => {
    const { role } = req.user;
    if (role !== 'Admin' && role !== 'Manager') {
        return res.status(403).json({ message: 'Access denied' });
    }
    try {
        const [workload] = await db.query(`
            SELECT u.ID, u.Name, u.Email, r.Name as RoleName,
                COUNT(t.ID) as TotalAssigned,
                SUM(CASE WHEN t.StatusID = 2 THEN 1 ELSE 0 END) as InProgress,
                SUM(CASE WHEN t.StatusID = 1 THEN 1 ELSE 0 END) as Open
            FROM \`User\` u
            JOIN Role r ON u.RoleID = r.ID
            LEFT JOIN Ticket t ON t.AssignedToID = u.ID
            WHERE r.Name = 'IT Support Agent'
            GROUP BY u.ID
            ORDER BY TotalAssigned DESC
        `);
        res.json(workload);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getRoles = async (req, res) => {
    try {
        const [roles] = await db.query('SELECT * FROM Role');
        res.json(roles);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const deactivateUser = async (req, res) => {
    const { role } = req.user;
    if (role !== 'Admin') {
        return res.status(403).json({ message: 'Only admins can deactivate users' });
    }
    const { id } = req.params;
    try {
        await db.query('UPDATE `User` SET IsActive = 0 WHERE ID = ?', [id]);
        res.json({ message: 'User deactivated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteUser = async (req, res) => {
    const { role } = req.user;
    if (role !== 'Admin') {
        return res.status(403).json({ message: 'Only admins can delete users' });
    }
    const { id } = req.params;
    try {
        const [tickets] = await db.query('SELECT ID FROM Ticket WHERE CreatedByID = ? OR AssignedToID = ?', [id, id]);
        const [logs] = await db.query('SELECT ID FROM ActivityLog WHERE UserID = ?', [id]);

        if (tickets.length > 0 || logs.length > 0) {
            return res.status(400).json({ message: 'Cannot delete user with existing tickets or activity. Deactivate instead.' });
        }

        await db.query('DELETE FROM `User` WHERE ID = ?', [id]);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getDashboardStats = async (req, res) => {
    const { role, id } = req.user;
    try {
        let stats = {};

        if (role === 'Admin' || role === 'Manager') {
            const [[open]] = await db.query('SELECT COUNT(*) as count FROM Ticket WHERE StatusID = 1');
            const [[inProgress]] = await db.query('SELECT COUNT(*) as count FROM Ticket WHERE StatusID = 2');
            const [[resolved]] = await db.query('SELECT COUNT(*) as count FROM Ticket WHERE StatusID = 4');
            const [[total]] = await db.query('SELECT COUNT(*) as count FROM Ticket');
            stats = { open: open.count, inProgress: inProgress.count, resolved: resolved.count, total: total.count };
        } else if (role === 'IT Support Agent') {
            const [[open]] = await db.query('SELECT COUNT(*) as count FROM Ticket WHERE AssignedToID = ? AND StatusID = 1', [id]);
            const [[inProgress]] = await db.query('SELECT COUNT(*) as count FROM Ticket WHERE AssignedToID = ? AND StatusID = 2', [id]);
            const [[resolved]] = await db.query('SELECT COUNT(*) as count FROM Ticket WHERE AssignedToID = ? AND StatusID = 4', [id]);
            const [[total]] = await db.query('SELECT COUNT(*) as count FROM Ticket WHERE AssignedToID = ?', [id]);
            stats = { open: open.count, inProgress: inProgress.count, resolved: resolved.count, total: total.count };
        } else {
            const [[open]] = await db.query('SELECT COUNT(*) as count FROM Ticket WHERE CreatedByID = ? AND StatusID = 1', [id]);
            const [[inProgress]] = await db.query('SELECT COUNT(*) as count FROM Ticket WHERE CreatedByID = ? AND StatusID = 2', [id]);
            const [[resolved]] = await db.query('SELECT COUNT(*) as count FROM Ticket WHERE CreatedByID = ? AND StatusID = 4', [id]);
            const [[total]] = await db.query('SELECT COUNT(*) as count FROM Ticket WHERE CreatedByID = ?', [id]);
            stats = { open: open.count, inProgress: inProgress.count, resolved: resolved.count, total: total.count };
        }

        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getAllUsers, createUser, getUserWorkload, getRoles, deactivateUser, deleteUser, getDashboardStats };