# Style & Glow API

Serverless backend for the Style & Glow AI application.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file (for local testing):

```bash
cp .env.example .env
```

3. Add your Gemini API key to `.env`:

```
GEMINI_API_KEY=your_actual_api_key_here
```

## Deployment to Vercel

### First-time Setup

1. Install Vercel CLI (if not already installed):

```bash
npm i -g vercel
```

2. Login to Vercel:

```bash
vercel login
```

3. Deploy:

```bash
vercel
```

### Environment Variables

Set the following environment variable in your Vercel project settings:

**Via Vercel Dashboard:**

1. Go to your project settings on vercel.com
2. Navigate to "Environment Variables"
3. Add: `GEMINI_API_KEY` = `your_gemini_api_key_here`

**Via CLI:**

```bash
vercel env add GEMINI_API_KEY
```

### Production Deployment

```bash
vercel --prod
```

## API Endpoints

### POST /api/analyze

Analyzes an image and returns comprehensive style advice.

**Request Body:**

```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Response:**

```json
{
  "summary": "Overall analysis summary",
  "details": {
    "subjectClarity": "...",
    "lightingQuality": "...",
    ...
  },
  "suggestions": {
    "general": ["suggestion1", "suggestion2", "suggestion3"],
    "clothing": [...],
    ...
  },
  "recaptureSuggestions": [...]
}
```

## Troubleshooting

### TypeScript Errors on Deployment

If you see errors like "Cannot find module '@vercel/node'":

1. Ensure `package.json` exists with all dependencies
2. Run `npm install` locally to verify
3. Commit and push `package.json` and `package-lock.json`
4. Redeploy to Vercel

### CORS Issues

The API includes CORS headers to allow cross-origin requests. If you still face CORS issues:

1. Check that the frontend is making requests to the correct URL
2. Verify the Vercel deployment is successful
3. Check browser console for specific CORS errors
