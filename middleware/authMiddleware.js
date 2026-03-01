const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(403).json({ message: 'No token provided' });

    jwt.verify(token, process.env.JWT_SECRET || 'secretkey', (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Unauthorized: Invalid token' });
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (req.userRole !== 'admin') {
        return res.status(403).json({ message: 'Require Admin Role!' });
    }
    next();
};

module.exports = { verifyToken, isAdmin };
