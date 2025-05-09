const validateServerKey = (req, res, next) => {
    const serverKey = req.headers['x-server-key'];
    
    if (!serverKey) {
        return res.status(401).json({ 
            status: 'error',
            message: 'Missing server key header'
        });
    }

    if (serverKey !== process.env.SERVER_KEY) {
        return res.status(403).json({ 
            status: 'error',
            message: 'Invalid server key'
        });
    }

    next();
};

module.exports = validateServerKey; 