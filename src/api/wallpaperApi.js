import { api } from './client';

export const wallpaperApi = {
  upload: ({ filename, mimeType, dataUrl }) =>
    api.post('/wallpaper/upload', { filename, mimeType, dataUrl }),
};
