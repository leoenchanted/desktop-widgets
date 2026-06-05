import { v4 as uuidv4 } from 'uuid';
import { getAllRecords, getRecord, putRecord } from '../data/localDb';
import { localDateKey, today } from '../utils/date';

export const LEGACY_WORKSPACE_KEY = 'workspace';
const now = () => new Date().toISOString();
const SEARCH_RESULT_LIMIT = 50;
const SEARCH_PAGE_RESULT_LIMIT = 5;
const SEARCH_EXCERPT_RADIUS = 56;

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
    const defaultPage = { id: uuidv4(), title: '页面 1', content: '', created_at: timestamp, updated_at: timestamp };
    return {
      id: uuidv4(),
      date,
      pages: [defaultPage],
      activePageId: defaultPage.id,
      content: '',
      word_count: 0,
      char_count: 0,
      created_at: timestamp,
      updated_at: timestamp,
    };
  }

  let pages = entry.pages;
  if (!pages || !Array.isArray(pages) || pages.length === 0) {
    const oldContent = entry.content || '';
    const pageId = uuidv4();
    pages = [{ id: pageId, title: '草稿', content: oldContent, created_at: entry.created_at || timestamp, updated_at: entry.updated_at || timestamp }];
  }

  const activePageId = entry.activePageId && pages.some((p) => p.id === entry.activePageId)
    ? entry.activePageId
    : pages[0].id;

  const activePage = pages.find((p) => p.id === activePageId) || pages[0];
  const content = activePage.content || '';

  return {
    ...entry,
    date,
    pages,
    activePageId,
    content,
    word_count: countMarkdownWords(content),
    char_count: content.length,
  };
}

function buildSearchExcerpt(content, matchIndex, matchLength) {
  const preferredBreaks = new Set(['\n', '。', '！', '？', '.', '!', '?', ';', '；']);
  let start = matchIndex;
  let end = matchIndex + matchLength;

  while (start > 0 && matchIndex - start < SEARCH_EXCERPT_RADIUS) {
    if (preferredBreaks.has(content[start - 1])) break;
    start -= 1;
  }

  while (end < content.length && end - matchIndex < SEARCH_EXCERPT_RADIUS) {
    if (preferredBreaks.has(content[end])) {
      end += content[end] === '\n' ? 0 : 1;
      break;
    }
    end += 1;
  }

  const hasPrefix = start > 0;
  const hasSuffix = end < content.length;
  const excerpt = content
    .slice(start, end)
    .replace(/\s+/g, ' ')
    .trim();

  return {
    excerpt: `${hasPrefix ? '...' : ''}${excerpt}${hasSuffix ? '...' : ''}`,
    excerptStart: start,
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

  save: async (date = today(), data = {}) => {
    const key = date || today();
    const existing = await getRecord('markdown_entries', key);
    const timestamp = now();

    const pages = data.pages || [];
    const activePageId = data.activePageId || pages[0]?.id || null;
    const activePage = pages.find((p) => p.id === activePageId) || pages[0];
    const content = activePage?.content || '';

    const entry = {
      id: existing?.id || uuidv4(),
      date: key,
      pages,
      activePageId,
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
      .filter((entry) => entry.pages?.some((p) => p.content?.trim()))
      .map((entry) => entry.date)
      .sort((a, b) => b.localeCompare(a));
  },

  searchDrafts: async (query) => {
    const keyword = query.trim();
    if (!keyword) return [];

    const needle = keyword.toLocaleLowerCase();
    const entries = await getDatedEntries();
    const results = [];

    for (const entry of entries.sort((a, b) => b.date.localeCompare(a.date))) {
      for (const page of entry.pages || []) {
        const content = page.content || '';
        if (!content.trim()) continue;

        const haystack = content.toLocaleLowerCase();
        let fromIndex = 0;
        let pageMatches = 0;

        while (results.length < SEARCH_RESULT_LIMIT && pageMatches < SEARCH_PAGE_RESULT_LIMIT) {
          const matchIndex = haystack.indexOf(needle, fromIndex);
          if (matchIndex === -1) break;

          const { excerpt, excerptStart } = buildSearchExcerpt(content, matchIndex, keyword.length);
          results.push({
            id: `${entry.date}:${page.id}:${matchIndex}`,
            date: entry.date,
            pageId: page.id,
            pageTitle: page.title || '草稿',
            excerpt,
            excerptStart,
            matchIndex,
            matchLength: keyword.length,
          });

          pageMatches += 1;
          fromIndex = matchIndex + Math.max(keyword.length, 1);
        }

        if (results.length >= SEARCH_RESULT_LIMIT) return results;
      }
    }

    return results;
  },
};
