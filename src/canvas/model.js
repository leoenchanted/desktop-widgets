export const CANVAS_FONTS = [
  { label: '系统黑体', value: 'system', family: '"PingFang SC", "Microsoft YaHei UI", sans-serif' },
  { label: '思源宋体', value: 'noto-serif', family: '"Noto Serif SC", serif' },
  { label: '小薇体', value: 'xiaowei', family: '"ZCOOL XiaoWei", serif' },
  { label: '马善政', value: 'ma-shan', family: '"Ma Shan Zheng", cursive' },
  { label: 'Excalifont · 手绘', value: 'excalifont', family: '"Excalifont", "Ma Shan Zheng", cursive' },
  { label: 'Poppins · 英文', value: 'poppins', family: '"Poppins", "PingFang SC", "Microsoft YaHei UI", sans-serif' },
];

export const CANVAS_COLORS = ['#f6f7f5', '#bce8dd', '#a9d8f5', '#f3cda8', '#f3aeb1', '#f8e5a2', '#101c25'];

export function fontFamily(value) {
  return CANVAS_FONTS.find(font => font.value === value)?.family || CANVAS_FONTS[0].family;
}

let measureContext;

function textMeasureContext(fontSize, font) {
  if (!measureContext) measureContext = document.createElement('canvas').getContext('2d');
  measureContext.font = `${fontSize}px ${fontFamily(font)}`;
  return measureContext;
}

export function wrapCanvasText(text, fontSize, font, maxWidth) {
  const paragraphs = String(text || '').split('\n');
  if (!maxWidth) return paragraphs;
  const context = textMeasureContext(fontSize, font);
  const lines = [];
  for (const paragraph of paragraphs) {
    let current = '';
    for (const chunk of paragraph.match(/\S+|\s+/gu) || []) {
      if (context.measureText(current + chunk).width <= maxWidth) {
        current += chunk;
        continue;
      }
      if (current) lines.push(current);
      if (context.measureText(chunk).width <= maxWidth) {
        current = chunk;
        continue;
      }
      current = '';
      for (const char of Array.from(chunk)) {
        if (current && context.measureText(current + char).width > maxWidth) {
          lines.push(current);
          current = char;
        } else current += char;
      }
    }
    lines.push(current);
  }
  return lines;
}

export function compareVersion(a, b) {
  if (!b) return 1;
  if (!a) return -1;
  if (a[0] !== b[0]) return a[0] - b[0];
  return String(a[1]).localeCompare(String(b[1]));
}

export function mergeElements(current, incoming) {
  const map = new Map(current.map(element => [element.id, element]));
  for (const element of incoming) {
    if (!element || typeof element.id !== 'string' || !['rect', 'ellipse', 'line', 'pen', 'text', 'image'].includes(element.type)) continue;
    if (compareVersion(element.version, map.get(element.id)?.version) > 0) map.set(element.id, element);
  }
  return Array.from(map.values());
}

export function elementBounds(element) {
  if (element.type === 'text') {
    const fontSize = element.fontSize || 28;
    const lines = wrapCanvasText(element.text, fontSize, element.font, element.wrapWidth);
    const context = textMeasureContext(fontSize, element.font);
    const naturalWidth = Math.max(80, ...lines.map(line => context.measureText(line || ' ').width));
    return {
      x: element.x,
      y: element.y,
      w: element.wrapWidth || naturalWidth,
      h: lines.length * fontSize * (element.lineHeight || 1.4),
    };
  }
  if (element.type === 'pen') {
    const xs = element.points?.map(point => point[0]) || [element.x];
    const ys = element.points?.map(point => point[1]) || [element.y];
    return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(1, Math.max(...xs) - Math.min(...xs)), h: Math.max(1, Math.max(...ys) - Math.min(...ys)) };
  }
  return { x: Math.min(element.x, element.x + (element.w || 0)), y: Math.min(element.y, element.y + (element.h || 0)), w: Math.abs(element.w || 0), h: Math.abs(element.h || 0) };
}

export function translated(element, dx, dy) {
  if (element.type === 'pen') return { ...element, points: element.points.map(([x, y]) => [x + dx, y + dy]), x: element.x + dx, y: element.y + dy };
  return { ...element, x: element.x + dx, y: element.y + dy };
}
