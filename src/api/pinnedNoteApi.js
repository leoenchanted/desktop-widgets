import { getRecord, putRecord } from '../data/localDb';

const PINNED_NOTE_ID = 'main';
const DEFAULT_CATEGORY_TITLE = '默认';

const now = () => new Date().toISOString();

function countWords(text = '') {
  const compact = text.trim();
  if (!compact) return 0;
  return compact.split(/\s+/).filter(Boolean).length;
}

function createCategory({
  id,
  title = DEFAULT_CATEGORY_TITLE,
  content = '',
  locked = false,
  encrypted = null,
  created_at,
  updated_at,
} = {}) {
  const timestamp = now();
  return {
    id: id || crypto.randomUUID(),
    title: title?.trim() || DEFAULT_CATEGORY_TITLE,
    content: locked ? '' : content,
    locked: Boolean(locked),
    encrypted: encrypted || null,
    created_at: created_at || timestamp,
    updated_at: updated_at || timestamp,
  };
}

function normalizeNote(row) {
  const timestamp = now();
  const categories = Array.isArray(row?.categories) && row.categories.length > 0
    ? row.categories.map((category, index) => createCategory({
      ...category,
      title: category.title || (index === 0 ? DEFAULT_CATEGORY_TITLE : `分类 ${index + 1}`),
      content: category.content || '',
      created_at: category.created_at || row?.created_at || timestamp,
      updated_at: category.updated_at || row?.updated_at || null,
    }))
    : [createCategory({
      title: DEFAULT_CATEGORY_TITLE,
      content: row?.content || '',
      created_at: row?.created_at || timestamp,
      updated_at: row?.updated_at || null,
    })];

  const activeCategoryId = categories.some((category) => category.id === row?.activeCategoryId)
    ? row.activeCategoryId
    : categories[0].id;
  const activeCategory = categories.find((category) => category.id === activeCategoryId) || categories[0];
  const content = activeCategory.content || '';
  const totalContent = categories.map((category) => category.content || '').join('\n');

  return {
    id: PINNED_NOTE_ID,
    content,
    activeCategoryId,
    categories,
    password: row?.password || null,
    char_count: content.length,
    word_count: countWords(content),
    total_char_count: totalContent.length,
    total_word_count: countWords(totalContent),
    created_at: row?.created_at || timestamp,
    updated_at: row?.updated_at || null,
  };
}

function normalizeSavePayload(payload, existing) {
  const base = normalizeNote(existing);

  if (typeof payload === 'string') {
    const timestamp = now();
    return {
      ...base,
      categories: base.categories.map((category) => (
        category.id === base.activeCategoryId
          ? { ...category, content: payload, updated_at: timestamp }
          : category
      )),
    };
  }

  return normalizeNote({
    ...base,
    ...payload,
    id: PINNED_NOTE_ID,
  });
}

export const pinnedNoteApi = {
  get: async () => {
    const row = await getRecord('pinned_notes', PINNED_NOTE_ID);
    return normalizeNote(row);
  },

  save: async (payload) => {
    const existing = await getRecord('pinned_notes', PINNED_NOTE_ID);
    const timestamp = now();
    const normalized = normalizeSavePayload(payload, existing);
    const activeCategory = normalized.categories.find((category) => category.id === normalized.activeCategoryId)
      || normalized.categories[0];
    const content = activeCategory?.content || '';
    const totalContent = normalized.categories.map((category) => category.content || '').join('\n');
    const row = {
      id: PINNED_NOTE_ID,
      activeCategoryId: normalized.activeCategoryId,
      categories: normalized.categories,
      password: normalized.password || null,
      content,
      char_count: content.length,
      word_count: countWords(content),
      total_char_count: totalContent.length,
      total_word_count: countWords(totalContent),
      created_at: existing?.created_at || timestamp,
      updated_at: timestamp,
    };
    await putRecord('pinned_notes', row);
    return row;
  },
};
