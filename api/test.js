module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  res.json({
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
}; 