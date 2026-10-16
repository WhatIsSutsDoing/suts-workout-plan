/**
 * @typedef {{ kind: 'work' | 'rest', exerciseIndex: number, round: number, durationSeconds: number }} WorkoutInterval
 * @typedef {{ status: 'ready' | 'running' | 'paused' | 'finished', intervals: WorkoutInterval[], intervalIndex: number, deadlineMs: number | null, remainingMs: number }} TimerState
 */

/** @returns {WorkoutInterval[]} */
export function createWorkoutIntervals(exerciseCount, rounds, workSeconds, restSeconds) {
  const workIntervals = [];
  for (let round = 1; round <= rounds; round += 1) {
    for (let exerciseIndex = 0; exerciseIndex < exerciseCount; exerciseIndex += 1) {
      workIntervals.push({ kind: 'work', exerciseIndex, round, durationSeconds: workSeconds });
    }
  }

  const intervals = [];
  workIntervals.forEach((interval, index) => {
    intervals.push(interval);
    if (restSeconds > 0 && index < workIntervals.length - 1) {
      const next = workIntervals[index + 1];
      intervals.push({
        kind: 'rest',
        exerciseIndex: next.exerciseIndex,
        round: next.round,
        durationSeconds: restSeconds,
      });
    }
  });
  return intervals;
}

/** @param {WorkoutInterval[]} intervals @returns {TimerState} */
export function createTimerState(intervals) {
  return {
    status: 'ready',
    intervals,
    intervalIndex: 0,
    deadlineMs: null,
    remainingMs: (intervals[0]?.durationSeconds ?? 0) * 1000,
  };
}

/** @param {TimerState} state @param {number} nowMs @returns {TimerState} */
export function startTimer(state, nowMs) {
  if (state.status === 'finished' || state.intervals.length === 0) return state;
  if (state.status === 'running') return state;
  return { ...state, status: 'running', deadlineMs: nowMs + state.remainingMs };
}

/** @param {TimerState} state @param {number} nowMs @returns {TimerState} */
export function syncTimer(state, nowMs) {
  if (state.status !== 'running' || state.deadlineMs === null) return state;

  let intervalIndex = state.intervalIndex;
  let deadlineMs = state.deadlineMs;
  while (nowMs >= deadlineMs) {
    if (intervalIndex >= state.intervals.length - 1) {
      return {
        ...state,
        status: 'finished',
        intervalIndex,
        deadlineMs: null,
        remainingMs: 0,
      };
    }
    intervalIndex += 1;
    deadlineMs += state.intervals[intervalIndex].durationSeconds * 1000;
  }

  return {
    ...state,
    intervalIndex,
    deadlineMs,
    remainingMs: Math.max(0, deadlineMs - nowMs),
  };
}

/** @param {TimerState} state @param {number} nowMs @returns {TimerState} */
export function pauseTimer(state, nowMs) {
  const current = syncTimer(state, nowMs);
  if (current.status !== 'running') return current;
  return { ...current, status: 'paused', deadlineMs: null };
}

/** @param {TimerState} state @param {number} nowMs @returns {TimerState} */
export function skipInterval(state, nowMs) {
  const current = syncTimer(state, nowMs);
  if (current.status === 'finished' || current.intervalIndex >= current.intervals.length - 1) {
    return { ...current, status: 'finished', deadlineMs: null, remainingMs: 0 };
  }

  const intervalIndex = current.intervalIndex + 1;
  const remainingMs = current.intervals[intervalIndex].durationSeconds * 1000;
  const isRunning = current.status === 'running';
  return {
    ...current,
    intervalIndex,
    deadlineMs: isRunning ? nowMs + remainingMs : null,
    remainingMs,
  };
}

/** @param {TimerState} state @returns {TimerState} */
export function restartTimer(state) {
  return createTimerState(state.intervals);
}
