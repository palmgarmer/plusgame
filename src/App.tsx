import React, { useState, useCallback, useEffect, useRef } from "react";
import "98.css";
import { Trophy } from "lucide-react";
import Display from "./components/Display";
import Keypad from "./components/Keypad";
import ThemeRewardDialog from "./components/ThemeRewardDialog";
import ThemeSwitcherDialog from "./components/ThemeSwitcherDialog";
import SummaryDialog from "./components/SummaryDialog";
import { useTimer } from "./hooks/useTimer";
import { useTheme } from "./hooks/useTheme";
import type { GameState, FeedbackState, StreakSummary } from "./types";
import { getThemeForStreak, type ThemeDefinition } from "./themes";

// ---------- constants ----------
const ROUND_DURATION = 3; // seconds
const LS_HIGH_SCORE_KEY = "plusgame_highscore";
const MAX_INPUT_LENGTH = 2;

// ---------- helpers ----------
function generateNumbers(): number[] {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 10));
}

function loadHighScore(): number {
  try {
    return parseInt(localStorage.getItem(LS_HIGH_SCORE_KEY) ?? "0", 10) || 0;
  } catch {
    return 0;
  }
}

function saveHighScore(hs: number): void {
  try {
    localStorage.setItem(LS_HIGH_SCORE_KEY, String(hs));
  } catch {
    // ignore
  }
}

function initialState(): GameState {
  return {
    numbers: generateNumbers(),
    input: "",
    timeLeft: ROUND_DURATION,
    score: 0,
    highScore: loadHighScore(),
    feedback: null,
    isActive: true,
    isPaused: false,
    isWaitingForNext: false,
    roundId: 1,
    recordTime: 0,
    streak: 0,
  };
}

