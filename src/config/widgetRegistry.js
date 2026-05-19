import {
  FaCalendarAlt,
  FaClock,
  FaImage,
  FaQuoteLeft,
  FaStar,
} from 'react-icons/fa';
import ClockWidget from '../components/widgets/ClockWidget';
import QuoteWidget from '../components/widgets/QuoteWidget';
import HoroscopeWidget from '../components/widgets/HoroscopeWidget';
import ImageWidget from '../components/widgets/ImageWidget';
import CalendarWidget from '../components/widgets/CalendarWidget';

export const WIDGET_REGISTRY = {
  clock: {
    id: 'clock',
    name: '数字时钟',
    icon: FaClock,
    component: ClockWidget,
    defaultW: 2,
    defaultH: 1,
    minW: 2,
    minH: 1,
    maxW: 4,
    maxH: 2,
    category: '时间日期',
  },
  calendar: {
    id: 'calendar',
    name: '月历',
    icon: FaCalendarAlt,
    component: CalendarWidget,
    defaultW: 2,
    defaultH: 2,
    minW: 2,
    minH: 2,
    maxW: 4,
    maxH: 4,
    category: '时间日期',
  },
  horoscope: {
    id: 'horoscope',
    name: '星座运势',
    icon: FaStar,
    component: HoroscopeWidget,
    defaultW: 2,
    defaultH: 2,
    minW: 2,
    minH: 2,
    maxW: 4,
    maxH: 4,
    category: '生活娱乐',
  },
  image: {
    id: 'image',
    name: '相框',
    icon: FaImage,
    component: ImageWidget,
    defaultW: 3,
    defaultH: 2,
    minW: 2,
    minH: 2,
    maxW: 5,
    maxH: 4,
    category: '个性化',
  },
  quote: {
    id: 'quote',
    name: '每日引用',
    icon: FaQuoteLeft,
    component: QuoteWidget,
    defaultW: 2,
    defaultH: 1,
    minW: 2,
    minH: 1,
    maxW: 4,
    maxH: 3,
    category: '学习工具',
  },
};

export const AVAILABLE_WIDGETS = Object.values(WIDGET_REGISTRY);

export function clampWidgetSize(item) {
  const config = WIDGET_REGISTRY[item?.type];
  if (!config) return item;

  const minW = config.minW || 1;
  const minH = config.minH || 1;
  const maxW = config.maxW || minW;
  const maxH = config.maxH || minH;
  const fallbackW = config.defaultW || minW;
  const fallbackH = config.defaultH || minH;
  const rawW = Number.isFinite(item.w) ? item.w : fallbackW;
  const rawH = Number.isFinite(item.h) ? item.h : fallbackH;

  return {
    ...item,
    w: Math.max(minW, Math.min(maxW, Math.round(rawW))),
    h: Math.max(minH, Math.min(maxH, Math.round(rawH))),
  };
}

export function normalizeWidgetLayout(layout) {
  if (!Array.isArray(layout)) return [];
  return layout.map(clampWidgetSize);
}
