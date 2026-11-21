import './style.css';
import { configured, supabase } from '../uro_game/src/auth/supabase.js';
import { usernameToEmail } from './username.js';
import { downloadPrivateLevel } from './privateLevel.js';
import gddUrl from './GDD/2000 GDD.pdf?url';

const screen = document.createElement('div');
screen.className = 'home-page open';
screen.innerHTML = `
  <main class="home-shell"><section class="home-hero"><div class="home-copy">
    <p class="home-kicker">2000</p><h1>Hex Tetromino Control Hub</h1>
    <p class="home-intro">Sign in with an approved game account to play.</p>
    <form class="game-login">
      <label for="game-username">Username</label>
      <input id="game-username" name="username" required minlength="3" maxlength="32" autocomplete="username" autocapitalize="none" spellcheck="false">
      <label for="game-password">Password</label>
      <input id="game-password" name="password" type="password" required autocomplete="current-password">
      <button class="home-start" type="submit" disabled>Checking session…</button>
    </form>
    <div class="home-actions">
      <button class="home-gdd change-account" type="button" hidden>Use another account</button>
      <a class="home-gdd" target="_blank" rel="noopener noreferrer">View GDD PDF</a>
      <a class="home-portfolio">Back to portfolio</a>
    </div>
    <p class="login-status" role="status" aria-live="polite"></p>
  </div></section></main>`;
screen.querySelector('a.home-gdd').href = gddUrl;
screen.querySelector('.home-portfolio').href = new URL('../../#home', window.location.href).href;
document.body.append(screen);
const form = screen.querySelector('form');
const submit = form.querySelector('button');
const status = screen.querySelector('.login-status');
const changeAccount = screen.querySelector('.change-account');
let signedIn = false;
let busy = false;

function showAccount(user) {
  signedIn = Boolean(user);
  for (const input of form.querySelectorAll('input')) {
    input.hidden = signedIn;
    input.required = !signedIn;
  }
  for (const label of form.querySelectorAll('label')) label.hidden = signedIn;
  changeAccount.hidden = !signedIn;
  submit.textContent = signedIn ? 'Load Game' : 'Sign in & Play';
  status.textContent = signedIn ? `Signed in as ${user.email?.split('@')[0] || 'Player'}.` : 'Use the credentials provided in the PDF portfolio.';
}

changeAccount.addEventListener('click', async () => {
  if (busy) return;
  busy = true;
  submit.disabled = changeAccount.disabled = true;
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) status.textContent = 'Could not sign out. Please retry.';
  else { form.reset(); showAccount(null); }
  busy = false;
  submit.disabled = changeAccount.disabled = false;
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (busy || !configured) return;
  busy = true;
  submit.disabled = changeAccount.disabled = true;
  submit.textContent = 'Loading…';
  try {
    if (!signedIn) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: usernameToEmail(form.elements.username.value), password: form.elements.password.value,
      });
      if (error || !data.user) throw new Error('Could not sign in. Check your username, password, and connection.');
      form.elements.password.value = '';
      showAccount(data.user);
    }
    submit.textContent = 'Loading…';
    status.textContent = 'Downloading your private game level…';
    await downloadPrivateLevel(supabase);
    status.textContent = 'Preparing the game…';
    const game = await import('./main.js');
    await game.levelReady;
    screen.remove();
  } catch (error) {
    status.textContent = error.message;
    submit.textContent = signedIn ? 'Retry loading game' : 'Sign in & Play';
    submit.disabled = changeAccount.disabled = false;
    busy = false;
  }
});

if (!configured) {
  status.textContent = 'Game login is unavailable. Please contact the portfolio owner.';
  submit.textContent = 'Login unavailable';
} else {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    showAccount(user?.email?.toLowerCase().endsWith('@hex.com') ? user : null);
    submit.disabled = false;
  } catch {
    showAccount(null);
    submit.disabled = false;
  }
}
