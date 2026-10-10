import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, useReducedMotion } from 'framer-motion';
import { FiArrowUp, FiSunrise } from 'react-icons/fi';
import { useClock } from '../hooks/useClock';

export default function LockScreen({ onEnter, username, bg }) {
  const now = useClock();
  const y = useMotionValue(0);
  const opacity = useTransform(y, [-300, 0], [0, 1]);
  const reduce = useReducedMotion();
  const buttonRef = useRef(null);
  const enterRef = useRef(onEnter);
  const wheelRef = useRef({ sum: 0, at: 0 });
  useEffect(() => { enterRef.current = onEnter; }, [onEnter]);
  useEffect(() => {
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    buttonRef.current?.focus({ preventScroll: true });
    return () => { document.body.style.overflow = overflow; };
  }, []);
  const date = now.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });
  const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  return (
    <motion.section className="os-lock-screen" aria-label="欢迎屏幕" onKeyDown={event => { if (event.key === 'Tab') { event.preventDefault(); buttonRef.current?.focus(); } }} exit={{ opacity: 0, y: reduce ? 0 : '-100%' }} transition={{ duration: reduce ? 0.12 : 0.75, ease: [0.22, 1, 0.36, 1] }}
      onWheel={event => {
        const stamp = Date.now();
        if (stamp - wheelRef.current.at > 250) wheelRef.current.sum = 0;
        wheelRef.current.at = stamp;
        wheelRef.current.sum += Math.max(0, event.deltaY);
        if (wheelRef.current.sum > 100) enterRef.current();
      }}>
      <div className="os-lock-wallpaper" style={{ backgroundImage: `url(${JSON.stringify(bg)})` }} />
      <div className="os-lock-shade" />
      <div className="os-lock-top"><span className="os-wordmark"><span className="os-brand-symbol">d.</span> desktop</span><span>YOUR SPACE. YOUR PACE.</span></div>
      <motion.div className="os-lock-content" style={{ y, opacity }} drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0.8, bottom: 0.08 }} dragMomentum={false}
        onDragEnd={(_, info) => { if (info.offset.y < -75 || (info.offset.y < -20 && info.velocity.y < -500)) onEnter(); }}>
        <div className="os-lock-clock"><p>{date}</p><time className="os-tall-clock" dateTime={time}>{time}</time></div>
        <div className="os-lock-welcome"><FiSunrise size={20} strokeWidth={1.3} /><p>把时间，留给喜欢的事。</p><span>{username === 'Guest' ? '欢迎来到你的私人桌面' : `${username}，欢迎回来`}</span></div>
        <button ref={buttonRef} className="os-unlock" onClick={onEnter} title="进入桌面，也可向上滑动、滚动或按 Enter"><FiArrowUp /><span>向上滑动，进入桌面</span><small>或点击此处 · Enter</small></button>
      </motion.div>
      <div className="os-lock-bottom"><span>慢一点，也很好。</span><span>DESKTOP / PERSONAL SPACE</span></div>
    </motion.section>
  );
}
