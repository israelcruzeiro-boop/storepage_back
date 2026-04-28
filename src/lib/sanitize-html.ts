const UNSAFE_TAGS = /<\/?(script|iframe|object|embed|link|meta|base|form|input|button|textarea|select|option|style)[^>]*>/gi;
const EVENT_HANDLER_ATTRIBUTES = /\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const JAVASCRIPT_URLS = /\s+(href|src|xlink:href)\s*=\s*("javascript:[^"]*"|'javascript:[^']*'|javascript:[^\s>]+)/gi;
const DANGEROUS_STYLE_EXPRESSIONS = /\s+style\s*=\s*("[^"]*(?:expression|javascript:|url\s*\(\s*javascript:)[^"]*"|'[^']*(?:expression|javascript:|url\s*\(\s*javascript:)[^']*')/gi;

export function sanitizeHtml(html: string): string {
  return html
    .replace(UNSAFE_TAGS, '')
    .replace(EVENT_HANDLER_ATTRIBUTES, '')
    .replace(JAVASCRIPT_URLS, '')
    .replace(DANGEROUS_STYLE_EXPRESSIONS, '');
}
