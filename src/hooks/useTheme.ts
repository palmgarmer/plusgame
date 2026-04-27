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
import { loadThemeCss } from '../themeCss';

const STYLE_ID = 'plusgame-theme-css';

/**
 * Manages dynamic CSS theme swapping.
 * - win98 uses the bundled 98.css (imported in main.tsx); the dynamic style is removed.
 * - All other themes inject a <style> tag with CSS bundled via Vite ?inline imports.
 * - A CSS class `theme-fading` is applied to <body> during the swap for a fade transition.
 */
export function useTheme() {
  const [activeThemeId, setActiveThemeId] = useState<ThemeId>(loadSavedThemeId);
  const [maxThemeId, setMaxThemeId] = useState<ThemeId>(loadMaxThemeId);
  const fadingRef = useRef(false);

  // Apply theme on mount and whenever it changes
  useEffect(() => {
    void applyThemeCss(activeThemeId);
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

      const doSwap = async () => {
        await applyThemeCss(id);
        setActiveThemeId(id);
        if (willUpdateMax) setMaxThemeId(id);
      };

      if (withFade) {
        fadingRef.current = true;
        document.body.classList.add('theme-fading');
        setTimeout(() => {
          void doSwap().then(() => {
            // Use setTimeout instead of rAF so it fires even in throttled/backgrounded contexts
            setTimeout(() => {
              document.body.classList.remove('theme-fading');
              fadingRef.current = false;
            }, 50);
          });
        }, 200); // matches the CSS transition duration
      } else {
        void doSwap();
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
async function applyThemeCss(id: ThemeId) {
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;

  // Remove any lingering xp / 7 / system body classes
  document.body.className = document.body.className
    .replace(/\bxp\b|\bwin7\b|\bsystem-css\b/g, '')
    .trim();

  if (id === 'win98') {
    // Win98: remove the injected style so bundled 98.css takes effect
    style?.remove();
    return;
  }

  const css = await loadThemeCss(id);
  if (!css) return;

  if (!style) {
    style = document.createElement('style');
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = css;

  // xp.css requires a body class; 7.css and system.css do not
  if (id === 'winxp') document.body.classList.add('xp');
}
