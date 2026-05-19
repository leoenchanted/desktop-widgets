import { v4 as uuidv4 } from 'uuid';
import { getRecord, putRecord } from '../data/localDb';
import { compressImageForLocalStorage, dataUrlToBlob } from '../utils/imageCompression';

function toFileLike({ file, filename, mimeType, dataUrl }) {
  if (file) return file;
  if (!dataUrl) throw new Error('No wallpaper image provided');
  const blob = dataUrlToBlob(dataUrl);
  return new File([blob], filename || 'wallpaper', { type: mimeType || blob.type });
}

export const wallpaperApi = {
  upload: async (input) => {
    const file = toFileLike(input);
    const compressed = await compressImageForLocalStorage(file);
    const timestamp = new Date().toISOString();
    const asset = {
      id: uuidv4(),
      type: input.type || 'wallpaper',
      name: file.name || 'wallpaper',
      mimeType: compressed.mimeType,
      blob: compressed.blob,
      size: compressed.blob.size,
      originalSize: file.size,
      width: compressed.width,
      height: compressed.height,
      compressed: compressed.compressed,
      created_at: timestamp,
      updated_at: timestamp,
    };
    await putRecord('assets', asset);
    return {
      assetId: asset.id,
      url: URL.createObjectURL(asset.blob),
      compressed: asset.compressed,
      size: asset.size,
      originalSize: asset.originalSize,
      width: asset.width,
      height: asset.height,
    };
  },

  getObjectUrl: async (assetId) => {
    const asset = await getRecord('assets', assetId);
    if (!asset?.blob) return null;
    return URL.createObjectURL(asset.blob);
  },
};
