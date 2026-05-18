import React, { useMemo } from 'react';
import { marked } from 'marked';
import { sanitizeHtml } from '../../utils/sanitizeHtml';

marked.setOptions({
  gfm: true,
  breaks: true,
  async: false,
});

const MarkdownPreview = ({ content }) => {
  const html = useMemo(() => {
    try {
      return sanitizeHtml(marked.parse(content || ''));
    } catch {
      return '<p>预览渲染失败</p>';
    }
  }, [content]);

  return (
    <div
      className="markdown-preview mx-auto max-w-3xl text-[15px] leading-relaxed"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default MarkdownPreview;
