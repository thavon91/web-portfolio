import { configured, supabase } from "./auth/supabase.js";
import gddUrl from "../../assets/pdf/URO GDD.pdf?url";
import { usernameToEmail } from "./auth/username.js";
import { installButtonSounds, startIntroMusic } from "./assets/sfx/sfx.js";
import { createSoundButton } from "./assets/HUD/sound_button.js";
import { preparePrivateAssets } from './privateAssets.js';

const loginSoundButton = createSoundButton();
document.querySelector('#view-gdd').href = gddUrl;
installButtonSounds();
loginSoundButton.id = "login-sound-button";

const overlay = document.createElement("div");
overlay.id = "auth-screen";
overlay.innerHTML = `<form id="login-form" aria-label="Login">
    <label for="login-username">Username</label>
    <input id="login-username" name="username" autocomplete="username" required minlength="3" maxlength="32" autocapitalize="none" spellcheck="false">
    <label for="login-password">Password</label>
    <div class="password-field">
      <input id="login-password" name="password" type="password" autocomplete="current-password" required>
      <button id="toggle-password" type="button" aria-label="Show password" aria-pressed="false" aria-controls="login-password">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/><path class="eye-slash" d="m3 3 18 18"/></svg>
      </button>
    </div>
    <label class="remember-login"><input type="checkbox" name="remember" id="remember-login"> Remember me</label>
  </form>
  <p id="auth-status" role="status">Checking session…</p>
`;
const startButton = document.querySelector("#start-game");
startButton.before(overlay);
startButton.type = "submit";
const startRow = document.createElement("div");
startRow.id = "login-start-row";
const exitLink = document.createElement("a");
exitLink.id = "login-exit-button";
exitLink.href = new URL("../#home", window.location.href).href;
exitLink.title = "Back to portfolio";
exitLink.setAttribute("aria-label", "Exit game and return to portfolio");
exitLink.innerHTML = `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v16h-6M14 12H3m5-5-5 5 5 5"/></svg>`;
startRow.append(exitLink, startButton, loginSoundButton);
overlay.querySelector("form").append(startRow);
startButton.textContent = "Start Game";
document.querySelector("#home-status").textContent = "Sign in to Start the Realm.";
const form = overlay.querySelector("form");
const submit = startButton;
const status = overlay.querySelector("#auth-status");
const password = form.elements.password;
const togglePassword = form.querySelector("#toggle-password");
togglePassword.addEventListener("click", () => {
  const visible = password.type === "password";
  password.type = visible ? "text" : "password";
  togglePassword.setAttribute("aria-label", visible ? "Hide password" : "Show password");
  togglePassword.setAttribute("aria-pressed", String(visible));
});
const remember = form.elements.remember;
const rememberKey = "uro-remembered-username";
try {
  const saved = localStorage.getItem(rememberKey);
  if (saved) { form.elements.username.value = saved; remember.checked = true; }
} catch { /* Browser storage may be disabled. */ }
remember.addEventListener("change", () => {
  if (!remember.checked) {
    try { localStorage.removeItem(rememberKey); } catch { /* Optional preference. */ }
  }
});

function rememberSuccessfulLogin() {
  const username = form.elements.username.value.trim();
  try {
    if (remember.checked) localStorage.setItem(rememberKey, username);
    else localStorage.removeItem(rememberKey);
  } catch { /* Login still works without saved preferences. */ }
  if (remember.checked && window.PasswordCredential && navigator.credentials?.store) {
    const credential = new PasswordCredential({ id: username, password: password.value, name: username });
    // Let the browser password manager store it; never put passwords in localStorage.
    navigator.credentials.store(credential).catch(() => {});
  }
}

function restoreSavedPassword() {
  if (!remember.checked || !window.PasswordCredential || !navigator.credentials?.get) return;
  navigator.credentials.get({ password: true, mediation: "optional" }).then((credential) => {
    if (credential?.type === "password" && !loaded && remember.checked &&
        !password.value && form.elements.username.value.toLowerCase() === credential.id.toLowerCase()) {
      password.value = credential.password;
    }
  }).catch(() => {});
}
let loaded = false;
let leaving = false;
// Start loading the intro track while the saved session is being checked.
// A browser that blocks autoplay will resume it on the first click or key press.
startIntroMusic();

