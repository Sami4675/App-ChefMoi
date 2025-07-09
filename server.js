const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Initialize OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Upload image and analyze ingredients
app.post('/analyze-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Read the uploaded image file
    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = imageBuffer.toString('base64');

    // Call OpenAI API to analyze the image
    const response = await openai.createChatCompletion({
      model: "gpt-4o",  // Using gpt-4o which is more widely available
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image and identify all the food ingredients you can see. List them in a clear, organized format. If you see any packaged foods, try to identify the main ingredients from the packaging."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${req.file.mimetype};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 500
    });

    // Clean up the uploaded file
    fs.unlinkSync(req.file.path);

    // Check if response has the expected structure and extract content safely
    let ingredients = '';
    try {
      if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
        ingredients = response.data.choices[0].message.content;
      } else {
        throw new Error('Unexpected API response structure');
      }
    } catch (parseError) {
      console.error('Error parsing API response:', parseError);
      throw new Error('Failed to parse API response');
    }

    // Send the analysis result
    res.json({
      success: true,
      ingredients: ingredients,
      filename: req.file.originalname
    });

  } catch (error) {
    console.error('Error analyzing image:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // Provide more specific error messages
    let errorMessage = 'Error analyzing image';
    let errorDetails = error.message;
    
    if (error.response) {
      // OpenAI API error
      errorDetails = `API Error: ${error.response.status} - ${error.response.data?.error?.message || error.message}`;
    } else if (error.message.includes('404')) {
      errorMessage = 'Model not found or API key invalid';
      errorDetails = 'Please check your OpenAI API key and ensure you have access to GPT-4 models';
    } else if (error.message.includes('401')) {
      errorMessage = 'Invalid API key';
      errorDetails = 'Please check your OpenAI API key in the .env file';
    }

    res.status(500).json({ 
      error: errorMessage,
      details: errorDetails 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
  }
  res.status(500).json({ error: error.message });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Upload an image to analyze ingredients!');
}); 