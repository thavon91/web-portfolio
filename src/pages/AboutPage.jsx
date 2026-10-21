import resumePdf from '../assets/pdf/Thavon_Resume.pdf';

const focuses = [
  { icon: 'gamepad', title: 'GAME DESIGN', text: 'Game mechanics,\nlevel design, systems', tone: 'red' },
  { icon: 'programming', title: 'PROGRAMMING', text: 'Unreal Engine, C++,\nBlueprints, JavaScript, Three.js', tone: 'blue' },
  { icon: 'palette', title: '3D ART', text: 'Blender, 3D modeling,\ntexturing', tone: 'red' },
  { icon: 'team', title: 'GAME PRODUCTION', text: 'Project management,\nteamwork, game business', tone: 'blue' },
];
const hobbies = [
  { icon: 'movie', title: 'Watch Movies & Documentaries', text: 'Inspired by great stories and creative ideas', tone: 'red' },
  { icon: 'gamepad', title: 'Play Games', text: 'RPG, RTS, Cards, Turn-based, Fighter, MMO, MOBA, Racing', tone: 'blue' },
  { icon: 'palette', title: '2D/3D Art', text: 'Drawing, 3D sculpting, improving art skills', tone: 'red' },
  { icon: 'code', title: 'Learn New Tech', text: 'Game engines, tools, AI, and programming.\nAttending GDC and gaming events (online/offline)', tone: 'blue' },
  { icon: 'music', title: 'Listen to Music', text: 'Game soundtracks, various genres', tone: 'red' },
  { icon: 'nature', title: 'Explore Nature', text: 'Road trips, concerts, and new places', tone: 'blue' },
];

function HobbyIcon({ name }) {
  const paths = {
    movie: 'M3 7h18v14H3z M3 7l2-4h4L7 7m2 0 2-4h4l-2 4m2 0 2-4h4l-2 4 M9 11v6l5-3z',
    gamepad: 'M7 8h10a4 4 0 0 1 3.8 2.8l1.1 4a2.5 2.5 0 0 1-4.2 2.4L15.5 15h-7l-2.2 2.2a2.5 2.5 0 0 1-4.2-2.4l1.1-4A4 4 0 0 1 7 8Z M8 10v4m-2-2h4m7-1h.01M18 13h.01',
    palette: 'M12 3a9 9 0 1 0 0 18h1.4a2 2 0 0 0 1.5-3.3 1.7 1.7 0 0 1 1.3-2.8H19a2 2 0 0 0 2-2A10 10 0 0 0 12 3Z M7.5 10h.01M10 7h.01M15 7.5h.01M17 11h.01',
    code: 'M3 4h18v12H3z M1.5 20h21 M8 8l-2 2 2 2m8-4 2 2-2 2m-3-5-2 6',
    music: 'M9 18V5l12-2v13 M9 18a3 2 0 1 1-3-2 3 2 0 0 1 3 2Zm12-2a3 2 0 1 1-3-2 3 2 0 0 1 3 2Z',
    nature: 'M3 20 10 8l7 12H3Zm10 0 3-5 5 5h-8ZM19 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM17 1v1m0 6v1m4-4h-1m-6 0h-1',
  };
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className="hobby-svg"
    >
      <path d={paths[name]} />
    </svg>
  );
}

function FocusIcon({ name }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false" className="focus-svg">
      {name === 'gamepad' && (
        <>
          <path d="M13 14h22a9 9 0 0 1 8.7 6.7l2.1 8.1a5.3 5.3 0 0 1-8.9 5l-5-4.8H16.1l-5 4.8a5.3 5.3 0 0 1-8.9-5l2.1-8.1A9 9 0 0 1 13 14Z" fill="currentColor" />
          <path d="M15 20v8m-4-4h8" fill="none" stroke="#071426" strokeWidth="3" strokeLinecap="round" />
          <circle cx="34" cy="22" r="2" fill="#071426" />
          <circle cx="39" cy="27" r="2" fill="#071426" />
        </>
      )}
      {name === 'programming' && (
        <>
          <path d="M7 7h34v25H7zM17 41h14M24 32v9" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round" />
          <path d="m21 15-5 4 5 4m6-8 5 4-5 4m-2-10-3 12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {name === 'palette' && (
        <>
          <path d="M24 4C12.4 4 4 12 4 22.5 4 33.8 13.1 43 24.5 43H29a5 5 0 0 0 3.6-8.5 3 3 0 0 1 2.1-5.1H39a5 5 0 0 0 5-5C44 13 35.3 4 24 4Z" fill="currentColor" />
          <circle cx="15" cy="19" r="2.2" fill="#071426" />
          <circle cx="20" cy="13" r="2.2" fill="#071426" />
          <circle cx="28" cy="13" r="2.2" fill="#071426" />
          <circle cx="34" cy="19" r="2.2" fill="#071426" />
        </>
      )}
      {name === 'team' && (
        <>
          <circle cx="24" cy="14" r="6" fill="currentColor" />
          <circle cx="10" cy="18" r="5" fill="currentColor" />
          <circle cx="38" cy="18" r="5" fill="currentColor" />
          <path d="M12 38v-4a12 12 0 0 1 24 0v4H12Zm-10-1v-3a9 9 0 0 1 7-8.7 10 10 0 0 1 5.3 1.2A14 14 0 0 0 10 36v1H2Zm34 0v-1a14 14 0 0 0-4.3-10.5 10 10 0 0 1 5.3-1.2 9 9 0 0 1 7 8.7v3h-8Z" fill="currentColor" />
        </>
      )}
    </svg>
  );
}

export default function AboutPage() {
  return (
    <main className="about-screen page-switch">
      <section className="about-copy reveal-on-scroll">
        <div className="eyebrow"><span>GET TO KNOW ME</span></div>
        <h1 className="mega-title"><span>ABOUT</span> <em>ME</em></h1>
        <div className="title-trails"><i /><i /><i /></div>
        <p className="about-intro">I’m a <strong>game developer</strong> and <strong>game designer</strong> who loves creating<b> interactive experiences</b>, learning new technologies, and turning ideas into games. I enjoy both the creative and technical sides of game development, from design and art to programming and production.</p>
        <div className="section-rule" />
        <h2 className="sub-title">MY <span>FOCUS</span></h2>
        <div className="focus-grid">{focuses.map((item) => <article className={`focus-item ${item.tone}`} key={item.title}><div className="focus-icon"><FocusIcon name={item.icon} /></div><h3 className={item.icon === 'team' ? 'production-title' : undefined}>{item.title}</h3><p>{item.text}</p></article>)}</div>
      </section>
      <aside className="hobbies-panel reveal-on-scroll">
        <h2><span className="hobby-heading-icon"><HobbyIcon name="gamepad" /></span> <b>HOB</b>BIES</h2>
        <div className="hobby-list">{hobbies.map((item) => <div className="hobby" key={item.title}><div className={`hobby-icon ${item.tone}`}><HobbyIcon name={item.icon} /></div><div><h3>{item.title}</h3><p>{item.text}</p></div></div>)}</div>
      </aside>
      <a className="resume-cta" href={resumePdf} target="_blank" rel="noreferrer"><span>▤</span> RESUME <b>→</b></a>
    </main>
  );
}
