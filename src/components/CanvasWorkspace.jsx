import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FiAlignCenter, FiAlignLeft, FiAlignRight, FiArrowLeft, FiArrowDownLeft, FiCircle, FiCopy, FiEdit3, FiImage, FiLink2, FiMaximize2, FiMinus, FiMousePointer, FiMove, FiPlus, FiShare2, FiSlash, FiSquare, FiTrash2, FiType, FiRotateCcw, FiRotateCw } from 'react-icons/fi';
import { getRecord, putRecord } from '../data/localDb';
import { createCanvasSession } from '../canvas/collaboration';
import { createRelayCanvasSession, hasCanvasRelay } from '../canvas/relayCollaboration';
import { createInvite, inviteUrl, readInvite } from '../canvas/invite';
import { CANVAS_COLORS, CANVAS_FONTS, compareVersion, elementBounds, fontFamily, mergeElements, translated, wrapCanvasText } from '../canvas/model';
import '../styles/canvas.css';

const TOOLS = [
  { id: 'select', label: '选择', Icon: FiMousePointer, key: 'V' },
  { id: 'hand', label: '移动画布', Icon: FiMove, key: 'H' },
  { id: 'pen', label: '画笔', Icon: FiEdit3, key: 'P' },
  { id: 'rect', label: '矩形', Icon: FiSquare, key: 'R' },
  { id: 'ellipse', label: '椭圆', Icon: FiCircle, key: 'O' },
  { id: 'line', label: '直线', Icon: FiSlash, key: 'L' },
  { id: 'arrow', label: '箭头', Icon: FiArrowDownLeft, key: 'A' },
  { id: 'text', label: '文字', Icon: FiType, key: 'T' },
];

const DEFAULT_VIEW = { x: 0, y: 0, zoom: 1 };
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

function isEditingTarget(target) {
  return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
}

function textEditorWidth(text, fontSize, family, zoom, left, fixedWidth) {
  if (fixedWidth) return Math.max(80, fixedWidth * zoom);
  const screenFontSize = fontSize * zoom;
  const context = document.createElement('canvas').getContext('2d');
  context.font = `${screenFontSize}px ${family}`;
  const lines = (text || '').split('\n');
  const longestLine = Math.max(...lines.map(line => context.measureText(line || ' ').width));
  const available = Math.max(120, window.innerWidth - Math.max(0, left) - 24);
  return Math.min(Math.max(150, Math.ceil(longestLine + 16)), available, 800 * zoom);
}

async function canvasImage(file) {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') throw new Error('请选择 PNG、JPG、WebP 等图片');
  if (file.size > MAX_IMAGE_BYTES) throw new Error('图片请小于 12 MB');
  let image;
  let temporaryUrl;
  try {
    if ('createImageBitmap' in window) image = await createImageBitmap(file);
    else {
      temporaryUrl = URL.createObjectURL(file);
      image = new Image();
      image.src = temporaryUrl;
      await image.decode();
    }
    const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    const src = canvas.toDataURL('image/webp', .85);
    return { src, width: canvas.width, height: canvas.height };
  } finally {
    image?.close?.();
    if (temporaryUrl) URL.revokeObjectURL(temporaryUrl);
  }
}

