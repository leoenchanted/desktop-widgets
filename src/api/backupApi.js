import { exportAllStores, importAllStores } from '../data/localDb';
import { normalizeWidgetLayout } from '../config/widgetRegistry';
import { blobToDataUrl, dataUrlToBlob } from '../utils/imageCompression';

const BACKUP_VERSION = 2;

async function serializeAssets(assets = []) {
  return Promise.all(
    assets.map(async (asset) => {
      if (!asset.blob) return asset;
      const dataUrl = await blobToDataUrl(asset.blob);
      const { blob, url, ...rest } = asset;
      void blob;
      void url;
      return { ...rest, dataUrl };
    }),
  );
}

function hydrateAssets(assets = []) {
  return assets.map((asset) => {
    if (!asset.dataUrl) return asset;
    const { dataUrl, ...rest } = asset;
    return {
      ...rest,
      blob: dataUrlToBlob(dataUrl),
      size: rest.size || dataUrl.length,
    };
  });
}

function normalizeWidgetRows(widgets = []) {
  return widgets.map((row) => {
    if (row?.key !== 'layout') return row;
    return {
      ...row,
      value: normalizeWidgetLayout(row.value),
    };
  });
}

function normalizeBackup(input) {
  if (!input) throw new Error('备份文件为空');
  if (input.data) return input.data;
  return input;
}

function countsFor(data) {
  return {
    settings: data.settings?.length || 0,
    widgets: data.widgets?.length || 0,
    todos: data.todos?.length || 0,
    markdown: data.markdown_entries?.length || 0,
    reviews: data.daily_reviews?.length || 0,
    pomodoro: data.pomodoro_sessions?.length || 0,
    assets: data.assets?.length || 0,
  };
}

export const backupApi = {
  export: async () => {
    const data = await exportAllStores();
    return {
      version: BACKUP_VERSION,
      app: 'desktop-widgets',
      storage: 'indexeddb',
      exportedAt: new Date().toISOString(),
      data: {
        ...data,
        widgets: normalizeWidgetRows(data.widgets),
        assets: await serializeAssets(data.assets),
      },
    };
  },

  import: async (backup) => {
    const data = normalizeBackup(backup);
    const hydrated = {
      settings: data.settings || [],
      widgets: normalizeWidgetRows(data.widgets || []),
      todos: data.todos || [],
      markdown_entries: data.markdown_entries || [],
      daily_reviews: data.daily_reviews || [],
      pomodoro_sessions: data.pomodoro_sessions || [],
      assets: hydrateAssets(data.assets || []),
    };
    await importAllStores(hydrated);
    return { ok: true, counts: countsFor(hydrated) };
  },
};
