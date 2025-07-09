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

// Function to get a random Moroccan food image
function getRandomMoroccanImage() {
  const moroccanImages = [
    {
      url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=400&fit=crop',
      alt: 'Tajine Marocain',
      photographer: 'Unsplash',
      unsplash_url: 'https://unsplash.com/photos/tajine-marocain'
    },
    {
      url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=400&fit=crop',
      alt: 'Couscous Traditionnel',
      photographer: 'Unsplash',
      unsplash_url: 'https://unsplash.com/photos/couscous-marocain'
    },
    {
      url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&h=400&fit=crop',
      alt: 'Pastilla Marocaine',
      photographer: 'Unsplash',
      unsplash_url: 'https://unsplash.com/photos/pastilla-marocaine'
    },
    {
      url: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=400&fit=crop',
      alt: 'Harira Soupe',
      photographer: 'Unsplash',
      unsplash_url: 'https://unsplash.com/photos/harira-soupe'
    },
    {
      url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=400&fit=crop',
      alt: 'Tajine de Poulet',
      photographer: 'Unsplash',
      unsplash_url: 'https://unsplash.com/photos/tajine-poulet'
    },
    {
      url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=400&fit=crop',
      alt: 'Couscous aux Légumes',
      photographer: 'Unsplash',
      unsplash_url: 'https://unsplash.com/photos/couscous-legumes'
    },
    {
      url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&h=400&fit=crop',
      alt: 'Pastilla aux Fruits de Mer',
      photographer: 'Unsplash',
      unsplash_url: 'https://unsplash.com/photos/pastilla-fruits-mer'
    },
    {
      url: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=400&fit=crop',
      alt: 'Harira Traditionnelle',
      photographer: 'Unsplash',
      unsplash_url: 'https://unsplash.com/photos/harira-traditionnelle'
    }
  ];
  
  // Return a random image from the collection
  const randomIndex = Math.floor(Math.random() * moroccanImages.length);
  return moroccanImages[randomIndex];
}

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
                text: "Analysez cette image et identifiez tous les ingrédients alimentaires que vous pouvez voir. Ensuite, créez une recette marocaine traditionnelle utilisant ces ingrédients. Incluez :\n\n1. **Liste des Ingrédients** : Tous les ingrédients que vous pouvez identifier dans l'image\n2. **Recette Marocaine** : Un délicieux plat marocain traditionnel utilisant ces ingrédients\n3. **Instructions de Cuisine** : Instructions étape par étape à la manière marocaine\n4. **Conseils de Cuisine** : Techniques et conseils de cuisine marocaine traditionnelle\n\nRendez-le authentique et savoureux avec des épices marocaines et des méthodes de cuisine traditionnelles !"
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
        max_tokens: 800
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

      // Get a random Moroccan food image
      const recipeImage = getRandomMoroccanImage();

      // Send the analysis result
      res.json({
        success: true,
        ingredients: ingredients,
        filename: req.file.originalname,
        recipeImage: recipeImage
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