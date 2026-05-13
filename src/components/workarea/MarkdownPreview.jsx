import React, { useMemo } from 'react';
import { marked } from 'marked';

// Configure marked once
marked.use({
  gfm: true,
  breaks: true,
});

const MarkdownPreview = ({ content }) => {
  const html = useMemo(() => {
    try {
      return marked.parse(content || '');
    } catch {
      return '<p>渲染错误</p>';
    }
  }, [content]);

  return (
    <div
      className="markdown-preview text-sm leading-relaxed"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default MarkdownPreview;
