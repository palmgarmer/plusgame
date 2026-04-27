import { useState, useCallback, useEffect, useRef } from 'react';
import {
  type ThemeId,
  type ThemeDefinition,
  THEMES,
  loadSavedThemeId,
  saveThemeId,
  loadMaxThemeId,
  saveMaxThemeId,
} from '../themes';

const LINK_ID = 'plusgame-theme-css';

/**
 * Manages dynamic CSS theme swapping.
 * - win98 uses the bundled 98.css (imported in main.tsx); the dynamic link is removed.
 * - All other themes are loaded via a <link> tag injected into <head>.
 * - A CSS class `theme-fading` is applied to <body> during the swap for a fade transition.
 */
export function useTheme() {
  const [activeThemeId, setActiveThemeId] = useState<ThemeId>(loadSavedThemeId);
  const [maxThemeId, setMaxThemeId] = useState<ThemeId>(loadMaxThemeId);
  const fadingRef = useRef(false);

  // Apply theme on mount and whenever it changes
  useEffect(() => {
    applyThemeCss(activeThemeId);
  }, [activeThemeId]);

  const applyTheme = useCallback(
    (id: ThemeId, withFade = true) => {
      if (fadingRef.current) return;

      // Persist immediately so a page reload during the fade doesn't lose the choice
      saveThemeId(id);
      const newThemeDef = THEMES.find((t) => t.id === id)!;
      const maxThemeDef = THEMES.find((t) => t.id === maxThemeId)!;
      const willUpdateMax = newThemeDef.unlockStreak >= maxThemeDef.unlockStreak;
      if (willUpdateMax) saveMaxThemeId(id);

      const doSwap = () => {
        applyThemeCss(id);
        setActiveThemeId(id);
        if (willUpdateMax) setMaxThemeId(id);
      };

      if (withFade) {
        fadingRef.current = true;
        document.body.classList.add('theme-fading');
        setTimeout(() => {
          doSwap();
          // Use setTimeout instead of rAF so it fires even in throttled/backgrounded contexts
          setTimeout(() => {
            document.body.classList.remove('theme-fading');
            fadingRef.current = false;
          }, 50);
        }, 200); // matches the CSS transition duration
      } else {
        doSwap();
      }
    },
    [maxThemeId],
  );

  const activeTheme: ThemeDefinition = THEMES.find((t) => t.id === activeThemeId)!;
  const maxTheme: ThemeDefinition = THEMES.find((t) => t.id === maxThemeId)!;

  return { activeTheme, maxTheme, applyTheme };
}

// ---------------------------------------------------------------------------
// Pure DOM helper – no React state
// ---------------------------------------------------------------------------
function applyThemeCss(id: ThemeId) {
  const def = THEMES.find((t) => t.id === id)!;
  let link = document.getElementById(LINK_ID) as HTMLLinkElement | null;

  if (def.cssUrl === null) {
    // Win98: remove the dynamic link so bundled 98.css takes effect
    link?.remove();
    // Remove any lingering xp / 7 / system body classes
    document.body.className = document.body.className
      .replace(/\bxp\b|\bwin7\b|\bsystem-css\b/g, '')
      .trim();
    return;
  }

  if (!link) {
    link = document.createElement('link');
    link.id = LINK_ID;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  link.href = def.cssUrl;

  // xp.css requires a body class; 7.css and system.css do not
  document.body.className = document.body.className
    .replace(/\bxp\b|\bwin7\b|\bsystem-css\b/g, '')
    .trim();
  if (id === 'winxp') document.body.classList.add('xp');
}
