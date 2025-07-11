const { createApi } = require('unsplash-js');

// Unsplash API configuration
const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY || 'edt5IaI4RtzARRx1Fxa_-Vw30J_BhFoJK5OZOpg4jyA',
});

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

  try {
    const { recipeName, ingredients } = req.body;

    if (!recipeName || !ingredients) {
      return res.status(400).json({ error: 'Recipe name and ingredients are required' });
    }

    // Create search terms for Moroccan food
    const searchTerms = [
      'moroccan food',
      'moroccan cuisine',
      'tagine',
      'couscous',
      'moroccan dish',
      'arabic food',
      'middle eastern food'
    ];

    // Try different search terms to find a good image
    let imageUrl = null;
    let photographer = 'Unsplash';
    let unsplashUrl = '';

    for (const term of searchTerms) {
      try {
        const result = await unsplash.search.getPhotos({
          query: term,
          page: 1,
          perPage: 10,
          orientation: 'landscape'
        });

        if (result.response && result.response.results && result.response.results.length > 0) {
          // Get a random image from the results
          const randomIndex = Math.floor(Math.random() * Math.min(5, result.response.results.length));
          const photo = result.response.results[randomIndex];
          
          imageUrl = photo.urls.regular;
          photographer = photo.user.name;
          unsplashUrl = photo.links.html;
          break;
        }
      } catch (searchError) {
        console.log(`Search term "${term}" failed, trying next...`);
        continue;
      }
    }

    // Fallback to a curated list of Moroccan food images if Unsplash fails
    if (!imageUrl) {
      const fallbackImages = [
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
        }
      ];
      
      const randomFallback = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
      imageUrl = randomFallback.url;
      photographer = randomFallback.photographer;
      unsplashUrl = randomFallback.unsplash_url;
    }

    // Send the image URL
    res.json({
      success: true,
      imageUrl: imageUrl,
      recipeName: recipeName,
      photographer: photographer,
      unsplashUrl: unsplashUrl
    });

  } catch (error) {
    console.error('Error generating image:', error);
    
    let errorMessage = 'Error generating image';
    let errorDetails = error.message;
    
    if (error.message.includes('401')) {
      errorMessage = 'Invalid API key';
      errorDetails = 'Please check your Unsplash API key';
    }

    res.status(500).json({ 
      error: errorMessage,
      details: errorDetails 
    });
  }
}; 