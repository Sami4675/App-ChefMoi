const multer = require('multer');
const { Configuration, OpenAIApi } = require('openai');

// Configure multer for memory storage (no file system writes)
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 4 * 1024 * 1024 // 4MB limit for Vercel
  }
});

// Initialize OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

 

// Vercel serverless function
 