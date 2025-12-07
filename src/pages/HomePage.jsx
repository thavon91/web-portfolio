import { Box, Typography, Paper } from '@mui/material';
import projectVideo from "../assets/videos/Motion_Graphics_Motion_Graphic - HT.mp4";

const paperStyle = { flex: 1, minWidth: '300px', p: '28px 32px 36px', borderRadius: '12px', background: 'linear-gradient(180deg, rgba(139, 119, 101, .1), rgba(139, 119, 101, .05))', border: '1px solid rgba(201, 169, 97, .15)', boxShadow: '0 18px 40px rgba(0,0,0,.45), inset 0 1px 1px rgba(255,255,255,.08)', position: 'relative' };

export default function HomePage() {
  return (
    <Box maxWidth="xl" className="page-switch" sx={{ py: 1, mx: 'auto' }}>
      <Box sx={{ maxWidth: '1700px', m: '8px auto', p: '30px', borderRadius: '10px', border: '1px solid rgba(255,255,255,.08)', boxShadow: '0 18px 40px rgba(0,0,0,.35)' }}>
        <Box sx={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Paper className="reveal-on-scroll" elevation={3} sx={paperStyle}>
            <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: '.1em', fontSize: 'clamp(18px, 3vw, 32px)', color: 'var(--accent-2)', display: 'block' }}>GAME DEV PORTFOLIO</Typography>
            <Typography className="reveal-on-scroll" variant="h1" sx={{ fontWeight: 900, fontStyle: 'italic', lineHeight: 1, fontSize: 'clamp(40px, 15vw, 90px)', m: '0 0 5px', background: 'linear-gradient(90deg, #c9a961, #b8956a)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', textShadow: '0 6px 22px rgba(139,119,101,.4)' }}>HEI!? THAVON</Typography>
            <Typography className="reveal-on-scroll" variant="h5" sx={{ fontSize: 'clamp(18px, 3vw, 28px)', color: 'var(--muted)', mb: 2 }}>IT Technician, Junior Game Design, and Developer</Typography>
            <Typography className="reveal-on-scroll" sx={{ lineHeight: 1.7, textAlign: 'justify', mb: 2, color: '#fff', fontSize: '1.2rem' }}>My nickname is Hei. I am in Laos, a highly dedicated and self-motivated game player who has had a passion for game maker. I have been addicted to playing games since I was a young boy. Games have motivated me to not give up on my life.</Typography>
            <Typography className="reveal-on-scroll" sx={{ lineHeight: 1.6, textAlign: 'justify', mb: 2, color: '#fff', fontSize: '1.2rem' }}>I have been working in Vientiane Capital as an IT support software development teams. There are no game and animation studios in my country. Anyway, my career goal is to be a game developer, owner, and director in a game team somewhere that makes cultural games, challenging myself creatively and managerially to build strong teams and game projects.</Typography>
            <Typography className="reveal-on-scroll" sx={{ lineHeight: 1.7, textAlign: 'justify', color: '#fff', fontSize: '1.2rem' }}>This portfolio is a list of games I have done and am in progress of making since I started my solo online learning project in January 2025.</Typography>
          </Paper>

          <Paper className="reveal-on-scroll" elevation={3} sx={{ ...paperStyle, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 0, overflow: 'hidden' }}>
            <Box component="video" controls autoPlay loop muted width="100%" height="100%" sx={{ borderRadius: '12px', backgroundColor: '#000', objectFit: 'cover' }}>
              <source src={projectVideo} type="video/mp4" />
              Your browser does not support the video tag.
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
