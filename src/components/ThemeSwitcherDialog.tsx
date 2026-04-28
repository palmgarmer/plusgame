import React, { useEffect, useRef } from 'react';
import { THEMES, type ThemeDefinition, type ThemeId } from '../themes';

interface ThemeSwitcherDialogProps {
  activeThemeId: ThemeId;
  maxTheme: ThemeDefinition;
  onSelect: (id: ThemeId) => void;
  onClose: () => void;
}

const ThemeSwitcherDialog: React.FC<ThemeSwitcherDialogProps> = ({
  activeThemeId,
  maxTheme,
  onSelect,
  onClose,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const firstBtn = overlayRef.current?.querySelector<HTMLElement>('button:not([disabled])');
    firstBtn?.focus();
  }, []);

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="switcher-title"
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
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="window"
        style={{ width: '300px', maxWidth: '92vw' }}
      >
        <div className="title-bar">
          <div className="title-bar-text" id="switcher-title">
            Theme Gallery
          </div>
          <div className="title-bar-controls">
            <button aria-label="Close" onClick={onClose} />
          </div>
        </div>

        <div className="window-body" style={{ padding: '8px 12px 12px' }}>
          {THEMES.map((theme, i) => {
            const unlocked = theme.unlockStreak <= maxTheme.unlockStreak;
            const isActive = theme.id === activeThemeId;
            const isLast = i === THEMES.length - 1;

            return (
              <div
                key={theme.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  padding: '7px 4px',
                  borderBottom: isLast ? 'none' : '1px solid #ccc',
                  opacity: unlocked ? 1 : 0.5,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 'bold',
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {isActive && <span style={{ color: 'green' }}>✓</span>}
                    {theme.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#555', marginTop: '2px' }}>
                    {unlocked
                      ? theme.tagline
                      : `🔒 Unlock at streak ${theme.unlockStreak}`}
                  </div>
                </div>

                <button
                  disabled={!unlocked || isActive}
                  onClick={() => onSelect(theme.id)}
                  style={{ fontSize: '0.75rem', minWidth: '58px', flexShrink: 0 }}
                >
                  {isActive ? 'Active' : unlocked ? 'Apply' : 'Locked'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ThemeSwitcherDialog;
