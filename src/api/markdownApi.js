import { v4 as uuidv4 } from 'uuid';
import { getAllRecords, getRecord, putRecord } from '../data/localDb';
import { localDateKey, today } from '../utils/date';

export const LEGACY_WORKSPACE_KEY = 'workspace';
const now = () => new Date().toISOString();

export function countMarkdownWords(content) {
  return content.trim() ? content.trim().split(/\s+/).length : 0;
}

export function inferMarkdownEntryDate(entry) {
  if (entry?.date && entry.date !== LEGACY_WORKSPACE_KEY) return entry.date;

  const timestamp = entry?.updated_at || entry?.created_at;
  if (timestamp) {
    const parsed = new Date(timestamp);
    if (!Number.isNaN(parsed.getTime())) return localDateKey(parsed);
  }

  return today();
}

function normalizeEntry(entry, date) {
  const timestamp = now();
  if (!entry) {
    return {
      id: uuidv4(),
      date,
      content: '',
      word_count: 0,
      char_count: 0,
      created_at: timestamp,
      updated_at: timestamp,
    };
  }

  const content = entry.content || '';
  return {
    ...entry,
    date,
    content,
    word_count: countMarkdownWords(content),
    char_count: content.length,
  };
}

async function migrateLegacyWorkspaceDraft() {
  const legacy = await getRecord('markdown_entries', LEGACY_WORKSPACE_KEY);
  if (!legacy?.content?.trim() || legacy.migrated_to) return null;

  const targetDate = inferMarkdownEntryDate(legacy);
  const existing = await getRecord('markdown_entries', targetDate);
  const timestamp = now();
  let content = legacy.content || '';

  if (existing?.content?.trim() && existing.content !== content && !existing.content.includes(content)) {
    content = `${existing.content}\n\n---\n\n## 旧长期草稿迁移\n\n${content}`;
  } else if (existing?.content?.trim()) {
    content = existing.content;
  }

  const migrated = {
    ...normalizeEntry(existing || legacy, targetDate),
    id: existing?.id || uuidv4(),
    date: targetDate,
    content,
    word_count: countMarkdownWords(content),
    char_count: content.length,
    migrated_from: LEGACY_WORKSPACE_KEY,
    created_at: existing?.created_at || legacy.created_at || timestamp,
    updated_at: timestamp,
  };

  await putRecord('markdown_entries', migrated);
  await putRecord('markdown_entries', {
    ...legacy,
    migrated_to: targetDate,
    migrated_at: timestamp,
    updated_at: timestamp,
  });

  return migrated;
}

async function getDatedEntries() {
  await migrateLegacyWorkspaceDraft();
  const entries = await getAllRecords('markdown_entries');
  return entries
    .filter((entry) => entry.date !== LEGACY_WORKSPACE_KEY)
    .map((entry) => normalizeEntry(entry, entry.date));
}

export const markdownApi = {
  getByDate: async (date = today()) => {
    await migrateLegacyWorkspaceDraft();
    const key = date || today();
    const entry = await getRecord('markdown_entries', key);
    return normalizeEntry(entry, key);
  },

  save: async (date = today(), content = '') => {
    const key = date || today();
    const existing = await getRecord('markdown_entries', key);
    const timestamp = now();
    const entry = {
      id: existing?.id || uuidv4(),
      date: key,
      content,
      word_count: countMarkdownWords(content),
      char_count: content.length,
      created_at: existing?.created_at || timestamp,
      updated_at: timestamp,
    };
    await putRecord('markdown_entries', entry);
    return entry;
  },

  getAllDates: async () => {
    const entries = await getDatedEntries();
    return entries
      .filter((entry) => entry.content?.trim())
      .map((entry) => entry.date)
      .sort((a, b) => b.localeCompare(a));
  },
};
