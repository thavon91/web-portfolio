import { useState } from 'react';

export default function UroCover() {
  const [portrait] = useState(() => {
    try {
      const cached = localStorage.getItem('bombom-home-smile-portrait-v2');
      if (cached?.startsWith('data:image/png;base64,')) return cached;
    } catch { /* Use the generated icon when browser storage is unavailable. */ }
    return '';
  });
  const cover = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="400" viewBox="0 0 720 400">
    <rect width="720" height="400" fill="#242c24"/>
    ${portrait ? `<image href="${portrait}" x="28" y="8" width="280" height="280"/>` : `<defs><radialGradient id="bomb"><stop stop-color="#39779c"/><stop offset="1" stop-color="#08192b"/></radialGradient></defs><path d="M166 90q-22-25-4-42" fill="none" stroke="#bb9360" stroke-width="12"/><circle cx="166" cy="176" r="76" fill="url(#bomb)"/><path d="m122 148 31 13-20 12m78-25-31 13 20 12" fill="none" stroke="#fff3da" stroke-width="9" stroke-linecap="round"/><path d="M126 196q40 34 80-4" fill="none" stroke="#fff3da" stroke-width="10"/>` }
    <text x="336" y="206" font-family="Arial,sans-serif" font-size="98" font-weight="900" letter-spacing="-5"><tspan fill="#ffe1a4">U</tspan><tspan fill="#819b46">R</tspan><tspan fill="#e88126">O</tspan></text>
    <text x="338" y="242" font-family="Arial,sans-serif" font-size="10" font-weight="700" letter-spacing="1" fill="#e88126">UNKNOWN REALM ORDNANCE</text>
  </svg>`;
  return <img className="home-project-image" alt="URO blue bomb and game title" src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(cover)}`} />;
}
