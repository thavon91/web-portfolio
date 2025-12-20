import { Box, Typography, Button, Grid } from '@mui/material';
import profile1Img from "../assets/profile1.png";
import SocialIcons from "../components/SocialIcons";
import resumePdf from "../assets/pdf/Thavon_Resume.pdf";
import reactjsIcon from "../assets/icons/reactjs.png";
import githubIcon from "../assets/icons/github.png";
import gitlabIcon from "../assets/icons/gitlab.png";
import dockerIcon from "../assets/icons/docker.png";
import jiraIcon from "../assets/icons/jira.png";
import unrealIcon from "../assets/icons/unreal.png";
import gdevelopIcon from "../assets/icons/GD.png";
import photopeaIcon from "../assets/icons/photopea.png";
import ZbrushIcon from "../assets/icons/Zbrush.png";
import BlenderIcon from "../assets/icons/Blender.png";
import MobileGameIcon from "../assets/icons/MobileGame.png";
import RPGMobileGameIcon from "../assets/icons/RPGMobileGame.png";
import ARPGIcon from "../assets/icons/ARPG.png";
import UE5CoOp from "../assets/icons/UE5 Co-Op.png";

const softwareIcons = [{ src: githubIcon, alt: "Github" }, { src: gitlabIcon, alt: "Gitlab" }, { src: reactjsIcon, alt: "Reactjs" }, { src: jiraIcon, alt: "Jira" },
{ src: unrealIcon, alt: "Unreal Engine" }, { src: gdevelopIcon, alt: "GDevelop" }, { src: photopeaIcon, alt: "Photopea" },
{ src: dockerIcon, alt: "Docker" }];

const pursuits = [
  { title: "Learn Crimson Ronin in Zbrush and Blender", href: "https://www.p2design-academy.com/p/crimson-ronin", bg: ZbrushIcon },
  { title: "Learn Alive! Animation course in Blender", href: "https://www.p2design-academy.com/p/alive-animation-course-in-blender", bg: BlenderIcon },
  { title: "Learn Unreal Engine 5 Mobile Game Development For Beginners", href: "https://www.udemy.com/course/creating-android-games-in-unreal-engine-5-using-blueprint/?couponCode=KEEPLEARNING", bg: MobileGameIcon },
  { title: "Learn Unreal Engine 5 Create RPG Mobile Game For Play Store", href: "https://www.udemy.com/course/unreal-engine-5-create-rpg-mobile-game-for-play-store/?couponCode=KEEPLEARNING", bg: RPGMobileGameIcon },
  { title: "Learn Unreal Engine 5 creating an ARPG Game from Scratch", href: "https://www.udemy.com/course/unreal-engine-5-creating-an-arpg-game-from-scratch/?couponCode=KEEPLEARNING", bg: ARPGIcon },
  { title: "Unreal Engine 5 Co-op Multiplayer Game For Intermediate", href: "https://www.udemy.com/course/unreal-engine-5-co-op-multiplayer-game-for-intermidate/?couponCode=KEEPLEARNING", bg: UE5CoOp }
];

const cardStyle = { width: { xs: 160, sm: 200, md: 250 }, height: { xs: 120, sm: 150, md: 180 }, position: 'relative', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 8px 20px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.08)', transition: 'all .3s ease', textDecoration: 'none', backgroundColor: '#3a3530', border: '2px solid #8b7765', '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 16px 40px rgba(201,169,97,.4), inset 0 1px 0 rgba(255,255,255,.08)', borderColor: 'var(--accent)' } };

