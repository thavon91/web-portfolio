# Hei Thavon portfolio

React portfolio with Game.

## Deployment

GitHub Actions builds and publishes the site. Supabase build settings come from repository secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.

Environment files, temporary folders, and local resume generation scripts are excluded from GitHub. Final resume PDFs are included.

The Supabase publishable key is included in the browser build. Never use private keys or passwords in Vite environment variables.
