import React, { useEffect, useCallback } from 'react';
import type { KeypadProps } from '../types';

/** Keys in layout order (3×4 grid like an old phone pad) */
const KEYPAD_LAYOUT: string[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['*', '0', '#'],
];

/** Physical keyboard keys that map to keypad actions */
const KEYBOARD_MAP: Record<string, string> = {
  '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
  '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
  'Numpad0': '0', 'Numpad1': '1', 'Numpad2': '2', 'Numpad3': '3',
  'Numpad4': '4', 'Numpad5': '5', 'Numpad6': '6', 'Numpad7': '7',
  'Numpad8': '8', 'Numpad9': '9',
  'Backspace': '*',
  'Enter': '#',
};

/**
 * 3×4 phone-style keypad.
 *  - Digits 0-9 append to the input
 *  - '*' acts as backspace / clear
 *  - '#' acts as submit / enter
 * Supports both mouse clicks and physical keyboard (number row + numpad).
 */
const Keypad: React.FC<KeypadProps> = ({ onKey, disabled }) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) return;
      const mapped = KEYBOARD_MAP[e.key] ?? KEYBOARD_MAP[e.code];
      if (mapped !== undefined) {
        e.preventDefault();
        onKey(mapped);
      }
    },
    [disabled, onKey],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
      {KEYPAD_LAYOUT.flat().map((key) => {
        const isSpecial = key === '*' || key === '#';
        return (
          <button
            key={key}
            className="keypad-btn"
            disabled={disabled}
            onClick={() => onKey(key)}
            style={{
              padding: '12px 0',
              fontSize: '1.25rem',
              fontFamily: 'Arial, sans-serif',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
              background: isSpecial ? '#c0c0c0' : 'silver',
              minWidth: '56px',
            }}
          >
            {key === '*' ? '⌫' : key === '#' ? '↵' : key}
          </button>
        );
      })}
    </div>
  );
};

export default Keypad;
