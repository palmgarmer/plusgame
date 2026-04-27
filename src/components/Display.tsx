import React from 'react';
import type { DisplayProps } from '../types';

/**
 * Displays the four random numbers, the player's current input,
 * a countdown progress bar, and visual feedback flash.
 */
const Display: React.FC<DisplayProps> = ({
  numbers,
  timeLeft,
  totalTime,
  input,
  feedback,
  isPaused,
  answer,
}) => {
  const progressPct = (timeLeft / totalTime) * 100;

  // Choose progress bar colour based on remaining time
  const barColour =
    timeLeft > totalTime * 0.6
      ? '#00aa00'
      : timeLeft > totalTime * 0.3
        ? '#ffaa00'
        : '#cc0000';

  // Determine feedback overlay class
  const feedbackClass =
    feedback === 'correct'
      ? 'feedback-correct'
      : feedback === 'wrong' || feedback === 'timeout'
        ? 'feedback-wrong'
        : '';

  return (
    <div className={`p-4 ${feedbackClass}`} style={{ transition: 'background-color 0.1s' }}>
      {/* Four random numbers */}
      <div className="flex justify-center gap-4 mb-3">
        {numbers.map((n, i) => (
          <div
            key={i}
            className="number-display w-14 h-14 flex items-center justify-center border-2"
            style={{ border: '2px inset #888', background: 'white', fontSize: '2rem', fontFamily: 'Courier New, monospace', fontWeight: 'bold' }}
          >
            {n}
          </div>
        ))}
      </div>

      {/* Equation hint */}
      <div className="text-center mb-3" style={{ fontSize: '1rem', color: '#444' }}>
        {numbers.length > 0 && (
          <span>{numbers.join(' + ')} = ?</span>
        )}
      </div>

      {/* Input display */}
      <div
        className="mx-auto mb-3 flex items-center justify-center"
        style={{
          width: '100%',
          height: '2.5rem',
          border: '2px inset #888',
          background: 'white',
          fontSize: '1.5rem',
          fontFamily: 'Courier New, monospace',
          letterSpacing: '0.1em',
        }}
      >
        {input || <span style={{ color: '#aaa' }}>_</span>}
      </div>

      {/* Countdown progress bar container */}
      <div style={{ height: '16px', border: '2px inset #888', background: '#c0c0c0', marginBottom: '4px' }}>
        <div
          className="timer-bar h-full"
          style={{
            width: `${progressPct}%`,
            background: barColour,
            transition: 'width 0.1s linear, background-color 0.5s',
          }}
        />
      </div>
      <div
        className="text-center"
        style={{
          fontSize: '0.75rem',
          fontWeight: feedback ? 'bold' : undefined,
          color: feedback === 'correct' ? 'green' : feedback ? 'red' : '#444',
        }}
      >
        {feedback === 'correct'
          ? '✓ Correct!'
          : feedback === 'timeout'
            ? `⏱ Time! Answer was ${answer}`
            : feedback === 'wrong'
              ? `✗ Wrong! Answer was ${answer}`
              : isPaused
                ? 'Paused'
                : `Time: ${timeLeft.toFixed(1)}s`}
      </div>
    </div>
  );
};

export default Display;
