import { v4 as uuidv4 } from 'uuid';
import { getAllRecords, getRecord, putRecord } from '../data/localDb';

const WORKSPACE_KEY = 'workspace';
const now = () => new Date().toISOString();

function countWords(content) {
  return content.trim() ? content.trim().split(/\s+/).length : 0;
}

function normalizeEntry(entry, date) {
  if (!entry) {
    return {
      id: uuidv4(),
      date,
      content: '',
      word_count: 0,
      char_count: 0,
      created_at: now(),
      updated_at: now(),
    };
  }

  return {
    ...entry,
    word_count: entry.word_count ?? countWords(entry.content || ''),
    char_count: entry.char_count ?? (entry.content || '').length,
  };
}

async function latestLegacyDraft() {
  const entries = await getAllRecords('markdown_entries');
  return entries
    .filter((entry) => entry.date !== WORKSPACE_KEY && entry.content?.trim())
    .sort((a, b) => (b.updated_at || b.date).localeCompare(a.updated_at || a.date))[0];
}

export const markdownApi = {
  getByDate: async (date = WORKSPACE_KEY) => {
    const key = date || WORKSPACE_KEY;
    const entry = await getRecord('markdown_entries', key);
    if (entry?.content?.trim() || key !== WORKSPACE_KEY) {
      return normalizeEntry(entry, key);
    }

    const legacy = await latestLegacyDraft();
    if (legacy) {
      const migrated = {
        ...normalizeEntry(legacy, WORKSPACE_KEY),
        id: uuidv4(),
        date: WORKSPACE_KEY,
        migrated_from: legacy.date,
        created_at: now(),
        updated_at: now(),
      };
      await putRecord('markdown_entries', migrated);
      return migrated;
    }

    return normalizeEntry(entry, key);
  },

  save: async (date = WORKSPACE_KEY, content = '') => {
    const key = date || WORKSPACE_KEY;
    const existing = await getRecord('markdown_entries', key);
    const timestamp = now();
    const entry = {
      id: existing?.id || uuidv4(),
      date: key,
      content,
      word_count: countWords(content),
      char_count: content.length,
      created_at: existing?.created_at || timestamp,
      updated_at: timestamp,
    };
    await putRecord('markdown_entries', entry);
    return entry;
  },
};
