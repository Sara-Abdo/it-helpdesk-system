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
        let ticketFilter = '';
        let filterParams = [];

        if (role === 'IT Support Agent') {
            ticketFilter = 'AND t.AssignedToID = ?';
            filterParams = [id];
        } else if (role === 'Employee') {
            ticketFilter = 'AND t.CreatedByID = ?';
            filterParams = [id];
        }

        const [[open]] = await db.query(`SELECT COUNT(*) as count FROM Ticket t WHERE t.StatusID = 1 ${ticketFilter}`, filterParams);
        const [[inProgress]] = await db.query(`SELECT COUNT(*) as count FROM Ticket t WHERE t.StatusID = 2 ${ticketFilter}`, filterParams);
        const [[resolved]] = await db.query(`SELECT COUNT(*) as count FROM Ticket t WHERE t.StatusID = 4 ${ticketFilter}`, filterParams);
        const [[total]] = await db.query(`SELECT COUNT(*) as count FROM Ticket t WHERE 1=1 ${ticketFilter}`, filterParams);

        const [byStatus] = await db.query(`
            SELECT s.Name as name, COUNT(t.ID) as count
            FROM \`Status\` s
            LEFT JOIN Ticket t ON t.StatusID = s.ID ${ticketFilter}
            GROUP BY s.ID, s.Name
            ORDER BY s.ID
        `, filterParams);

        const [byPriority] = await db.query(`
            SELECT p.Name as name, COUNT(t.ID) as count
            FROM Priority p
            LEFT JOIN Ticket t ON t.PriorityID = p.ID ${ticketFilter}
            GROUP BY p.ID, p.Name
            ORDER BY p.ID
        `, filterParams);

        const [recentTickets] = await db.query(`
            SELECT t.ID, t.ReferenceNumber, t.Title, t.CreatedAt, s.Name as StatusName, p.Name as PriorityName
            FROM Ticket t
            JOIN \`Status\` s ON t.StatusID = s.ID
            JOIN Priority p ON t.PriorityID = p.ID
            WHERE 1=1 ${ticketFilter}
            ORDER BY t.CreatedAt DESC
            LIMIT 5
        `, filterParams);

        res.json({
            open: open.count,
            inProgress: inProgress.count,
            resolved: resolved.count,
            total: total.count,
            byStatus,
            byPriority,
            recentTickets
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getAllUsers, createUser, getUserWorkload, getRoles, deactivateUser, deleteUser, getDashboardStats };