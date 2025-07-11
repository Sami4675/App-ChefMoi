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
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Use multer to handle file upload
  upload.single('image')(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ 
        error: 'File upload error',
        details: err.message 
      });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file uploaded' });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: 'OpenAI API key not configured' });
      }

      // Convert buffer to base64
      const base64Image = req.file.buffer.toString('base64');

      // Call OpenAI API to analyze the image
      const response = await openai.createChatCompletion({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze the provided food image and generate a 100% authentic Moroccan recipe using ONLY visibly detected ingredients. If absolutely necessary, add THE BARE MINIMUM of staple ingredients to complete a traditional morrocan dish."
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
        max_tokens: 400
      });

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

      // Extract recipe name from the response for image search
      let recipeName = 'Moroccan Recipe';
      try {
        const lines = ingredients.split('\n');
        for (const line of lines) {
          if (line.includes('**') && (line.toLowerCase().includes('recipe') || line.toLowerCase().includes('dish') || line.toLowerCase().includes('tagine') || line.toLowerCase().includes('couscous'))) {
            recipeName = line.replace(/\*\*/g, '').trim();
            break;
          }
        }
      } catch (error) {
        console.log('Could not extract recipe name, using default');
      }
 

      // Send the analysis result
      res.json({
        success: true,
        ingredients: ingredients,
        filename: req.file.originalname,
     
      });

    } catch (error) {
      console.error('Error analyzing image:', error);
      
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
}; 
