export const COLORS = {
  primary: '#00ffff',
  secondary: '#ff00ff',
  success: '#00ff88',
  warning: '#ffaa00',
  danger: '#ff4444',

  bg: '#1a1a2e',
  bgDark: '#0d0d1a',
  text: '#ffffff',
  textMuted: '#aaaaaa',
  textDim: '#666666',
};

export const FONTS = {
  title: { size: '48px', family: 'Courier New', style: 'bold' },
  heading: { size: '28px', family: 'Courier New', style: 'bold' },
  body: { size: '18px', family: 'Courier New' },
  label: { size: '16px', family: 'Courier New' },
  small: { size: '14px', family: 'Courier New' },
};

export function fontStyle(preset, color = COLORS.text) {
  const f = FONTS[preset] || FONTS.body;
  return {
    fontSize: f.size,
    fontFamily: f.family,
    fontStyle: f.style || '',
    fill: color,
  };
}
