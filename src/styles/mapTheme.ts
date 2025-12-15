export const mapTheme = {
  // Brand and neutral foundation (dark UI)
  color: {
    canvas: '#0b0f14',
    surface: 'rgba(17,19,24,0.88)',      // panels
    surfaceSubtle: 'rgba(17,19,24,0.76)',
    border: 'rgba(255,255,255,0.10)',
    borderStrong: 'rgba(255,255,255,0.16)',
    text: '#e9eef5',
    textMuted: 'rgba(233,238,245,0.65)',
    halo: '#0b0f14',
    accent: '#22d3ee',                   // cyan-accent for selected states
    accentStrong: '#67e8f9',

    // Campus ground
    campusFill: '#0e141c',
    campusLine: '#30b7d9',

    // Outdoor categories (muted, professional)
    outdoor: {
      water: '#4aa4ff',
      ground: '#36b87a'
    },

    // Buildings (muted per category)
    building: {
      Academic: '#5973ff',
      Admin: '#3fb6e8',
      Auditorium: '#8b92ff',
      Cafeteria: '#ff6b9a',
      Library: '#7a6cf8',
      Parking: '#8b8f99',
      Hostel: '#f0a23a',
      Sports: '#2ec49c',
      Medical: '#f45d5d',
      Lab: '#6e7df1',
      Other: '#7b82a1'
    }
  },

  // Shape
  radius: {
    xs: 6,
    sm: 8,
    md: 12,
    lg: 14
  },

  // Shadows
  shadow: {
    panel: '0 10px 30px -12px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.05)',
    soft: '0 6px 18px -8px rgba(0,0,0,0.45)',
    chip: '0 2px 10px -4px rgba(0,0,0,0.45)'
  },

  // Spacing scale
  space: (n: number) => n * 4
};

export function categoryColor(name?: string) {
  const c = mapTheme.color.building;
  if (!name) return c.Other;
  return (c as any)[name] ?? c.Other;
}