// ---------- component ----------
const App: React.FC = () => {
  const [state, setState] = useState<GameState>(initialState);

  // Theme system
  const { activeTheme, maxTheme, applyTheme, unlockTheme } = useTheme();

  // Reward dialog state: null = hidden, else the theme to preview
  const [pendingReward, setPendingReward] = useState<ThemeDefinition | null>(
    null,
  );

  // Theme switcher dialog
  const [showThemeSwitcher, setShowThemeSwitcher] = useState(false);

  // Summary dialog: shown after a losing round if streak was > 0
  const [streakSummary, setStreakSummary] = useState<StreakSummary | null>(null);

  // Total elapsed time across the current streak, including the failed round.
  // This avoids race conditions between render timing and performance.now().
  const streakElapsedRef = useRef(0);

  // Track the highest streak threshold we've already rewarded (seed from max unlocked)
  const lastTriggeredStreakRef = useRef(maxTheme.unlockStreak);

  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -----------------------------------------------------------------------
  // Round management
  // -----------------------------------------------------------------------

  const startRound = useCallback((resetScore = false) => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    if (resetScore) {
      streakElapsedRef.current = 0;
    }
    setState((prev) => ({
      ...prev,
      numbers: generateNumbers(),
      input: "",
      timeLeft: ROUND_DURATION,
      feedback: null,
      isActive: true,
      isPaused: false,
      isWaitingForNext: false,
      roundId: prev.roundId + 1,
      ...(resetScore ? { score: 0, recordTime: 0 } : {}),
    }));
  }, []);

  const resolveRound = useCallback((fb: FeedbackState, isCorrect: boolean) => {
    setState((prev) => {
      const newScore = isCorrect ? prev.score + 1 : 0;
      const newHigh = Math.max(newScore, prev.highScore);
      if (newHigh > prev.highScore) saveHighScore(newHigh);
      const timeUsed = ROUND_DURATION - prev.timeLeft;
      const newRecordTime = isCorrect ? prev.recordTime + timeUsed : 0;
      const newStreak = isCorrect ? prev.streak + 1 : 0;
      const streakTimeBeforeRound = prev.streak === 0 ? 0 : streakElapsedRef.current;
      const streakTimeAfterRound = streakTimeBeforeRound + timeUsed;

      // Show summary when the player loses and had an active streak
      if (!isCorrect && prev.streak > 0) {
        setStreakSummary({
          streak: prev.streak,
          totalTime: parseFloat(streakTimeAfterRound.toFixed(1)),
          failedNumbers: prev.numbers,
          failedAnswer: prev.numbers.reduce((a, b) => a + b, 0),
          failReason: fb as 'wrong' | 'timeout',
        });
      }

      streakElapsedRef.current = isCorrect ? streakTimeAfterRound : 0;

      return {
        ...prev,
        isActive: false,
        isPaused: false,
        isWaitingForNext: true,
        feedback: fb,
        score: newScore,
        highScore: newHigh,
        recordTime: newRecordTime,
        streak: newStreak,
      };
    });
  }, []);

  // Detect streak milestones after React has committed the new state.
  // Using useEffect guarantees we read the committed streak value.
  useEffect(() => {
    if (
      state.feedback === "correct" &&
      state.streak > lastTriggeredStreakRef.current
    ) {
      const reward = getThemeForStreak(state.streak);
      if (reward) {
        lastTriggeredStreakRef.current = state.streak;
        setPendingReward((prev) => (prev ? prev : reward));
      }
    }
  }, [state.streak, state.feedback]);

  // -----------------------------------------------------------------------
  // Reward dialog handlers
  // -----------------------------------------------------------------------

  const handleApplyReward = useCallback(() => {
    if (!pendingReward) return;
    applyTheme(pendingReward.id);
    setPendingReward(null);
  }, [pendingReward, applyTheme]);

  const handleDismissReward = useCallback(() => {
    if (pendingReward) unlockTheme(pendingReward.id);
    setPendingReward(null);
  }, [pendingReward, unlockTheme]);

  // -----------------------------------------------------------------------
  // Timer
  // -----------------------------------------------------------------------

  const handleTick = useCallback((remaining: number) => {
    setState((prev) => ({ ...prev, timeLeft: remaining }));
  }, []);

  const handleExpire = useCallback(() => {
    const typedGuess = state.input.length > 0 ? parseInt(state.input, 10) : NaN;
    const answer = state.numbers.reduce((a, b) => a + b, 0);
    const typedIsCorrect = Number.isFinite(typedGuess) && typedGuess === answer;
    resolveRound(typedIsCorrect ? "correct" : "timeout", typedIsCorrect);
  }, [resolveRound, state.input, state.numbers]);

  const isTimerPaused =
    state.isPaused || pendingReward !== null || showThemeSwitcher || streakSummary !== null;

  useTimer(
    ROUND_DURATION,
    handleTick,
    handleExpire,
    state.isActive,
    isTimerPaused,
    state.isWaitingForNext,
    state.roundId,
  );

  const togglePause = useCallback(() => {
    setState((prev) => {
      if (!prev.isActive || prev.timeLeft <= 0) return prev;
      return { ...prev, isPaused: !prev.isPaused };
    });
  }, []);

  // -----------------------------------------------------------------------
  // Input handling
  // -----------------------------------------------------------------------

  const handleKey = useCallback(
    (key: string) => {
      if (
        !state.isActive ||
        state.isPaused ||
        pendingReward ||
        showThemeSwitcher ||
        streakSummary
      )
        return;

      if (key === "*") {
        setState((prev) => ({ ...prev, input: prev.input.slice(0, -1) }));
        return;
      }

      if (key === "#") {
        if (state.input.length === 0) return;
        const guess = parseInt(state.input, 10);
        const answer = state.numbers.reduce((a, b) => a + b, 0);
        resolveRound(guess === answer ? "correct" : "wrong", guess === answer);
        return;
      }

      if (/^\d$/.test(key)) {
        if (state.input.length >= MAX_INPUT_LENGTH) return;
        const newInput = state.input + key;
        setState((prev) => ({ ...prev, input: newInput }));
        const answer = state.numbers.reduce((a, b) => a + b, 0);
        if (parseInt(newInput, 10) === answer) {
          resolveRound("correct", true);
        }
      }
    },
    [
      state.isActive,
      state.isPaused,
      state.input,
      state.numbers,
      resolveRound,
      pendingReward,
      showThemeSwitcher,
      streakSummary,
    ],
  );

  // Global keyboard listener
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (streakSummary) {
          e.preventDefault();
          setStreakSummary(null);
          startRound(true);
          return;
        }
        if (pendingReward) {
          e.preventDefault();
          handleDismissReward();
          return;
        }
        if (showThemeSwitcher) {
          e.preventDefault();
          setShowThemeSwitcher(false);
          return;
        }
      }

      if (e.code === "Space") {
        e.preventDefault();
        if (pendingReward || showThemeSwitcher || streakSummary) return;
        if (state.isWaitingForNext && !state.isActive) {
          startRound();
          return;
        }
        togglePause();
        return;
      }

      const mapped = /^\d$/.test(e.key)
        ? e.key
        : /^Numpad\d$/.test(e.code)
          ? e.code.replace("Numpad", "")
          : e.key === "Enter"
            ? "#"
            : e.key === "Backspace"
              ? "*"
              : null;

      if (mapped !== null) {
        e.preventDefault();
        handleKey(mapped);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    handleKey,
    togglePause,
    startRound,
    state.isWaitingForNext,
    state.isActive,
    state.feedback,
    pendingReward,
    handleDismissReward,
    showThemeSwitcher,
    streakSummary,
  ]);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  const correct = state.numbers.reduce((a, b) => a + b, 0);
  const themeIcon = {
    win98: <img src="icon/paint_98.webp" width={15} alt="98" />,
    winxp: <img src="icon/paint_xp.webp" width={15} alt="XP" />,
    win7: <img src="icon/paint_7.webp" width={15} alt="7" />,
    macos: <img src="icon/MacPaint.webp" width={15} alt="Mac" />,
  }[activeTheme.id];

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <>
      <div
        className="flex items-center justify-center"
        style={{ minHeight: "100vh", padding: "16px" }}
      >
        <div className="window" style={{ width: "320px", maxWidth: "100%" }}>
          {/* Title bar */}
          <div className="title-bar">
            <div className="title-bar-text">Plus Game v1.0</div>
          </div>

          {/* Scores toolbar */}
          <div
            className="window-body"
            style={{
              padding: "4px 1px",
              borderBottom: "1px solid #888",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "0.8rem" }}>
              Score: <strong>{state.score}</strong>
            </span>
            <span
              style={{
                fontSize: "0.8rem",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Trophy size={14} />
              Best: <strong>{state.highScore}</strong>
            </span>
          </div>

          {/* Main game body */}
          <div className="window-body" style={{ padding: "8px" }}>
            {/* Record / streak / pause row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "6px",
              }}
            >
              <span style={{ fontSize: "0.75rem" }}>
                Record: {state.recordTime.toFixed(1)}s
                {state.streak > 0 && (
                  <span
                    style={{
                      marginLeft: "6px",
                      color:
                        state.streak >= 10
                          ? "#a000a0"
                          : state.streak >= 5
                            ? "#0055cc"
                            : "#cc7700",
                      fontWeight: "bold",
                    }}
                  ></span>
                )}
              </span>
              <button
                onClick={togglePause}
                disabled={
                  !state.isActive || state.timeLeft <= 0 || !!pendingReward
                }
                style={{ fontSize: "0.75rem", minWidth: "68px" }}
              >
                {state.isPaused ? "Resume" : "Pause"}
              </button>
            </div>

            <Display
              numbers={state.numbers}
              timeLeft={state.timeLeft}
              totalTime={ROUND_DURATION}
              input={state.input}
              feedback={state.feedback}
              isPaused={isTimerPaused}
              answer={correct}
            />

            <div className="mt-2">
              <Keypad
                onKey={handleKey}
                disabled={!state.isActive || state.isPaused || !!pendingReward}
              />
            </div>
            <div className="flex justify-center mt-2">
              <button
                onClick={() => startRound()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.8rem",
                }}
              >
                Next Round
              </button>
            </div>
          </div>

          {/* Status bar */}
          <div
            className="status-bar"
            style={{ minHeight: "52px", flexDirection: "column" }}
          >
            <p
              className="status-bar-field"
              style={{ fontSize: "0.75rem", whiteSpace: "normal" }}
            >
              {pendingReward
                ? `🎉 New theme unlocked: ${pendingReward.name}!`
                : state.isPaused
                  ? "Paused"
                  : state.isWaitingForNext
                    ? "Round complete!"
                    : state.isActive
                      ? "Round in progress…"
                      : "Waiting for next round…"}
            </p>
            <p
              className="status-bar-field"
              style={{
                fontSize: "0.75rem",
                whiteSpace: "normal",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "4px",
              }}
            >
              <span>
                {activeTheme.id !== "win98"
                  ? `Theme: ${activeTheme.name}`
                  : "Add all 4 numbers and enter the sum"}
              </span>
              {maxTheme.unlockStreak > 0 && (
                <button
                  onClick={() => setShowThemeSwitcher(true)}
                  disabled={!!pendingReward}
                  title="Switch theme"
                  style={{
                    fontSize: "0.7rem",
                    minWidth: "unset",
                    padding: "0 5px",
                    height: "18px",
                    lineHeight: 1,
                    flexShrink: 0,
                  }}
                >
                  {themeIcon}
                </button>
              )}
            </p>
          </div>
        </div>
      </div>

      {showThemeSwitcher && (
        <ThemeSwitcherDialog
          activeThemeId={activeTheme.id}
          maxTheme={maxTheme}
          onSelect={(id) => {
            applyTheme(id);
            setShowThemeSwitcher(false);
          }}
          onClose={() => setShowThemeSwitcher(false)}
        />
      )}

      {pendingReward && (
        <ThemeRewardDialog
          theme={pendingReward}
          onApply={handleApplyReward}
          onDismiss={handleDismissReward}
        />
      )}

      {streakSummary && (
        <SummaryDialog
          summary={streakSummary}
          onClose={() => {
            setStreakSummary(null);
            startRound(true);
          }}
        />
      )}
    </>
  );
};

export default App;
