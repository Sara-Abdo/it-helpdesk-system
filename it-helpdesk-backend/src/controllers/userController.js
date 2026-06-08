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

module.exports = { getAllUsers, createUser, getUserWorkload, getRoles };