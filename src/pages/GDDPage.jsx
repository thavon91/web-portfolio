import { Box, Typography, Button } from '@mui/material';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import WitchClass1 from '../assets/GDD/Forsaken/WitchClass1.png';
import Conc1 from '../assets/GDD/Concept/Conc1.png';
import Conc2 from '../assets/GDD/Concept/Conc2.png';
import Conc33 from '../assets/GDD/Concept/Conc33.png';
import BackgroundF from '../assets/GDD/Backround/BackgroudF.jpg';
import Refe1 from '../assets/GDD/References/Refe1.jpg';
import Refe2 from '../assets/GDD/References/Refe2.png';
import Refe3 from '../assets/GDD/References/Refe3.png';
import Refe4 from '../assets/GDD/References/Refe4.jpg';
import Refe5 from '../assets/GDD/References/Refe5.png';
import Refe6 from '../assets/GDD/References/Refe6.png';
import Refe7 from '../assets/GDD/References/Refe7.png';
import Refe8 from '../assets/GDD/References/Refe8.png';

import Desc1 from '../assets/GDD/Description/Desc1.png';
import Desc2 from '../assets/GDD/Description/Desc2.png';
import Desc3 from '../assets/GDD/Description/Desc3.png';
import Sett1 from '../assets/GDD/Setting/Sett1.png';
import Sett2 from '../assets/GDD/Setting/Sett2.png';
import Sett3 from '../assets/GDD/Setting/Sett3.jpg';
import Char1 from '../assets/GDD/Character/Char1.jpg';
import Char2 from '../assets/GDD/Character/Char2.jpg';
import Char3 from '../assets/GDD/Character/Char3.jpg';
import Char4 from '../assets/GDD/Character/Char4.jpg';
import Char5 from '../assets/GDD/Character/Char5.jpg';
import Char6 from '../assets/GDD/Character/Char6.jpg';
import Char7 from '../assets/GDD/Character/Char7.png';
import Level1 from '../assets/GDD/Levels/Level1.png';
import Controller1 from '../assets/GDD/Controller/Controller1.png';
import Devr1 from '../assets/GDD/Dev Roadmap/Devr1.png';
import Devr2 from '../assets/GDD/Dev Roadmap/Devr2.png';
import Devr3 from '../assets/GDD/Dev Roadmap/Devr3.png';

// Consolidated styles
const sx = {
  page: { width: '210mm', height: '297mm', borderRadius: '12px', boxShadow: '0 18px 40px rgba(0,0,0,.45), inset 0 1px 1px rgba(255,255,255,.08)', overflow: 'hidden', flexShrink: 0 },
  img: { width: '100%', objectFit: 'cover', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.7)', border: '2px solid rgba(201,169,97,0.25)' },
  txt: { color: '#ffffff', fontSize: '1.3rem', lineHeight: 1.6 },
  list: { m: 0, pl: '20px', color: '#ffffff', fontSize: '1.3rem', lineHeight: 1.6 },
  title: { color: '#fff', fontWeight: 700, fontSize: 'clamp(4rem,6vw,5rem)', mb: '25px', fontFamily: 'serif', position: 'relative', zIndex: 1 },
  sub: { color: '#fff', fontWeight: 700, fontSize: '1.5rem', mb: '8px' }
};

const Page = ({ children, bg, overlay = 0.85 }) => (
  <Box className="reveal-on-scroll" sx={{ ...sx.page, backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', display: 'flex', flexDirection: 'column', p: '50px 60px', '&::before': { content: '""', position: 'absolute', inset: 0, zIndex: 0, backgroundColor: `rgba(0,0,0,${overlay})` } }}>{children}</Box>
);

const Title = ({ children, mb = '25px', ...p }) => <Typography variant="h3" sx={{ ...sx.title, mb, ...p.sx }}>{children}</Typography>;
const Txt = ({ children, j, ...p }) => <Typography sx={{ ...sx.txt, ...(j && { textAlign: 'justify' }), ...p.sx }}>{children}</Typography>;
const Img = ({ src, alt, h = 'auto', w, ...p }) => <Box component="img" src={src} alt={alt} sx={{ ...sx.img, height: h, ...(w && { width: w }), ...p.sx }} />;
const List = ({ items, ...p }) => <Box component="ul" sx={{ ...sx.list, ...p.sx }}>{items.map((item, i) => <li key={i}>{typeof item === 'object' ? <><Typography component="span" sx={{ fontWeight: 600, color: '#ffffff' }}>{item.label}:</Typography> {item.text}</> : item}</li>)}</Box>;
const Section = ({ title, children }) => <Box sx={{ mt: '10px' }}><Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '1.5rem', mb: '8px' }}>{title}</Typography>{children}</Box>;

