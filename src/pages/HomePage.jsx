import { useState } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import believerImage from "../assets/home images/Believer1.jpeg";
import projectImage from '../assets/gallery/demo/demo1.png';
import fantasyDemoImage from '../assets/gallery/pic2.png';
import adventureDemoImage from '../assets/gallery/pic4.png';

const projects = [
  {
    title: 'TPS Multiplayer Game',
    category: 'Shooter',
    description: 'A multiplayer third-person shooter in Unreal Engine 5, built with C++.',
    image: projectImage,
  },
  {
    title: 'Fantasy RPG Demo',
    category: 'RPG',
    description: 'Demo project card for a fantasy role-playing game concept.',
    image: fantasyDemoImage,
    demo: true,
  },
  {
    title: 'Adventure Prototype Demo',
    category: 'Adventure',
    description: 'Demo project card for an exploration-focused adventure game.',
    image: adventureDemoImage,
    demo: true,
  },
];

const projectFilters = ['All', 'RPG', 'Adventure', 'Shooter'];

const paperStyle = {
  flex: { xs: '0 0 auto', md: '1 1 0' },
  width: { xs: 'calc(100% - 0px)', md: 'calc(50% - 11px)' },
  minWidth: { xs: 'auto', md: '300px' },
  maxWidth: { xs: '100%', md: 'calc(50% - 11px)' },
  p: { xs: '16px', sm: '20px', md: '32px 36px 40px' },
  borderRadius: '12px',
  background: 'linear-gradient(145deg, rgba(3, 12, 26, .92), rgba(6, 27, 52, .78))',
  border: '1px solid rgba(29, 100, 181, .65)',
  boxShadow: '0 18px 40px rgba(2,9,20,.45), inset 0 0 40px rgba(15,93,180,.08)',
  position: 'relative',
  boxSizing: 'border-box'
};

export default function HomePage() {
  const [projectFilter, setProjectFilter] = useState('All');
  const visibleProjects = projects.filter((project) => projectFilter === 'All' || project.category === projectFilter);

  return (
    <Box maxWidth="xl" className="page-switch" sx={{ py: 0, mx: 'auto', width: '100%', boxSizing: 'border-box' }}>
      <Box sx={{ maxWidth: '1850px', m: { xs: '0 auto', md: '0 auto' }, mt: { xs: 0, md: '8px' }, display: 'flex', gap: { xs: '8px', md: '22px' }, alignItems: 'stretch', flexWrap: 'wrap', p: { xs: '8px', sm: '15px', md: '35px' }, boxSizing: 'border-box' }}>
        <Paper className="home-panel home-intro-panel reveal-on-scroll" elevation={3} sx={{ ...paperStyle }}>
          <Typography variant="overline" className="home-kicker" sx={{ fontWeight: 800, letterSpacing: '.1em', fontSize: { xs: '12px', sm: '16px', md: '20px', lg: '24px' }, color: 'var(--accent-2)', display: 'block' }}><span>GAME DEV</span> <em>PORTFOLIO</em></Typography>
          <Typography className="reveal-on-scroll home-title" variant="h1" sx={{ fontWeight: 900, fontStyle: 'italic', lineHeight: 1, fontSize: { xs: '32px', sm: '48px', md: '64px', lg: '90px' }, m: '0 0 5px' }}><span>HEI!?</span> <em>THAVON</em></Typography>
          <Typography className="reveal-on-scroll home-detail home-subtitle" variant="h5" sx={{ fontSize: { xs: '14px', sm: '18px', md: '22px', lg: '28px' }, mb: 2 }}><strong>IT Technician</strong>, Junior <b>Game Design</b>, and Developer</Typography>
          <Typography className="reveal-on-scroll home-detail home-bio" sx={{ lineHeight: 1.7, textAlign: 'justify', mb: 2, fontSize: { xs: '14px', sm: '16px', md: '18px', lg: '1.2rem' } }}>My nickname is Hei. I am in Laos, a highly dedicated and self-motivated <strong className="home-bio-game-player">GamePlayer</strong> who has had a passion for <b className="home-bio-game-maker">GameMaker</b>. I have been addicted to playing games since I was a young boy. <strong>Games have motivated me</strong> to not give up on my life.</Typography>
          <Typography className="reveal-on-scroll home-detail home-bio" sx={{ lineHeight: 1.7, textAlign: 'justify', fontSize: { xs: '14px', sm: '16px', md: '18px', lg: '1.2rem' } }}>This portfolio is a list of games I have done and am in progress of making since I started my <b>solo online learning project</b> in January 2025.</Typography>
          <Box className="home-projects home-projects-in-profile">
            <Box className="home-projects-header">
              <Typography className="home-projects-kicker">/ MY PERSONAL WORK</Typography>
              <Typography className="home-projects-intro">
                A collection of my personal game projects. These projects help me improve my skills in game design, programming, and 3D art.
              </Typography>
            </Box>
            <Box className="home-project-filters" aria-label="Filter projects">
              {projectFilters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={projectFilter === filter ? 'active' : ''}
                  aria-pressed={projectFilter === filter}
                  onClick={() => setProjectFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </Box>
            <Box className="home-project-grid">
              {visibleProjects.map((project) => (
                <article className="home-project-card" key={project.title}>
                  <Box component="img" src={project.image} alt={`${project.title} preview`} className="home-project-image" />
                  <Box className="home-project-info">
                    <span className="home-project-category">{project.category}</span>
                    <Typography component="h3">{project.title}</Typography>
                    <Typography component="p">{project.description}</Typography>
                    {project.demo ? (
                      <span className="home-project-link home-project-demo">DEMO CARD</span>
                    ) : (
                      <a href="#SoloProject" className="home-project-link">VIEW DETAILS <span aria-hidden="true">→</span></a>
                    )}
                  </Box>
                </article>
              ))}
            </Box>
          </Box>
        </Paper>

        <Paper className="home-panel reveal-on-scroll" elevation={3} sx={{ ...paperStyle, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 0, overflow: 'hidden' }}>
          <Box component="img" src={believerImage} alt="Believer" width="100%" sx={{ borderRadius: '12px 12px 0 0', objectFit: 'cover', flexGrow: 1 }} />
          <Box sx={{ p: { xs: '12px 16px', sm: '16px 20px', md: '20px 24px' }, background: 'transparent', borderTop: '1px solid rgba(29, 100, 181, .45)' }}>
            <Typography className="home-quote" sx={{ lineHeight: 1.6, textAlign: 'center', fontStyle: 'italic', fontSize: { xs: '12px', sm: '14px', md: '16px', lg: '1.1rem' }, fontWeight: 400 }}>
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
