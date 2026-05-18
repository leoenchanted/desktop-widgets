const BLOCKED_TAGS = ['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta'];
const URL_ATTRS = ['href', 'src', 'xlink:href'];

export function sanitizeHtml(html) {
  if (typeof document === 'undefined') return html;

  const template = document.createElement('template');
  template.innerHTML = html;

  template.content.querySelectorAll(BLOCKED_TAGS.join(',')).forEach((node) => {
    node.remove();
  });

  template.content.querySelectorAll('*').forEach((node) => {
    [...node.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim().toLowerCase();

      if (name.startsWith('on')) {
        node.removeAttribute(attr.name);
        return;
      }

      if (URL_ATTRS.includes(name) && value.startsWith('javascript:')) {
        node.removeAttribute(attr.name);
      }
    });
  });

  return template.innerHTML;
}
