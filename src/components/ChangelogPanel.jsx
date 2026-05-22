import React, { useMemo } from 'react';
import { FaHistory, FaTimes } from 'react-icons/fa';
import { CHANGELOG } from '../data/changelog';
import IconButton from './ui/IconButton';

const ChangelogPanel = ({ onClose }) => {
  const groupedChangelog = useMemo(() => {
    const groups = new Map();

    CHANGELOG.forEach((entry) => {
      if (!groups.has(entry.date)) groups.set(entry.date, []);
      groups.get(entry.date).push(entry);
    });

    return Array.from(groups.entries()).map(([date, entries]) => ({
      date,
      entries,
    }));
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 py-6" onClick={onClose}>
      <div className="absolute inset-0 bg-black/44 backdrop-blur-sm" />
      <div
        className="glass-panel relative flex max-h-[min(760px,86vh)] w-full max-w-2xl flex-col overflow-hidden p-0 shadow-2xl animate-bubble"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-5">
          <div>
            <div className="panel-kicker flex items-center gap-2">
              <FaHistory size={11} />
              Changelog
            </div>
            <h3 className="mt-2 text-lg font-semibold text-white">更新日志</h3>
            <p className="mt-1 text-xs leading-5 text-white/42">
              记录这个桌面工作台每次升级了什么，方便以后慢慢迭代。
            </p>
          </div>
          <IconButton icon={FaTimes} onClick={onClose} title="关闭" className="h-9 w-9" />
        </div>

        <div className="overflow-y-auto px-5 py-5 glass-scrollbar">
          <div className="relative">
            <div className="absolute bottom-2 left-[7px] top-2 w-px bg-gradient-to-b from-[#9cc9ff]/70 via-white/14 to-transparent" />
            <div className="space-y-5">
              {groupedChangelog.map((group) => (
                <article key={group.date} className="relative pl-7">
                  <span className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border border-[#9cc9ff]/50 bg-[#0b111b] shadow-[0_0_18px_rgba(156,201,255,0.42)]" />
                  <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold text-white/90">{group.date}</h4>
                      <span className="rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-[11px] font-semibold text-white/42">
                        {group.entries.length} 项更新
                      </span>
                    </div>
                    <div className="mt-4 space-y-4">
                      {group.entries.map((entry) => (
                        <section
                          key={`${entry.date}-${entry.title}`}
                          className="rounded-xl border border-white/8 bg-black/10 px-3.5 py-3"
                        >
                          <h5 className="text-sm font-semibold text-white/84">{entry.title}</h5>
                          <p className="mt-1.5 text-xs leading-5 text-white/46">{entry.summary}</p>
                          <ul className="mt-2.5 space-y-1.5 text-xs leading-5 text-white/58">
                            {entry.items.map((item) => (
                              <li key={item} className="flex gap-2">
                                <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-[#9ae9bd]/80" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </section>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangelogPanel;
