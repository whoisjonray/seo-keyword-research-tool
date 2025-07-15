# Railway Deployment Guide

## Quick Deploy to Railway

This SEO Keyword Research Tool is designed to be deployed on Railway as a standalone service that can be used for all your clients.

### Prerequisites
- Railway account (https://railway.app)
- GitHub account
- API keys from:
  - Firecrawl (https://firecrawl.dev/)
  - Perplexity (https://www.perplexity.ai/)
  - DataForSEO (https://dataforseo.com/)

### Deployment Steps

1. **Push to GitHub** (if not already done):
   ```bash
   git init
   git add -A
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/seo-keyword-research-tool.git
   git push -u origin main
   ```

2. **Deploy to Railway**:
   - Go to https://railway.app/new
   - Click "Deploy from GitHub repo"
   - Select your repository
   - Railway will automatically detect the Node.js app

3. **Configure Environment Variables** (optional):
   In Railway dashboard, add these variables if you want server-side API key storage:
   ```
   NODE_ENV=production
   PORT=3000
   MONGODB_URI=your_mongodb_connection_string (optional for report storage)
   ```

4. **Get Your App URL**:
   - Railway will provide a URL like: `https://your-app-name.up.railway.app`
   - This is your production URL that all clients can use

### Usage for Multiple Clients

Since this is a client-side application, each client can:
1. Visit your Railway URL
2. Enter their own API keys (stored only in their browser)
3. Run keyword analysis for their websites
4. Results are not stored server-side (unless you implement database storage)

### Custom Domain (Optional)

To use a custom domain like `keywords.doorgrow.com`:
1. In Railway dashboard, go to Settings → Domains
2. Add your custom domain
3. Update your DNS records as instructed by Railway

### Monitoring

Railway provides:
- Automatic HTTPS
- Built-in logs
- Usage metrics
- Automatic deployments on git push

### Cost Estimate

Railway pricing:
- $5/month for hobby plan (includes $5 of usage)
- This app uses minimal resources, should stay within free tier

### Updates

To update the app:
```bash
git add -A
git commit -m "Update message"
git push origin main
```

Railway will automatically redeploy!

## Features for All Clients

- ✅ No client data mixing (each session is independent)
- ✅ Clients use their own API keys
- ✅ Mobile responsive
- ✅ Fast and secure
- ✅ No setup required for clients

## Support

For issues or feature requests, create an issue in the GitHub repository.