import { create } from 'zustand';
import {
  estimateStorage,
  getSetting,
  isPersistentStorage,
  requestPersistentStorage,
  setSetting,
} from '../data/localDb';
import { wallpaperApi } from '../api/wallpaperApi';

const DEFAULT_BG =
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?ixlib=rb-4.0.3&auto=format&fit=crop&w=2940&q=80';

function legacyValue(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

async function persistSetting(key, value) {
  try {
    await setSetting(key, value);
  } catch (error) {
    console.error(`Failed to persist setting: ${key}`, error);
  }
}

export const useSettingsStore = create((set, get) => ({
  bg: DEFAULT_BG,
  username: 'Guest',
  activeSection: 'widgets',
  isEditMode: false,
  initialized: false,
  wallpaperAssetId: null,
  storagePersisted: false,
  storageEstimate: null,

  initializeSettings: async () => {
    if (get().initialized) return;

    const [
      storedBg,
      storedUser,
      storedSection,
      storedWallpaperKind,
      storedWallpaperAssetId,
      persistentRequested,
    ] = await Promise.all([
      getSetting('bg'),
      getSetting('username'),
      getSetting('activeSection'),
      getSetting('wallpaperKind'),
      getSetting('wallpaperAssetId'),
      getSetting('persistentStorageRequested', false),
    ]);

    let bg = storedBg || legacyValue('glass_bg') || DEFAULT_BG;
    const username = storedUser || legacyValue('glass_user') || 'Guest';
    const activeSection = storedSection || legacyValue('glass_section') || 'widgets';
    let wallpaperAssetId = storedWallpaperAssetId || null;

    if (storedWallpaperKind === 'asset' && wallpaperAssetId) {
      const assetUrl = await wallpaperApi.getObjectUrl(wallpaperAssetId);
      if (assetUrl) bg = assetUrl;
      else wallpaperAssetId = null;
    }

    if (!storedBg && bg && storedWallpaperKind !== 'asset') await persistSetting('bg', bg);
    if (!storedUser) await persistSetting('username', username);
    if (!storedSection) await persistSetting('activeSection', activeSection);

    let storagePersisted = await isPersistentStorage();
    if (!persistentRequested && !storagePersisted) {
      storagePersisted = await requestPersistentStorage();
      await persistSetting('persistentStorageRequested', true);
      await persistSetting('persistentStorageGranted', storagePersisted);
    }

    const storageEstimate = await estimateStorage();

    set({
      bg,
      username,
      activeSection,
      wallpaperAssetId,
      storagePersisted,
      storageEstimate,
      initialized: true,
    });
  },

  setBg: (bg) => {
    set({ bg, wallpaperAssetId: null });
    persistSetting('bg', bg);
    persistSetting('wallpaperKind', 'url');
    persistSetting('wallpaperAssetId', null);
  },

  setWallpaperAsset: (assetId, objectUrl) => {
    set({ bg: objectUrl, wallpaperAssetId: assetId });
    persistSetting('bg', null);
    persistSetting('wallpaperKind', 'asset');
    persistSetting('wallpaperAssetId', assetId);
  },

  setUsername: (username) => {
    set({ username });
    persistSetting('username', username);
  },

  toggleSection: () => {
    const activeSection = get().activeSection === 'widgets' ? 'work' : 'widgets';
    set({ activeSection });
    persistSetting('activeSection', activeSection);
  },

  setSection: (activeSection) => {
    set({ activeSection });
    persistSetting('activeSection', activeSection);
  },

  toggleEditMode: () => set((state) => ({ isEditMode: !state.isEditMode })),
}));

export { DEFAULT_BG };