export default function GDDPage() {
  const handleExportPDF = async () => {
    const element = document.querySelector('.gdd-content');
    if (!element) return;

    try {
      // Hide scrollbars temporarily
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const pages = element.querySelectorAll('.reveal-on-scroll');
      const pdf = new jsPDF('p', 'mm', 'a4');

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];

        const canvas = await html2canvas(page, {
          scale: 1.5,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#000000',
          scrollY: -window.scrollY,
          scrollX: -window.scrollX,
          onclone: (clonedDoc) => {
            const clonedPage = clonedDoc.querySelector('.reveal-on-scroll:nth-child(' + (i + 1) + ')');
            if (clonedPage) {
              clonedPage.style.transform = 'none';
              clonedPage.style.opacity = '1';
            }
            // Hide scrollbars and buttons in cloned document
            clonedDoc.body.style.overflow = 'hidden';
            const noPrintElements = clonedDoc.querySelectorAll('.no-print');
            noPrintElements.forEach(el => el.style.display = 'none');
          }
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.7);
        const pdfWidth = 210;
        const pdfHeight = 297;

        if (i > 0) {
          pdf.addPage();
        }

        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = pdfWidth / (imgWidth * 0.264583);
        const finalWidth = pdfWidth;
        const finalHeight = imgHeight * 0.264583 * ratio;

        pdf.addImage(imgData, 'JPEG', 0, 0, finalWidth, finalHeight);
      }

      // Restore scrollbars
      document.body.style.overflow = originalOverflow;

      pdf.save('The_Forsaken_GDD.pdf');
      alert('PDF generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
      // Restore scrollbars on error
      document.body.style.overflow = originalOverflow || 'auto';
    }
  };

  return (
    <Box className="page-switch gdd-content" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: '30px 10px', gap: '30px' }}>
      {/* Cover */}
      <Box className="reveal-on-scroll" sx={{ ...sx.page, backgroundImage: `url(${WitchClass1})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', textAlign: 'center', p: '50px 60px', '&::before': { content: '""', position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 0 } }}>
        <Box sx={{ position: 'relative', zIndex: 1, pt: '20px' }}>
          <Typography sx={{ color: '#fff', fontWeight: 300, fontSize: 'clamp(1.5rem,4vw,2.2rem)', letterSpacing: '4px', mb: '-10px' }}>The</Typography>
          <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 'clamp(3rem,8vw,5.5rem)', letterSpacing: '6px', textShadow: '2px 2px 8px rgba(0,0,0,0.7)' }}>Forsaken</Typography>
        </Box>
        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '30px', alignItems: 'center', pt: '120px' }}>
          <Typography sx={{ color: '#fff', fontWeight: 600, letterSpacing: '6px', fontSize: 'clamp(1rem,2.5vw,1.4rem)' }}>GAME DESIGN DOCUMENT</Typography>
          <Box>
            <Typography sx={{ color: '#fff', fontWeight: 600, letterSpacing: '3px', fontSize: 'clamp(0.85rem,2vw,1rem)', mb: 1 }}>WRITTEN BY:</Typography>
            <Typography sx={{ color: '#fff', fontWeight: 400, fontSize: 'clamp(1rem,2.2vw,1.2rem)', mb: 0.5 }}>Hei Thavon</Typography>
            <Typography sx={{ color: '#fff', fontWeight: 300, fontSize: 'clamp(0.8rem,1.8vw,0.95rem)', lineHeight: 1.4 }}>IT Technician, Junior Game Design and Developer</Typography>
          </Box>
          <Box sx={{ mt: 2 }}>
            <Typography sx={{ color: '#fff', fontWeight: 600, letterSpacing: '2px', fontSize: 'clamp(0.85rem,2vw,1rem)', mb: 1 }}>VERSION # 1.00</Typography>
            <Typography sx={{ color: '#fff', fontWeight: 300, fontSize: 'clamp(0.85rem,1.8vw,0.95rem)', mb: 3 }}>Monday, November 24, 2025</Typography>
            <Button className="no-print" onClick={handleExportPDF} sx={{ mt: 2, px: 4, py: 2, background: 'linear-gradient(135deg,#c9a961,#a68860)', color: '#2a2420', fontWeight: 'bold', fontSize: '16px', borderRadius: '8px', boxShadow: '0 6px 20px rgba(201,169,97,.3), inset 0 1px 0 rgba(255,255,255,.15)', '&:hover': { background: 'linear-gradient(135deg,#d4b370,#b39370)', transform: 'translateY(-2px)', boxShadow: '0 10px 28px rgba(201,169,97,.4)' } }}>EXPORT GDD TO PDF</Button>
          </Box>
        </Box>
        <Box sx={{ position: 'relative', zIndex: 1, height: '80px' }} />
      </Box>

      {/* Concept */}
      <Page bg={BackgroundF}>
        <Title>Concept</Title>
        <Box sx={{ display: 'flex', gap: '30px', position: 'relative', zIndex: 1 }}>
          <Box sx={{ flex: '0 0 55%', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <Section title="Genre:"><List items={['RPG action and 3D exploration']} /></Section>
            <Section title="The game:"><List items={['The Forsaken is set in a dark world where the player manages a character of adventurers in the style of Darkest Dungeon, fighting against the dark forces that plague the region']} /></Section>
            <Section title="Target Audience:"><List items={['Users between 18 and 45 years old']} /></Section>
            <Section title="Platform:"><List items={['PC, the game is controlled with mouse and keyboard']} /></Section>
          </Box>
          <Box sx={{ flex: '0 0 42%', display: 'flex', flexDirection: 'column', gap: '20px', pt: '5px' }}>
            {[Conc1, Conc2].map((img, i) => <Img key={i} src={img} alt={`Concept ${i + 1}`} h="165px" />)}
          </Box>
        </Box>
        <Img src={Conc33} alt="Concept 3" sx={{ mt: '25px', position: 'relative', zIndex: 1 }} />
      </Page>

      {/* References */}
      <Page bg={BackgroundF}>
        <Title mb="20px">References</Title>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', zIndex: 1 }}>
          <Box>
            <Typography sx={{ ...sx.sub }}>Path of Exile 2:</Typography>
            <List items={['The main inspiration for this game comes from POE 2, shaping both its combat philosophy and gameplay structure. The fast, ability combat informs how players chain skills, manage cooldowns, and react to enemy patterns. Its rich 3D environments and atmospheric exploration.']} />
            <Box sx={{ display: 'flex', gap: '12px', mt: '15px', height: '200px' }}>
              <Img src={Refe1} alt="POE2-1" sx={{ flex: '0 0 55%', height: '100%' }} />
              <Box sx={{ flex: '0 0 43%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[Refe2, Refe3].map((img, i) => <Img key={i} src={img} alt={`POE2-${i + 2}`} sx={{ height: 'calc(50% - 6px)' }} />)}
              </Box>
            </Box>
          </Box>

          <Box sx={{ mt: '15px' }}>
            <Typography sx={{ ...sx.sub }}>Dungeon Hunter 4:</Typography>
            <List items={['Second reference is Dungeon Hunter 4, especially in the game\'s atmosphere carries a feeling of constant tension between the mortal realm and the demonic forces threatening it. Dungeon Hunter 4 inspires the use of gothic ruins, corrupted landscapes, and shadowy ambient.']} />
          </Box>
          <Box sx={{ mt: '10px' }}>
            <Typography sx={{ ...sx.sub }}>No Rest for the Wicked:</Typography>
            <Box component="ul" sx={{ ...sx.list, mb: '15px' }}><li>Last reference is No Rest for the Wicked, the game's emphasis on precision, stamina control, and skill encounters. Its handcrafted world, rich with storytelling, and lived-in spaces. Its focus on expression through mastery, reinforcing the tone of gritty struggle and earned power.</li></Box>
            <Box sx={{ display: 'flex', gap: '15px', height: '260px' }}>
              <Img src={Refe4} alt="Dungeon Hunter 4" w="42%" h="100%" />
              <Box sx={{ width: '56%', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {[[Refe5, Refe6], [Refe7, Refe8]].map((row, i) => (
                  <Box key={i} sx={{ display: 'flex', gap: '15px', height: '47%' }}>
                    {row.map((img, j) => <Img key={j} src={img} alt={`No Rest ${i * 2 + j + 1}`} w="48%" h="100%" />)}
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>

        </Box>
      </Page>

      {/* Description */}
      <Page bg={BackgroundF}>
        <Title>Description</Title>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '30px', position: 'relative', zIndex: 1 }}>
          {[
            { txt: 'Step into a dark fantasy world as a young huntress fighting to uncover the truth behind an ancient curse. Explore a world where every ability, attribute, and combat choice is powered by a deep, expandable gameplay framework. Master spellcasting, melee combat, and character progression built on a foundation of precision, strategy, and integrated RPG mechanics.', img: Desc1, w: '48%', w2: '49%', align: 'flex-start', mt: '15px' },
            { txt: 'Build character through a detailed stats system that shapes damage, defense, critical hits, health, mana, and every layer of combat. Unlock powerful spells, passive abilities, and multipath upgrades. Face enemies with advanced AI, from goblins and demons to corrupted beasts that adapt and react.', img: Desc2, w: '46%', imgFirst: true, align: 'center' },
            { txt: 'Crafted with a blend of C++ and Blueprint engineering, the game features responsive controls, impactful abilities, dynamic combat feedback, and a scalable codebase inspired by tier RPG design.', img: Desc3, w2: '49%', align: 'center' }
          ].map((item, i) => (
            <Box key={i} sx={{ display: 'flex', gap: '28px', alignItems: item.align }}>
              {item.imgFirst && <Img src={item.img} alt={`Desc ${i + 1}`} w={item.w} />}
              <Txt j sx={{ ...(item.w ? { width: item.w } : { flex: 1 }) }}>{item.txt}</Txt>
              {!item.imgFirst && <Img src={item.img} alt={`Desc ${i + 1}`} w={item.w2} sx={{ ...(item.mt && { mt: item.mt }) }} />}
            </Box>
          ))}
        </Box>
      </Page>

      {/* Setting */}
      <Page bg={BackgroundF}>
        <Title>Setting</Title>
        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '25px' }}>
          <Txt j>The game is built upon the ruins of forgotten civilizations, where ancient magic once shaped every creature, structure, and force of nature. These remnants still pulse beneath the land manifesting as elemental anomalies, corrupted beasts, and forgotten shrines that channel the world's power.</Txt>
          {[
            { txt: 'As society rebuilds after centuries of collapse, new settlements rise amid wilderness filled with goblins, demons, and other creatures warped by old energy. Dungeons, scattered across the land, connect relic chambers, and ritual sites created by ancient cultures that mastered magic long before humanity could wield it.', img: Sett1 },
            { txt: 'In this world, attributes such as Vigor, Intelligence, and Resilience, they represent the lingering influence of old magic on the body and soul. Abilities, spells, and elemental forces are learned by uncovering relics, unlocking shrines, or defeating powerful guardians. Every region reflects a hybrid of emerging civilization and the overwhelming presence of ancient power ready to awaken.', img: Sett2 }
          ].map((item, i) => (
            <Box key={i} sx={{ display: 'flex', gap: '28px', alignItems: 'flex-start' }}>
              <Txt j sx={{ flex: 1 }}>{item.txt}</Txt>
              <Img src={item.img} alt={`Setting ${i + 1}`} w="38%" />
            </Box>
          ))}
          <Img src={Sett3} alt="Fantasy Setting" h="380px" sx={{ mt: '5px', objectPosition: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.8)' }} />
        </Box>
      </Page>

      {/* Characters */}
      <Page bg={BackgroundF}>
        <Title>Characters</Title>
        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Box sx={{ display: 'flex', gap: '28px', alignItems: 'flex-start' }}>
            <Box sx={{ flex: '0 0 65%', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1.5rem', mb: '8px' }}>Reference: Frieren</Typography>
              <List items={['Personality: She listens more than she speaks, and often pauses before answering, as if considering centuries of memory. Appears cold at first, but hides a deep compassion known only to those patient enough to stay by her side.', 'Appearance: A slender elf with pale, worn from centuries of travel, and yet faintly glow with lingering star-magic. Rarely smiles, but radiates a quiet gentleness.']} />
            </Box>
            <Box sx={{ flex: '0 0 32%', mt: '20px' }}>
              <Img src={Char1} alt="Frieren" h="335px" />
            </Box>
          </Box>
          <Box>
            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1.5rem', mb: '8px' }}>Abilities:</Typography>
            <List items={[
              { label: 'Astral Magic', text: 'Draws power from constellations and distant realms.' },
              { label: 'Long-Lived Insight', text: 'Understands people after watching many generations pass.' },
              { label: 'Silent Casting', text: 'Performs spells with almost no visible motion.' }
            ]} />
          </Box>
          <Img src={Char2} alt="Character Design" />
        </Box>
      </Page>

      {/* Main Character: Frieluna */}
      <Page bg={BackgroundF}>
        <Typography variant="h3" sx={{ ...sx.title, fontSize: '1.5rem', fontWeight: 700, mb: '8px', mt: '35px' }}>Main Character: Frieluna</Typography>
        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Box sx={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <Box>
                <Typography sx={{ color: '#c9a961', fontWeight: 700, fontSize: '1.3rem', fontStyle: 'italic', mb: '8px' }}>The Main Protagonist.</Typography>
                <Txt>A young huntress gifted with innate magical affinity, trained to master ancient abilities awakened within her.</Txt>
              </Box>
              <Box>
                <Typography sx={{ color: '#ffffff', fontWeight: 700, fontSize: '1.5rem', mb: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Physiology</Typography>
                <Box component="ul" sx={{ m: 0, pl: '20px', color: '#d4c5b9', fontSize: '1.3rem', lineHeight: 1.6 }}>
                  {['Gender: Female', 'Age: 17', 'Hair Color: Brown', 'Eye Color: Blue / Purple', 'Height: 1.57 m', 'Weight: 47 kg', 'Outfit: Light armor, enchanted sash, and leather boots.'].map((t, i) => <li key={i}>{t}</li>)}
                </Box>
              </Box>
            </Box>
            <Img src={Char3} alt="Frieluna" w="35%" sx={{ border: '2px solid rgba(201, 169, 97, 0.35)' }} />
          </Box>
          <Box sx={{ display: 'flex', gap: '30px', mt: '10px' }}>
            <Box sx={{ width: '35%', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {[Char4, Char5].map((src, i) => <Img key={i} src={src} alt={`Frieluna ${i + 1}`} h="225px" sx={{ border: '2px solid rgba(201, 169, 97, 0.35)' }} />)}
            </Box>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Typography sx={{ color: '#ffffff', fontWeight: 700, fontSize: '1.5rem', mb: '2px', textTransform: 'uppercase', letterSpacing: '1px' }}>Sociology</Typography>
              <Box component="ul" sx={{ m: 0, pl: '20px', color: '#d4c5b9', fontSize: '1.3rem', lineHeight: 1.6 }}>
                {['Class: Wanderer / Apprentice Spellblade', 'Residence: Nomadic (travels between ruins, shrines, and frontier towns)', 'Occupation: Monster hunter, relic seeker', 'Family Background: Orphan raised by frontier villagers', 'Economic Status: Low income; relies on hunting and exploring', 'Home Life: Lives alone; spends most time traveling', "Religion: Doesn't follow structured religion, believes in ancient elemental forces", 'Social Traits: Respectful, cooperative', 'Hobbies: Studying relics, practicing abilities, observing magical wildlife'].map((t, i) => <li key={i}>{t}</li>)}
              </Box>
            </Box>
          </Box>
        </Box>
      </Page>

      {/* Frieluna Abilities, Psychology & Backstory */}
      <Page bg={BackgroundF}>
        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', gap: '50px', justifyContent: 'center', pl: '1px', pt: '50px' }}>
          {/* Left Column: Image + Psychology + Backstory */}
          <Box sx={{ flex: '0 0 38%', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <Img src={Char6} alt="Frieluna" sx={{ width: '100%', maxWidth: '420px', height: 'auto', border: '2px solid rgba(201, 169, 97, 0.35)' }} />
            <Box sx={{ mt: '15px' }}>
              <Typography sx={{ color: '#ffffff', fontWeight: 700, fontSize: '1.5rem', mb: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Psychology</Typography>
              <Box component="ul" sx={{ m: 0, pl: '20px', color: '#d4c5b9', fontSize: '1.1rem', lineHeight: 1.7 }}>
                {[
                  { label: 'Personality Type', text: 'Determined, curious, empathetic' },
                  { label: 'Strengths', text: 'Strategic thinker, fast learner, highly focused in battle' },
                  { label: 'Weakness', text: 'Overuses magic' },
                  { label: 'Intelligence', text: 'Good at analyzing magical systems' },
                  { label: 'Fears', text: 'Losing control of ancient magic' },
                  { label: 'Temperament', text: 'Calm, introspective' },
                  { label: 'Attitude', text: 'Driven to uncover the truth of her powers' }
                ].map((item, i) => (
                  <li key={i}>
                    <Typography component="span" sx={{ fontWeight: 600, color: '#ffffff' }}>{item.label}:</Typography> {item.text}
                  </li>
                ))}
              </Box>
            </Box>
            <Box sx={{ mt: '15px' }}>
              <Typography sx={{ color: '#ffffff', fontWeight: 700, fontSize: '1.5rem', mb: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Backstory</Typography>
              <Txt j sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>Frieluna was found as a child near the ruins of an ancient shrine, the only survivor of a mysterious incident marked by lingering magical energy.</Txt>
            </Box>
          </Box>

          {/* Right Column: Abilities */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Box>
              <Typography sx={{ color: '#ffffff', fontWeight: 700, fontSize: '1.5rem', mb: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Abilities</Typography>
              {[
                {
                  name: 'Firebolt', items: [
                    { label: 'Damage', text: 'Medium' },
                    { label: 'Range', text: 'Long' },
                    { label: 'Effect', text: 'Applies burning damage over time' },
                    { label: 'Extra', text: 'Creates hit sparks + floating damage text' }
                  ]
                },
                {
                  name: 'Electrocute', items: [
                    { label: 'Damage', text: 'High (burst)' },
                    { label: 'Effect', text: 'Stun + lightning arc to nearby targets' },
                    { label: 'Extra', text: 'Can interrupt enemy abilities' }
                  ]
                },
                {
                  name: 'Arcane Shards', items: [
                    { label: 'Damage', text: 'Medium AoE' },
                    { label: 'Effect', text: 'Crystal fragments expand outward' },
                    { label: 'Extra', text: 'Higher critical chance based on Intelligence' }
                  ]
                },
                {
                  name: 'FireBlast', items: [
                    { label: 'Damage', text: 'High AoE' },
                    { label: 'Effect', text: 'Knocks back surrounding enemies' },
                    { label: 'Extra', text: 'Leaves burning ground effect' }
                  ]
                }
              ].map((ability, i) => (
                <Box key={i} sx={{ mb: '8px' }}>
                  <Typography sx={{ color: '#ffffff', fontWeight: 700, fontSize: '1.25rem', mb: '2px' }}>• {ability.name}</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                    {ability.items.map((item, j) => (
                      <Typography key={j} sx={{ color: '#d4c5b9', fontSize: '1.1rem', lineHeight: 1.5 }}>
                        <Typography component="span" sx={{ fontWeight: 600, color: '#ffffff' }}>{item.label}:</Typography> {item.text}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
            <Img src={Char7} alt="Frieluna Design" sx={{ border: '2px solid rgba(201, 169, 97, 0.35)', width: '100%', maxWidth: '500px', mt: '10px' }} />
          </Box>
        </Box>
      </Page>

      {/* Levels */}
      <Page bg={BackgroundF}>
        <Title>Levels</Title>
        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {[
            'This level takes full advantage of the modular dungeon to be included in the project. The player enters the Sunken Shrine, a forgotten temple constructed from ancient stone blocks and broken obelisks. The dungeon is designed to teach players how to combine movement, abilities, and resource management through Unreal\'s Gameplay Ability System.',
            'The level begins in a quiet antechamber where players interact with highlighted objects, learning how ability targeting and item selection. As they progress deeper, they encounter the first enemy: Goblin Warriors with reactive AI. Gameplay unfolds through basic combat and direct damage.'
          ].map((t, i) => <Txt key={i} j>{t}</Txt>)}
          <Box>
            <Txt j sx={{ mb: '12px' }}>Each chamber of the shrine escalates difficulty:</Txt>
            <Box component="ul" sx={{ m: 0, pl: '30px', color: '#d4c5b9', fontSize: '1.1rem', lineHeight: 1.8 }}>
              {['rooms filled with environmental hazards (falling rocks)', 'corridors guarded by summoned minions', 'narrow bridges where knockback effects can push enemies into pits'].map((t, i) => <li key={i}>{t}</li>)}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: '10px', mb: '15px' }}>
            <Img src={Level1} alt="Level Design" w="80%" sx={{ border: '2px solid rgba(201, 169, 97, 0.35)', boxShadow: '0 6px 16px rgba(0,0,0,0.8)' }} />
          </Box>
          <Txt j>At the core of the level is an ancient 'Waypoint Shrine: Activation' it reveals the final boss chamber: a Goblin Shaman empowered by old magic. Defeating him teaches players the importance of Critical Hit Chance, Block Chance, and reaction timing. After victory, players unlock new attribute points and a spell upgrade, demonstrating the upgrade system.</Txt>
        </Box>
      </Page>

      {/* Mechanics & Controller */}
      <Page bg={BackgroundF}>
        <Title>Mechanics</Title>
        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {[
            'Character movement is controlled with directional keys, mouse input, and allowing players to explore ruins and modular dungeons from a top-down perspective. The mouse is used for aiming abilities, selecting enemies, and interacting with objects in the environment.',
            'Combat is built on a deep attribute and ability system. Players cast spells, perform weapon attacks, and trigger elemental stuns, burns, and knockbacks. Floating combat text and visual effects provide instant feedback for hits, critical strikes, and status conditions.',
            'Outside of battle, players collect loot, gather resources, and navigate dialogue prompts with NPCs. Leveling up grants attribute points and new abilities, while adaptive enemy AI and ability reassignment allow players to adjust their approach as challenges grow.'
          ].map((t, i) => <Txt key={i} j sx={i === 2 ? { mb: '10px' } : {}}>{t}</Txt>)}
          <Title sx={{ mt: '30px', mb: '20px' }}>Controller</Title>
          <Img src={Controller1} alt="Controller" sx={{ border: '2px solid rgba(201, 169, 97, 0.35)', boxShadow: '0 6px 16px rgba(0,0,0,0.8)', mt: '5px' }} />
        </Box>
      </Page>

      {/* Development Roadmap */}
      <Page bg={BackgroundF}>
        <Typography variant="h3" sx={{ ...sx.title, fontSize: 'clamp(3.5rem, 6vw, 4.5rem)' }}>Development</Typography>
        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Typography sx={{ color: '#ffffff', fontWeight: 600, fontSize: '1.25rem', mb: '5px' }}>Development estimate timeline is on Github</Typography>
          <Txt j sx={{ mb: '15px' }}>This section links directly to the project's Github repository milestones, showcasing major development phases, feature implementations, and AI behavior.</Txt>
          <Img src={Devr1} alt="Roadmap Overview" sx={{ border: '2px solid rgba(201, 169, 97, 0.35)', boxShadow: '0 6px 16px rgba(0,0,0,0.8)', mb: '15px' }} />
          <Box sx={{ display: 'flex', gap: '20px', mb: '15px' }}>
            {[Devr2, Devr3].map((src, i) => <Img key={i} src={src} alt={`Roadmap ${i + 2}`} w="48%" sx={{ border: '2px solid rgba(201, 169, 97, 0.35)', boxShadow: '0 6px 16px rgba(0,0,0,0.8)' }} />)}
          </Box>
          <Txt j sx={{ mt: '10px' }}>(Please check on Github link <Typography component="span" sx={{ fontStyle: 'italic', textDecoration: 'underline' }}>here</Typography>)</Txt>
        </Box>
      </Page>
    </Box>
  );
}
