const mongoose = require('mongoose');
const os = require('os');
const { version } = require('../../package.json');

/**
 * Get system health status
 */
const getHealthStatus = async (req, res) => {
    try {
        const dbStatus = mongoose.connection.readyState;
        const dbStatusText = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        }[dbStatus];

        const healthInfo = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            system: {
                platform: os.platform(),
                arch: os.arch(),
                nodeVersion: process.version,
                memoryUsage: {
                    total: os.totalmem(),
                    free: os.freemem(),
                    used: os.totalmem() - os.freemem()
                },
                loadAverage: os.loadavg()
            },
            application: {
                name: 'Fantasy F1 API',
                version: version,
                environment: process.env.NODE_ENV || 'development'
            },
            database: {
                status: dbStatusText,
                connectionState: dbStatus,
                lastPing: mongoose.connection.db?.admin()?.ping ? 
                    await mongoose.connection.db.admin().ping() : 
                    null
            },
            services: {
                auth: true,
                database: dbStatus === 1,
                rateLimiting: true
            }
        };

        // Check if any critical service is down
        const criticalServicesDown = Object.entries(healthInfo.services)
            .some(([_, status]) => status === false);

        if (criticalServicesDown) {
            healthInfo.status = 'degraded';
        }

        res.json(healthInfo);
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
};

module.exports = {
    getHealthStatus
}; 