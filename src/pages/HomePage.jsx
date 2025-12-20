import { Box, Typography, Paper } from '@mui/material';
import believerImage from "../assets/home images/Believer1.jpeg";

const paperStyle = { flex: '1 1 0', minWidth: '300px', maxWidth: 'calc(50% - 10px)', p: '28px 32px 36px', borderRadius: '12px', background: 'linear-gradient(180deg, rgba(139, 119, 101, .1), rgba(139, 119, 101, .05))', border: '1px solid rgba(201, 169, 97, .15)', boxShadow: '0 18px 40px rgba(0,0,0,.45), inset 0 1px 1px rgba(255,255,255,.08)', position: 'relative' };

export default function HomePage() {
  return (
    <Box maxWidth="xl" className="page-switch" sx={{ py: 0, mx: 'auto' }}>
      <Box sx={{ maxWidth: '1700px', m: '8px auto 0', display: 'flex', gap: '20px', alignItems: 'stretch', flexWrap: 'wrap', p: '30px' }}>
        <Paper className="reveal-on-scroll" elevation={3} sx={{ ...paperStyle, width: 'calc(50% - 10px)' }}>
          <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: '.1em', fontSize: 'clamp(18px, 3vw, 32px)', color: 'var(--accent-2)', display: 'block' }}>GAME DEV PORTFOLIO</Typography>
          <Typography className="reveal-on-scroll" variant="h1" sx={{ fontWeight: 900, fontStyle: 'italic', lineHeight: 1, fontSize: 'clamp(40px, 15vw, 90px)', m: '0 0 5px', background: 'linear-gradient(90deg, #c9a961, #b8956a)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', textShadow: '0 6px 22px rgba(139,119,101,.4)' }}>HEI!? THAVON</Typography>
          <Typography className="reveal-on-scroll" variant="h5" sx={{ fontSize: 'clamp(18px, 3vw, 28px)', color: 'var(--muted)', mb: 2 }}>IT Technician, Junior Game Design, and Developer</Typography>
          <Typography className="reveal-on-scroll" sx={{ lineHeight: 1.7, textAlign: 'justify', mb: 2, color: '#c9a961', fontSize: '1.2rem' }}>My nickname is Hei. I am in Laos, a highly dedicated and self-motivated game player who has had a passion for game maker. I have been addicted to playing games since I was a young boy. Games have motivated me to not give up on my life.</Typography>
          <Typography className="reveal-on-scroll" sx={{ lineHeight: 1.6, textAlign: 'justify', mb: 2, color: '#c9a961', fontSize: '1.2rem' }}>I have been working in Vientiane Capital as an IT support software development teams. There are no game and animation studios in my country. Anyway, my career goal is to be a game developer, owner, and director in a game team somewhere that makes cultural games, challenging myself creatively and managerially to build strong teams and game projects.</Typography>
          <Typography className="reveal-on-scroll" sx={{ lineHeight: 1.7, textAlign: 'justify', color: '#c9a961', fontSize: '1.2rem' }}>This portfolio is a list of games I have done and am in progress of making since I started my solo online learning project in January 2025.</Typography>
        </Paper>

        <Paper className="reveal-on-scroll" elevation={3} sx={{ ...paperStyle, width: 'calc(50% - 10px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 0, overflow: 'hidden', background: 'linear-gradient(180deg, rgba(139, 119, 101, .1), rgba(139, 119, 101, .05))' }}>
          <Box component="img" src={believerImage} alt="Believer" width="100%" sx={{ borderRadius: '12px 12px 0 0', objectFit: 'cover', flexGrow: 1 }} />
          <Box sx={{ p: '20px 24px', background: 'transparent', borderTop: '1px solid rgba(201, 169, 97, .2)' }}>
            <Typography sx={{ lineHeight: 1.6, textAlign: 'center', fontStyle: 'italic', color: '#c9a961', fontSize: '1.2rem', fontWeight: 500 }}>
              "Sometimes the sadness of loss makes me feel lonely, but I believe there is still hope. Although the pain of failure will scar me, I believe there is still a way.
              <br />
              Until that day, I will create wings to soar like a bird through the piercing, cold storm,
              <br />
              lean into the crimson sun, and roar over everything"
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
