export const AMBIENT_SOUNDS = [
  {
    id: 'white',
    label: '白噪音',
    shortLabel: 'White',
    type: 'generated',
    color: '#d9efff',
  },
  {
    id: 'pink',
    label: '粉噪音',
    shortLabel: 'Pink',
    type: 'generated',
    color: '#ffd8de',
  },
  {
    id: 'brown',
    label: '棕噪音',
    shortLabel: 'Brown',
    type: 'generated',
    color: '#e7c99b',
  },
  {
    id: 'rain',
    label: '雨声',
    shortLabel: 'Rain',
    type: 'sample',
    src: '/audio/ambient/rain.mp3',
    fileName: 'rain.mp3',
    color: '#9cc9ff',
  },
  {
    id: 'ocean',
    label: '海浪',
    shortLabel: 'Ocean',
    type: 'sample',
    src: '/audio/ambient/ocean.mp3',
    fileName: 'ocean.mp3',
    color: '#8fe8df',
  },
  {
    id: 'storm',
    label: '风暴',
    shortLabel: 'Storm',
    type: 'sample',
    src: '/audio/ambient/storm.mp3',
    fileName: 'storm.mp3',
    color: '#d5e4ef',
  },
];

export function getAmbientSound(id) {
  return AMBIENT_SOUNDS.find((sound) => sound.id === id) || AMBIENT_SOUNDS[0];
}
