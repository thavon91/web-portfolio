# URO login setup
or test1@uro.com
or test2@uro.com

URO shows Username and Password only. Public registration is not implemented.
Supabase Auth stores each account under an internal alias: `User1` becomes
`user1@uro.com`. Usernames are case-insensitive and accept 3–32
letters, numbers, or underscores. No real mailbox is required.

## Connect the game

1. Open Supabase project overview and copy the Project URL.
2. Open Settings → API Keys and copy the publishable key.
3. Edit `.env.local` in the project root:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

4. Restart `npm run dev`. Vite reads environment variables when it starts.
5. In Authentication settings disable new user sign-ups and anonymous sign-ins;
   keep email/password sign-in enabled.

No custom public database table is needed for this login-only flow.
Publishable keys can be included in the browser. Never use a secret or
service-role key in a VITE_ variable.

## Create a player manually

In Authentication → Users → Add user → Create new user, enter
`user1@uro.com`, choose a password and enable Auto Confirm User.
The player logs in as `User1`. Password recovery is handled by you because the
internal aliases do not receive email.

## Create a player from a local environment file

Create a local `.env.admin` file with the following values. Use your Supabase
project URL, server secret key, desired username, and a new password:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SECRET_KEY=YOUR_SERVER_SECRET_KEY
URO_PLAYER_USERNAME=User1
URO_PLAYER_PASSWORD=YOUR_NEW_PASSWORD
```

Then run:

```powershell
node --env-file=.env.admin scripts/create-player.mjs
```

The script runs locally and calls Supabase's admin API. It is never imported by
the browser. `.env.admin` and `.env.local` are excluded from Git. Remove the
player password from `.env.admin` after provisioning.

## Sessions and access

Supabase persists and refreshes sessions. Reloading and Replay keep the login.
Logout clears the local session and reloads into Login. A sign-out in another tab
also exits a running game. The game modules load only after successful login.
This browser gate does not make downloaded game assets private. Any future
saved scores or player data must have server-side authorization and RLS.
