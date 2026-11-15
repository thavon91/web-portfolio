import gameDesignPdfUrl from './GDD/2000 GDD.pdf?url';

export function createHomePage({ onStart = () => { } } = {}) {
  const portfolioUrl = new URL('../../', window.location.href).href;
  const home = document.createElement('div');
  home.className = 'home-page open';
  home.setAttribute('aria-hidden', 'false');

  home.innerHTML = `
    <main class="home-shell">
      <section class="home-hero">
        <div class="home-copy">
          <p class="home-kicker">2000</p>
          <h1>Hex Tetromino Control Hub</h1>
          <p class="home-intro">
            Drop pieces, clear lines, protect your health, and survive faster levels inside a tactile 3D arcade panel.
          </p>
          <div class="home-actions">
            <button class="home-start" type="button">Play Game</button>
            <a class="home-gdd" href="${gameDesignPdfUrl}" target="_blank" rel="noopener noreferrer">View GDD PDF</a>
            <a class="home-portfolio" href="${portfolioUrl}">Hei Portfolio</a>
            <span class="home-hint">Keyboard(Space, Left, Right, Down, and Up), mouse, and touch ready</span>
          </div>
        </div>
      </section>
    </main>
  `;

  const startButton = home.querySelector('.home-start');
  let openState = true;

  function close() {
    if (!openState) return;
    openState = false;
    home.classList.remove('open');
    home.setAttribute('aria-hidden', 'true');
    onStart();
  }

  function open() {
    openState = true;
    home.classList.add('open');
    home.setAttribute('aria-hidden', 'false');
  }

  startButton.addEventListener('click', close);
  window.addEventListener('keydown', (event) => {
    if (!openState) return;
    if (event.code === 'Enter' || event.code === 'Space') close();
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);

  document.body.appendChild(home);

  return {
    isOpen: () => openState,
    close,
    open,
  };
}
