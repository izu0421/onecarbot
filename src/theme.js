// Palette carried over from the website (css/style.css :root) so the app and
// onecarbon.com read as one product. Square corners are deliberate there — the
// --radius-* tokens are all 0px — so keep radii small here too.
export const colors = {
  accent: '#1f355a',
  accentDark: '#162844',
  bg: '#F7F5F0',
  bgAlt: '#EFEDE8',
  surface: '#ffffff',
  text: '#1a1a18',
  textMuted: '#555555',
  textFaint: '#888888',
  border: 'rgba(0,0,0,0.10)',
  good: '#3F7D59',
  goodBg: '#F2F8F4',
  danger: '#A8341F',
};

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

export const radius = { sm: 2, md: 4, pill: 100 };

export const type = {
  h1: { fontSize: 30, lineHeight: 34, fontWeight: '600', color: colors.text, letterSpacing: -0.5 },
  h2: { fontSize: 22, lineHeight: 27, fontWeight: '600', color: colors.text, letterSpacing: -0.3 },
  h3: { fontSize: 17, lineHeight: 22, fontWeight: '600', color: colors.text },
  body: { fontSize: 16, lineHeight: 24, color: colors.textMuted },
  small: { fontSize: 13, lineHeight: 19, color: colors.textFaint },
  // Tabular figures matter on the results screen — scores jump around otherwise.
  mono: { fontVariant: ['tabular-nums'], fontSize: 16, color: colors.text },
};
