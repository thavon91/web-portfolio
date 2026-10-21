import { createTheme } from '@mui/material/styles';

const heading = {
  fontFamily: "'Inter', sans-serif",
  fontWeight: 800,
};

const theme = createTheme({
  typography: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 16,
    h1: { ...heading, fontWeight: 900, fontSize: '5rem' },
    h2: { ...heading, fontWeight: 900, fontSize: '4.2rem' },
    h3: { ...heading, fontSize: '3.5rem' },
    h4: { ...heading, fontSize: '2.8rem' },
    h5: { ...heading, fontSize: '2.2rem' },
    h6: { ...heading, fontSize: '1.8rem' },
    body1: { fontFamily: "'Inter', sans-serif", fontSize: '1.3rem' },
    body2: { fontFamily: "'Inter', sans-serif", fontSize: '1.2rem' },
    button: { ...heading, fontWeight: 800 },
    overline: { ...heading, fontWeight: 700 },
  },
});

export default theme;
