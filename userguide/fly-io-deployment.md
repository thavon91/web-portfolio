# Fly.io Deployment

## Free Tier Limits
- **3 machines** (shared-cpu-1x with 256MB RAM each)
- **160GB bandwidth** per month (resets monthly)
- **3GB persistent storage** total
- **Trial limitation**: Without credit card, machines auto-stop after 5 minutes
- **Solution**: Add credit card at https://fly.io/trial (won't be charged for free tier usage)

## Quick Setup

**1. Install Fly CLI**
```powershell
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

**2. Login to Fly.io**
```bash
fly auth login
```

**3. Navigate to Your Project**
```bash
cd e:\MyFiles\web-app-project-main
```

**4. Launch App (creates fly.toml)**
```bash
fly launch
```
- Choose app name
- Select region
- Don't deploy yet (we'll configure first)

**5. Create Dockerfile (if not exists)**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

**6. Deploy**
```bash
fly deploy
```

## Important: Fix Vite Base Path
If your app shows a blank page, you need to fix the base path in `vite.config.js`:

```javascript
export default defineConfig({
  plugins: [react()],
  base: '/', // Use '/' for Fly.io (not '/web-portfolio/' like GitHub Pages)
})
```

After changing, redeploy:
```bash
fly deploy
```

## Configure for Free Tier

**Option 1: Single Machine (Most reliable for free tier)**
In `fly.toml`, set:
```toml
[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = 'stop'
  auto_start_machines = true
  min_machines_running = 0
  processes = ['app']
  ha = false  # Disable high availability for single machine

[[vm]]
  memory = '256mb'  # Keep at 256MB to stay free
  cpu_kind = 'shared'
  cpus = 1
```

Then scale to 1 machine:
```bash
fly scale count 1
```

**Option 2: 2-3 Machines (Better uptime)**
Keep `ha = false` and manually add machines:
```bash
fly machine clone <machine-id>
```

View machines:
```bash
fly machine list
```

Remove extra machines:
```bash
fly machine destroy <machine-id> --force
```

**7. Open Your App**
```bash
fly open
```

## Useful Commands
- `fly status` - Check app status
- `fly logs -n` - View recent logs
- `fly apps list` - List all apps
- `fly machine list` - List all machines
- `fly machine clone <machine-id>` - Clone a machine
- `fly machine destroy <machine-id> --force` - Remove a machine
- `fly machine start <machine-id>` - Start a stopped machine
- `fly scale count <number>` - Set number of instances
- `fly secrets set KEY=VALUE` - Add secrets
- `fly ssh console` - SSH into a machine
- `fly ssh console -C "ls -la /app"` - Run command in machine

## Important Notes
- **Machines are immutable**: Cannot push/pull code like Git
- **Deployment workflow**: Make changes locally → `fly deploy` → New image built
- **Auto-stop/start**: Machines auto-stop when idle, auto-start on requests (takes 10-30s)
- **Cost monitoring**: Check usage at https://fly.io/dashboard
- **Pricing**: Only 256MB RAM is free. 512MB = ~$2/month, 1GB = ~$4/month per machine

Your app URL: `https://your-app-name.fly.dev`
