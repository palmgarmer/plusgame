import React from 'react';
import type { KeypadProps } from '../types';

/** Keys in layout order (3×4 grid like an old phone pad) */
const KEYPAD_LAYOUT: string[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['*', '0', '#'],
];

/**
 * 3×4 phone-style keypad.
 *  - Digits 0-9 append to the input
 *  - '*' acts as backspace / clear
 *  - '#' acts as submit / enter
 * Supports mouse/touch clicks. Keyboard shortcuts are handled by App.
 */
const Keypad: React.FC<KeypadProps> = ({ onKey, disabled }) => {
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
            {key === '*' ? 'c' : key === '#' ? '#' : key}
          </button>
        );
      })}
    </div>
  );
};

export default Keypad;
