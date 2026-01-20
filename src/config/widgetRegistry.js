import {
  FaClock,
  FaCalendarAlt,
  FaQuoteLeft,
  FaStar,
  FaImage,
} from "react-icons/fa";
import ClockWidget from "../components/widgets/ClockWidget";
import QuoteWidget from "../components/widgets/QuoteWidget";
import HoroscopeWidget from "../components/widgets/HoroscopeWidget";
import ImageWidget from "../components/widgets/ImageWidget";
import CalendarWidget from "../components/widgets/CalendarWidget";

// 这里定义图标和分类
export const WIDGET_REGISTRY = {
  clock: {
    id: "clock",
    name: "数字时钟",
    icon: FaClock,
    component: ClockWidget,
    defaultW: 2,
    defaultH: 1,
    category: "时间 & 日期",
  },
  calendar: {
    id: "calendar",
    name: "月历",
    icon: FaCalendarAlt,
    component: CalendarWidget,
    defaultW: 2,
    defaultH: 2,
    category: "时间 & 日期",
  },
  horoscope: {
    id: "horoscope",
    name: "星座运势",
    icon: FaStar,
    component: HoroscopeWidget,
    defaultW: 2,
    defaultH: 2,
    category: "生活 & 娱乐",
  },
  image: {
    id: "image",
    name: "相框",
    icon: FaImage,
    component: ImageWidget,
    defaultW: 3,
    defaultH: 2,
    category: "装饰 & 个性化",
  },
  quote: {
    id: "quote",
    name: "每日英语",
    icon: FaQuoteLeft,
    component: QuoteWidget,
    defaultW: 2,
    defaultH: 1,
    category: "学习 & 工具",
  },
};

export const AVAILABLE_WIDGETS = Object.values(WIDGET_REGISTRY);
