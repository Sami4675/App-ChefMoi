# 🍽️ ChefMoi - AI Recipe Generator

An AI-powered web application that analyzes food images, identifies ingredients, and generates traditional Moroccan recipes using OpenAI's GPT-4 Vision API and DALL-E 3.

## Features

- 📷 Upload food images via drag & drop or file picker
- 🤖 AI-powered ingredient analysis using GPT-4 Vision
- 🍳 Automatic generation of traditional Moroccan recipes
- 🎨 AI-generated meal images using DALL-E 3
- 🎨 Beautiful, modern UI with responsive design
- 📱 Mobile-friendly interface
- ⚡ Real-time analysis with loading indicators

## Prerequisites

- Node.js (v14 or higher)
- OpenAI API key

## Setup

1. **Clone or download the project**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `env.example` to `.env`
   - Add your OpenAI API key:
   ```bash
   cp env.example .env
   ```
   - Edit `.env` and replace `your_openai_api_key_here` with your actual OpenAI API key

4. **Get an OpenAI API key**
   - Go to [OpenAI Platform](https://platform.openai.com/api-keys)
   - Create a new API key
   - Copy the key and paste it in your `.env` file

## Running the Application

1. **Start the server**
   ```bash
   npm start
   ```
   or
   ```bash
   node server.js
   ```

2. **Open your browser**
   - Navigate to `http://localhost:3000`
   - Upload a food image
   - Click "Analyze Ingredients" to get AI-powered ingredient detection

## Usage

1. **Upload an image**: Click the upload area or drag & drop an image file
2. **Preview**: The image will be displayed for confirmation
3. **Analyze**: Click the "Analyze Ingredients" button
4. **Results**: View the AI-detected ingredients in a formatted list

## Supported File Types

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- Maximum file size: 5MB

## API Endpoints

- `GET /` - Serves the main application page
- `POST /api/analyze-image` - Analyzes uploaded image and returns Moroccan recipe
- `POST /api/generate-image` - Generates meal image using DALL-E 3

## Error Handling

The application includes comprehensive error handling for:
- Invalid file types
- File size limits
- Network errors
- API errors
- Missing API keys

## Technologies Used

- **Backend**: Node.js, Express.js
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **AI**: OpenAI GPT-4 Vision API, DALL-E 3
- **File Upload**: Multer
- **Styling**: Custom CSS with modern design

## Troubleshooting

### Common Issues

1. **"OpenAI API key not configured"**
   - Make sure you have created a `.env` file
   - Ensure your OpenAI API key is correctly set in the `.env` file

2. **"File too large"**
   - Ensure your image is under 5MB
   - Compress the image if necessary

3. **"Only image files are allowed"**
   - Make sure you're uploading an image file (JPG, PNG, GIF)

4. **Server won't start**
   - Check if port 3000 is already in use
   - Try changing the PORT in your `.env` file

### Getting Help

If you encounter any issues:
1. Check the browser console for error messages
2. Check the server console for backend errors
3. Ensure all dependencies are installed correctly
4. Verify your OpenAI API key is valid and has sufficient credits

## License

This project is open source and available under the ISC License. 