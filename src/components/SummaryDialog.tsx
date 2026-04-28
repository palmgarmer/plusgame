import React, { useEffect, useRef } from 'react';
import type { StreakSummary } from '../types';

interface SummaryDialogProps {
  summary: StreakSummary;
  onClose: () => void;
}

const SummaryDialog: React.FC<SummaryDialogProps> = ({ summary, onClose }) => {
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    btnRef.current?.focus();
  }, []);

  const mins = Math.floor(summary.totalTime / 60);
  const secs = summary.totalTime % 60;
  const timeLabel =
    mins > 0
      ? `${mins}m ${Math.round(secs)}s`
      : `${secs.toFixed(1)} seconds`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="summary-title"
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
    >
      <div className="window" style={{ width: '300px', maxWidth: '92vw' }}>
        {/* Title bar */}
        <div className="title-bar">
          <div className="title-bar-text" id="summary-title">
            Streak Summary
          </div>
          <div className="title-bar-controls">
            <button aria-label="Close" onClick={onClose} />
          </div>
        </div>

        <div className="window-body" style={{ padding: '12px 16px' }}>
          {/* Icon + streak */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <img
              src="https://win98icons.alexmeub.com/icons/png/msg_warning-0.png"
              width={32}
              height={32}
              alt=""
              aria-hidden="true"
              style={{ imageRendering: 'pixelated', flexShrink: 0 }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                Streak ended at {summary.streak}!
              </div>
              <div style={{ fontSize: '0.78rem', color: '#555' }}>
                You played for {timeLabel}.
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid #888', marginBottom: '10px' }} />

          {/* Failed question */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '0.78rem', color: '#555', marginBottom: '4px' }}>
              The Mistake
            </div>
            <div
              style={{
                fontFamily: 'Courier New, monospace',
                fontSize: '1rem',
                fontWeight: 'bold',
                background: 'white',
                border: '2px inset #888',
                padding: '4px 8px',
                marginBottom: '4px',
              }}
            >
              {summary.failedNumbers.join(' + ')} = ?
            </div>
            <div style={{ fontSize: '0.82rem', color: summary.failReason === 'timeout' ? '#b85000' : '#cc0000' }}>
              {summary.failReason === 'timeout' ? '⏱ Time ran out.' : '✗ Wrong answer.'}{' '}
              Correct answer was <strong>{summary.failedAnswer}</strong>.
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button ref={btnRef} onClick={onClose} style={{ fontWeight: 'bold' }}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryDialog;
