import { exportAllStores, getSetting, importAllStores, setSetting } from '../data/localDb';
import { normalizeWidgetLayout } from '../config/widgetRegistry';
import { LEGACY_WORKSPACE_KEY, countMarkdownWords, inferMarkdownEntryDate } from './markdownApi';
import { blobToDataUrl, dataUrlToBlob } from '../utils/imageCompression';

const BACKUP_VERSION = 4;

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

function serializeSettings(settings = []) {
  return settings.filter(
    (row) => row?.key !== 'autoBackupDirectoryHandle' && row?.key !== 'autoBackupDirectoryName',
  );
}

function normalizeMarkdownRows(entries = []) {
  const byDate = new Map();

  entries.forEach((entry) => {
    if (!entry) return;
    const date = inferMarkdownEntryDate(entry);
    const content = entry.content || '';
    const normalized = {
      ...entry,
      date,
      content,
      word_count: countMarkdownWords(content),
      char_count: content.length,
      ...(entry.date === LEGACY_WORKSPACE_KEY ? { migrated_from: LEGACY_WORKSPACE_KEY } : {}),
    };
    delete normalized.migrated_to;
    delete normalized.migrated_at;

    const existing = byDate.get(date);
    if (!existing) {
      byDate.set(date, normalized);
      return;
    }

    if (!content.trim() || existing.content === content || existing.content?.includes(content)) return;

    const mergedContent = existing.content?.trim()
      ? `${existing.content}\n\n---\n\n## 导入合并草稿\n\n${content}`
      : content;

    byDate.set(date, {
      ...existing,
      content: mergedContent,
      word_count: countMarkdownWords(mergedContent),
      char_count: mergedContent.length,
      updated_at: [existing.updated_at, normalized.updated_at].filter(Boolean).sort().at(-1) || new Date().toISOString(),
    });
  });

  return Array.from(byDate.values());
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
    pinned: data.pinned_notes?.length || 0,
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
        settings: serializeSettings(data.settings),
        widgets: normalizeWidgetRows(data.widgets),
        markdown_entries: normalizeMarkdownRows(data.markdown_entries),
        assets: await serializeAssets(data.assets),
      },
    };
  },

  import: async (backup) => {
    const [directoryHandle, fileBackupEnabled] = await Promise.all([
      getSetting('autoBackupDirectoryHandle'),
      getSetting('autoBackupFileEnabled'),
    ]);
    const data = normalizeBackup(backup);
    const hydrated = {
      settings: data.settings || [],
      widgets: normalizeWidgetRows(data.widgets || []),
      todos: data.todos || [],
      markdown_entries: normalizeMarkdownRows(data.markdown_entries || []),
      daily_reviews: data.daily_reviews || [],
      pomodoro_sessions: data.pomodoro_sessions || [],
      assets: hydrateAssets(data.assets || []),
      pinned_notes: data.pinned_notes || [],
    };
    await importAllStores(hydrated);
    if (directoryHandle) {
      await setSetting('autoBackupDirectoryHandle', directoryHandle);
      await setSetting('autoBackupDirectoryName', directoryHandle.name);
      await setSetting('autoBackupFileEnabled', fileBackupEnabled ?? false);
    }
    return { ok: true, counts: countsFor(hydrated) };
  },
};
