import { Box } from '@mui/material';
import linkedinIcon from "../assets/Linkedin.svg";
import facebookIcon from "../assets/Facebook.svg";
import whatsappIcon from "../assets/WhatsApp.svg";
import githubIcon from "../assets/github.svg";

const socialLinks = [
  { src: linkedinIcon, href: 'https://www.linkedin.com/in/hei-thon-2051b3274', alt: 'Linkedin' },
  { src: facebookIcon, href: 'https://www.facebook.com/share/1HXBTVNyrx/', alt: 'Facebook' },
  { src: githubIcon, href: 'https://github.com/thavon91', alt: 'GitHub' }
];

export default function SocialIcons({ size = 80, className = '' }) {
  return (
    <Box className={className} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.5, width: '100%' }}>
      {socialLinks.map((item, i) => {
        const isMailto = item.href.startsWith('mailto:');
        return (
          <a
            key={i}
            href={item.href}
            target={isMailto ? undefined : '_blank'}
            rel={isMailto ? undefined : 'noreferrer'}
            style={{
              width: size,
              height: size,
              borderRadius: '50%',
              padding: '0',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all .2s ease',
              cursor: 'pointer',
              textDecoration: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.1)';
              e.currentTarget.style.filter = 'brightness(1.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.filter = '';
            }}
          >
            <img
              src={item.src}
              alt={item.alt}
              style={{
                width: '70%',
                height: '70%',
                objectFit: 'contain'
              }}
            />
          </a>
        );
      })}
    </Box>
  );
}
