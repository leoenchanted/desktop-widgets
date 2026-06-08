import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  FaCheck,
  FaClipboard,
  FaCopy,
  FaEdit,
  FaEllipsisH,
  FaExpandAlt,
  FaFolder,
  FaKey,
  FaLock,
  FaLockOpen,
  FaPlus,
  FaThumbtack,
  FaTimes,
  FaTrashAlt,
  FaUndo,
} from 'react-icons/fa';
import { TbLayoutSidebarLeftCollapse, TbLayoutSidebarLeftExpand } from 'react-icons/tb';
import { pinnedNoteApi } from '../../api/pinnedNoteApi';
import { useDebounce } from '../../hooks/useDebounce';
import {
  createPinnedPassword,
  decryptPinnedText,
  encryptPinnedText,
  isValidPin,
  unlockPinnedPassword,
} from '../../utils/pinCrypto';
import GlassPanel from '../ui/GlassPanel';
import IconButton from '../ui/IconButton';
import PanelHeader from '../ui/PanelHeader';
import StatusPill from '../ui/StatusPill';
import StatsBar from './StatsBar';

const fallbackCategory = () => {
  const timestamp = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: '默认',
    content: '',
    created_at: timestamp,
    updated_at: timestamp,
  };
};

const normalizeTitle = (title) => title.trim() || '未命名';

const countWords = (text = '') => {
  const compact = text.trim();
  if (!compact) return 0;
  return compact.split(/\s+/).filter(Boolean).length;
};

const getCategoryMeta = (category) => {
  const content = category?.content || '';
  return {
    charCount: content.length,
    wordCount: countWords(content),
  };
};

const PIN_DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '清空', '0', '删除'];

