import { AVAILABLE_WIDGETS } from '../config/widgetRegistry';
import { FiPlus } from 'react-icons/fi';

const descriptions = { clock: '把握当下的每一刻', calendar: '让日子清晰可见', horoscope: '今天也会有好事发生', image: '把喜欢的风景留在身边', quote: '一句话，一点新灵感' };
export default function WidgetPicker({ onAdd }) {
  return <div className="os-widget-library"><p className="os-guide-intro">小小的组件，让桌面更像你。添加后可在编辑模式中自由排列。</p><div className="os-widget-options">{AVAILABLE_WIDGETS.map(widget => {
    const Icon = widget.icon;
    return <button key={widget.id} onClick={() => onAdd(widget)}><span className={`os-widget-preview os-widget-preview-${widget.id}`}>
      {widget.id === 'clock' ? <span className="os-preview-clock">09:41</span> : widget.id === 'calendar' ? <span className="os-preview-calendar"><small>星期二</small>15</span> : widget.id === 'quote' ? <span className="os-preview-quote">“<small>生活，自有回响。</small></span> : <Icon size={32} />}
    </span><span className="os-widget-description"><strong>{widget.name}</strong><small>{descriptions[widget.id]}</small></span><span className="os-widget-add"><FiPlus /></span></button>;
  })}</div><p className="os-dialog-note">组件配置随完整 JSON 备份一起保存。</p></div>;
}
