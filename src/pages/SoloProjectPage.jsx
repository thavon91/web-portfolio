import { useState } from 'react';
import { ImageList, ImageListItem, Box, Typography, Button, Modal } from '@mui/material';
import pic1 from '../assets/gif/gif1.gif';
import pic2 from '../assets/gallery/pic2.png';
import pic3 from '../assets/gallery/pic3.png';
import pic4 from '../assets/gallery/pic4.png';
import pic5 from '../assets/gallery/pic5.png';
import pic6 from '../assets/gallery/pic6.png';
import pic7 from '../assets/gallery/pic7.png';
import pic8 from '../assets/gallery/pic8.png';
import timel1 from '../assets/gallery/timeline/timel1.png';
import timel2 from '../assets/gallery/timeline/timel2.png';
import timel3 from '../assets/gallery/timeline/timel3.png';
import timel4 from '../assets/gallery/timeline/timel4.png';
import timel5 from '../assets/gallery/timeline/timel5.png';
import timel6 from '../assets/gallery/timeline/timel6.png';
import timel7 from '../assets/gallery/timeline/timel7.png';
import projectVideo from '../assets/videos/Motion_Graphics_Motion_Graphic.mp4';

const itemData = [
  { img: pic1, rows: 2, cols: 2 }, { img: pic2 }, { img: pic3 }, { img: pic4, cols: 2 },
  { img: pic5, cols: 2 }, { img: pic6, rows: 2, cols: 2 }, { img: pic7 }, { img: pic8 }
];

const timelineData = [
  { img: timel1, rows: 2, cols: 2 }, { img: timel2 }, { img: timel3 }, { img: timel4, cols: 2 },
  { img: timel5, cols: 2 }, { img: timel6, rows: 2, cols: 2 }, { img: timel7 }
];

const sectionBox = {
  mt: 2.5, p: '28px 32px 48px', borderRadius: '12px', color: 'var(--text)',
  background: 'linear-gradient(180deg, rgba(139, 119, 101, .1), rgba(139, 119, 101, .05))',
  border: '1px solid rgba(201, 169, 97, .15)',
  boxShadow: '0 18px 40px rgba(0,0,0,.45), inset 0 1px 1px rgba(255,255,255,.08)'
};

const navButtonStyle = (position) => ({
  position: 'absolute', [position]: 20, width: 50, height: 50,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'white', bgcolor: 'rgba(0, 0, 0, 0.5)', borderRadius: '50%',
  cursor: 'pointer', fontSize: '32px', fontWeight: 'bold', zIndex: 10,
  transition: 'all 0.2s',
  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)', transform: 'scale(1.1)' }
});

const learning = [
  'Creating a plugin to convert any Unreal Engine project to multiplayer',
  'Program multiplayer matchmaking in Unreal Engine',
  'Optimize network code by minimizing bandwidth and maximizing performance',
  'Lag compensation techniques including client-side prediction and server-side rewind',
  'Multiple weapons including pistols, SMGs, assault rifles, shotguns, sniper rifles, rocket launcher, grenade launchers, and throwing grenades',
  'Pickups including shields, health, speed buffs, jump buffs, and ammo pickups',
  'Crouching, aiming, jumping, strafing, reloading, and throwing, all in multiplayer',
  'Working HUD with health and shield bars, ammo count, score and defeats, and game timers',
  'Custom game modes, custom match states, and use of the core classes used in multiplayer',
  'Learn how the Game Mode, Game State, Player State, Player Controller, Pawn, Character, and Actor classes work in multiplayer',
  'Learn about the Unreal Engine Online Subsystem and use it to program multiplayer games using any online service such as Steam',
  'Display announcements including: Who eliminated who, who won the game, winning teams, countdown timers',
];

const GallerySection = ({ title, onClick, subtitle, items }) => (
  <Box className="reveal-on-scroll" sx={sectionBox}>
    <Typography variant="h4" sx={{ textAlign: 'center', color: 'var(--accent-2)', fontWeight: 1000, mb: 1 }}>
      {title}
    </Typography>
    {subtitle && (
      <Typography variant="body1" sx={{ textAlign: 'center', fontStyle: 'italic', color: 'var(--muted)', mb: 3 }}>
        {subtitle}
      </Typography>
    )}
    <ImageList sx={{ width: '100%', maxWidth: 1000, height: 500, m: '0 auto', overflow: 'hidden' }} variant="quilted" cols={4} rowHeight={121}>
      {items.map((item, i) => (
        <ImageListItem
          key={i}
          cols={item.cols || 1}
          rows={item.rows || 1}
          sx={{ cursor: 'pointer', overflow: 'hidden', '& img': { transition: 'transform 0.3s', '&:hover': { transform: 'scale(1.05)' } } }}
          onClick={() => onClick(item.img, items)}
        >
          <img src={item.img} alt={`Screenshot ${i + 1}`} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </ImageListItem>
      ))}
    </ImageList>
  </Box>
);

