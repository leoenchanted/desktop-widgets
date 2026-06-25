import { getAllRecords } from '../data/localDb';
import { dateRange, localDateKey, parseDateKey, today } from '../utils/date';

const DAY_MS = 24 * 60 * 60 * 1000;
const CJK_REGEX = /[\u3400-\u9fff\uf900-\ufaff]/g;
const LATIN_WORD_REGEX = /[A-Za-z0-9]+(?:[-_'][A-Za-z0-9]+)*/g;

export function countActivityWords(content = '') {
  const source = String(content);
  if (!source.trim()) return 0;

  const cjkCount = source.match(CJK_REGEX)?.length || 0;
  const latinSource = source.replace(CJK_REGEX, ' ');
  const latinWordCount = latinSource.match(LATIN_WORD_REGEX)?.length || 0;

  return cjkCount + latinWordCount;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(date) {
  const next = new Date(date);
  next.setDate(next.getDate() - next.getDay());
  return next;
}

function getMarkdownStats(entry) {
  if (!entry) return { markdownChars: 0, markdownWords: 0 };

  const pages = Array.isArray(entry.pages) && entry.pages.length
    ? entry.pages
    : [{ content: entry.content || '' }];
  const content = pages.map((page) => page.content || '').join('\n');

  return {
    markdownChars: content.length,
    markdownWords: countActivityWords(content),
  };
}

function getActivityScore(day) {
  const markdownScore = Math.min(40, day.markdownWords / 20);
  const todoScore = Math.min(30, day.completedTodos * 8);
  const focusScore = Math.min(25, day.focusMinutes / 2);
  const reviewScore = day.hasReview ? 5 : 0;

  return Math.round(markdownScore + todoScore + focusScore + reviewScore);
}

function getActivityLevel(score) {
  if (score <= 0) return 0;
  if (score < 20) return 1;
  if (score < 45) return 2;
  if (score < 75) return 3;
  return 4;
}

function buildDay(date, grouped) {
  const markdownEntry = grouped.markdown.get(date);
  const todos = grouped.todos.get(date) || [];
  const sessions = grouped.sessions.get(date) || [];
  const review = grouped.reviews.get(date);
  const markdownStats = getMarkdownStats(markdownEntry);
  const completedTodos = todos.filter((todo) => Boolean(todo.completed)).length;
  const focusMinutes = sessions
    .filter((session) => session.completed !== 0)
    .reduce((total, session) => total + Number(session.duration || 0), 0);
  const hasReview = Boolean(review?.notes?.trim());
  const score = getActivityScore({
    ...markdownStats,
    completedTodos,
    focusMinutes,
    hasReview,
  });

  return {
    date,
    score,
    level: getActivityLevel(score),
    ...markdownStats,
    completedTodos,
    totalTodos: todos.length,
    focusMinutes,
    pomodoroCount: sessions.filter((session) => session.completed !== 0).length,
    hasReview,
  };
}

function groupByDate(records) {
  const grouped = new Map();
  records.forEach((record) => {
    if (!record?.date) return;
    const existing = grouped.get(record.date) || [];
    existing.push(record);
    grouped.set(record.date, existing);
  });
  return grouped;
}

async function getGroupedData() {
  const [markdownEntries, todos, sessions, reviews] = await Promise.all([
    getAllRecords('markdown_entries'),
    getAllRecords('todos'),
    getAllRecords('pomodoro_sessions'),
    getAllRecords('daily_reviews'),
  ]);

  return {
    markdown: new Map(
      markdownEntries
        .filter((entry) => entry.date && entry.date !== 'workspace')
        .map((entry) => [entry.date, entry]),
    ),
    todos: groupByDate(todos),
    sessions: groupByDate(sessions),
    reviews: new Map(reviews.filter((review) => review.date).map((review) => [review.date, review])),
  };
}

export const activityApi = {
  getActivityRange: async (startDate, endDate = today()) => {
    const grouped = await getGroupedData();
    return dateRange(startDate, endDate).map((date) => buildDay(date, grouped));
  },

  getRecentActivity: async (days = 183, endDate = today()) => {
    const end = parseDateKey(endDate);
    const start = addDays(end, -(Math.max(1, days) - 1));
    return activityApi.getActivityRange(localDateKey(start), endDate);
  },

  getHeatmapWindow: async (days = 183, endDate = today()) => {
    const end = parseDateKey(endDate);
    const rawStart = addDays(end, -(Math.max(1, days) - 1));
    const start = startOfWeek(rawStart);
    const allDays = await activityApi.getActivityRange(localDateKey(start), endDate);
    const paddedEnd = addDays(end, 6 - end.getDay());
    const dates = dateRange(localDateKey(start), localDateKey(paddedEnd));
    const dayMap = new Map(allDays.map((day) => [day.date, day]));

    return dates.map((date) => (
      dayMap.get(date) || {
        date,
        score: 0,
        level: 0,
        markdownChars: 0,
        markdownWords: 0,
        completedTodos: 0,
        totalTodos: 0,
        focusMinutes: 0,
        pomodoroCount: 0,
        hasReview: false,
        isFuture: parseDateKey(date).getTime() > end.getTime() + DAY_MS - 1,
      }
    ));
  },

  getMonthlySummary: async (year, month) => {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const end = new Date(year, month, 0);
    const days = await activityApi.getActivityRange(startDate, localDateKey(end));

    return {
      year,
      month,
      days,
      totalScore: days.reduce((total, day) => total + day.score, 0),
      totalMarkdownWords: days.reduce((total, day) => total + day.markdownWords, 0),
      completedTodos: days.reduce((total, day) => total + day.completedTodos, 0),
      focusMinutes: days.reduce((total, day) => total + day.focusMinutes, 0),
      reviewDays: days.filter((day) => day.hasReview).length,
      activeDays: days.filter((day) => day.score > 0).length,
      bestDay: days.reduce((best, day) => (day.score > (best?.score || 0) ? day : best), null),
    };
  },
};
