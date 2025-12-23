# GitHub Pages Deployment

## Quick Setup

**1. Install gh-pages**
```bash
npm install --save-dev gh-pages
```

**2. Update vite.config.js**
```javascript
export default defineConfig({
  plugins: [react()],
  base: '/your-repo-name/',
})
```

**3. Update package.json**
```json
{
  "homepage": "https://your-username.github.io/your-repo-name/",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

**4. Deploy**
```bash
npm run deploy
```

**5. Enable GitHub Pages**
- Go to repo Settings → Pages
- Select `gh-pages` branch → Save

Your site: `https://your-username.github.io/your-repo-name/`

## Troubleshooting
- **Blank page?** Check `base` matches repo name
- **Update site:** Run `npm run deploy`
