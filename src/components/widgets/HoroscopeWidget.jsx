import React, { useState, useEffect } from "react";
import {
  FaStar,
  FaHeart,
  FaBriefcase,
  FaCoins,
  FaBolt,
  FaSpinner,
} from "react-icons/fa";

const ALL_SIGNS = [
  { val: "白羊座", date: "3.21-4.19" },
  { val: "金牛座", date: "4.20-5.20" },
  { val: "双子座", date: "5.21-6.21" },
  { val: "巨蟹座", date: "6.22-7.22" },
  { val: "狮子座", date: "7.23-8.22" },
  { val: "处女座", date: "8.23-9.22" },
  { val: "天秤座", date: "9.23-10.23" },
  { val: "天蝎座", date: "10.24-11.22" },
  { val: "射手座", date: "11.23-12.21" },
  { val: "摩羯座", date: "12.22-1.19" },
  { val: "水瓶座", date: "1.20-2.18" },
  { val: "双鱼座", date: "2.19-3.20" },
];

const HoroscopeWidget = () => {
  const [sign, setSign] = useState(
    localStorage.getItem("glass_sign") || "白羊座",
  );
  const [activeTab, setActiveTab] = useState("summary");
  const [data, setData] = useState(null);

  // 确定的伪随机生成器 (保证每天结果一样)
  const generateData = (signName) => {
    const today = new Date().toDateString();
    let seed = 0;
    const str = signName + today;
    for (let i = 0; i < str.length; i++)
      seed = str.charCodeAt(i) + ((seed << 5) - seed);
    const rnd = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    const summaries = [
      "今天星象显示出一种平衡的态势，适合处理积压已久的任务。",
      "直觉异常敏锐，遇到抉择时请听从内心。",
      "人际关系有小波折，真诚能化解一切。",
      "财运有意外收获，但需理性消费。",
      "适合独处思考，整理近期思绪。",
      "充满活力，把能量投入工作中吧！",
      "注意休息，不要给自己太大压力。",
      "可能会遇到许久未见的老朋友。",
    ];

    return {
      summary:
        summaries[Math.floor(rnd() * summaries.length)] +
        " 保持积极的心态，宇宙的能量将与你同在。记得多喝水，注意休息。", // 加长文本测试滚动
      lucky_color: ["红", "蓝", "金", "紫", "白", "绿"][Math.floor(rnd() * 6)],
      lucky_number: Math.floor(rnd() * 9 + 1),
      scores: {
        love: Math.floor(rnd() * 40 + 60),
        work: Math.floor(rnd() * 50 + 50),
        money: Math.floor(rnd() * 60 + 40),
        health: Math.floor(rnd() * 30 + 70),
      },
    };
  };

  useEffect(() => {
    setData(null); // Reset to show loading
    const timer = setTimeout(() => {
      setData(generateData(sign));
    }, 600);
    localStorage.setItem("glass_sign", sign);
    return () => clearTimeout(timer);
  }, [sign]);

  return (
    // 添加 p-5 还原内边距
    <div className="flex flex-col h-full w-full p-5">
      <div className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2 flex-shrink-0">
        <FaStar /> 星座运势
      </div>

      <div className="flex gap-2 mb-3 flex-shrink-0">
        <select
          value={sign}
          onChange={(e) => setSign(e.target.value)}
          className="w-full bg-black/20 border border-white/20 text-white py-1.5 px-3 rounded-xl text-sm outline-none cursor-pointer appearance-none hover:bg-black/30 transition-colors"
        >
          {ALL_SIGNS.map((s) => (
            <option key={s.val} value={s.val}>
              {s.val} ({s.date})
            </option>
          ))}
        </select>
      </div>

      <div className="flex bg-black/20 rounded-xl p-1 mb-3 flex-shrink-0">
        {["summary", "details"].map((tab) => (
          <div
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 text-center py-1 rounded-lg text-xs cursor-pointer transition-all ${activeTab === tab ? "bg-white/20 text-white font-semibold" : "text-white/60 hover:text-white"}`}
          >
            {tab === "summary" ? "今日概述" : "详细指数"}
          </div>
        ))}
      </div>

      {/* 
          内容区域：
          1. flex-1 撑满剩余高度
          2. overflow-y-auto 允许滚动
          3. glass-scrollbar 应用自定义滚动条样式
      */}
      <div className="flex-1 overflow-y-auto glass-scrollbar relative pr-1">
        {!data ? (
          <div className="flex h-full items-center justify-center opacity-60 gap-2 text-sm">
            <FaSpinner className="animate-spin" /> 计算中...
          </div>
        ) : (
          <>
            {activeTab === "summary" && (
              <div className="animate-fade-in">
                <p className="text-sm leading-relaxed opacity-90 mb-4 text-justify">
                  {data.summary}
                </p>
                <div className="grid grid-cols-2 gap-3 pb-2">
                  <div className="bg-white/10 rounded-xl p-2 text-center">
                    <span className="block text-[10px] opacity-60 mb-1">
                      幸运色
                    </span>
                    <strong className="text-sm">{data.lucky_color}</strong>
                  </div>
                  <div className="bg-white/10 rounded-xl p-2 text-center">
                    <span className="block text-[10px] opacity-60 mb-1">
                      幸运数字
                    </span>
                    <strong className="text-sm">{data.lucky_number}</strong>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "details" && (
              <div className="animate-fade-in space-y-4 pt-1 pb-2">
                {[
                  {
                    icon: <FaHeart className="text-[#ff2d55]" />,
                    label: "爱情",
                    val: data.scores.love,
                    color: "bg-[#ff2d55]",
                  },
                  {
                    icon: <FaBriefcase className="text-[#5856d6]" />,
                    label: "事业",
                    val: data.scores.work,
                    color: "bg-[#5856d6]",
                  },
                  {
                    icon: <FaCoins className="text-[#ffcc00]" />,
                    label: "财运",
                    val: data.scores.money,
                    color: "bg-[#ffcc00]",
                  },
                  {
                    icon: <FaBolt className="text-[#30d158]" />,
                    label: "健康",
                    val: data.scores.health,
                    color: "bg-[#30d158]",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-center text-sm">
                    <div className="w-6 flex justify-center">{item.icon}</div>
                    <div className="w-10 opacity-80 text-xs ml-2">
                      {item.label}
                    </div>
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full mx-3 overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-1000`}
                        style={{ width: `${item.val}%` }}
                      />
                    </div>
                    <div className="w-8 text-right text-xs">{item.val}%</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
export default HoroscopeWidget;