const PinModal = ({ flow, busy = false, onClose, onComplete }) => {
  const [step, setStep] = useState(flow?.mode === 'change' ? 'old' : 'pin');
  const [pin, setPin] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [oldPin, setOldPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!flow) return undefined;
    setStep(flow.mode === 'change' ? 'old' : 'pin');
    setPin('');
    setFirstPin('');
    setOldPin('');
    setError('');
    return undefined;
  }, [flow]);

  const title = (() => {
    if (flow?.mode === 'set') return step === 'confirm' ? '确认 6 位密码' : '设置 6 位密码';
    if (flow?.mode === 'change') {
      if (step === 'old') return '输入旧密码';
      if (step === 'confirm') return '确认新密码';
      return '输入新密码';
    }
    return '输入 6 位密码';
  })();

  const detail = (() => {
    if (flow?.mode === 'set') return '密码只保存在当前浏览器本地，忘记后无法恢复已加密分类。';
    if (flow?.mode === 'change') return '修改密码会重新加密所有已锁分类。';
    return flow?.detail || '解锁后可在本次会话中查看和编辑该分类。';
  })();

  const submitPin = async (value) => {
    if (!isValidPin(value) || busy) return;

    try {
      setError('');
      if (flow?.mode === 'set') {
        if (step !== 'confirm') {
          setFirstPin(value);
          setPin('');
          setStep('confirm');
          return;
        }
        if (value !== firstPin) {
          setError('两次密码不一致');
          setPin('');
          setStep('pin');
          setFirstPin('');
          return;
        }
        await onComplete({ pin: value });
        return;
      }

      if (flow?.mode === 'change') {
        if (step === 'old') {
          setOldPin(value);
          setPin('');
          setStep('pin');
          return;
        }
        if (step !== 'confirm') {
          setFirstPin(value);
          setPin('');
          setStep('confirm');
          return;
        }
        if (value !== firstPin) {
          setError('两次新密码不一致');
          setPin('');
          setStep('pin');
          setFirstPin('');
          return;
        }
        await onComplete({ oldPin, newPin: value });
        return;
      }

      await onComplete({ pin: value });
    } catch (submitError) {
      setError(submitError.message || '密码处理失败');
      setPin('');
    }
  };

  const appendDigit = (digit) => {
    if (busy) return;
    setError('');
    if (digit === '清空') {
      setPin('');
      return;
    }
    if (digit === '删除') {
      setPin((value) => value.slice(0, -1));
      return;
    }
    setPin((value) => {
      const next = `${value}${digit}`.slice(0, 6);
      if (next.length === 6) {
        window.queueMicrotask(() => submitPin(next));
      }
      return next;
    });
  };

  useEffect(() => {
    if (!flow) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (/^\d$/.test(event.key)) {
        appendDigit(event.key);
        return;
      }
      if (event.key === 'Backspace') appendDigit('删除');
      if (event.key === 'Enter' && pin.length === 6) submitPin(pin);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow, pin, busy]);

  if (!flow) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4 py-6" onClick={onClose}>
      <div className="absolute inset-0 bg-black/56 backdrop-blur-sm" />
      <div
        className="glass-panel relative w-full max-w-sm overflow-hidden p-5 shadow-2xl animate-bubble"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/38">
              <FaKey size={11} />
              PIN LOCK
            </div>
            <h3 className="mt-2 text-base font-semibold text-white/90">{title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-white/45">{detail}</p>
          </div>
          <IconButton
            icon={FaTimes}
            onClick={onClose}
            title="关闭"
            className="h-8 w-8 shrink-0 text-white/50"
          />
        </div>

        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <span
              key={index}
              className={`h-3 w-8 rounded-full border transition-colors ${
                index < pin.length
                  ? 'border-[#9cc9ff]/40 bg-[#9cc9ff]/60'
                  : 'border-white/12 bg-white/7'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-[#ff9f9f]/18 bg-[#ff7b7b]/10 px-3 py-2 text-center text-xs font-semibold text-[#ffd0d0]">
            {error}
          </div>
        )}

        <div className="mt-5 grid grid-cols-3 gap-2">
          {PIN_DIGITS.map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => appendDigit(digit)}
              disabled={busy}
              className="h-12 rounded-2xl border border-white/10 bg-white/8 text-sm font-semibold text-white/76 transition-colors hover:bg-white/13 hover:text-white disabled:cursor-wait disabled:opacity-50"
            >
              {digit}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
};

const PinnedNote = () => {
  const [note, setNote] = useState({
    activeCategoryId: null,
    categories: [],
    password: null,
  });
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState('idle');
  const [clearedCategory, setClearedCategory] = useState(null);
  const [copyState, setCopyState] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [passwordKey, setPasswordKey] = useState(null);
  const [unlockedCategoryIds, setUnlockedCategoryIds] = useState(() => new Set());
  const [pinFlow, setPinFlow] = useState(null);
  const [pinBusy, setPinBusy] = useState(false);
  const [menuCategoryId, setMenuCategoryId] = useState(null);
  const renameInputRef = useRef(null);
  const hasEditedRef = useRef(false);
  const debouncedNote = useDebounce(note, 500);

  const categories = note.categories;
  const activeCategoryId = note.activeCategoryId || categories[0]?.id;
  const activeCategory = categories.find((category) => category.id === activeCategoryId) || categories[0];
  const activeContent = activeCategory?.content || '';
  const activeCategoryUnlocked = !activeCategory?.locked || unlockedCategoryIds.has(activeCategory.id);
  const { charCount, wordCount } = getCategoryMeta(activeCategory);

  const status =
    saveState === 'saving'
      ? '保存中'
      : saveState === 'error'
        ? '保存失败'
        : saveState === 'saved'
          ? '已保存'
          : '长期保留';

  const prepareNoteForSave = useCallback(async (nextNote) => {
    const nextCategories = await Promise.all((nextNote.categories || []).map(async (category) => {
      if (!category.locked) {
        return {
          ...category,
          encrypted: null,
        };
      }

      const isUnlocked = unlockedCategoryIds.has(category.id);
      if (isUnlocked && passwordKey) {
        return {
          ...category,
          content: '',
          encrypted: await encryptPinnedText(category.content || '', passwordKey),
        };
      }

      return {
        ...category,
        content: '',
      };
    }));

    return {
      ...nextNote,
      categories: nextCategories,
    };
  }, [passwordKey, unlockedCategoryIds]);

  useEffect(() => {
    let cancelled = false;

    pinnedNoteApi.get()
      .then((nextNote) => {
        if (!cancelled) {
          setNote({
            activeCategoryId: nextNote.activeCategoryId,
            categories: nextNote.categories,
            password: nextNote.password || null,
          });
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error('Failed to load pinned note', error);
        if (!cancelled) {
          setSaveState('error');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasEditedRef.current || loading) return undefined;

    let cancelled = false;
    prepareNoteForSave(debouncedNote)
      .then((payload) => pinnedNoteApi.save(payload))
      .then(() => {
        if (!cancelled) setSaveState('saved');
      })
      .catch((error) => {
        console.error('Failed to save pinned note', error);
        if (!cancelled) setSaveState('error');
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedNote, loading, prepareNoteForSave]);

  useEffect(() => {
    if (!renamingId) return;
    requestAnimationFrame(() => {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    });
  }, [renamingId]);

  const updateNote = (updater, { saving = true } = {}) => {
    if (saving) {
      hasEditedRef.current = true;
      setSaveState('saving');
    }
    setCopyState('');
    setNote((current) => {
      const currentCategories = current.categories.length ? current.categories : [fallbackCategory()];
      const currentActiveId = current.activeCategoryId || currentCategories[0].id;
      const next = updater({
        activeCategoryId: currentActiveId,
        categories: currentCategories,
        password: current.password || null,
      });
      const nextCategories = next.categories.length ? next.categories : [fallbackCategory()];
      const nextActiveId = nextCategories.some((category) => category.id === next.activeCategoryId)
        ? next.activeCategoryId
        : nextCategories[0].id;
      return {
        activeCategoryId: nextActiveId,
        categories: nextCategories,
        password: next.password || current.password || null,
      };
    });
  };

  const saveImmediately = async (nextNote) => {
    setSaveState('saving');
    try {
      await pinnedNoteApi.save(await prepareNoteForSave(nextNote));
      setSaveState('saved');
    } catch (error) {
      console.error('Failed to save pinned note', error);
      setSaveState('error');
    }
  };

  const handleChange = (value) => {
    setClearedCategory(null);
    updateNote(({ activeCategoryId: currentActiveId, categories: currentCategories }) => {
      const timestamp = new Date().toISOString();
      return {
        activeCategoryId: currentActiveId,
        categories: currentCategories.map((category) => (
          category.id === currentActiveId
            ? { ...category, content: value, updated_at: timestamp }
            : category
        )),
      };
    });
  };

  const handleSwitchCategory = (categoryId) => {
    if (activeCategory?.locked && activeCategory.id !== categoryId) {
      setUnlockedCategoryIds((current) => {
        const next = new Set(current);
        next.delete(activeCategory.id);
        return next;
      });
      updateNote((current) => ({
        ...current,
        activeCategoryId: categoryId,
        categories: current.categories.map((category) => (
          category.id === activeCategory.id
            ? { ...category, content: '' }
            : category
        )),
      }));
      setClearedCategory(null);
      setMenuCategoryId(null);
      return;
    }

    updateNote((current) => ({
      ...current,
      activeCategoryId: categoryId,
    }));
    setClearedCategory(null);
    setMenuCategoryId(null);
  };

  const handleAddCategory = async () => {
    const timestamp = new Date().toISOString();
    const category = {
      id: crypto.randomUUID(),
      title: '新分类',
      content: '',
      created_at: timestamp,
      updated_at: timestamp,
    };
    const nextNote = {
      activeCategoryId: category.id,
      categories: [...categories, category],
      password: note.password || null,
    };
    hasEditedRef.current = true;
    setClearedCategory(null);
    setNote(nextNote);
    await saveImmediately(nextNote);
    setRenamingId(category.id);
    setRenameValue(category.title);
  };

  const startRename = (category) => {
    setRenamingId(category.id);
    setRenameValue(category.title);
  };

  const confirmRename = async () => {
    if (!renamingId) return;
    const timestamp = new Date().toISOString();
    const nextCategories = categories.map((category) => (
      category.id === renamingId
        ? { ...category, title: normalizeTitle(renameValue), updated_at: timestamp }
        : category
    ));
    const nextNote = { activeCategoryId, categories: nextCategories, password: note.password || null };
    hasEditedRef.current = true;
    setNote(nextNote);
    setRenamingId(null);
    await saveImmediately(nextNote);
  };

  const handleDeleteCategory = async (categoryId) => {
    if (categories.length <= 1) return;
    const category = categories.find((item) => item.id === categoryId);
    const shouldDelete = window.confirm(`删除分类“${category?.title || '未命名'}”？分类里的内容也会一起删除。`);
    if (!shouldDelete) return;

    const index = categories.findIndex((item) => item.id === categoryId);
    const nextCategories = categories.filter((item) => item.id !== categoryId);
    const nextActiveCategory = categoryId === activeCategoryId
      ? nextCategories[Math.min(index, nextCategories.length - 1)]
      : activeCategory;
    const nextNote = {
      activeCategoryId: nextActiveCategory?.id || nextCategories[0].id,
      categories: nextCategories,
      password: note.password || null,
    };

    hasEditedRef.current = true;
    setClearedCategory(null);
    setNote(nextNote);
    await saveImmediately(nextNote);
  };

  const handleClear = async () => {
    if (!activeContent || loading) return;
    const timestamp = new Date().toISOString();
    const nextCategories = categories.map((category) => (
      category.id === activeCategoryId
        ? { ...category, content: '', updated_at: timestamp }
        : category
    ));
    const nextNote = { activeCategoryId, categories: nextCategories, password: note.password || null };
    setClearedCategory({
      categoryId: activeCategoryId,
      content: activeContent,
    });
    hasEditedRef.current = true;
    setNote(nextNote);
    await saveImmediately(nextNote);
  };

  const handleUndoClear = async () => {
    if (!clearedCategory || loading) return;
    const timestamp = new Date().toISOString();
    const nextCategories = categories.map((category) => (
      category.id === clearedCategory.categoryId
        ? { ...category, content: clearedCategory.content, updated_at: timestamp }
        : category
    ));
    const nextNote = {
      activeCategoryId: clearedCategory.categoryId,
      categories: nextCategories,
      password: note.password || null,
    };
    hasEditedRef.current = true;
    setNote(nextNote);
    setClearedCategory(null);
    await saveImmediately(nextNote);
  };

  const handleDuplicateCategory = async () => {
    if (loading || !activeCategory) return;

    const timestamp = new Date().toISOString();
    const duplicatedEncrypted = activeCategory.locked && activeCategoryUnlocked && passwordKey
      ? await encryptPinnedText(activeContent, passwordKey)
      : activeCategory.encrypted;
    const category = {
      ...activeCategory,
      id: crypto.randomUUID(),
      title: `${activeCategory.title || '未命名'} 副本`,
      content: activeCategory.locked ? '' : activeContent,
      encrypted: duplicatedEncrypted || null,
      created_at: timestamp,
      updated_at: timestamp,
    };
    const activeIndex = categories.findIndex((item) => item.id === activeCategoryId);
    const insertIndex = activeIndex === -1 ? categories.length : activeIndex + 1;
    const nextCategories = [
      ...categories.slice(0, insertIndex),
      category,
      ...categories.slice(insertIndex),
    ];
    const nextNote = {
      activeCategoryId: category.id,
      categories: nextCategories,
      password: note.password || null,
    };

    hasEditedRef.current = true;
    setClearedCategory(null);
    setNote(nextNote);
    setCopyState('已复制分类');
    setTimeout(() => setCopyState(''), 1600);
    await saveImmediately(nextNote);
  };

  const lockCategoryWithKey = async (categoryId, key, password = note.password) => {
    const timestamp = new Date().toISOString();
    const nextCategories = await Promise.all(categories.map(async (category) => {
      if (category.id !== categoryId) return category;
      const content = category.content || '';
      return {
        ...category,
        content: '',
        locked: true,
        encrypted: await encryptPinnedText(content, key),
        updated_at: timestamp,
      };
    }));
    const nextNote = { activeCategoryId: categoryId, categories: nextCategories, password };
    hasEditedRef.current = true;
    setUnlockedCategoryIds((current) => {
      const next = new Set(current);
      next.delete(categoryId);
      return next;
    });
    setNote(nextNote);
    await saveImmediately(nextNote);
  };

  const unlockCategoryWithKey = async (categoryId, key) => {
    const category = categories.find((item) => item.id === categoryId);
    if (!category?.locked) return;
    const plaintext = await decryptPinnedText(category.encrypted, key);
    const nextCategories = categories.map((item) => (
      item.id === categoryId ? { ...item, content: plaintext } : item
    ));
    setPasswordKey(key);
    setUnlockedCategoryIds((current) => new Set([...current, categoryId]));
    setNote({ activeCategoryId: categoryId, categories: nextCategories, password: note.password || null });
  };

  const removeLockWithKey = async (categoryId, key) => {
    const category = categories.find((item) => item.id === categoryId);
    if (!category?.locked) return;
    const plaintext = unlockedCategoryIds.has(categoryId)
      ? category.content || ''
      : await decryptPinnedText(category.encrypted, key);
    const timestamp = new Date().toISOString();
    const nextCategories = categories.map((item) => (
      item.id === categoryId
        ? {
          ...item,
          content: plaintext,
          locked: false,
          encrypted: null,
          updated_at: timestamp,
        }
        : item
    ));
    const nextNote = { activeCategoryId: categoryId, categories: nextCategories, password: note.password || null };
    hasEditedRef.current = true;
    setPasswordKey(key);
    setUnlockedCategoryIds((current) => {
      const next = new Set(current);
      next.delete(categoryId);
      return next;
    });
    setNote(nextNote);
    await saveImmediately(nextNote);
  };

  const handleLockRequest = (categoryId) => {
    const category = categories.find((item) => item.id === categoryId);
    if (!category || category.locked) return;
    setMenuCategoryId(null);
    if (!note.password) {
      setPinFlow({ mode: 'set', action: 'lock', categoryId });
      return;
    }
    if (passwordKey) {
      lockCategoryWithKey(categoryId, passwordKey);
      return;
    }
    setPinFlow({
      mode: 'enter',
      action: 'lock',
      categoryId,
      detail: '输入置顶记录密码后锁住该分类。',
    });
  };

  const handleUnlockRequest = (categoryId) => {
    setMenuCategoryId(null);
    setPinFlow({
      mode: 'enter',
      action: 'unlock',
      categoryId,
      detail: '输入密码以查看这个置顶分类。',
    });
  };

  const handleRemoveLockRequest = (categoryId) => {
    setMenuCategoryId(null);
    setPinFlow({
      mode: 'enter',
      action: 'removeLock',
      categoryId,
      detail: '输入密码后取消这个分类的密码锁。',
    });
  };

  const handlePasswordSettings = () => {
    if (note.password) {
      setPinFlow({ mode: 'change', action: 'changePassword' });
      return;
    }
    setPinFlow({ mode: 'set', action: 'setPassword' });
  };

  const handleCloseExpanded = () => {
    if (activeCategory?.locked) {
      setUnlockedCategoryIds((current) => {
        const next = new Set(current);
        next.delete(activeCategory.id);
        return next;
      });
      setNote((current) => ({
        ...current,
        categories: current.categories.map((category) => (
          category.id === activeCategory.id ? { ...category, content: '' } : category
        )),
      }));
    }
    setMenuCategoryId(null);
    setExpanded(false);
  };

  const handlePinComplete = async (payload) => {
    if (!pinFlow) return;
    setPinBusy(true);
    try {
      if (pinFlow.mode === 'set') {
        const { password, key } = await createPinnedPassword(payload.pin);
        setPasswordKey(key);
        if (pinFlow.action === 'lock') {
          await lockCategoryWithKey(pinFlow.categoryId, key, password);
        } else {
          const nextNote = { activeCategoryId, categories, password };
          hasEditedRef.current = true;
          setNote(nextNote);
          await saveImmediately(nextNote);
        }
        setPinFlow(null);
        return;
      }

      if (pinFlow.mode === 'enter') {
        const key = await unlockPinnedPassword(payload.pin, note.password);
        setPasswordKey(key);
        if (pinFlow.action === 'unlock') await unlockCategoryWithKey(pinFlow.categoryId, key);
        if (pinFlow.action === 'lock') await lockCategoryWithKey(pinFlow.categoryId, key);
        if (pinFlow.action === 'removeLock') await removeLockWithKey(pinFlow.categoryId, key);
        setPinFlow(null);
        return;
      }

      if (pinFlow.mode === 'change') {
        const oldKey = await unlockPinnedPassword(payload.oldPin, note.password);
        const { password, key: newKey } = await createPinnedPassword(payload.newPin);
        const nextCategories = await Promise.all(categories.map(async (category) => {
          if (!category.locked) return category;
          const plaintext = unlockedCategoryIds.has(category.id)
            ? category.content || ''
            : await decryptPinnedText(category.encrypted, oldKey);
          return {
            ...category,
            content: '',
            encrypted: await encryptPinnedText(plaintext, newKey),
          };
        }));
        const nextNote = { activeCategoryId, categories: nextCategories, password };
        hasEditedRef.current = true;
        setPasswordKey(newKey);
        setUnlockedCategoryIds(new Set());
        setNote(nextNote);
        await saveImmediately(nextNote);
        setPinFlow(null);
      }
    } finally {
      setPinBusy(false);
    }
  };

  const renderCategoryPill = () => (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-[11px] font-semibold text-white/52">
      {activeCategory?.locked ? <FaLock size={9} /> : <FaFolder size={10} />}
      <span className="min-w-0 truncate">
        当前：{activeCategory?.title || '默认'}{activeCategory?.locked ? ' · 已锁' : ''}
      </span>
    </span>
  );

  const renderCategoryList = ({ compact = false } = {}) => (
    <div className={compact ? 'grid gap-2' : 'grid gap-1.5'}>
      {categories.map((category) => {
        const active = category.id === activeCategoryId;
        const meta = getCategoryMeta(category);
        const isLockedAndHidden = category.locked && !unlockedCategoryIds.has(category.id);
        return (
          <div key={category.id} className="group relative">
            <button
              type="button"
              onClick={() => handleSwitchCategory(category.id)}
              className={`flex w-full min-w-0 items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-colors ${
                active
                  ? 'border-[#9cc9ff]/34 bg-[#9cc9ff]/14 text-white'
                  : 'border-white/8 bg-white/[0.045] text-white/58 hover:border-white/16 hover:bg-white/8 hover:text-white/82'
              } ${compact ? 'justify-center px-0' : ''}`}
              title={category.title}
            >
              <span className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold ${
                active ? 'bg-[#9cc9ff]/18 text-white' : 'bg-white/8 text-white/48'
              }`}
              >
                {category.locked ? <FaLock size={10} /> : category.title.slice(0, 1).toUpperCase()}
              </span>
              {!compact && (
                <span className="min-w-0 flex-1">
                  {renamingId === category.id ? (
                    <input
                      ref={renameInputRef}
                      value={renameValue}
                      onChange={(event) => setRenameValue(event.target.value)}
                      onBlur={confirmRename}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') confirmRename();
                        if (event.key === 'Escape') setRenamingId(null);
                      }}
                      onClick={(event) => event.stopPropagation()}
                      className="w-full rounded-lg border border-white/12 bg-black/20 px-2 py-1 text-xs text-white outline-none"
                    />
                  ) : (
                    <>
                      <span className="block truncate pr-7 text-xs font-semibold">{category.title}</span>
                      <span className="mt-0.5 block truncate text-[10px] text-white/34">
                        {isLockedAndHidden ? '已锁定' : `${meta.charCount} 字`}
                      </span>
                    </>
                  )}
                </span>
              )}
            </button>
            {!compact && renamingId !== category.id && (
              <div className="absolute right-1.5 top-1.5">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setMenuCategoryId((current) => (current === category.id ? null : category.id));
                  }}
                  className="flex size-6 items-center justify-center rounded-lg bg-black/26 text-white/42 transition-colors hover:bg-white/12 hover:text-white"
                  title="更多"
                >
                  <FaEllipsisH size={10} />
                </button>
                {menuCategoryId === category.id && (
                  <div className="absolute right-0 top-7 z-20 grid w-32 gap-1 rounded-xl border border-white/12 bg-[#0b111b]/95 p-1.5 shadow-2xl">
                    {!category.locked && (
                      <button
                        type="button"
                        onClick={() => handleLockRequest(category.id)}
                        className="rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white"
                      >
                        锁住
                      </button>
                    )}
                    {category.locked && !unlockedCategoryIds.has(category.id) && (
                      <button
                        type="button"
                        onClick={() => handleUnlockRequest(category.id)}
                        className="rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white"
                      >
                        解锁查看
                      </button>
                    )}
                    {category.locked && unlockedCategoryIds.has(category.id) && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLockRequest(category.id)}
                        className="rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white"
                      >
                        取消锁住
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setMenuCategoryId(null);
                        startRename(category);
                      }}
                      className="rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white"
                    >
                      重命名
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuCategoryId(null);
                        handleDeleteCategory(category.id);
                      }}
                      disabled={categories.length <= 1}
                      className="rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-[#ffd0d0]/80 hover:bg-white/10 hover:text-[#ffd0d0] disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      删除
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderFooter = ({ padded = 'px-4' } = {}) => (
    <div className={`grid gap-2 ${padded} py-3`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <StatusPill
          variant={saveState === 'error' ? 'warning' : 'success'}
          className="min-w-[4.75rem] justify-center"
        >
          {saveState === 'saved' && <FaCheck className="mr-1.5" size={10} />}
          {status}
        </StatusPill>
        {copyState ? (
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-white/44">
            <FaClipboard size={10} />
            {copyState}
          </span>
        ) : renderCategoryPill()}
      </div>
      <StatsBar
        charCount={charCount}
        wordCount={wordCount}
        extra={(
          <span className="flex min-w-0 items-center gap-1.5">
            <FaLock size={9} />
            <span className="min-w-0 truncate">{activeCategory?.title || '默认'}</span>
          </span>
        )}
      />
    </div>
  );

  const renderEditor = ({ expandedEditor = false } = {}) => (
    activeCategory?.locked && !activeCategoryUnlocked ? (
      <div className="flex h-full flex-col items-center justify-center px-5 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl border border-white/12 bg-white/8 text-white/58">
          <FaLock size={16} />
        </span>
        <div className="mt-4 text-sm font-semibold text-white/78">这个分类已锁住</div>
        <div className="mt-1 max-w-[240px] text-xs leading-relaxed text-white/38">
          输入 6 位数字密码后查看和编辑内容。
        </div>
        <button
          type="button"
          onClick={() => handleUnlockRequest(activeCategory.id)}
          className="mt-4 rounded-xl border border-[#9cc9ff]/24 bg-[#9cc9ff]/14 px-4 py-2 text-xs font-semibold text-white/82 transition-colors hover:bg-[#9cc9ff]/20"
        >
          输入密码
        </button>
      </div>
    ) : (
      <textarea
        value={activeContent}
        onChange={(event) => handleChange(event.target.value)}
        placeholder={`在“${activeCategory?.title || '默认'}”里记录长期信息...`}
        className={`h-full w-full resize-none bg-transparent text-white/86 outline-none placeholder-white/24 selection:bg-[#80bfff]/30 ${
          expandedEditor
            ? 'p-5 text-[15px] leading-8 md:p-6'
            : 'px-4 py-4 text-sm leading-7'
        }`}
        spellCheck={false}
      />
    )
  );

  return (
    <>
      <GlassPanel className="workspace-fixed-panel flex flex-col overflow-hidden" padded={false}>
        <div className="px-4 pb-3 pt-4">
          <PanelHeader
            eyebrow="Pinned"
            title="置顶记录"
            icon={FaThumbtack}
            meta="长期保留，不随日期切换。请不要在公共电脑保存敏感密码。"
            action={(
              <div className="flex flex-wrap items-center justify-end gap-2">
                <IconButton
                  icon={FaExpandAlt}
                  onClick={() => setExpanded(true)}
                  disabled={loading}
                  title="展开编辑"
                  className="draft-toolbar-button h-9 w-9 text-white/50 hover:text-white disabled:opacity-35"
                />
                <IconButton
                  icon={FaCopy}
                  onClick={handleDuplicateCategory}
                  disabled={loading || !activeCategory}
                  title="复制当前分类为新分类"
                  className="draft-toolbar-button h-9 w-9 text-white/50 disabled:opacity-35"
                />
                <IconButton
                  icon={FaTrashAlt}
                  onClick={handleClear}
                  disabled={loading || !activeContent}
                  title="清空当前分类"
                  className="draft-toolbar-button h-9 w-9 text-white/50 hover:text-[#ffd0d0] disabled:opacity-35"
                />
                <IconButton
                  icon={FaUndo}
                  onClick={handleUndoClear}
                  disabled={loading || !clearedCategory}
                  title="撤回清空"
                  className="draft-toolbar-button h-9 w-9 text-white/50 hover:text-[#bdf6d3] disabled:opacity-35"
                />
              </div>
            )}
          />
        </div>

        <div className="px-4 pb-2">
          {renderCategoryPill()}
        </div>

        <div className="soft-divider" />

        <div className="min-h-0 flex-1">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-white/34">
              加载中...
            </div>
          ) : renderEditor()}
        </div>

        <div className="soft-divider" />
        {renderFooter()}
      </GlassPanel>

      {expanded && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 py-6" onClick={handleCloseExpanded}>
          <div className="absolute inset-0 bg-black/44 backdrop-blur-sm" />
          <div
            className="glass-panel relative flex h-full w-full max-w-5xl flex-col overflow-hidden p-0 shadow-2xl animate-bubble"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex min-h-[92px] items-start justify-between gap-4 border-b border-white/10 px-5 py-5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/8 text-white/66">
                    <FaThumbtack size={13} />
                  </span>
                  <span className="panel-kicker">Pinned</span>
                </div>
                <h2 className="mt-2 truncate text-base font-semibold tracking-normal text-white">
                  置顶记录
                </h2>
                <p className="mt-1 max-w-[360px] truncate text-xs leading-relaxed text-white/45">
                  当前分类：{activeCategory?.title || '默认'}
                </p>
              </div>
              <div className="grid shrink-0 grid-cols-5 gap-2">
                <IconButton
                  icon={FaKey}
                  onClick={handlePasswordSettings}
                  title={note.password ? '修改置顶记录密码' : '新建置顶记录密码'}
                  className="draft-toolbar-button h-9 w-9 text-white/50 hover:text-white"
                />
                <IconButton
                  icon={FaCopy}
                  onClick={handleDuplicateCategory}
                  disabled={!activeCategory}
                  title="复制当前分类为新分类"
                  className="draft-toolbar-button h-9 w-9 text-white/50 disabled:opacity-35"
                />
                <IconButton
                  icon={FaTrashAlt}
                  onClick={handleClear}
                  disabled={!activeContent}
                  title="清空当前分类"
                  className="draft-toolbar-button h-9 w-9 text-white/50 hover:text-[#ffd0d0] disabled:opacity-35"
                />
                <IconButton
                  icon={FaUndo}
                  onClick={handleUndoClear}
                  disabled={!clearedCategory}
                  title="撤回清空"
                  className="draft-toolbar-button h-9 w-9 text-white/50 hover:text-[#bdf6d3] disabled:opacity-35"
                />
                <IconButton
                  icon={FaTimes}
                  onClick={handleCloseExpanded}
                  title="关闭"
                  className="draft-toolbar-button h-9 w-9 text-white/50 hover:text-white"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 md:flex">
              <aside className={`flex shrink-0 flex-col border-b border-white/10 bg-black/12 p-3 md:border-b-0 md:border-r ${
                sidebarCollapsed ? 'md:w-[64px]' : 'md:w-[230px]'
              }`}
              >
                <div className={`mb-3 flex items-center gap-2 ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
                  {!sidebarCollapsed && (
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white/70">分类</div>
                      <div className="mt-0.5 text-[10px] text-white/34">{categories.length} 个页面</div>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    {!sidebarCollapsed && (
                      <button
                        type="button"
                        onClick={handleAddCategory}
                        className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/8 text-white/54 transition-colors hover:bg-white/12 hover:text-white"
                        title="新增分类"
                      >
                        <FaPlus size={11} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSidebarCollapsed((value) => !value)}
                      className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/8 text-white/54 transition-colors hover:bg-white/12 hover:text-white"
                      title={sidebarCollapsed ? '展开分类列表' : '收起分类列表'}
                    >
                      {sidebarCollapsed ? (
                        <TbLayoutSidebarLeftExpand size={16} />
                      ) : (
                        <TbLayoutSidebarLeftCollapse size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {sidebarCollapsed ? (
                  <div className="min-h-0 flex-1" />
                ) : (
                  <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                    {renderCategoryList()}
                  </div>
                )}
              </aside>

              <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex items-center justify-between gap-3 border-b border-white/8 px-5 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white/82">{activeCategory?.title || '默认'}</div>
                    <div className="mt-0.5 text-xs text-white/34">{charCount} 字 · {wordCount} 词</div>
                  </div>
                  {renderCategoryPill()}
                </div>
                <div className="min-h-0 flex-1">
                  {renderEditor({ expandedEditor: true })}
                </div>
              </div>
            </div>

            <div className="soft-divider" />
            {renderFooter({ padded: 'px-5' })}
          </div>
        </div>,
        document.body,
      )}

      <PinModal
        flow={pinFlow}
        busy={pinBusy}
        onClose={() => {
          if (!pinBusy) setPinFlow(null);
        }}
        onComplete={handlePinComplete}
      />
    </>
  );
};

export default PinnedNote;
