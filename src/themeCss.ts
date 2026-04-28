/**
 * Lazily loads a theme's CSS string via dynamic import so each theme is
 * code-split into its own chunk and only fetched when first needed.
 * Vite's `?inline` transform bundles all url() font/image references as
 * hashed assets (works fully offline). Results are cached in-memory so
 * subsequent calls for the same theme are instant.
 */
import type { ThemeId } from './themes';

const cache = new Map<ThemeId, string>();

export async function loadThemeCss(id: ThemeId): Promise<string | undefined> {
  if (cache.has(id)) return cache.get(id);

  let css: string | undefined;
  switch (id) {
    case 'winxp':
      css = (await import('xp.css/dist/XP.css?inline')).default;
      break;
    case 'win7':
      css = (await import('7.css/dist/7.css?inline')).default;
      break;
    case 'macos':
      css = (await import('@sakun/system.css/dist/system.css?inline')).default;
      break;
  }
  if (css !== undefined) cache.set(id, css);
  return css;
}
