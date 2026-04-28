import React, { useEffect, useRef } from 'react';
import type { ThemeDefinition } from '../themes';
import { loadThemeCss } from '../themeCss';

interface ThemeRewardDialogProps {
  theme: ThemeDefinition;
  onApply: () => void;
  onDismiss: () => void;
}

const PREVIEW_STYLE_ID = 'plusgame-theme-preview';

/**
 * Congratulations dialog shown when a new theme is unlocked.
 * Injects the new theme's CSS as a live preview while the dialog
 * is open. The preview style is removed if the player dismisses.
 */
const ThemeRewardDialog: React.FC<ThemeRewardDialogProps> = ({
  theme,
  onApply,
  onDismiss,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Inject the new theme CSS for a live preview; clean up on unmount
  useEffect(() => {
    let cancelled = false;
    void loadThemeCss(theme.id).then((css) => {
      if (cancelled || !css) return;
      let style = document.getElementById(PREVIEW_STYLE_ID) as HTMLStyleElement | null;
      if (!style) {
        style = document.createElement('style');
        style.id = PREVIEW_STYLE_ID;
        document.head.appendChild(style);
      }
      style.textContent = css;
      // xp.css scopes its selectors under body.xp
      if (theme.id === 'winxp') document.body.classList.add('xp');
    });

    return () => {
      cancelled = true;
      document.getElementById(PREVIEW_STYLE_ID)?.remove();
      document.body.classList.remove('xp');
    };
  }, [theme.id]);

  // Focus first button on mount
  useEffect(() => {
    const focusable = overlayRef.current?.querySelectorAll<HTMLElement>('button');
    focusable?.[0]?.focus();
  }, []);

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reward-title"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        background: 'rgba(0,0,0,0.55)',
        animation: 'plusgame-fadein 0.25s ease both',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onDismiss();
      }}
    >
      <div
        className="window"
        style={{ width: '280px', maxWidth: '90vw' }}
      >
        <div className="title-bar">
          <div className="title-bar-text" id="reward-title">
            🎉 Theme Unlocked!
          </div>
          <div className="title-bar-controls">
            <button aria-label="Close" onClick={onDismiss} />
          </div>
        </div>

        <div className="window-body" style={{ padding: '12px 16px' }}>
          <p style={{ margin: '0 0 4px', fontWeight: 'bold', fontSize: '1rem' }}>
            {theme.name}
          </p>
          <p style={{ margin: '0 0 12px', fontSize: '0.82rem', color: '#444' }}>
            {theme.tagline}
          </p>
          <p style={{ margin: '0 0 16px', fontSize: '0.78rem', color: '#555' }}>
            The page is now previewing this theme. Apply to keep it!
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button onClick={onDismiss}>Keep Current</button>
            <button onClick={onApply} style={{ fontWeight: 'bold' }}>
              Apply &amp; Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeRewardDialog;

