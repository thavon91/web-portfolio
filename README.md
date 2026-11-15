# Hei Thavon portfolio

React portfolio with Game.

## Run

- `npm ci` installs the portfolio and URO dependencies.
- `npm run dev` starts the portfolio locally.
- `npm run build` builds URO and the portfolio into `dist/`.
- `npm run lint` checks project code.
- `npm run preview` previews the production build.

## Project structure

- `src/pages/` and `src/components/`: portfolio UI.
- `src/2000_game/`: Hex Tetromino source and assets.
- `src/uro_game/`: standalone URO source, assets, and its own dependency versions.
- `public/uro_game/`: generated URO output; rebuilt automatically. Do not edit it directly.
- `dist/`: generated website for deployment. Do not edit it directly.
- `scripts/`: optional resume generators. Final PDFs live in `src/assets/pdf/`.

URO opens at `/uro_game/`. It contains four skeleton enemies sharing one model and animation set.
The URO `.env.local` contains its existing public Supabase client configuration; it is ignored by Git.
See `src/uro_game/SUPABASE_SETUP.md` for authentication setup.

## GitHub Pages

The single workflow `.github/workflows/deploy.yml` builds and deploys `dist/`.
It sets `VITE_BASE_PATH=/web-portfolio/` for the repository URL.
Generated folders, dependencies, temporary files, and local environment files are ignored by Git.

## Optional resume editing

Install Python requirements with `python -m pip install -r scripts/requirements.txt`.
Run `python scripts/style-resume.py` or `python scripts/style-it-resume.py` to regenerate a resume.
The original portrait source is kept in `scripts/resources/`. Previews are generated in disposable `tmp/pdfs/`.
