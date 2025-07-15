const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware - more permissive for development
app.use(helmet({
  contentSecurityPolicy: false // Disable CSP for now to avoid issues
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);
app.use(cors());
app.use(compression());
app.use(express.json());

// Serve static files
app.use('/dist', express.static('dist'));
app.use(express.static('.'));

// API endpoints for saving reports
app.post('/api/reports', async (req, res) => {
  try {
    // TODO: Save report to database
    const report = req.body;
    console.log('Saving report for:', report.website);
    
    // For now, just return success
    res.json({ 
      success: true, 
      message: 'Report saved successfully',
      reportId: Date.now().toString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save report' });
  }
});

// Get all reports for a client
app.get('/api/reports/:clientDomain', async (req, res) => {
  try {
    // TODO: Fetch from database
    const { clientDomain } = req.params;
    
    // Mock data for now
    res.json({
      reports: [],
      message: 'No reports found for ' + clientDomain
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Serve the main app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`SEO Keyword Research Tool running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});