function showLogin() {
  // A valid session keeps Replay on the result card; only a missing/invalid
  // session should return the player to the login form.
  document.documentElement.classList.remove("replaying");
  const url = new URL(window.location.href);
  url.searchParams.delete("replay");
  url.searchParams.delete("result");
  window.history.replaceState(window.history.state, "", url);
}

async function enter(user) {
  if (loaded || leaving) return;
  if (!user.email?.toLowerCase().endsWith('@uro.com')) {
    showLogin();
    status.textContent = 'Please sign in to Start Game.';
    startButton.disabled = false;
    startButton.type = 'submit';
    startButton.textContent = 'Start Game';
    return;
  }
  loaded = true;
  document.querySelector("#home-screen").dataset.startRequested = "true";
  status.textContent = '';
  startButton.textContent = "Loading Realm…";
  startButton.type = "button";
  startButton.disabled = true;
  form.elements.username.readOnly = true;
  password.readOnly = true;
  remember.disabled = true;
  try {
    await preparePrivateAssets(supabase, (done, total) => {
      startButton.textContent = `Loading Realm… ${done}/${total}`;
    });
    await import("./main.js");
    loginSoundButton.dispose();
    document.body.classList.remove("auth-pending");
    const account = document.createElement("div");
    account.id = "account-controls";
    const name = document.createElement("span");
    name.textContent = user.email?.split("@")[0] ?? "Player";
    const logout = document.createElement("button");
    logout.type = "button";
    logout.textContent = "Logout";
    logout.addEventListener("click", async () => {
      logout.disabled = true;
      logout.textContent = "Logging out…";
      // Signing out reloads the page, so give the button sound time to play.
      await new Promise((resolve) => setTimeout(resolve, 500));
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) {
        logout.disabled = false;
        logout.textContent = "Retry logout";
        logout.title = "Could not log out. Check your connection and retry.";
      }
    });
    account.append(name, logout);
    document.body.append(account);
  } catch (error) {
    loaded = false;
    delete document.querySelector('#home-screen').dataset.startRequested;
    status.textContent = error.message || 'Could not load the game. Refresh to retry.';
    startButton.type = 'submit';
    startButton.disabled = false;
    startButton.textContent = 'Try Again';
    form.elements.username.readOnly = false;
    password.readOnly = false;
    remember.disabled = false;
  }
}

async function leave() {
  if (leaving) return;
  leaving = true;
  document.body.classList.add("auth-pending");
  document.body.classList.add("auth-leaving");
  const { setGameAudioPaused } = await import("./assets/sfx/sfx.js");
  setGameAudioPaused(true);
  const url = new URL(window.location.href);
  url.searchParams.delete("replay");
  url.searchParams.delete("result");
  window.location.replace(url.href);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!configured || submit.disabled) return;
  submit.disabled = true;
  submit.textContent = "Loading Realm…";
  document.querySelector("#home-screen").dataset.startRequested = "true";
  status.textContent = '';
  try {
    const email = usernameToEmail(form.elements.username.value);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: password.value });
    if (error || !data.user) throw new Error(error?.status === 400 ? "Incorrect username or password." : "Could not sign in. Check your connection and try again.");
    rememberSuccessfulLogin();
    await enter(data.user);
  } catch (error) {
    delete document.querySelector("#home-screen").dataset.startRequested;
    status.textContent = error.message;
    submit.disabled = false;
    submit.textContent = "Start Game";
  }
});

if (!configured) {
  showLogin();
  status.textContent = "Supabase setup required: add the Project URL and publishable key to .env.local, then restart npm run dev.";
} else {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT" && loaded) void leave();
    if (event === "SIGNED_IN" && session && !loaded) void enter(session.user);
  });
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (session) {
      const { data: { user }, error: verificationError } = await supabase.auth.getUser();
      if (verificationError || !user) throw new Error("Your session could not be verified. Please log in again.");
      await enter(user);
    } else {
      showLogin();
      status.textContent = "Sign in to Start the Realm.";
      submit.disabled = false;
      restoreSavedPassword();
    }
  } catch {
    showLogin();
    status.textContent = "Please log in to continue.";
    submit.disabled = false;
    restoreSavedPassword();
  }
}
