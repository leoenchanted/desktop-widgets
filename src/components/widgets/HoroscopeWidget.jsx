import React, { useEffect, useState } from 'react';
import {
  FaBolt,
  FaBriefcase,
  FaCoins,
  FaHeart,
  FaSpinner,
  FaStar,
} from 'react-icons/fa';

const SIGNS = [
  { val: '白羊座', date: '3.21-4.19' },
  { val: '金牛座', date: '4.20-5.20' },
  { val: '双子座', date: '5.21-6.21' },
  { val: '巨蟹座', date: '6.22-7.22' },
  { val: '狮子座', date: '7.23-8.22' },
  { val: '处女座', date: '8.23-9.22' },
  { val: '天秤座', date: '9.23-10.23' },
  { val: '天蝎座', date: '10.24-11.22' },
  { val: '射手座', date: '11.23-12.21' },
  { val: '摩羯座', date: '12.22-1.19' },
  { val: '水瓶座', date: '1.20-2.18' },
  { val: '双鱼座', date: '2.19-3.20' },
];

const summaries = [
  '适合处理积压任务，把复杂的事情拆成小步骤会更顺。',
  '直觉很敏锐，适合做需要判断力的选择。',
  '沟通会带来新的线索，别急着把想法收起来。',
  '适合整理环境，也适合重新规划接下来几天。',
  '能量稳定，专注在一件最重要的事上会很有效。',
  '今天更适合慢一点，稳定节奏比冲刺更重要。',
];

const makeDailyData = (signName) => {
  const date = new Date().toDateString();
  let seed = 0;
  const str = signName + date;
  for (let i = 0; i < str.length; i += 1) {
    seed = str.charCodeAt(i) + ((seed << 5) - seed);
  }
  const rnd = () => {
    const x = Math.sin(seed += 1) * 10000;
    return x - Math.floor(x);
  };

  return {
    summary: summaries[Math.floor(rnd() * summaries.length)],
    luckyColor: ['蓝色', '绿色', '银色', '白色', '金色', '紫色'][Math.floor(rnd() * 6)],
    luckyNumber: Math.floor(rnd() * 9 + 1),
    scores: {
      love: Math.floor(rnd() * 35 + 60),
      work: Math.floor(rnd() * 42 + 55),
      money: Math.floor(rnd() * 45 + 45),
      health: Math.floor(rnd() * 30 + 68),
    },
  };
};

const ScoreRow = ({ icon, label, value, color }) => (
  <div className="flex items-center text-sm">
    <div className="flex w-6 justify-center">{icon}</div>
    <div className="ml-2 w-10 text-xs text-white/58">{label}</div>
    <div className="mx-3 h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${value}%` }}
      />
    </div>
    <div className="w-8 text-right text-xs text-white/62">{value}</div>
  </div>
);

const HoroscopeWidget = () => {
  const [sign, setSign] = useState(localStorage.getItem('glass_sign') || '白羊座');
  const [data, setData] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setData(makeDailyData(sign));
    }, 250);
    localStorage.setItem('glass_sign', sign);
    return () => clearTimeout(timer);
  }, [sign]);

  return (
    <div className="flex h-full w-full flex-col p-5">
      <div className="mb-3 flex flex-shrink-0 items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-white/54">
        <FaStar size={12} />
        星座运势
      </div>

      <select
        value={sign}
        onChange={(e) => setSign(e.target.value)}
        className="mb-4 w-full cursor-pointer appearance-none rounded-2xl border border-white/12 bg-black/20 px-3 py-2 text-sm text-white outline-none transition-colors hover:bg-black/28"
      >
        {SIGNS.map((item) => (
          <option key={item.val} value={item.val}>
            {item.val} ({item.date})
          </option>
        ))}
      </select>

      <div className="flex-1 overflow-y-auto pr-1 glass-scrollbar">
        {!data ? (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-white/38">
            <FaSpinner className="animate-spin" />
            计算中...
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <p className="text-sm leading-relaxed text-white/78">{data.summary}</p>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-white/8 p-3 text-center">
                <span className="block text-[10px] text-white/34">幸运色</span>
                <strong className="mt-1 block text-sm text-white">{data.luckyColor}</strong>
              </div>
              <div className="rounded-2xl bg-white/8 p-3 text-center">
                <span className="block text-[10px] text-white/34">幸运数字</span>
                <strong className="mt-1 block text-sm text-white">{data.luckyNumber}</strong>
              </div>
            </div>

            <div className="space-y-3">
              <ScoreRow icon={<FaHeart className="text-[#ff9db5]" />} label="爱情" value={data.scores.love} color="bg-[#ff9db5]" />
              <ScoreRow icon={<FaBriefcase className="text-[#80bfff]" />} label="事业" value={data.scores.work} color="bg-[#80bfff]" />
              <ScoreRow icon={<FaCoins className="text-[#f8d77a]" />} label="财运" value={data.scores.money} color="bg-[#f8d77a]" />
              <ScoreRow icon={<FaBolt className="text-[#7ee7ad]" />} label="健康" value={data.scores.health} color="bg-[#7ee7ad]" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HoroscopeWidget;
