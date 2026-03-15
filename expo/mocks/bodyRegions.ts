import { BodyRegion } from '@/types';

export const bodyRegions: BodyRegion[] = [
  { id: 'neck', label: 'Neck', icon: 'spine' },
  { id: 'shoulder', label: 'Shoulder', icon: 'arm' },
  { id: 'upper-back', label: 'Upper Back', icon: 'back' },
  { id: 'lower-back', label: 'Lower Back', icon: 'back' },
  { id: 'chest', label: 'Chest', icon: 'heart' },
  { id: 'elbow', label: 'Elbow', icon: 'arm' },
  { id: 'wrist', label: 'Wrist', icon: 'hand' },
  { id: 'hip', label: 'Hip', icon: 'leg' },
  { id: 'knee', label: 'Knee', icon: 'leg' },
  { id: 'ankle', label: 'Ankle', icon: 'foot' },
  { id: 'foot', label: 'Foot', icon: 'foot' },
  { id: 'other', label: 'Other', icon: 'plus' },
];

export const painTypes = [
  { id: 'sharp', label: 'Sharp', emoji: '⚡' },
  { id: 'dull', label: 'Dull', emoji: '🔵' },
  { id: 'aching', label: 'Aching', emoji: '💫' },
  { id: 'burning', label: 'Burning', emoji: '🔥' },
  { id: 'stiffness', label: 'Stiffness', emoji: '🧊' },
  { id: 'throbbing', label: 'Throbbing', emoji: '💢' },
];