export default function AboutPage() {
  return (
    <Box maxWidth="lg" className="page-switch" sx={{ mx: 'auto', px: { xs: 1, sm: 2, md: 2.5 }, boxSizing: 'border-box', mt: { xs: 0, md: 1 } }}>
      <Box sx={{ py: { xs: '20px', sm: '30px', md: '35px' }, textAlign: 'center' }} className="reveal-on-scroll">
        <Typography variant="h3" sx={{ fontWeight: 'bold', mb: { xs: 2, sm: 3, md: 5 }, color: 'var(--accent-2)', fontSize: { xs: '2rem', sm: '2.5rem', md: '3.5rem' } }}>About Me</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: { xs: 2, sm: 3, md: 5 }, lineHeight: 1.4 }}>
          <Box sx={{ flex: '1 1 300px', textAlign: 'center' }}>
            <Box component="img" src={profile1Img} alt="Profile" className="reveal-on-scroll" sx={{ width: { xs: '180px', sm: '220px', md: '260px' }, height: { xs: '180px', sm: '220px', md: '260px' }, borderRadius: '8px', boxShadow: '0 14px 34px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,.1)', border: '3px solid #8b7765', objectFit: 'cover', filter: 'sepia(0.15)' }} />
            <Typography className="reveal-on-scroll" sx={{ fontStyle: 'italic', mt: 1.25, mb: 2.5, color: 'var(--accent)', fontSize: { xs: '1rem', sm: '1.2rem', md: '1.4rem' }, fontWeight: 500 }}>"Bringing exceptional moments to life"</Typography>
            <SocialIcons className="reveal-on-scroll" size={35} />
          </Box>
          <Box sx={{ flex: '1 1 300px', textAlign: 'left' }}>
            <Typography variant="h6" className="reveal-on-scroll" sx={{ fontWeight: 'bold', mb: 2, color: 'var(--accent)', fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.8rem' }, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hobbies</Typography>
            <Box component="ul" className="reveal-on-scroll" sx={{ listStyle: 'disc', ml: 2.5, mb: 4, color: '#d4c5b9', lineHeight: 1.6, fontSize: { xs: '0.9rem', sm: '1.1rem', md: '1.3rem' }, '& li': { marginBottom: '0.6em' } }}>
              {['Addict documentaries, movies, animations, performances, songs, music, tech, GDC festival of gaming, awards, sports, and e-sports.',
                'Watch Gameplay walkthrough: RPG, RTS, Cards, Turn-based, Fighter, MMO, MOBA, and Racing.',
                'Upgrade old skills: 2d drawing, 3d sculpting, and Programming.',
                'Goal obtain in 3 year: Complete English level testing; Perceive Unreal Engine 5-create RPG mobile, multiplayer shooter PC with C++, and multiplsyer RPG PC games.',
                'Do road trips, go to concerts, and explore nature.'].map((item, i) => <li key={i}>{item}</li>)}
            </Box>
            <Button component="a" href={resumePdf} target="_blank" rel="noopener noreferrer" className="reveal-on-scroll" sx={{ mt: 2, px: { xs: 2, md: 3 }, py: { xs: 1, md: 1.5 }, background: 'linear-gradient(135deg, #c9a961, #a68860)', color: '#2a2420', fontWeight: 'bold', fontSize: { xs: '14px', md: '16px' }, boxShadow: '0 6px 20px rgba(201, 169, 97, .3), inset 0 1px 0 rgba(255,255,255,.15)', '&:hover': { background: 'linear-gradient(135deg, #d4b370, #b39370)', transform: 'translateY(-2px)', boxShadow: '0 10px 28px rgba(201, 169, 97, .4)' } }}>RESUME</Button>
          </Box>
        </Box>
      </Box>

      <Box component="section" className="reveal-on-scroll" sx={{ py: { xs: '30px', sm: '45px', md: '60px' }, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'var(--accent)', mb: { xs: 2, sm: 3, md: 5 }, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: { xs: '1.5rem', sm: '2rem', md: '2.8rem' } }}>Junior Software Proficiency</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 100px)', sm: 'repeat(3, 120px)', md: 'repeat(4, 150px)' }, gap: { xs: 1.5, sm: 2, md: 2.5 }, maxWidth: 1000, margin: '0 auto', justifyContent: 'center' }}>
          {softwareIcons.map((it, i) => (
            <Box key={i} className="reveal-on-scroll" sx={{ width: { xs: 100, sm: 120, md: 150 }, height: { xs: 100, sm: 120, md: 150 }, background: 'linear-gradient(180deg, rgba(139, 119, 101, .15), rgba(139, 119, 101, .08))', borderRadius: '8px', display: 'grid', placeItems: 'center', boxShadow: '0 6px 14px rgba(0,0,0,.45), inset 0 1px 1px rgba(255,255,255,.08)', border: '1px solid rgba(201,169,97,.15)', transition: 'all .2s ease', '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 12px 22px rgba(0,0,0,.55), inset 0 1px 1px rgba(255,255,255,.1)', borderColor: 'var(--accent)' } }}>
              <Box component="img" src={it.src} alt={it.alt} loading="lazy" sx={{ width: '85%', height: '85%', objectFit: 'contain', opacity: 0.9 }} />
            </Box>
          ))}
        </Box>
      </Box>

      <Box component="section" className="reveal-on-scroll" sx={{ py: { xs: '30px', sm: '45px', md: '60px' }, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'var(--accent)', mb: { xs: 2, sm: 3, md: 5 }, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: { xs: '1.5rem', sm: '2rem', md: '2.8rem' } }}>Other Pursuits</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: { xs: 1.5, sm: 2, md: 3 }, maxWidth: 900, m: '0 auto' }}>
          {pursuits.map((card, i) => (
            <Box key={i} component="a" href={card.href} target="_blank" rel="noopener noreferrer" className="reveal-on-scroll" sx={cardStyle}>
              <Box component="img" src={card.bg} alt={card.title} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,.4), rgba(0,0,0,.75))', display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 1, sm: 1.5, md: 2 } }}>
                <Typography sx={{ textAlign: 'center', color: '#c9a961', fontWeight: 800, fontSize: { xs: '12px', sm: '14px', md: '18px' }, lineHeight: 1.3, textShadow: '0 2px 10px rgba(0,0,0,.9)' }}>{card.title}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
