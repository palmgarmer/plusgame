import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook providing a precise countdown timer.
 * Uses setInterval with drift correction to avoid cumulative timing errors.
 *
 * @param duration  Total duration in seconds
 * @param onTick    Called each second with the new remaining time
 * @param onExpire  Called when the timer reaches 0
 * @param active    Whether the timer should be running
 */
export function useTimer(
  duration: number,
  onTick: (remaining: number) => void,
  onExpire: () => void,
  active: boolean,
): void {
  const onTickRef = useRef(onTick);
  const onExpireRef = useRef(onExpire);

  // Keep refs current so interval closure always sees latest callbacks
  useEffect(() => { onTickRef.current = onTick; }, [onTick]);
  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

  const startTimeRef = useRef<number>(0);
  const remainingRef = useRef<number>(duration);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!active) {
      stop();
      return;
    }

    // Reset state for new round
    startTimeRef.current = Date.now();
    remainingRef.current = duration;

    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const newRemaining = Math.max(0, duration - elapsed);

      remainingRef.current = newRemaining;
      onTickRef.current(newRemaining);

      if (newRemaining <= 0) {
        stop();
        onExpireRef.current();
      }
    }, 100); // Poll at 100 ms for smooth progress bar

    return stop;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, duration]);
}
