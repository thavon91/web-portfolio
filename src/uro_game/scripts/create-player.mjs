import { createClient } from "@supabase/supabase-js";
import { usernameToEmail } from "../src/auth/username.js";

try {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  const username = process.env.URO_PLAYER_USERNAME ?? "";
  const password = process.env.URO_PLAYER_PASSWORD ?? "";
  if (!url || !key || key.includes("REPLACE_ME") || password.includes("REPLACE_") || password.length < 8) {
    throw new Error("Set SUPABASE_URL, SUPABASE_SECRET_KEY, URO_PLAYER_USERNAME and a password of at least 8 characters in .env.admin.");
  }
  const email = usernameToEmail(username);
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { username: username.trim() },
  });
  if (error) throw error;
  console.log(`Player ${username.trim()} created. They can now log in to URO.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
