import { playSettingsButtonSound } from './soundEffects/index.js';

export function createSettingsOverlay({
  onOpenChange = () => {},
  onOptionsChange = () => {},
  onExitToHome = () => {},
} = {}) {
  const overlay = document.createElement('div');
  overlay.className = 'settings-overlay';
  overlay.setAttribute('aria-hidden', 'true');

  overlay.innerHTML = `
    <section class="settings-panel" role="dialog" aria-modal="true" aria-label="Settings">
      <header class="settings-header">
      <button class="settings-close" type="button" aria-label="Close settings"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
      <div class="settings-kicker">Settings</div>
      <div class="settings-tabbar" role="tablist" aria-label="Settings pages">
        <button class="settings-tab active" type="button" role="tab" aria-selected="true" data-settings-tab="controls">Controls</button>
        <button class="settings-tab" type="button" role="tab" aria-selected="false" data-settings-tab="options">Options</button>
        <button class="settings-home-button" type="button">Exit to Home</button>
      </div>
      </header>
      <div class="settings-content">
      <div class="settings-view" data-settings-view="controls">
        <p class="settings-intro">
          Quick controller guide for computer and mobile play.
        </p>

        <div class="settings-grid">
          <article class="settings-card">
            <h2>Computer</h2>
            <dl class="control-list">
              <div><dt>Left Arrow</dt><dd>Move left</dd></div>
              <div><dt>Right Arrow</dt><dd>Move right</dd></div>
              <div><dt>Down Arrow</dt><dd>Soft drop</dd></div>
              <div><dt>Space</dt><dd>Rotate</dd></div>
              <div><dt>Up Arrow</dt><dd>Hold / swap preview</dd></div>
              <div><dt>P</dt><dd>Pause / play</dd></div>
              <div><dt>Esc</dt><dd>Close settings</dd></div>
            </dl>
          </article>

          <article class="settings-card">
            <h2>Mobile / Touch</h2>
            <dl class="control-list">
              <div><dt>D-pad left</dt><dd>Move left</dd></div>
              <div><dt>D-pad right</dt><dd>Move right</dd></div>
              <div><dt>D-pad down</dt><dd>Soft drop</dd></div>
              <div><dt>D-pad up</dt><dd>Hold / swap preview</dd></div>
              <div><dt>Round arrow button</dt><dd>Rotate</dd></div>
              <div><dt>Pause / play button</dt><dd>Pause or resume</dd></div>
              <div><dt>Gear button</dt><dd>Open this guide</dd></div>
            </dl>
          </article>
        </div>
      </div>

      <div class="settings-view" data-settings-view="options" hidden>
        <p class="settings-intro">Adjust game audio while you play.</p>
        <div class="settings-options-list">
          <div class="settings-option-row">
            <span>Sound FX volume</span>
            <div class="settings-option-adjuster">
              <button type="button" data-option="soundFxVolume" data-change="-10" aria-label="Lower sound effects volume">&minus;</button>
              <output data-option-value="soundFxVolume">100%</output>
              <button type="button" data-option="soundFxVolume" data-change="10" aria-label="Raise sound effects volume">+</button>
            </div>
          </div>
          <div class="settings-option-row">
            <span>Music volume</span>
            <div class="settings-option-adjuster">
              <button type="button" data-option="musicVolume" data-change="-10" aria-label="Lower music volume">&minus;</button>
              <output data-option-value="musicVolume">100%</output>
              <button type="button" data-option="musicVolume" data-change="10" aria-label="Raise music volume">+</button>
            </div>
          </div>
          <div class="settings-option-row">
            <span>Music type</span>
            <div class="settings-option-adjuster">
              <button type="button" data-option="musicType" data-change="-1" aria-label="Previous music type">&minus;</button>
              <output data-option-value="musicType">Hip Hop 1</output>
              <button type="button" data-option="musicType" data-change="1" aria-label="Next music type">+</button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </section>
  `;

  const closeButton = overlay.querySelector('.settings-close');
  const homeButton = overlay.querySelector('.settings-home-button');
  const tabButtons = [...overlay.querySelectorAll('[data-settings-tab]')];
  const views = [...overlay.querySelectorAll('[data-settings-view]')];
  const optionButtons = [...overlay.querySelectorAll('[data-option][data-change]')];
  const optionValues = new Map(
    [...overlay.querySelectorAll('[data-option-value]')].map((element) => [element.dataset.optionValue, element])
  );
  let openState = false;
  const options = {
    soundFxVolume: 100,
    musicVolume: 100,
    musicType: 1,
  };

  function showTab(tabName) {
    tabButtons.forEach((button) => {
      const isActive = button.dataset.settingsTab === tabName;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-selected', String(isActive));
    });
    views.forEach((view) => {
      view.hidden = view.dataset.settingsView !== tabName;
    });
  }

  function updateOptions() {
    optionValues.get('soundFxVolume').textContent = `${options.soundFxVolume}%`;
    optionValues.get('musicVolume').textContent = `${options.musicVolume}%`;
    optionValues.get('musicType').textContent = `Hip Hop ${options.musicType}`;
    onOptionsChange({ ...options });
  }

  function setOpen(nextOpen) {
    if (openState === nextOpen) return;
    openState = nextOpen;
    playSettingsButtonSound();
    overlay.classList.toggle('open', openState);
    overlay.setAttribute('aria-hidden', String(!openState));
    onOpenChange(openState);
  }

  closeButton.addEventListener('click', () => setOpen(false));
  homeButton.addEventListener('click', () => {
    playSettingsButtonSound();
    onExitToHome();
  });
  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      playSettingsButtonSound();
      showTab(button.dataset.settingsTab);
    });
  });
  optionButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const optionName = button.dataset.option;
      const change = Number(button.dataset.change);
      if (optionName === 'musicType') {
        options.musicType = ((options.musicType - 1 + change + 3) % 3) + 1;
      } else {
        options[optionName] = Math.min(100, Math.max(0, options[optionName] + change));
      }
      updateOptions();
      playSettingsButtonSound();
    });
  });
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) setOpen(false);
  });
  window.addEventListener('keydown', (event) => {
    if (!openState) return;
    if (event.code === 'Escape') setOpen(false);
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);

  document.body.appendChild(overlay);

  return {
    open: () => setOpen(true),
    close: () => setOpen(false),
    toggle: () => setOpen(!openState),
    isOpen: () => openState,
  };
}
