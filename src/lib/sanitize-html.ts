import sanitizeHtmlLibrary from 'sanitize-html';

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'blockquote',
  'pre',
  'code',
  'ul',
  'ol',
  'li',
  'a',
  'img',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
] as const;

const SAFE_LINK_PROTOCOLS = new Set(['http', 'https', 'mailto', 'tel']);
const SAFE_IMAGE_PROTOCOLS = new Set(['http', 'https']);

function getProtocol(value: string): string | null {
  const match = value.trim().match(/^([a-z][a-z0-9+.-]*):/i);
  return match?.[1]?.toLowerCase() ?? null;
}

function isSafeUrl(value: string | undefined, protocols: Set<string>): boolean {
  if (!value) return false;
  const protocol = getProtocol(value);
  return protocol !== null && protocols.has(protocol);
}

const SANITIZE_OPTIONS: sanitizeHtmlLibrary.IOptions = {
  allowedTags: [...ALLOWED_TAGS],
  allowedAttributes: {
    '*': ['title'],
    a: ['href', 'target', 'rel', 'title'],
    img: ['src', 'alt', 'title', 'width', 'height'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: {
    img: ['http', 'https'],
  },
  allowedSchemesAppliedToAttributes: ['href', 'src'],
  allowProtocolRelative: false,
  nonTextTags: ['script', 'style', 'textarea', 'option', 'iframe', 'svg', 'math'],
  parseStyleAttributes: false,
  transformTags: {
    a: (tagName, attributes) => {
      const safeAttributes = { ...attributes };

      if (!isSafeUrl(safeAttributes.href, SAFE_LINK_PROTOCOLS)) {
        delete safeAttributes.href;
      }

      if (safeAttributes.target === '_blank') {
        safeAttributes.rel = 'noopener noreferrer';
      } else {
        delete safeAttributes.target;
      }

      return { tagName, attribs: safeAttributes };
    },
    img: (tagName, attributes) => {
      const safeAttributes = { ...attributes };

      if (!isSafeUrl(safeAttributes.src, SAFE_IMAGE_PROTOCOLS)) {
        delete safeAttributes.src;
      }

      return { tagName, attribs: safeAttributes };
    },
  },
};

export function sanitizeHtml(html: string): string {
  return sanitizeHtmlLibrary(html, SANITIZE_OPTIONS);
}
