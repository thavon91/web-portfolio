import './style.css';
import { configured, supabase } from '../uro_game/src/auth/supabase.js';
import { usernameToEmail } from './username.js';
import { downloadPrivateLevel } from './privateLevel.js';

const screen = document.createElement('div');
screen.className = 'home-page open';
screen.innerHTML = `
  <main class="home-shell"><section class="home-hero"><div class="home-copy">
    <h1>2000</h1><p class="home-kicker">Hex Tetromino</p>
    <p class="home-intro login-status" role="status" aria-live="polite"></p>
    <form class="game-login">
      <label for="game-username">Username</label>
      <input id="game-username" name="username" required minlength="3" maxlength="32" autocomplete="username" autocapitalize="none" spellcheck="false">
      <label for="game-password">Password</label>
      <div class="game-password-field">
        <input id="game-password" name="password" type="password" required autocomplete="current-password">
        <button class="game-password-toggle" type="button" aria-label="Show password" aria-pressed="false" aria-controls="game-password" title="Show password">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/><path class="password-eye-slash" d="m3 3 18 18"/></svg>
        </button>
      </div>
      <button class="home-start" type="submit" disabled>Checking session…</button>
    </form>
    <p class="login-status">Sign in with an approved game account to play.</p>
    <div class="home-actions">
      <a class="home-portfolio">Back to portfolio</a>
      <span class="home-hint">Keyboard (Space and arrow keys), mouse, and touch ready</span>
    </div>
  </div></section></main>`;
screen.querySelector('.home-portfolio').href = new URL('../../#home', window.location.href).href;
document.body.append(screen);
const form = screen.querySelector('form');
const submit = form.querySelector('.home-start');
const passwordToggle = form.querySelector('.game-password-toggle');
passwordToggle.addEventListener('click', () => {
  const password = form.elements.password;
  const visible = password.type === 'password';
  password.type = visible ? 'text' : 'password';
  passwordToggle.setAttribute('aria-pressed', String(visible));
  passwordToggle.setAttribute('aria-label', visible ? 'Hide password' : 'Show password');
  passwordToggle.title = visible ? 'Hide password' : 'Show password';
});
const status = screen.querySelector('.login-status');
let signedIn = false;
let busy = false;
let loadedGame = null;

window.addEventListener('hex-exit-to-home', () => {
  screen.hidden = false;
  screen.classList.add('open');
  busy = false;
  submit.disabled = false;
  submit.textContent = 'Play Game';
  status.textContent = 'Ready to play.';
  submit.focus();
});

function showAccount(user) {
  signedIn = Boolean(user);
  for (const input of form.querySelectorAll('input')) {
    input.required = !signedIn;
    input.readOnly = signedIn;
  }
  if (signedIn) form.elements.username.value = user.email?.split('@')[0] || '';
  submit.textContent = 'Sign in & Play';
  status.textContent = 'Use the credentials provided in the PDF portfolio.';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (busy || !configured) return;
  busy = true;
  submit.disabled = true;
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
    if (!loadedGame) {
      submit.textContent = 'Loading…';
      status.textContent = 'Downloading your private game level…';
      await downloadPrivateLevel(supabase);
      status.textContent = 'Preparing the game…';
      const game = await import('./main.js');
      await game.levelReady;
      loadedGame = game;
    }
    screen.classList.remove('open');
    screen.hidden = true;
    loadedGame.startGame();
  } catch (error) {
    status.textContent = error.message;
    submit.textContent = signedIn ? 'Retry loading game' : 'Sign in & Play';
    submit.disabled = false;
    busy = false;
  }
});

if (!configured) {
  status.textContent = 'Game login is unavailable. Please contact the portfolio owner.';
  submit.textContent = 'Login unavailable';
} else {
  // Each page load requires an explicit password login, even with a saved session.
  showAccount(null);
  submit.disabled = false;
}
