# Deploying to Netlify

Deploy your React + Vite app to Netlify for free.

## Quick Deploy Options

### Option 1: GitHub (Recommended)
1. Push code to GitHub
2. Go to [app.netlify.com](https://app.netlify.com/)
3. Click "Add new site" → "Import an existing project"
4. Select your repository
5. Deploy (settings auto-detected from `netlify.toml`)

### Option 2: CLI Deploy
```bash
npm install -g netlify-cli
netlify login
npm run build
netlify deploy --prod
```

### Option 3: Drag & Drop
```bash
npm run build
```
Then drag `dist` folder to [app.netlify.com/drop](https://app.netlify.com/drop)

## Configuration
Build settings (already in `netlify.toml`):
- **Build command:** `npm run build`
- **Publish directory:** `dist`

## Troubleshooting
- **Build fails:** Check build log, test `npm run build` locally
- **404 on routes:** Redirects configured in `netlify.toml`
- **Blank page:** Check browser console for errors
