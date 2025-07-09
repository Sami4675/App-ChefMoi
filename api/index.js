const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Read the HTML file
    const htmlPath = path.join(process.cwd(), 'public', 'index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Set content type
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(htmlContent);
  } catch (error) {
    console.error('Error serving HTML:', error);
    res.status(500).json({ error: 'Failed to serve page' });
  }
}; 