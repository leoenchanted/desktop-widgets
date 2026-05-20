const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function today() {
  return localDateKey();
}

export function millisecondsUntilNextDay(date = new Date()) {
  const next = new Date(date);
  next.setHours(24, 0, 1, 0);
  return Math.max(1000, next.getTime() - date.getTime());
}

export function parseDateKey(dateStr) {
  return new Date(`${dateStr}T00:00:00`);
}

export function formatDate(dateStr) {
  const d = parseDateKey(dateStr);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${year}年${month}月${day}日 周${WEEKDAYS[d.getDay()]}`;
}

export function formatShort(dateStr) {
  const d = parseDateKey(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function isToday(dateStr) {
  return dateStr === today();
}

export function getWeekday(dateStr) {
  const d = parseDateKey(dateStr);
  return `周${WEEKDAYS[d.getDay()]}`;
}

export function dateRange(start, end) {
  const dates = [];
  const current = parseDateKey(start);
  const endDate = parseDateKey(end);

  while (current <= endDate) {
    dates.push(localDateKey(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}