export default function SoloProjectPage() {
  const [openModal, setOpenModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentGallery, setCurrentGallery] = useState(itemData);

  const handleImageClick = (img, gallery) => {
    const index = gallery.findIndex(item => item.img === img);
    setCurrentIndex(index);
    setSelectedImage(img);
    setCurrentGallery(gallery);
    setOpenModal(true);
  };
  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % currentGallery.length;
    setCurrentIndex(nextIndex);
    setSelectedImage(currentGallery[nextIndex].img);
  };
  const handlePrevious = () => {
    const prevIndex = (currentIndex - 1 + currentGallery.length) % currentGallery.length;
    setCurrentIndex(prevIndex);
    setSelectedImage(currentGallery[prevIndex].img);
  };

  return (
    <Box className="page-switch" sx={{ maxWidth: 900, margin: '8px auto', p: '30px', background: 'linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.04))', borderRadius: '10px', border: '1px solid rgba(255,255,255,.08)', boxShadow: '0 18px 40px rgba(0,0,0,.35)' }}>
      <Box className="reveal-on-scroll" sx={{ ...sectionBox, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ textAlign: 'center', color: 'var(--accent-2)', fontWeight: 1000, mb: 2 }}>This is TEST1 Page</Typography>
        <Typography sx={{ textAlign: 'center', textIndent: '50px', lineHeight: 1.5, mb: 3 }}>
          PC game development: multiplayer shooter in the powerful Unreal Engine 5 using C++. This project is my aspiring shooting game, which I am passionate about creating and joining game sessions using C++ programming and connecting many players across the internet. I am eager to bring my game ideas to life and dive into the gaming studio.
        </Typography>
        <Box component="video" controls autoPlay loop muted width="100%" sx={{ aspectRatio: '16 / 9', borderRadius: '8px', backgroundColor: '#000' }}>
          <source src={projectVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </Box>
        <Button href="https://drive.google.com/your-google-drive-link-here" target="_blank" rel="noopener noreferrer" sx={{ mt: 2, px: 2.5, py: 1.25, background: 'linear-gradient(135deg, #c9a961, #a68860)', color: 'white', fontWeight: 'bold', borderRadius: '8px', textTransform: 'none', boxShadow: '0 6px 16px rgba(201, 169, 97, .25)', '&:hover': { background: 'linear-gradient(135deg, #d4b370, #b39370)', transform: 'translateY(-2px)' } }}>
          📂 Open Google Drive
        </Button>
      </Box>

      <Box className="reveal-on-scroll" sx={{ ...sectionBox, p: '24px 28px', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(260px, 1fr))', gap: 4, textAlign: 'left' }}>
        <Box>
          <Typography variant="h6" sx={{ m: 0, mb: 1.5, fontSize: 24, fontWeight: 800, color: 'var(--accent-2)' }}>Goal:</Typography>
          <Box component="ul" sx={{ m: 0, pl: '1.5rem', lineHeight: 1.7, listStyle: 'disc', opacity: 0.95 }}>
            <li>Build an FPS game with optimized multipliers for PC platforms. Creating and managing blueprints for game logic, programming C++ for core mechanics, designing animated characters and environments, and prepare game publication on Steam.</li>
          </Box>
        </Box>
        <Box>
          <Typography variant="h6" sx={{ m: 0, mb: 1.5, fontSize: 24, fontWeight: 800, color: 'var(--accent-2)' }}>Project Details</Typography>
          <Box component="ul" sx={{ m: 0, pl: '1.5rem', lineHeight: 1.7, listStyle: 'disc', opacity: 0.95 }}>
            <li><Box component="span" sx={{ color: 'var(--accent-2)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '.02em' }}>Engine:</Box> Unreal Engine 5</li>
            <li><Box component="span" sx={{ color: 'var(--accent-2)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '.02em' }}>Language:</Box> C++ and Blueprints</li>
            <li><Box component="span" sx={{ color: 'var(--accent-2)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '.02em' }}>Duration:</Box> 65 hours of learning, build in 5 months</li>
            <li><Box component="span" sx={{ color: 'var(--accent-2)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '.02em' }}>Team Size:</Box> Solo project</li>
          </Box>
        </Box>
      </Box>

      <Box className="reveal-on-scroll" sx={sectionBox}>
        <Typography variant="h4" sx={{ textAlign: 'center', color: 'var(--accent-2)', fontWeight: 1000, mb: 1 }}>
          Project Timeline
        </Typography>
        <Typography variant="body1" sx={{ textAlign: 'center', fontStyle: 'italic', color: 'var(--muted)', mb: 3 }}>
          Click <Button
            href="https://github.com/users/thavon91/projects/1/views/1"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ px: 1, py: 0.1, background: 'linear-gradient(135deg, #c9a961, #a68860)', color: 'white', fontWeight: 'bold', borderRadius: '6px', textTransform: 'none', fontSize: 'inherit', fontStyle: 'normal', minWidth: 'auto', boxShadow: '0 4px 12px rgba(201, 169, 97, .2)', '&:hover': { background: 'linear-gradient(135deg, #d4b370, #b39370)' } }}
          >
            roadmap
          </Button> to see a better timeline on Github!
        </Typography>
        <ImageList sx={{ width: '100%', maxWidth: 1000, height: 500, m: '0 auto', overflow: 'hidden' }} variant="quilted" cols={4} rowHeight={121}>
          {timelineData.map((item, i) => (
            <ImageListItem
              key={i}
              cols={item.cols || 1}
              rows={item.rows || 1}
              sx={{ cursor: 'pointer', overflow: 'hidden', '& img': { transition: 'transform 0.3s', '&:hover': { transform: 'scale(1.05)' } } }}
              onClick={() => handleImageClick(item.img, timelineData)}
            >
              <img src={item.img} alt={`Timeline ${i + 1}`} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </ImageListItem>
          ))}
        </ImageList>
      </Box>

      <Box className="reveal-on-scroll" sx={sectionBox}>
        <Typography variant="h5" sx={{ m: 0, mb: 1.5, fontSize: 28, fontWeight: 800, color: 'var(--accent-2)', textAlign: 'center' }}>Assets Used:</Typography>
        <Box component="ul" sx={{ m: 0, pl: '1.2rem', lineHeight: 1.8, listStyle: 'disc' }}>
          {['Avatar character (Art)', 'Farm field with house, and shop (Art)', 'Good Sky (Art)'].map((item, i) => <li key={i}>{item}</li>)}
        </Box>
      </Box>

      <GallerySection
        title="Project Screenshots"
        onClick={handleImageClick}
        subtitle="Click the images to get a better view!"
        items={itemData}
      />

      <Modal
        open={openModal}
        onClose={() => { setOpenModal(false); setSelectedImage(null); }}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0, 0, 0, 0.95)' }}
      >
        <Box sx={{ position: 'relative', maxWidth: '95vw', maxHeight: '95vh', outline: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box
            onClick={() => { setOpenModal(false); setSelectedImage(null); }}
            sx={{ position: 'absolute', top: 10, right: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', bgcolor: 'rgba(0, 0, 0, 0.5)', borderRadius: '50%', cursor: 'pointer', fontSize: '24px', fontWeight: 'bold', zIndex: 10, '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' } }}
          >
            ✕
          </Box>
          <Box onClick={handlePrevious} sx={navButtonStyle('left')}>‹</Box>
          {selectedImage && <img src={selectedImage} alt="Full view" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }} />}
          <Box onClick={handleNext} sx={navButtonStyle('right')}>›</Box>
        </Box>
      </Modal>

      <Box className="reveal-on-scroll" sx={sectionBox}>
        <Typography variant="h5" sx={{ m: 0, mb: 1.5, fontSize: 28, fontWeight: 800, color: 'var(--accent-2)', textAlign: 'center' }}>Learning:</Typography>
        <Box component="ol" sx={{ m: 0, pl: '1.2rem', lineHeight: 1.8, listStyle: 'decimal' }}>
          {learning.map((item, i) => <li key={i}>{item}</li>)}
        </Box>
      </Box>
    </Box>
  );
}
