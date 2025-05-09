require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { generalLimiter, authLimiter, sensitiveLimiter } = require('./middleware/rateLimiter');
const { initializeScraperSystem, runScraper } = require('./scrapers/motorsportScraper');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Apply general rate limiting to all routes
app.use(generalLimiter);

// Healthcheck route
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Mock user middleware for testing
if (process.env.NODE_ENV === 'test') {
  app.use((req, res, next) => {
    if (req.headers.user) {
      req.user = { 
        _id: req.headers.user,
        id: req.headers.user // For backward compatibility
      };
      next();
    } else if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      if (token) {
        req.user = { 
          _id: token,
          id: token // For backward compatibility
        };
      }
      next();
    } else {
      res.status(401).json({ message: 'Authentication required' });
    }
  });
}

// Routes
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/switcheroo', sensitiveLimiter, require('./routes/switcherooRoutes'));
app.use('/api/race', require('./routes/raceRoutes'));
app.use('/api/health', require('./routes/healthRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/statistics', require('./routes/leagueStatisticsRoutes'));
app.use('/api/league', require('./routes/leagueRoutes'));
app.use('/api/selections', require('./routes/selectionRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!'
  });
});

// Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (req.headers['x-forwarded-proto'] !== 'https') {
            return res.redirect(`https://${req.headers.host}${req.url}`);
        }
        next();
    });
}

module.exports = app;