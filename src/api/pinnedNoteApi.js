import { getRecord, putRecord } from '../data/localDb';

const PINNED_NOTE_ID = 'main';

function countWords(text = '') {
  const compact = text.trim();
  if (!compact) return 0;
  return compact.split(/\s+/).filter(Boolean).length;
}

function normalizeNote(row) {
  const content = row?.content || '';
  return {
    id: PINNED_NOTE_ID,
    content,
    char_count: content.length,
    word_count: countWords(content),
    created_at: row?.created_at || new Date().toISOString(),
    updated_at: row?.updated_at || null,
  };
}

export const pinnedNoteApi = {
  get: async () => {
    const row = await getRecord('pinned_notes', PINNED_NOTE_ID);
    return normalizeNote(row);
  },

  save: async (content) => {
    const existing = await getRecord('pinned_notes', PINNED_NOTE_ID);
    const now = new Date().toISOString();
    const row = {
      id: PINNED_NOTE_ID,
      content,
      char_count: content.length,
      word_count: countWords(content),
      created_at: existing?.created_at || now,
      updated_at: now,
    };
    await putRecord('pinned_notes', row);
    return row;
  },
};
