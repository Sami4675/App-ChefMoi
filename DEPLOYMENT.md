# 🚀 Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Account**: Your code should be in a GitHub repository
3. **OpenAI API Key**: Get one from [OpenAI Platform](https://platform.openai.com/api-keys)

## Step 1: Prepare Your Repository

Make sure your project structure looks like this:
```
ingredient-detector/
├── public/
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── server.js
├── package.json
├── vercel.json
└── .env
```

## Step 2: Set Up Environment Variables

1. **Create `.env` file** (if not already created):
```bash
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
```

2. **Add environment variables in Vercel**:
   - Go to your Vercel dashboard
   - Select your project
   - Go to Settings → Environment Variables
   - Add: `OPENAI_API_KEY` with your actual API key

## Step 3: Deploy to Vercel

### Option A: Using Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts:
# - Link to existing project? No
# - Project name: ingredient-detector
# - Directory: ./
# - Override settings? No
```

### Option B: Using GitHub Integration
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Configure environment variables
6. Deploy

## Step 4: Verify Deployment

After deployment, your app will be available at:
- **Production**: `https://your-project-name.vercel.app`
- **Preview**: `https://your-project-name-git-branch.vercel.app`

## Troubleshooting

### Common Issues:

1. **"Page not found" error**:
   - Check that `vercel.json` is in the root directory
   - Ensure all files are committed to Git

2. **API errors**:
   - Verify `OPENAI_API_KEY` is set in Vercel environment variables
   - Check that the API key is valid and has credits

3. **File upload issues**:
   - Vercel has a 4.5MB limit for serverless functions
   - Consider using external storage (AWS S3, Cloudinary) for larger files

4. **Build errors**:
   - Check that all dependencies are in `package.json`
   - Ensure Node.js version compatibility

### Environment Variables in Vercel:

1. Go to your project dashboard
2. Settings → Environment Variables
3. Add:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key
   - **Environment**: Production, Preview, Development

### File Size Limits:

- **Vercel Function**: 50MB (including dependencies)
- **Request Body**: 4.5MB
- **Response**: 6MB

## Alternative Deployment Options

If Vercel doesn't work for your needs, consider:

1. **Railway**: `railway.app`
2. **Render**: `render.com`
3. **Heroku**: `heroku.com`
4. **DigitalOcean App Platform**: `digitalocean.com`

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test locally first with `npm start`
4. Check OpenAI API key validity 