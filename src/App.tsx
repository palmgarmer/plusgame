import React, { useState, useCallback, useEffect, useRef } from 'react';
import '98.css';
import { Trophy, RefreshCw } from 'lucide-react';
import Display from './components/Display';
import Keypad from './components/Keypad';
import { useTimer } from './hooks/useTimer';
import type { GameState, FeedbackState } from './types';

// ---------- constants ----------
const ROUND_DURATION = 3; // seconds
const LS_HIGH_SCORE_KEY = 'plusgame_highscore';
const MAX_INPUT_LENGTH = 2;

// ---------- helpers ----------
function generateNumbers(): number[] {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 10));
}

function loadHighScore(): number {
  try {
    return parseInt(localStorage.getItem(LS_HIGH_SCORE_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveHighScore(hs: number): void {
  try {
    localStorage.setItem(LS_HIGH_SCORE_KEY, String(hs));
  } catch {
    // localStorage may be unavailable in some environments
  }
}

function initialState(): GameState {
  return {
    numbers: generateNumbers(),
    input: '',
    timeLeft: ROUND_DURATION,
    score: 0,
    highScore: loadHighScore(),
    feedback: null,
    isActive: true,
  };
}

// ---------- component ----------
const App: React.FC = () => {
  const [state, setState] = useState<GameState>(initialState);

  // Feedback timeout ref so we can clear it before starting a new round
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Start a fresh round */
  const startRound = useCallback(() => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setState((prev) => ({
      ...prev,
      numbers: generateNumbers(),
      input: '',
      timeLeft: ROUND_DURATION,
      feedback: null,
      isActive: true,
    }));
  }, []);

  /** Resolve a round with the given feedback and update score / high score */
  const resolveRound = useCallback((fb: FeedbackState, isCorrect: boolean) => {
    setState((prev) => {
      const newScore = isCorrect ? prev.score + 1 : 0;
      const newHigh = Math.max(newScore, prev.highScore);
      if (newHigh > prev.highScore) saveHighScore(newHigh);
      return {
        ...prev,
        isActive: false,
        feedback: fb,
        score: newScore,
        highScore: newHigh,
      };
    });

    // Auto-advance to next round after brief feedback display
    feedbackTimerRef.current = setTimeout(startRound, 800);
  }, [startRound]);

  /** Timer tick – update displayed time */
  const handleTick = useCallback((remaining: number) => {
    setState((prev) => ({ ...prev, timeLeft: remaining }));
  }, []);

  /** Timer expired – mark as timeout */
  const handleExpire = useCallback(() => {
    resolveRound('timeout', false);
  }, [resolveRound]);

  useTimer(ROUND_DURATION, handleTick, handleExpire, state.isActive);

  /** Handle a keypad / keyboard key press */
  const handleKey = useCallback((key: string) => {
    if (!state.isActive) return;

    if (key === '*') {
      // Backspace / clear
      setState((prev) => ({ ...prev, input: prev.input.slice(0, -1) }));
      return;
    }

    if (key === '#') {
      // Submit
      if (state.input.length === 0) return;
      const guess = parseInt(state.input, 10);
      const answer = state.numbers.reduce((a, b) => a + b, 0);
      resolveRound(guess === answer ? 'correct' : 'wrong', guess === answer);
      return;
    }

    // Digit key: append (max MAX_INPUT_LENGTH digits)
    if (/^\d$/.test(key)) {
      setState((prev) => {
        if (prev.input.length >= MAX_INPUT_LENGTH) return prev;
        return { ...prev, input: prev.input + key };
      });
    }
  }, [state.isActive, state.input, state.numbers, resolveRound]);

  // Clean up feedback timer on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  const correct = state.numbers.reduce((a, b) => a + b, 0);

  return (
    <div
      className="flex items-center justify-center"
      style={{ minHeight: '100vh', padding: '16px' }}
    >
      {/* Windows 98 window container */}
      <div className="window" style={{ width: '320px', maxWidth: '100%' }}>
        {/* Title bar */}
        <div className="title-bar">
          <div className="title-bar-text">Plus Game v1.0</div>
          <div className="title-bar-controls">
            <button aria-label="Minimize" />
            <button aria-label="Maximize" />
            <button aria-label="Close" />
          </div>
        </div>

        {/* Scores toolbar */}
        <div className="window-body" style={{ padding: '4px 8px', borderBottom: '1px solid #888', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem' }}>
            Score: <strong>{state.score}</strong>
          </span>
          <span style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Trophy size={14} />
            Best: <strong>{state.highScore}</strong>
          </span>
        </div>

        {/* Main game body */}
        <div className="window-body" style={{ padding: '8px' }}>
          {/* Display area */}
          <Display
            numbers={state.numbers}
            timeLeft={state.timeLeft}
            totalTime={ROUND_DURATION}
            input={state.input}
            feedback={state.feedback}
          />

          {/* Feedback message */}
          {state.feedback && (
            <div
              className="text-center my-1"
              style={{
                fontSize: '0.9rem',
                fontWeight: 'bold',
                color:
                  state.feedback === 'correct'
                    ? 'green'
                    : 'red',
              }}
            >
              {state.feedback === 'correct'
                ? '✓ Correct!'
                : state.feedback === 'timeout'
                  ? `⏱ Time! Answer was ${correct}`
                  : `✗ Wrong! Answer was ${correct}`}
            </div>
          )}

          {/* Keypad */}
          <div className="mt-2">
            <Keypad onKey={handleKey} disabled={!state.isActive} />
          </div>

          {/* Manual restart */}
          <div className="flex justify-center mt-2">
            <button
              onClick={startRound}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
            >
              <RefreshCw size={14} /> New Round
            </button>
          </div>
        </div>

        {/* Status bar */}
        <div className="status-bar">
          <p className="status-bar-field" style={{ fontSize: '0.75rem' }}>
            {state.isActive ? 'Round in progress…' : 'Waiting for next round…'}
          </p>
          <p className="status-bar-field" style={{ fontSize: '0.75rem' }}>
            Add all 4 numbers and enter the sum
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