function CanvasElement({ element, selected, editing, onPointerDown, onDoubleClick, onResizePointerDown }) {
  if (element.deleted) return null;
  const { x, y, w, h } = elementBounds(element);
  const common = { stroke: element.color || '#f6f7f5', strokeWidth: element.strokeWidth || 3, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' };
  let art;
  if (element.type === 'rect') art = <rect x={x} y={y} width={Math.max(w, 1)} height={Math.max(h, 1)} rx="5" {...common} />;
  if (element.type === 'ellipse') art = <ellipse cx={x + w / 2} cy={y + h / 2} rx={Math.max(w / 2, 1)} ry={Math.max(h / 2, 1)} {...common} />;
  if (element.type === 'line') {
    const endX = element.x + element.w;
    const endY = element.y + element.h;
    const length = Math.hypot(element.w, element.h) || 1;
    const ux = element.w / length;
    const uy = element.h / length;
    art = <><line x1={element.x} y1={element.y} x2={endX} y2={endY} {...common} />{element.arrow && <path d={`M ${endX - ux * 14 - uy * 7} ${endY - uy * 14 + ux * 7} L ${endX} ${endY} L ${endX - ux * 14 + uy * 7} ${endY - uy * 14 - ux * 7}`} {...common} />}</>;
  }
  if (element.type === 'pen') art = <polyline points={(element.points || []).map(point => point.join(',')).join(' ')} {...common} />;
  if (element.type === 'image' && /^data:image\/(png|jpeg|webp|gif);base64,/i.test(element.src || '')) art = <image href={element.src} x={x} y={y} width={w} height={h} preserveAspectRatio="none" />;
  if (element.type === 'text' && !editing) {
    const anchor = element.textAlign === 'center' ? 'middle' : element.textAlign === 'right' ? 'end' : 'start';
    const textX = anchor === 'middle' ? x + w / 2 : anchor === 'end' ? x + w : x;
    art = <text x={textX} y={y + (element.fontSize || 28)} fill={element.color || '#fff'} fontSize={element.fontSize || 28} fontFamily={fontFamily(element.font)} fontWeight="400" textAnchor={anchor} dominantBaseline="auto" xmlSpace="preserve">{wrapCanvasText(element.text, element.fontSize || 28, element.font, element.wrapWidth).map((line, index) => <tspan key={index} x={textX} dy={index ? `${element.lineHeight || 1.4}em` : 0}>{line || ' '}</tspan>)}</text>;
  }
  return <g className="canvas-element" onPointerDown={onPointerDown} onDoubleClick={onDoubleClick}>
    {art}
    {selected && !editing && <rect className="canvas-selection" x={x - 8} y={y - 8} width={Math.max(w, 8) + 16} height={Math.max(h, 8) + 16} rx="7" />}
    <rect x={x - 9} y={y - 9} width={Math.max(w, 8) + 18} height={Math.max(h, 8) + 18} fill="transparent" stroke="none" />
    {selected && element.type === 'text' && !editing && <rect className="canvas-text-resize-handle" x={x + w + 1} y={y + h / 2 - 7} width="14" height="14" rx="4" onPointerDown={onResizePointerDown} aria-label="调整文字框宽度" />}
    {selected && !['pen', 'text'].includes(element.type) && <rect className="canvas-resize-handle" x={x + w + 2} y={y + h + 2} width="12" height="12" rx="3" onPointerDown={onResizePointerDown} />}
  </g>;
}

export default function CanvasWorkspace({ bg, onBack }) {
  const [ready, setReady] = useState(false);
  const [boardId, setBoardId] = useState('main');
  const [elements, setElements] = useState([]);
  const elementsRef = useRef([]);
  const [view, setView] = useState(DEFAULT_VIEW);
  const viewRef = useRef(DEFAULT_VIEW);
  const [tool, setTool] = useState('select');
  const toolRef = useRef('select');
  const [textColor, setTextColor] = useState(CANVAS_COLORS[0]);
  const [strokeColor, setStrokeColor] = useState(CANVAS_COLORS[0]);
  const [font, setFont] = useState('system');
  const [fontSize, setFontSize] = useState(30);
  const [lineHeight, setLineHeight] = useState(1.4);
  const [textAlign, setTextAlign] = useState('left');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [invite, setInvite] = useState(readInvite);
  const [isHost, setIsHost] = useState(false);
  const [hasSynced, setHasSynced] = useState(() => !readInvite());
  const [sessionNonce, setSessionNonce] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [status, setStatus] = useState(() => ({ state: readInvite() ? 'connecting' : 'local', peers: 0, message: '' }));
  const [notice, setNotice] = useState('');
  const [saveStatus, setSaveStatus] = useState('已保存在此浏览器');
  const stageRef = useRef(null);
  const fileRef = useRef(null);
  const editRef = useRef(null);
  const sessionRef = useRef(null);
  const hostRetryCountRef = useRef(0);
  const gestureRef = useRef(null);
  const lastBlankClickRef = useRef(null);
  const spaceRef = useRef(false);
  const clockRef = useRef(0);
  const [actor] = useState(uuidv4);
  const lastSendRef = useRef(0);
  const textBeforeRef = useRef(null);
  const undoRef = useRef([]);
  const redoRef = useRef([]);

  const setViewState = useCallback(next => {
    viewRef.current = next;
    setView(next);
  }, []);

  const applyIncoming = useCallback(incoming => {
    const list = Array.isArray(incoming) ? incoming : [incoming];
    for (const element of list) clockRef.current = Math.max(clockRef.current, Number(element?.version?.[0]) || 0);
    const merged = mergeElements(elementsRef.current, list);
    elementsRef.current = merged;
    setElements(merged);
  }, []);

  const commit = useCallback((raw, send = true) => {
    const element = { ...raw, version: [++clockRef.current, actor] };
    applyIncoming(element);
    setSaveStatus('正在保存…');
    if (send) {
      lastSendRef.current = performance.now();
      sessionRef.current?.send({ type: 'element', element }).catch(error => setNotice(error.message));
    }
    return element;
  }, [applyIncoming, actor]);

  const remember = useCallback((before, after) => {
    if (JSON.stringify(before) === JSON.stringify(after)) return;
    undoRef.current.push({ before, after });
    if (undoRef.current.length > 80) undoRef.current.shift();
    redoRef.current = [];
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const currentInvite = readInvite();
      const main = await getRecord('canvases', 'main');
      const host = Boolean(currentInvite && main?.shareRoom?.room === currentInvite.room && main?.shareRoom?.key === currentInvite.key);
      const id = currentInvite && !host ? `room:${currentInvite.room}` : 'main';
      const document = id === 'main' ? main : await getRecord('canvases', id);
      if (cancelled) return;
      const saved = Array.isArray(document?.elements) ? document.elements : [];
      elementsRef.current = saved;
      clockRef.current = Math.max(0, ...saved.map(element => Number(element.version?.[0]) || 0));
      setElements(saved);
      setBoardId(id);
      setIsHost(host);
      setHasSynced(!currentInvite || host);
      setReady(true);
    })().catch(error => { setNotice(`画布读取失败：${error.message}`); setReady(true); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ready) return undefined;
    const timer = setTimeout(() => {
      putRecord('canvases', { id: boardId, elements: elementsRef.current, shareRoom: isHost ? invite : null, updated_at: new Date().toISOString() })
        .then(() => setSaveStatus('已保存在此浏览器'))
        .catch(error => { setSaveStatus('保存失败'); setNotice(`保存失败：${error.message}`); });
    }, 350);
    return () => clearTimeout(timer);
  }, [elements, boardId, ready, invite, isHost]);

  useEffect(() => {
    if (!ready || !invite) return undefined;
    let cancelled = false;
    let registrationTimer;
    (hasCanvasRelay ? createRelayCanvasSession : createCanvasSession)({
      invite,
      host: isHost,
      getSnapshot: () => elementsRef.current,
      onMessage: message => {
        applyIncoming(message.type === 'snapshot' ? message.elements : message.element);
        if (message.type === 'snapshot') setHasSynced(true);
      },
      onStatus: (state, peers, error) => {
        if (cancelled) return;
        if (state === 'hosting') hostRetryCountRef.current = 0;
        if (isHost && error?.type === 'unavailable-id' && hostRetryCountRef.current < 4) {
          const attempt = ++hostRetryCountRef.current;
          setStatus({ state: 'reconnecting', peers: 0, message: '正在恢复共享房间…' });
          registrationTimer = setTimeout(() => setSessionNonce(value => value + 1), attempt * 1500);
          return;
        }
        setStatus({ state, peers, message: error?.message || '' });
      },
    }).then(session => {
      if (cancelled) session.close();
      else sessionRef.current = session;
    }).catch(error => setStatus({ state: 'error', peers: 0, message: error.message }));
    return () => {
      cancelled = true;
      if (registrationTimer) clearTimeout(registrationTimer);
      sessionRef.current?.close();
      sessionRef.current = null;
    };
  }, [ready, invite, isHost, applyIncoming, sessionNonce]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (editingId) editRef.current?.focus();
  }, [editingId]);

  const selected = elements.find(element => element.id === selectedId && !element.deleted);
  const editing = elements.find(element => element.id === editingId && !element.deleted);
  const propertyMode = selected?.type === 'text' || (!selected && tool === 'text') ? 'text' : selected?.type === 'image' ? 'image' : 'shape';
  const editingLeft = editing ? view.x + editing.x * view.zoom : 0;
  const editingTop = editing ? view.y + editing.y * view.zoom : 0;
  const editingWidth = editing ? textEditorWidth(editText, editing.fontSize || 28, fontFamily(editing.font), view.zoom, editingLeft, editing.fixedWidth ? editing.wrapWidth : null) : 0;
  const editingMaxHeight = Math.max(96, Math.min(window.innerHeight - 120, window.innerHeight - Math.max(100, editingTop) - 40));

  useLayoutEffect(() => {
    if (!editingId || !editRef.current) return;
    const editor = editRef.current.parentElement.getBoundingClientRect();
    const stage = stageRef.current.getBoundingClientRect();
    const panX = Math.max(0, editor.right - stage.right + 24);
    const panY = Math.max(0, editor.bottom - stage.bottom + 24);
    if (panX || panY) setViewState({ ...viewRef.current, x: viewRef.current.x - panX, y: viewRef.current.y - panY });
  }, [editText, editingId, editingWidth, setViewState]);

  const screenToWorld = useCallback((clientX, clientY) => {
    const rect = stageRef.current.getBoundingClientRect();
    const current = viewRef.current;
    return { x: (clientX - rect.left - current.x) / current.zoom, y: (clientY - rect.top - current.y) / current.zoom };
  }, []);

  const beginText = (element, isNew = false) => {
    textBeforeRef.current = isNew ? null : element;
    setEditingId(element.id);
    setEditText(element.text || '');
    setSelectedId(element.id);
  };

  const createEditableText = point => {
    const created = commit({ id: uuidv4(), type: 'text', x: point.x, y: point.y, text: '', font, fontSize, lineHeight, textAlign, color: textColor });
    beginText(created, true);
    setTool('select'); toolRef.current = 'select';
  };

  const finishText = () => {
    if (!editing) return;
    const text = editText.trimEnd();
    const updated = commit(text ? { ...editing, text, wrapWidth: editing.fixedWidth ? editing.wrapWidth : editingWidth / viewRef.current.zoom } : { ...editing, deleted: true });
    if (text || textBeforeRef.current) remember(textBeforeRef.current, updated);
    textBeforeRef.current = null;
    setEditingId(null);
  };

  const handleStageDown = (event) => {
    if (event.button !== 0 && event.button !== 1) return;
    if (!hasSynced) return;
    const point = screenToWorld(event.clientX, event.clientY);
    const currentTool = toolRef.current;
    event.currentTarget.setPointerCapture(event.pointerId);
    if (event.button === 1 || spaceRef.current || currentTool === 'hand' || currentTool === 'select') {
      if (currentTool === 'select' && !spaceRef.current && event.button !== 1) setSelectedId(null);
      gestureRef.current = { mode: 'pan', tool: currentTool, blankClick: currentTool === 'select' && !spaceRef.current && event.button === 0, clientX: event.clientX, clientY: event.clientY, view: viewRef.current };
      return;
    }
    lastBlankClickRef.current = null;
    if (currentTool === 'text') {
      gestureRef.current = { mode: 'text', point };
      return;
    }
    const type = currentTool === 'arrow' ? 'line' : currentTool;
    const raw = { id: uuidv4(), type, x: point.x, y: point.y, w: 0, h: 0, color: strokeColor, strokeWidth, ...(currentTool === 'arrow' ? { arrow: true } : {}), ...(type === 'pen' ? { points: [[point.x, point.y]] } : {}) };
    const created = commit(raw);
    gestureRef.current = { mode: 'draw', id: created.id, start: point, before: null };
    setSelectedId(created.id);
  };

  const handleElementDown = (event, element) => {
    if (toolRef.current !== 'select' || event.button !== 0 || editingId) return;
    event.stopPropagation();
    lastBlankClickRef.current = null;
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedId(element.id);
    gestureRef.current = { mode: 'move', id: element.id, start: screenToWorld(event.clientX, event.clientY), before: element };
  };

  const handleResizeDown = (event, element) => {
    if (toolRef.current !== 'select' || event.button !== 0 || !hasSynced) return;
    event.stopPropagation();
    stageRef.current.setPointerCapture(event.pointerId);
    gestureRef.current = { mode: element.type === 'text' ? 'resize-text' : 'resize', id: element.id, before: element, bounds: elementBounds(element) };
  };

  const handleStageMove = (event) => {
    const gesture = gestureRef.current;
    if (!gesture) return;
    if (gesture.mode === 'pan') {
      setViewState({ ...gesture.view, x: gesture.view.x + event.clientX - gesture.clientX, y: gesture.view.y + event.clientY - gesture.clientY });
      return;
    }
    const point = screenToWorld(event.clientX, event.clientY);
    const previous = elementsRef.current.find(element => element.id === gesture.id);
    if (!previous) return;
    let next;
    if (gesture.mode === 'move') next = translated(gesture.before, point.x - gesture.start.x, point.y - gesture.start.y);
    else if (gesture.mode === 'resize-text') next = { ...gesture.before, wrapWidth: Math.max(80, Math.round(point.x - gesture.bounds.x)), fixedWidth: true };
    else if (gesture.mode === 'resize') next = { ...gesture.before, x: gesture.bounds.x, y: gesture.bounds.y, w: Math.max(16, point.x - gesture.bounds.x), h: Math.max(16, point.y - gesture.bounds.y) };
    else if (previous.type === 'pen') {
      const last = previous.points.at(-1);
      if (Math.hypot(point.x - last[0], point.y - last[1]) < 2 / viewRef.current.zoom) return;
      next = { ...previous, points: [...previous.points, [point.x, point.y]] };
    } else next = { ...previous, w: point.x - gesture.start.x, h: point.y - gesture.start.y };
    commit(next, event.timeStamp - lastSendRef.current > 65);
  };

  const handleStageUp = (event) => {
    const gesture = gestureRef.current;
    if (!gesture) return;
    if (gesture.mode === 'text') {
      createEditableText(gesture.point);
      gestureRef.current = null;
      if (stageRef.current?.hasPointerCapture(event.pointerId)) stageRef.current.releasePointerCapture(event.pointerId);
      return;
    }
    if (gesture.mode !== 'pan') {
      let after = elementsRef.current.find(element => element.id === gesture.id);
      if (after && gesture.mode === 'draw' && after.type !== 'pen' && Math.abs(after.w) + Math.abs(after.h) < 5) {
        after = commit({ ...after, w: after.type === 'line' ? 150 : 180, h: after.type === 'line' ? 0 : 110 });
      } else if (after) after = commit(after);
      if (after) remember(gesture.before, after);
    }
    if (gesture.mode === 'pan' && gesture.blankClick) {
      const distance = Math.hypot(event.clientX - gesture.clientX, event.clientY - gesture.clientY);
      const previous = lastBlankClickRef.current;
      if (distance <= 6 && previous && event.timeStamp - previous.time <= 400 && Math.hypot(event.clientX - previous.x, event.clientY - previous.y) <= 8) {
        lastBlankClickRef.current = null;
        createEditableText(screenToWorld(event.clientX, event.clientY));
      } else lastBlankClickRef.current = distance <= 6 ? { time: event.timeStamp, x: event.clientX, y: event.clientY } : null;
    } else lastBlankClickRef.current = null;
    if (gesture.mode === 'draw' || (gesture.mode === 'pan' && gesture.tool === 'hand')) {
      setTool('select'); toolRef.current = 'select';
    }
    gestureRef.current = null;
    if (stageRef.current?.hasPointerCapture(event.pointerId)) stageRef.current.releasePointerCapture(event.pointerId);
  };

  const changeSelected = (patch) => {
    if (!selected) return;
    const before = selected;
    const after = commit({ ...selected, ...patch });
    remember(before, after);
  };

  const deleteSelected = () => {
    if (!selected) return;
    const after = commit({ ...selected, deleted: true });
    remember(selected, after);
    setSelectedId(null);
  };

  const historyStep = (direction) => {
    const source = direction === 'undo' ? undoRef.current : redoRef.current;
    const destination = direction === 'undo' ? redoRef.current : undoRef.current;
    const entry = source.pop();
    if (!entry) return;
    destination.push(entry);
    const target = direction === 'undo' ? entry.before : entry.after;
    commit(target || { ...entry.after, deleted: true });
    setSelectedId(target && !target.deleted ? target.id : null);
  };

  const addImage = async (file, point = null) => {
    if (!hasSynced) { setNotice('正在等待共享画布同步'); return; }
    try {
      const image = await canvasImage(file);
      const center = point || screenToWorld(window.innerWidth / 2, window.innerHeight / 2);
      const width = Math.min(500, image.width);
      const height = width * image.height / image.width;
      const after = commit({ id: uuidv4(), type: 'image', x: center.x - width / 2, y: center.y - height / 2, w: width, h: height, src: image.src });
      remember(null, after);
      setSelectedId(after.id);
      setTool('select'); toolRef.current = 'select';
    } catch (error) { setNotice(error.message); }
  };

  useEffect(() => {
    const onKeyDown = event => {
      if (isEditingTarget(event.target)) return;
      if (event.code === 'Space') { event.preventDefault(); spaceRef.current = true; }
      if (event.key === 'Escape') { setSelectedId(null); setShareOpen(false); setTool('select'); toolRef.current = 'select'; return; }
      if (event.key === 'Enter' && selected?.type === 'text') { event.preventDefault(); beginText(selected); return; }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd' && selected) {
        event.preventDefault();
        const duplicate = commit({ ...translated(selected, 24, 24), id: uuidv4() });
        remember(null, duplicate);
        setSelectedId(duplicate.id);
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); historyStep(event.shiftKey ? 'redo' : 'undo'); return; }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') { event.preventDefault(); historyStep('redo'); return; }
      if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); deleteSelected(); return; }
      if (selected && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();
        const distance = event.shiftKey ? 10 : 1;
        const dx = event.key === 'ArrowLeft' ? -distance : event.key === 'ArrowRight' ? distance : 0;
        const dy = event.key === 'ArrowUp' ? -distance : event.key === 'ArrowDown' ? distance : 0;
        const after = commit(translated(selected, dx, dy));
        remember(selected, after);
        return;
      }
      const shortcut = TOOLS.find(entry => entry.key.toLowerCase() === event.key.toLowerCase());
      if (shortcut && !event.ctrlKey && !event.metaKey) { setTool(shortcut.id); toolRef.current = shortcut.id; if (shortcut.id !== 'select') setSelectedId(null); }
    };
    const onKeyUp = event => { if (event.code === 'Space') spaceRef.current = false; };
    const onPaste = event => {
      if (isEditingTarget(event.target)) return;
      const file = Array.from(event.clipboardData?.files || []).find(item => item.type.startsWith('image/'));
      if (file) { event.preventDefault(); addImage(file); }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('paste', onPaste);
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); window.removeEventListener('paste', onPaste); };
  });

  const zoomAt = (factor, clientX, clientY) => {
    const rect = stageRef.current.getBoundingClientRect();
    const current = viewRef.current;
    const zoom = Math.max(.15, Math.min(4, current.zoom * factor));
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    setViewState({ x: x - (x - current.x) * zoom / current.zoom, y: y - (y - current.y) * zoom / current.zoom, zoom });
  };

  const fitCanvas = () => {
    const visible = elementsRef.current.filter(element => !element.deleted);
    if (!visible.length) { setViewState(DEFAULT_VIEW); return; }
    const bounds = visible.map(elementBounds);
    const minX = Math.min(...bounds.map(box => box.x));
    const minY = Math.min(...bounds.map(box => box.y));
    const maxX = Math.max(...bounds.map(box => box.x + box.w));
    const maxY = Math.max(...bounds.map(box => box.y + box.h));
    const rect = stageRef.current.getBoundingClientRect();
    const zoom = Math.max(.15, Math.min(1.5, Math.min((rect.width - 180) / Math.max(100, maxX - minX), (rect.height - 180) / Math.max(100, maxY - minY))));
    setViewState({ x: rect.width / 2 - (minX + maxX) / 2 * zoom, y: rect.height / 2 - (minY + maxY) / 2 * zoom, zoom });
  };

  const startShare = async () => {
    const next = createInvite();
    try {
      hostRetryCountRef.current = 0;
      await putRecord('canvases', { id: 'main', elements: elementsRef.current, shareRoom: next, updated_at: new Date().toISOString() });
      window.history.replaceState(null, '', inviteUrl(next));
      setIsHost(true);
      setHasSynced(true);
      setInvite(next);
      setStatus({ state: 'connecting', peers: 0, message: '' });
      setShareOpen(true);
    } catch (error) { setNotice(`共享未启动：${error.message}`); }
  };

  const stopShare = () => {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    setInvite(null);
    setIsHost(false);
    setStatus({ state: 'local', peers: 0, message: '' });
    setShareOpen(false);
  };

  const leaveCanvas = async () => {
    try {
      await putRecord('canvases', { id: boardId, elements: elementsRef.current, shareRoom: isHost ? invite : null, updated_at: new Date().toISOString() });
    } catch (error) { setNotice(`保存失败：${error.message}`); return; }
    onBack();
  };

  const copyShare = async () => {
    try { await navigator.clipboard.writeText(inviteUrl(invite)); setNotice('邀请链接已复制'); }
    catch { setNotice('请手动复制下面的邀请链接'); }
  };

  const retryShare = () => {
    setStatus({ state: 'connecting', peers: 0, message: '' });
    setSessionNonce(value => value + 1);
  };

  const statusText = status.state === 'hosting' ? `正在共享 · ${status.peers} 人已加入` : status.state === 'connected' ? '实时连接中' : status.state === 'connecting' ? '正在连接…' : status.state === 'reconnecting' ? status.message || '正在重新连接…' : status.state === 'error' ? `连接失败：${status.message || '请稍后重试'}` : status.state === 'decrypt-error' ? '解密失败，请检查邀请链接' : status.state === 'disconnected' ? '连接已断开，画布仍保存在本机' : '仅在此浏览器';

  return <div className="canvas-workspace" style={{ '--canvas-wallpaper': bg ? `url(${JSON.stringify(bg)})` : 'none' }}>
    <div className="canvas-wallpaper" />
    <header className="canvas-topbar">
      <div className="canvas-top-left"><button className="canvas-back" onClick={leaveCanvas} title="返回桌面"><FiArrowLeft /><span>返回桌面</span></button><span className="canvas-top-divider" /><div className="canvas-title"><small>DESKTOP / CANVAS</small><strong>无限画布</strong></div></div>
      <div className="canvas-top-right"><span className="canvas-save-status"><i />{saveStatus}</span><button className="canvas-share-button" onClick={() => invite ? setShareOpen(value => !value) : startShare()} title="实时共享画布"><FiShare2 /><span>{invite ? '共享中' : '实时共享'}</span></button></div>
    </header>

    <main className={`canvas-stage canvas-tool-${tool}`} ref={stageRef}
      style={{ '--grid-size': `${24 * view.zoom}px`, '--grid-x': `${view.x}px`, '--grid-y': `${view.y}px`, touchAction: editing ? 'auto' : 'none' }}
      onPointerDown={handleStageDown} onPointerMove={handleStageMove} onPointerUp={handleStageUp} onPointerCancel={handleStageUp}
      onWheel={event => {
        event.preventDefault();
        if (event.ctrlKey || event.metaKey) zoomAt(Math.exp(-event.deltaY * .008), event.clientX, event.clientY);
        else setViewState({ ...viewRef.current, x: viewRef.current.x - event.deltaX, y: viewRef.current.y - event.deltaY });
      }}
      onDragOver={event => event.preventDefault()}
      onDrop={event => { event.preventDefault(); const file = Array.from(event.dataTransfer.files).find(item => item.type.startsWith('image/')); if (file) addImage(file, screenToWorld(event.clientX, event.clientY)); }}>
      <svg className="canvas-svg" aria-label="无限画布绘图区"><g transform={`translate(${view.x} ${view.y}) scale(${view.zoom})`}>{elements.filter(element => !element.deleted).map(element => <CanvasElement key={element.id} element={element} selected={selectedId === element.id} editing={editingId === element.id} onPointerDown={event => handleElementDown(event, element)} onResizePointerDown={event => handleResizeDown(event, element)} onDoubleClick={event => { event.stopPropagation(); if (element.type === 'text') beginText(element); }} />)}</g></svg>
      {editing && <div className="canvas-text-editor-shell" style={{ left: editingLeft, top: editingTop, width: editingWidth, maxHeight: editingMaxHeight, fontFamily: fontFamily(editing.font), fontSize: (editing.fontSize || 28) * view.zoom, lineHeight: editing.lineHeight || 1.4, textAlign: editing.textAlign || 'left', color: editing.color }}><span className="canvas-text-editor-measure" aria-hidden="true">{editText || '\u200b'}{editText.endsWith('\n') ? '\u200b' : ''}</span><textarea ref={editRef} className="canvas-text-editor" value={editText} onChange={event => setEditText(event.target.value)} onBlur={finishText} onPointerDown={event => event.stopPropagation()} onWheel={event => event.stopPropagation()} onKeyDown={event => { if (event.key === 'Escape' || ((event.ctrlKey || event.metaKey) && event.key === 'Enter')) { event.preventDefault(); finishText(); } }} placeholder="在这里写下想法…" spellCheck={false} aria-label="编辑画布文字" /></div>}
      {!elements.some(element => !element.deleted) && ready && <div className="canvas-empty"><span>01 / A SPACE TO THINK</span><strong>从一个想法开始。</strong><p>写字、贴图、画线。画布会随着你的思路一直延伸。</p><button onClick={() => { setTool('text'); toolRef.current = 'text'; }}>添加第一段文字 <FiArrowDownLeft /></button></div>}
      {ready && !hasSynced && <div className="canvas-sync-wait"><strong>{status.state === 'error' ? '共享连接失败' : status.state === 'reconnecting' ? '正在重新连接' : '正在加入共享画布'}</strong><span>{status.message || '等待发起者保持画布打开并完成连接…'}</span>{['error', 'disconnected', 'decrypt-error'].includes(status.state) && <button onClick={retryShare}>重新连接</button>}</div>}
    </main>

    <aside className="canvas-toolbox" aria-label="画布工具">{TOOLS.map(({ id, label, Icon, key }) => <button key={id} className={tool === id ? 'active' : ''} title={`${label} (${key})`} aria-label={label} aria-pressed={tool === id} onClick={() => { setTool(id); toolRef.current = id; if (id !== 'select') setSelectedId(null); }}><Icon /></button>)}<span className="canvas-tool-divider" /><button title="插入图片" aria-label="插入图片" onClick={() => fileRef.current?.click()}><FiImage /></button><input ref={fileRef} hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={event => { if (event.target.files[0]) addImage(event.target.files[0]); event.target.value = ''; }} /></aside>

    <div className="canvas-properties" aria-label={propertyMode === 'text' ? '文字属性' : propertyMode === 'image' ? '图片属性' : '形状属性'}>
      <span className="canvas-properties-label">{propertyMode === 'text' ? '文字' : propertyMode === 'image' ? '图片' : '绘制'}</span>
      {propertyMode !== 'image' && <>
        <div className="canvas-colors" aria-label={propertyMode === 'text' ? '文字颜色' : '描边颜色'}>{CANVAS_COLORS.map(swatch => <button key={swatch} className={(selected?.color || (propertyMode === 'text' ? textColor : strokeColor)) === swatch ? 'active' : ''} style={{ '--swatch': swatch }} aria-label={`颜色 ${swatch}`} title={swatch} onClick={() => { if (propertyMode === 'text') setTextColor(swatch); else setStrokeColor(swatch); if (selected) changeSelected({ color: swatch }); }} />)}</div>
        <span className="canvas-property-divider" />
      </>}
      {propertyMode === 'text' && <>
        <label className="canvas-select-wrap"><span>字体</span><select aria-label="字体" value={selected?.font || font} onChange={event => { setFont(event.target.value); if (selected?.type === 'text') changeSelected({ font: event.target.value }); }}>{CANVAS_FONTS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label className="canvas-select-wrap"><span>字号</span><select aria-label="字号" value={selected?.fontSize || fontSize} onChange={event => { const value = Number(event.target.value); setFontSize(value); if (selected?.type === 'text') changeSelected({ fontSize: value }); }}><option value="20">20</option><option value="30">30</option><option value="42">42</option><option value="60">60</option></select></label>
        <label className="canvas-select-wrap"><span>行距</span><select aria-label="行距" value={selected?.lineHeight || lineHeight} onChange={event => { const value = Number(event.target.value); setLineHeight(value); if (selected?.type === 'text') changeSelected({ lineHeight: value }); }}><option value="1">1.0</option><option value="1.2">1.2</option><option value="1.4">1.4</option><option value="1.6">1.6</option><option value="1.8">1.8</option><option value="2">2.0</option></select></label>
        <div className="canvas-align-control" role="group" aria-label="文本对齐">{[{ value: 'left', label: '左对齐', Icon: FiAlignLeft }, { value: 'center', label: '居中对齐', Icon: FiAlignCenter }, { value: 'right', label: '右对齐', Icon: FiAlignRight }].map(({ value, label, Icon }) => <button key={value} className={(selected?.textAlign || textAlign) === value ? 'active' : ''} title={label} aria-label={label} aria-pressed={(selected?.textAlign || textAlign) === value} onClick={() => { setTextAlign(value); if (selected?.type === 'text') changeSelected({ textAlign: value }); }}><Icon /></button>)}</div>
        {selected?.type === 'text' && <label className="canvas-select-wrap canvas-width-control"><span>框宽</span><input aria-label="文字框宽度" type="number" min="80" max="2000" step="10" value={Math.round(selected.wrapWidth || elementBounds(selected).w)} onChange={event => { const value = Number(event.target.value); if (value >= 80 && value <= 2000) changeSelected({ wrapWidth: value, fixedWidth: true }); }} /><span>px</span></label>}
      </>}
      {propertyMode === 'shape' && <label className="canvas-select-wrap"><span>线宽</span><select aria-label="线宽" value={selected?.strokeWidth || strokeWidth} onChange={event => { const value = Number(event.target.value); setStrokeWidth(value); if (selected && selected.type !== 'text' && selected.type !== 'image') changeSelected({ strokeWidth: value }); }}><option value="2">细</option><option value="3">标准</option><option value="6">粗</option></select></label>}
      {propertyMode === 'image' && <span className="canvas-properties-hint">拖动边角调整图片</span>}
      {selected && <button className="canvas-delete" title="删除所选元素" onClick={deleteSelected}><FiTrash2 /></button>}
    </div>

    <div className="canvas-bottom-left"><span className={`canvas-connection-dot ${status.state}`} />{statusText}</div>
    <div className="canvas-bottom-right"><button title="撤销 Ctrl+Z" onClick={() => historyStep('undo')}><FiRotateCcw /></button><button title="重做 Ctrl+Y" onClick={() => historyStep('redo')}><FiRotateCw /></button><span /><button title="缩小" onClick={() => zoomAt(.8, window.innerWidth / 2, window.innerHeight / 2)}><FiMinus /></button><strong>{Math.round(view.zoom * 100)}%</strong><button title="放大" onClick={() => zoomAt(1.25, window.innerWidth / 2, window.innerHeight / 2)}><FiPlus /></button><button title="适合全部内容" onClick={fitCanvas}><FiMaximize2 /></button></div>

    {shareOpen && invite && <div className="canvas-share-popover"><div className="canvas-share-heading"><FiLink2 /><div><strong>一起画，同步此刻</strong><small>端到端加密 · 内容各自保存在浏览器</small></div><button onClick={() => setShareOpen(false)} title="关闭">×</button></div><p>将邀请链接发给对方。你需要保持此画布打开，对方才能实时加入。</p><div className="canvas-invite-row"><input readOnly value={inviteUrl(invite)} onFocus={event => event.target.select()} aria-label="共享邀请链接" /><button onClick={copyShare} title="复制邀请链接"><FiCopy /> 复制</button></div><span className="canvas-share-note">链接包含解密密钥，请只发给信任的人。关闭此画布后实时会话结束。</span>{['error', 'disconnected', 'decrypt-error'].includes(status.state) && <button className="canvas-retry-share" onClick={retryShare}>重新连接</button>}{isHost && <button className="canvas-stop-share" onClick={stopShare}>结束共享</button>}</div>}
    {notice && <div className="canvas-notice" role="status">{notice}</div>}
    {!ready && <div className="canvas-loading">正在打开本地画布…</div>}
  </div>;
}
