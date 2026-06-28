export const EVENT_COLORS = [
  { name: 'Tomato', value: '#D50000' },
  { name: 'Flamingo', value: '#E67C73' },
  { name: 'Tangerine', value: '#F4511E' },
  { name: 'Banana', value: '#F6BF26' },
  { name: 'Sage', value: '#33B679' },
  { name: 'Basil', value: '#0B8043' },
  { name: 'Peacock', value: '#039BE5' },
  { name: 'Blueberry', value: '#3F51B5' },
  { name: 'Lavender', value: '#7986CB' },
  { name: 'Grape', value: '#8E24AA' },
  { name: 'Graphite', value: '#616161' },
  { name: 'Calendar', value: '#4285F4' },
];

export const DEFAULT_EVENT_COLOR = '#4285F4';

export function getContrastColor(hexColor: string): string {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1a1a1a' : '#ffffff';
}

export function lightenColor(hex: string, amount: number = 0.85): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const newR = Math.round(r + (255 - r) * amount);
  const newG = Math.round(g + (255 - g) * amount);
  const newB = Math.round(b + (255 - b) * amount);

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}
