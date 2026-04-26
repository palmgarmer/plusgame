/** Possible feedback states after an answer attempt */
export type FeedbackState = 'correct' | 'wrong' | 'timeout' | null;

/** Core game state shape */
export interface GameState {
  /** The four randomly generated single-digit numbers */
  numbers: number[];
  /** Current player input string (max 2 chars) */
  input: string;
  /** Remaining time in the current round (seconds, 0-3) */
  timeLeft: number;
  /** Player's current session score */
  score: number;
  /** All-time high score persisted in localStorage */
  highScore: number;
  /** Current feedback state for visual flash */
  feedback: FeedbackState;
  /** Whether a round is currently active */
  isActive: boolean;
}

/** Props for the Display component */
export interface DisplayProps {
  numbers: number[];
  timeLeft: number;
  totalTime: number;
  input: string;
  feedback: FeedbackState;
}

/** Props for the Keypad component */
export interface KeypadProps {
  onKey: (key: string) => void;
  disabled: boolean;
}
