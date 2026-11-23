import bombPortrait from '../assets/uro-bomb.png';

export default function UroCover() {
  return <svg className="home-project-image" role="img" aria-label="URO blue bomb and game title" viewBox="0 0 720 400">
    <rect width="720" height="400" fill="#242c24" />
    <image href={bombPortrait} x="28" y="8" width="280" height="280" />
    <text x="336" y="206" fontFamily="Arial,sans-serif" fontSize="98" fontWeight="900" letterSpacing="-5">
      <tspan style={{ fill: '#ffe1a4' }}>U</tspan><tspan style={{ fill: '#819b46' }}>R</tspan><tspan style={{ fill: '#e88126' }}>O</tspan>
    </text>
    <text x="338" y="242" fontFamily="Arial,sans-serif" fontSize="10" fontWeight="700" letterSpacing="1" style={{ fill: '#e88126' }}>UNKNOWN REALM ORDNANCE</text>
  </svg>;
}
